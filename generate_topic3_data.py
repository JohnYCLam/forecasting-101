import json
import os
import numpy as np
import pandas as pd
import warnings
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.exponential_smoothing.ets import ETSModel
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

warnings.filterwarnings("ignore")

def smape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    denominator = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    diff = np.abs(y_true - y_pred) / denominator
    diff[denominator == 0] = 0.0
    return np.mean(diff) * 100

def mase(y_true, y_pred, y_train):
    y_true, y_pred, y_train = np.array(y_true), np.array(y_pred), np.array(y_train)
    n = len(y_train)
    d = np.abs(np.diff(y_train)).sum() / (n - 1)
    if d == 0:
        return 0
    errors = np.abs(y_true - y_pred)
    return errors.mean() / d

def wmape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    sum_actual = np.sum(np.abs(y_true))
    if sum_actual == 0:
        return 0.0
    return np.sum(np.abs(y_true - y_pred)) / sum_actual * 100

def compute_all_metrics(y_true, y_pred, y_train):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    # MAPE can explode near 0, so we add a tiny epsilon if needed, but sklearn does this or returns large numbers
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100
    s_mape = smape(y_true, y_pred)
    mase_val = mase(y_true, y_pred, y_train)
    wmape_val = wmape(y_true, y_pred)
    return {
        "MAE": mae,
        "MSE": mse,
        "RMSE": rmse,
        "MAPE": mape,
        "sMAPE": s_mape,
        "MASE": mase_val,
        "wMAPE": wmape_val
    }

def generate_tab1():
    print("Generating Tab 3.1: The Metric Zoo...")
    n = 200
    dates = pd.date_range(start="2020-01-01", periods=n, freq="D")
    t = np.arange(n)
    
    trend = 0.5 * t
    seasonality = 20 * np.sin(2 * np.pi * t / 20)
    base_signal = trend + seasonality
    
    # Add a tiny bit of noise for realism
    np.random.seed(42)
    noise = np.random.normal(0, 2, n)
    data = base_signal + noise
    
    train_size = 140
    test_size = 60
    
    # Inject massive outliers in test set ONLY (e.g. unannounced events or promos)
    outlier_indices = [150, 165, 185]
    for idx in outlier_indices:
        data[idx] += 85
        
    train = data[:train_size]
    test = data[train_size:]
    
    # Model A: Fits the base signal perfectly, but completely misses the outliers.
    model_a_in = base_signal[:train_size].tolist()
    model_a_out = base_signal[train_size:].tolist()
    
    # Model B: Predicts the outliers perfectly (e.g. has access to an exogenous calendar),
    # but its overall baseline is poorly calibrated (shifted down by 15 units constantly).
    base_b_in = base_signal[:train_size] - 15
    base_b_out = base_signal[train_size:] - 15
    for idx in outlier_indices:
        base_b_out[idx - train_size] += 85 # It successfully predicts the spike!
    
    model_b_in = base_b_in.tolist()
    model_b_out = base_b_out.tolist()

    metrics_a = compute_all_metrics(test, model_a_out, train)
    metrics_b = compute_all_metrics(test, model_b_out, train)
    
    res_a = (np.array(test) - np.array(model_a_out)).tolist()
    res_b = (np.array(test) - np.array(model_b_out)).tolist()
    
    return {
        "actual": data.tolist(),
        "time_label": dates.strftime('%Y-%m-%d').tolist(),
        "train_size": train_size,
        "model_a_in": model_a_in,
        "model_a_out": model_a_out,
        "model_b_in": model_b_in,
        "model_b_out": model_b_out,
        "metrics_a": metrics_a,
        "metrics_b": metrics_b,
        "res_a": res_a,
        "res_b": res_b
    }

def generate_tab2():
    print("Generating Tab 3.2: MAPE's Fatal Flaw...")
    baselines = list(range(0, 51))
    n = 100
    t = np.arange(n)
    
    np.random.seed(123)
    # Sinusoidal series oscillating around zero initially
    base_signal = 20 * np.sin(2 * np.pi * t / 20) + np.random.normal(0, 3, n)
    train_size = 80
    test_size = 20
    
    results = {}
    
    for b in baselines:
        data = base_signal + b
        train = data[:train_size]
        test = data[train_size:]
        
        # We can fit a model, e.g., SARIMA with seasonality
        # But to ensure errors are EXACTLY the same across baselines (shifted by b), 
        # we can just compute one forecast and shift it!
        # This perfectly isolates the effect of the denominator in MAPE.
        if b == 0:
            model = ETSModel(train, error='add', seasonal='add', seasonal_periods=20).fit(disp=False)
            base_out = model.forecast(steps=test_size)
            base_in = model.fittedvalues
        
        out = (base_out + b).tolist()
        in_sample = (base_in + b).tolist()
        
        metrics = compute_all_metrics(test, out, train)
        
        results[str(b)] = {
            "actual": data.tolist(),
            "time_label": t.tolist(),
            "train_size": train_size,
            "in_sample": in_sample,
            "out_sample": out,
            "metrics": metrics
        }
        
    return results

if __name__ == "__main__":
    final_data = {
        "tab1": generate_tab1(),
        "tab2": generate_tab2(),
    }
    
    out_path = os.path.join("public", "topic3_data.json")
    with open(out_path, "w") as f:
        json.dump(final_data, f)
    
    print(f"Successfully generated {out_path}!")

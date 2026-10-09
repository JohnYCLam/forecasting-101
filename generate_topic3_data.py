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

def generate_tab3():
    print("Generating Tab 3.3: Walk-Forward Validation...")
    n = 156
    t = np.arange(n)
    
    # Base signal: Stable linear trend until t=122, then massive volatility/seasonality
    np.random.seed(42)
    data = 50 + 0.3 * t + np.random.normal(0, 1.5, n)
    
    # Introduce structural complexity (seasonal wave) from t=122 onwards
    data[122:] += 25 * np.sin(2 * np.pi * (t[122:] - 122) / 15)
    
    folds = [
        {"train_end": 105, "test_end": 122},
        {"train_end": 122, "test_end": 139},
        {"train_end": 139, "test_end": 156}
    ]
    
    results = {
        "actual": data.tolist(),
        "folds": []
    }
    
    for i, f in enumerate(folds):
        train_end = f["train_end"]
        test_end = f["test_end"]
        
        train = data[:train_end]
        test = data[train_end:test_end]
        
        # Model: Simple ARIMA(1,1,1)
        model = ARIMA(train, order=(1,1,1)).fit()
        forecast = model.forecast(steps=len(test))
        in_sample = model.fittedvalues
        
        metrics = compute_all_metrics(test, forecast, train)
        
        results["folds"].append({
            "fold_idx": i + 1,
            "train_end": train_end,
            "test_end": test_end,
            "sx_in": in_sample.tolist(),
            "sx_out": forecast.tolist(), # keeping key as sx_out for frontend compatibility
            "metrics_sx": metrics
        })
        
    return results

def generate_tab4():
    print("Generating Tab 3.4: Sliding vs Expanding...")
    n = 200
    t = np.arange(n)
    
    # Regime Shift at t=100
    np.random.seed(100)
    data = np.zeros(n)
    
    # Regime 1: Mean = 20
    data[:100] = 20 + np.random.normal(0, 2, 100)
    
    # Regime 2: Massive shift in mean to 80
    data[100:] = 80 + np.random.normal(0, 2, 100)
    
    folds = [
        {"test_start": 40, "test_end": 60},
        {"test_start": 80, "test_end": 100},
        {"test_start": 120, "test_end": 140},
        {"test_start": 160, "test_end": 180},
    ]
    
    window_sizes = [40]
    results = {
        "actual": data.tolist(),
        "folds": folds,
        "expanding": {},
        "sliding": {str(w): {} for w in window_sizes}
    }
    
    # Expanding
    expanding_metrics = []
    for f in folds:
        train = data[:f["test_start"]]
        test = data[f["test_start"]:f["test_end"]]
        
        model = ARIMA(train, order=(1,0,0)).fit()
        forecast = model.forecast(steps=20)
        metrics = compute_all_metrics(test, forecast, train)
        
        expanding_metrics.append({
            "test_start": f["test_start"],
            "test_end": f["test_end"],
            "exp_in": model.fittedvalues.tolist(),
            "exp_out": forecast.tolist(),
            "metrics": metrics
        })
    results["expanding"] = expanding_metrics
    
    # Sliding
    for w in window_sizes:
        sliding_metrics = []
        for f in folds:
            start_idx = max(0, f["test_start"] - w)
            train = data[start_idx:f["test_start"]]
            test = data[f["test_start"]:f["test_end"]]
            
            model = ARIMA(train, order=(1,0,0)).fit()
            forecast = model.forecast(steps=20)
            metrics = compute_all_metrics(test, forecast, train)
            
            sliding_metrics.append({
                "test_start": f["test_start"],
                "test_end": f["test_end"],
                "sld_in": model.fittedvalues.tolist(),
                "sld_out": forecast.tolist(),
                "metrics": metrics
            })
        results["sliding"][str(w)] = sliding_metrics
        
    return results

if __name__ == "__main__":
    final_data = {
        "tab1": generate_tab1(),
        "tab2": generate_tab2(),
        "tab3": generate_tab3(),
        "tab4": generate_tab4(),
    }
    
    out_path = os.path.join("public", "topic3_data.json")
    with open(out_path, "w") as f:
        json.dump(final_data, f)
    
    print(f"Successfully generated {out_path}!")

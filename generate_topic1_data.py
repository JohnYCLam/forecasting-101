import numpy as np
import pandas as pd
import json
import os
import warnings
from statsmodels.tsa.holtwinters import SimpleExpSmoothing, Holt, ExponentialSmoothing

warnings.filterwarnings('ignore')

def generate_ses_data():
    np.random.seed(42)
    periods = 120
    baseline = 100
    noise = np.random.normal(loc=0, scale=8.0, size=periods)
    y = baseline + noise
    
    train = y[:-24]
    test = y[-24:]
    
    results = {}
    alphas = [0.2, 0.5, 0.8]
    
    for alpha in alphas:
        model = SimpleExpSmoothing(train, initialization_method="estimated").fit(smoothing_level=alpha, optimized=False)
        in_sample = model.fittedvalues
        out_sample = model.forecast(len(test))
        results[str(alpha)] = {
            "in_sample": in_sample.tolist(),
            "out_sample": out_sample.tolist(),
            "description": f"Alpha = {alpha}: {'Slow reaction to noise. Very smooth.' if alpha == 0.2 else 'Overreacting to recent noise. Jagged line.' if alpha == 0.8 else 'Balanced smoothing.'}"
        }
        
    return {
        "actual": y.tolist(),
        "train_size": len(train),
        "results": results
    }

def generate_holt_data():
    np.random.seed(42)
    periods = 120
    trend_slow = 0.5 * np.arange(60)
    trend_fast = trend_slow[-1] + 2.5 * np.arange(1, 61)
    combined_trend = np.concatenate([trend_slow, trend_fast])
    noise = np.random.normal(loc=0, scale=3.0, size=periods)
    y = combined_trend + noise
    
    train = y[:-24]
    test = y[-24:]
    
    results = {}
    betas = [0.05, 0.5, 0.9]
    alpha = 0.8 # fix alpha
    
    for beta in betas:
        model = Holt(train, initialization_method="estimated").fit(smoothing_level=alpha, smoothing_trend=beta, optimized=False)
        in_sample = model.fittedvalues
        out_sample = model.forecast(len(test))
        results[str(beta)] = {
            "in_sample": in_sample.tolist(),
            "out_sample": out_sample.tolist(),
            "description": f"Beta = {beta}: {'Slow to adapt to the new steeper trend.' if beta == 0.05 else 'Very fast to adapt to the new trend.' if beta == 0.9 else 'Moderate adaptation speed.'}"
        }
        
    return {
        "actual": y.tolist(),
        "train_size": len(train),
        "results": results
    }

def generate_hw_data():
    np.random.seed(42)
    periods = 120
    time = np.arange(periods)
    baseline = 100
    noise = np.random.normal(loc=0, scale=3.0, size=periods)
    amplitude = np.where(time < 60, 10, 35)
    seasonality = amplitude * np.sin(2 * np.pi * time / 12)
    y = baseline + seasonality + noise
    
    train = y[:-24]
    test = y[-24:]
    
    results = {}
    gammas = [0.05, 0.5, 0.9]
    alpha = 0.2
    
    for gamma in gammas:
        model = ExponentialSmoothing(train, trend=None, seasonal='add', seasonal_periods=12).fit(smoothing_level=alpha, smoothing_seasonal=gamma, optimized=False)
        in_sample = model.fittedvalues
        out_sample = model.forecast(len(test))
        results[str(gamma)] = {
            "in_sample": in_sample.tolist(),
            "out_sample": out_sample.tolist(),
            "description": f"Gamma = {gamma}: {'Fails to capture the sudden massive seasonal waves.' if gamma == 0.05 else 'Rapidly adjusts to the new massive seasonal waves.' if gamma == 0.9 else 'Slowly catches on to the amplitude change.'}"
        }
        
    return {
        "actual": y.tolist(),
        "train_size": len(train),
        "results": results
    }

if __name__ == "__main__":
    final_data = {
        "ses": generate_ses_data(),
        "holt": generate_holt_data(),
        "hw": generate_hw_data()
    }
    
    # Ensure public folder exists
    os.makedirs('public', exist_ok=True)
    with open('public/topic1_data.json', 'w') as f:
        json.dump(final_data, f)
    
    print("Successfully generated public/topic1_data.json")

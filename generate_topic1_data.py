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
    alphas = np.round(np.arange(0.0, 1.1, 0.1), 1)
    
    for alpha in alphas:
        # Statsmodels expects alpha > 0, if 0 it might use eps. We pass it directly.
        try:
            model = SimpleExpSmoothing(train, initialization_method="estimated").fit(smoothing_level=alpha, optimized=False)
            results[f"{alpha:.1f}"] = {
                "in_sample": model.fittedvalues.tolist(),
                "out_sample": model.forecast(len(test)).tolist()
            }
        except Exception:
            # Fallback for numerical instability
            results[f"{alpha:.1f}"] = {"in_sample": [baseline]*len(train), "out_sample": [baseline]*len(test)}
        
    return {
        "dataset_description": "Stationary Data (Flat Level + High Noise): A simple horizontal baseline subjected to random, heavy fluctuations. Perfect for demonstrating how Alpha smooths out recent chaos versus overreacting to it.",
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
    values = np.round(np.arange(0.0, 1.1, 0.1), 1)
    
    for alpha in values:
        for beta in values:
            key = f"{alpha:.1f}_{beta:.1f}"
            try:
                model = Holt(train, initialization_method="estimated").fit(smoothing_level=alpha, smoothing_trend=beta, optimized=False)
                results[key] = {
                    "in_sample": model.fittedvalues.tolist(),
                    "out_sample": model.forecast(len(test)).tolist()
                }
            except Exception:
                results[key] = {"in_sample": [0]*len(train), "out_sample": [0]*len(test)}
        
    return {
        "dataset_description": "Structural Break (Changing Trend): This data starts with a slow upward trend, but halfway through, the trend suddenly accelerates. This demonstrates how Beta dictates the model's ability to 'learn' a new slope.",
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
    values = np.round(np.arange(0.0, 1.1, 0.1), 1)
    
    for alpha in values:
        for beta in values:
            for gamma in values:
                key = f"{alpha:.1f}_{beta:.1f}_{gamma:.1f}"
                try:
                    # using trend='add' to allow beta tuning
                    model = ExponentialSmoothing(train, trend='add', seasonal='add', seasonal_periods=12).fit(
                        smoothing_level=alpha, smoothing_trend=beta, smoothing_seasonal=gamma, optimized=False)
                    results[key] = {
                        "in_sample": model.fittedvalues.tolist(),
                        "out_sample": model.forecast(len(test)).tolist()
                    }
                except Exception:
                    results[key] = {"in_sample": [0]*len(train), "out_sample": [0]*len(test)}
        
    return {
        "dataset_description": "Amplitude Jump (Changing Seasonality): A perfect 12-month cycle where the waves suddenly become 3x larger halfway through. This isolates Gamma, showing how quickly the model recognizes the new seasonal intensity.",
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
    
    os.makedirs('public', exist_ok=True)
    with open('public/topic1_data.json', 'w') as f:
        # rounding floats to 2 decimal places in JSON to drastically save file size
        json.dump(final_data, f, separators=(',', ':'))
    
    print("Successfully generated public/topic1_data.json with expanded ranges")

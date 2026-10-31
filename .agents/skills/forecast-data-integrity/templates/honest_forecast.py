"""Template: an honest train/test forecast block for generate_topicN_data.py.

Copy the pattern, not the numbers. Replace the model with the one required by the plan.
"""
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.api import VAR


def rmse(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    return float(np.sqrt(np.mean((a - b) ** 2)))


def gen_univariate_example(y: pd.Series, order=(1, 1, 1), n_test=12):
    """Univariate: fit on train only, forecast the test horizon."""
    train, test = y.iloc[:-n_test], y.iloc[-n_test:]
    fit = ARIMA(train, order=order).fit()              # fit on TRAIN only
    fc = fit.get_forecast(steps=n_test)                # forecast comes from the model
    mean = fc.predicted_mean.to_numpy()
    ci = fc.conf_int(alpha=0.05).to_numpy()
    return {
        "order": f"ARIMA{order}",
        "train": train.round(4).tolist(),
        "actual": test.round(4).tolist(),
        "forecast": np.round(mean, 4).tolist(),
        "lower": np.round(ci[:, 0], 4).tolist(),
        "upper": np.round(ci[:, 1], 4).tolist(),
        "rmse": round(rmse(test, mean), 4),            # metric computed here, not typed in
        "aic": round(float(fit.aic), 3),
    }


def gen_multivariate_example(df: pd.DataFrame, lags=2, n_test=12):
    """Multivariate: VAR fitted on train, forecast from the last `lags` train rows."""
    train, test = df.iloc[:-n_test], df.iloc[-n_test:]
    res = VAR(train).fit(lags)
    fc = res.forecast(train.values[-res.k_ar:], steps=n_test)
    out = {"lags": lags, "aic": round(float(res.aic), 3), "series": {}}
    for j, col in enumerate(df.columns):
        out["series"][col] = {
            "actual": test[col].round(4).tolist(),
            "forecast": np.round(fc[:, j], 4).tolist(),
            "rmse": round(rmse(test[col], fc[:, j]), 4),
        }
    return out

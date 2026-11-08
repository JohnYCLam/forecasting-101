"""Data generator for Topic 6: Traditional Machine Learning in Time Series.

Generates public/topic6_data.json reproducibly without hardcoded forecasts.
All forecasts are produced by fitted statistical or machine learning models.
"""

from __future__ import annotations

import hashlib
import json
import math
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge, LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
import xgboost as xgb
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.api import Holt

if __package__:
    from .topic6_linear_intro import build_linear_intro
    from . import topic6_sections as section_evidence
else:
    from topic6_linear_intro import build_linear_intro
    import topic6_sections as section_evidence

warnings.filterwarnings("ignore")

DATA_PATH = Path(__file__).resolve().parents[3] / "references" / "boost-vs-forest-ts" / "data" / "de_electricity_load_daily.csv"
OUTPUT_FILE = Path(__file__).resolve().parents[2] / "public" / "topic6_data.json"


def clean_val(v, decimals: int = 2):
    """Convert float/int/numpy numbers into JSON-compliant serializable values."""
    if v is None:
        return None
    if isinstance(v, (np.floating, float)):
        if math.isnan(v) or math.isinf(v):
            return None
        return round(float(v), decimals)
    if isinstance(v, (np.integer, int)):
        return int(v)
    if isinstance(v, (np.bool_, bool)):
        return bool(v)
    return v


def load_german_load() -> pd.DataFrame:
    """Load and format the German daily electricity load series."""
    df = pd.read_csv(DATA_PATH, parse_dates=["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)
    df["dow"] = df["datetime"].dt.dayofweek
    df["dom"] = df["datetime"].dt.day
    df["month"] = df["datetime"].dt.month
    df["doy"] = df["datetime"].dt.dayofyear
    df["is_weekend"] = (df["dow"] >= 5).astype(int)
    
    # Cyclical harmonics
    df["dow_sin"] = np.sin(2 * np.pi * df["dow"] / 7.0)
    df["dow_cos"] = np.cos(2 * np.pi * df["dow"] / 7.0)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)
    df["doy_sin"] = np.sin(2 * np.pi * df["doy"] / 365.25)
    df["doy_cos"] = np.cos(2 * np.pi * df["doy"] / 365.25)
    
    # Target lags (strictly <= t)
    for l in [1, 2, 3, 7, 14, 28]:
        df[f"lag_{l}"] = df["y"].shift(l)
        
    # Shifted rolling statistics (strictly on y.shift(1))
    shifted = df["y"].shift(1)
    df["roll_mean_7"] = shifted.rolling(7).mean()
    df["roll_std_7"] = shifted.rolling(7).std()
    df["roll_mean_28"] = shifted.rolling(28).mean()
    
    # Strictly lagged renewables
    df["solar_lag1"] = df["solar"].shift(1)
    df["solar_lag7"] = df["solar"].shift(7)
    df["wind_lag1"] = df["wind"].shift(1)
    df["wind_lag7"] = df["wind"].shift(7)
    
    return df


def gen_tab1(df: pd.DataFrame) -> dict:
    """Subsection 6.1: From a time series to a supervised-learning table.
    Demonstrates supervised table reformatting, safe vs leaky features, and Ridge vs Seasonal Naive.
    """
    np.random.seed(42)
    horizon = 30
    origin_dt = pd.Timestamp("2019-09-30")
    origin_idx = df[df["datetime"] == origin_dt].index[0]
    
    # Training window: 1 year prior to origin (2018-10-01 to 2019-09-30)
    train_start_dt = pd.Timestamp("2018-10-01")
    train_origins = [
        i for i, dt in enumerate(df["datetime"])
        if dt >= train_start_dt and dt <= (origin_dt - pd.Timedelta(days=horizon))
    ]
    train_origins_used = train_origins[::2]  # Sample every 2 days for speed & compact size
    
    def build_tab1_rows(origins: list[int]):
        rows = []
        for t in origins:
            dt = df.loc[t, "datetime"]
            y_hist = df.loc[:t, "y"]
            s_hist = df.loc[:t, "solar"]
            w_hist = df.loc[:t, "wind"]
            
            f_l1 = float(y_hist.iloc[-1])
            f_l2 = float(y_hist.iloc[-2])
            f_l3 = float(y_hist.iloc[-3])
            f_l7 = float(y_hist.iloc[-7])
            f_l14 = float(y_hist.iloc[-14])
            f_l28 = float(y_hist.iloc[-28])
            f_r7 = float(y_hist.iloc[-7:].mean())
            f_r28 = float(y_hist.iloc[-28:].mean())
            f_sol = float(s_hist.iloc[-1])
            f_wnd = float(w_hist.iloc[-1])
            
            for h in range(1, horizon + 1):
                fut_idx = t + h
                if fut_idx >= len(df):
                    continue
                fut_dt = df.loc[fut_idx, "datetime"]
                y_fut = float(df.loc[fut_idx, "y"])
                
                rows.append({
                    "origin_dt": dt,
                    "target_dt": fut_dt,
                    "h": h,
                    "h_sin": np.sin(2 * np.pi * h / horizon),
                    "h_cos": np.cos(2 * np.pi * h / horizon),
                    "dow": fut_dt.dayofweek,
                    "dow_sin": np.sin(2 * np.pi * fut_dt.dayofweek / 7.0),
                    "dow_cos": np.cos(2 * np.pi * fut_dt.dayofweek / 7.0),
                    "month": fut_dt.month,
                    "is_weekend": int(fut_dt.dayofweek >= 5),
                    "lag_1": f_l1,
                    "lag_2": f_l2,
                    "lag_3": f_l3,
                    "lag_7": f_l7,
                    "lag_14": f_l14,
                    "lag_28": f_l28,
                    "roll_7": f_r7,
                    "roll_28": f_r28,
                    "solar_lag1": f_sol,
                    "wind_lag1": f_wnd,
                    "target_load": y_fut,
                    "y": y_fut,
                })
        return pd.DataFrame(rows)

    train_df = build_tab1_rows(train_origins_used)
    test_df = build_tab1_rows([origin_idx])
    
    # Feature group definitions for safe Ridge models
    feature_tiers = {
        "lags_only": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28", "h", "h_sin", "h_cos"],
        "lags_rolling": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28", "roll_7", "roll_28", "h", "h_sin", "h_cos"],
        "history_calendar": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28", "roll_7", "roll_28", "dow_sin", "dow_cos", "is_weekend", "h", "h_sin", "h_cos"],
        "safe_full": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28", "roll_7", "roll_28", "dow_sin", "dow_cos", "is_weekend", "solar_lag1", "wind_lag1", "h", "h_sin", "h_cos"],
    }
    
    tier_results = {}
    test_predictions = {}
    test_predictions_raw = {}
    fitted_pipelines = {}
    
    for name, cols in feature_tiers.items():
        pipe = make_pipeline(StandardScaler(), Ridge(alpha=10.0))
        pipe.fit(train_df[cols], train_df["y"])
        fitted_pipelines[name] = pipe
        train_pred = pipe.predict(train_df[cols])
        test_pred = pipe.predict(test_df[cols])
        
        tr_mae = mean_absolute_error(train_df["y"], train_pred)
        te_mae = mean_absolute_error(test_df["y"], test_pred)
        tr_rmse = root_mean_squared_error(train_df["y"], train_pred)
        te_rmse = root_mean_squared_error(test_df["y"], test_pred)
        
        status_text = "Fitted Ridge; compare generated MAE and RMSE for this holdout"
        
        tier_results[name] = {
            "name": name,
            "train_mae": clean_val(tr_mae),
            "test_mae": clean_val(te_mae),
            "train_rmse": clean_val(tr_rmse),
            "test_rmse": clean_val(te_rmse),
            "feature_count": len(cols),
            "status": status_text,
        }
        test_predictions[name] = [clean_val(v) for v in test_pred]
        test_predictions_raw[name] = test_pred

    # Leaky Model fit (locked leak design)
    leaky_cols = ["target_load", "h", "h_sin", "h_cos"]
    pipe_leaky = make_pipeline(StandardScaler(), Ridge(alpha=10.0))
    pipe_leaky.fit(train_df[leaky_cols], train_df["y"])
    
    leaky_train_pred = pipe_leaky.predict(train_df[leaky_cols])
    leaky_train_mae = mean_absolute_error(train_df["y"], leaky_train_pred)
    leaky_train_rmse = root_mean_squared_error(train_df["y"], leaky_train_pred)
    
    # Invalid score: on October rows, target_load = actual future load
    invalid_test_pred = pipe_leaky.predict(test_df[leaky_cols])
    invalid_test_mae = mean_absolute_error(test_df["y"], invalid_test_pred)
    invalid_test_rmse = root_mean_squared_error(test_df["y"], invalid_test_pred)
    
    # Production forecast: on October rows, target_load = load on origin day 2019-09-30
    origin_load = float(df.loc[origin_idx, "y"])
    test_prod_df = test_df.copy()
    test_prod_df["target_load"] = origin_load
    prod_test_pred = pipe_leaky.predict(test_prod_df[leaky_cols])
    prod_test_mae = mean_absolute_error(test_df["y"], prod_test_pred)
    prod_test_rmse = root_mean_squared_error(test_df["y"], prod_test_pred)
    
    # Evaluate locked falsifier
    falsifier_cond1 = (leaky_train_mae < 400.0) and (invalid_test_mae < 400.0)
    falsifier_cond2 = (prod_test_mae >= 1.5 * tier_results["safe_full"]["test_mae"])
    falsifier_passed = falsifier_cond1 and falsifier_cond2
    falsifier_verdict = "PASS" if falsifier_passed else "FAIL"

    tier_results["leaky_production"] = {
        "name": "leaky_production",
        "train_mae": clean_val(leaky_train_mae),
        "train_rmse": clean_val(leaky_train_rmse),
        "invalid_test_mae": clean_val(invalid_test_mae),
        "invalid_test_rmse": clean_val(invalid_test_rmse),
        "production_test_mae": clean_val(prod_test_mae),
        "production_test_rmse": clean_val(prod_test_rmse),
        "test_mae": clean_val(prod_test_mae),
        "test_rmse": clean_val(prod_test_rmse),
        "feature_count": len(leaky_cols),
        "falsifier_verdict": falsifier_verdict,
        "status": "Invalid future-input diagnostic and separate origin-load fallback; inspect generated metrics",
    }
    tier_results["leaky_model"] = tier_results["leaky_production"]
    tier_results["leaky_rolling"] = tier_results["leaky_production"]

    # Honest Seasonal Naive evaluation
    # Test path: copy of last 7 observed days
    last_7_known = df.loc[origin_idx - 6:origin_idx, "y"].values
    sn_test_preds = [float(last_7_known[(h - 1) % 7]) for h in range(1, horizon + 1)]
    sn_test_mae = mean_absolute_error(test_df["y"], sn_test_preds)
    sn_test_rmse = root_mean_squared_error(test_df["y"], sn_test_preds)
    
    # Training path: exact same rule on the same training rows as Ridge
    sn_train_preds = []
    for t in train_origins_used:
        for h in range(1, horizon + 1):
            if t + h < len(df):
                sn_train_preds.append(float(df.loc[t - 6 + ((h - 1) % 7), "y"]))
    sn_train_mae = mean_absolute_error(train_df["y"], sn_train_preds)
    sn_train_rmse = root_mean_squared_error(train_df["y"], sn_train_preds)
    
    tier_results["seasonal_naive"] = {
        "name": "seasonal_naive",
        "train_mae": clean_val(sn_train_mae),
        "test_mae": clean_val(sn_test_mae),
        "train_rmse": clean_val(sn_train_rmse),
        "test_rmse": clean_val(sn_test_rmse),
        "feature_count": 1,
        "status": "Unfitted repeat-last-week baseline; compare generated MAE and RMSE",
    }

    # Timeline payload: 28 days pre-origin + 30 days test
    context_start = origin_idx - 28
    timeline = []
    for idx in range(context_start, origin_idx + horizon + 1):
        dt = df.loc[idx, "datetime"]
        dt_str = dt.strftime("%Y-%m-%d")
        act = clean_val(df.loc[idx, "y"])
        is_holdout = idx > origin_idx
        h_idx = idx - origin_idx if is_holdout else None
        
        item = {
            "date": dt_str,
            "time": idx - context_start,
            "actual": act,
            "is_holdout": is_holdout,
        }
        if is_holdout and h_idx and h_idx <= horizon:
            item["safe_ridge"] = test_predictions["safe_full"][h_idx - 1]
            item["calendar_ridge"] = test_predictions["history_calendar"][h_idx - 1]
            item["invalid_future_input"] = clean_val(invalid_test_pred[h_idx - 1])
            item["lags_only_ridge"] = test_predictions["lags_only"][h_idx - 1]
            item["lags_rolling_ridge"] = test_predictions["lags_rolling"][h_idx - 1]
            item["leaky_production"] = clean_val(prod_test_pred[h_idx - 1])
            item["leaky_ridge"] = clean_val(prod_test_pred[h_idx - 1])
            item["seasonal_naive"] = clean_val(sn_test_preds[h_idx - 1])
        timeline.append(item)

    # 30-row forecast design matrix
    dow_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    sample_rows = []
    for idx, r in test_df.iterrows():
        sample_rows.append({
            "target_date": r["target_dt"].strftime("%Y-%m-%d"),
            "h": int(r["h"]),
            "horizon": int(r["h"]),
            "lag_1": clean_val(r["lag_1"]),
            "lag_7": clean_val(r["lag_7"]),
            "roll_7": clean_val(r["roll_7"]),
            "dow": int(r["dow"]),
            "target_dow": dow_names[int(r["dow"])],
            "solar": clean_val(r["solar_lag1"]),
            "solar_lag1": clean_val(r["solar_lag1"]),
            "wind": clean_val(r["wind_lag1"]),
            "wind_lag1": clean_val(r["wind_lag1"]),
            "load_on_target_date_used": False,
            "production_target_load": clean_val(origin_load),
            "actual_later": clean_val(r["y"]),
        })

    # Assertions
    assert len(sample_rows) == 30
    assert sample_rows[0]["lag_1"] == clean_val(test_df.loc[0, "lag_1"])
    assert sample_rows[0]["lag_1"] == clean_val(df.loc[origin_idx, "y"])

    # Safe Ridge vs Naive comparison metrics
    safe_actuals = test_df["y"].values
    safe_pred_vals = np.array(test_predictions_raw["safe_full"])
    sn_pred_vals = np.array(sn_test_preds)

    safe_abs_err = np.abs(safe_pred_vals - safe_actuals)
    sn_abs_err = np.abs(sn_pred_vals - safe_actuals)
    days_safe_closer = int(np.sum(safe_abs_err < sn_abs_err))
    
    largest_idx = int(np.argmax(safe_abs_err))
    largest_safe_miss = {
        "date": test_df.loc[largest_idx, "target_dt"].strftime("%Y-%m-%d"),
        "actual": clean_val(safe_actuals[largest_idx]),
        "safe_forecast": clean_val(safe_pred_vals[largest_idx]),
        "abs_error": clean_val(safe_abs_err[largest_idx]),
    }

    safe_test_rmse = clean_val(root_mean_squared_error(safe_actuals, safe_pred_vals))
    naive_test_rmse = clean_val(sn_test_rmse)
    mae_gap_vs_naive = clean_val(sn_test_mae - tier_results["safe_full"]["test_mae"])
    mae_gap_pct_vs_naive = clean_val((sn_test_mae - tier_results["safe_full"]["test_mae"]) / sn_test_mae * 100)

    # 1. Raw series preview (7 chronological source rows around training origin 2018-10-01)
    raw_series_preview = []
    idx_origin_0 = train_origins_used[0]
    for r_idx in range(idx_origin_0, idx_origin_0 + 7):
        r_dt = df.loc[r_idx, "datetime"]
        raw_series_preview.append({
            "date": r_dt.strftime("%Y-%m-%d"),
            "load": clean_val(df.loc[r_idx, "y"]),
            "solar": clean_val(df.loc[r_idx, "solar"]),
            "wind": clean_val(df.loc[r_idx, "wind"]),
            "price": clean_val(df.loc[r_idx, "price"]),
        })

    # 2. Training table preview: 2 distinct origins and horizons h=1, 7, 30
    preview_origin_dts = [df.loc[train_origins_used[0], "datetime"], df.loc[train_origins_used[7], "datetime"]]
    preview_df = train_df[(train_df["origin_dt"].isin(preview_origin_dts)) & (train_df["h"].isin([1, 7, 30]))]
    training_table_preview = []
    for _, r in preview_df.iterrows():
        training_table_preview.append({
            "origin_date": r["origin_dt"].strftime("%Y-%m-%d"),
            "target_date": r["target_dt"].strftime("%Y-%m-%d"),
            "h": int(r["h"]),
            "target_dow": dow_names[int(r["dow"])],
            "lag_1": clean_val(r["lag_1"]),
            "lag_7": clean_val(r["lag_7"]),
            "roll_7": clean_val(r["roll_7"]),
            "solar_lag1": clean_val(r["solar_lag1"]),
            "wind_lag1": clean_val(r["wind_lag1"]),
            "target_y": clean_val(r["y"]),
        })

    # 3. Forecast table preview: 30 October rows structured as prediction inputs
    forecast_table_preview = []
    for idx, r in test_df.iterrows():
        forecast_table_preview.append({
            "origin_date": origin_dt.strftime("%Y-%m-%d"),
            "target_date": r["target_dt"].strftime("%Y-%m-%d"),
            "h": int(r["h"]),
            "target_dow": dow_names[int(r["dow"])],
            "lag_1": clean_val(r["lag_1"]),
            "lag_7": clean_val(r["lag_7"]),
            "roll_7": clean_val(r["roll_7"]),
            "solar_lag1": clean_val(r["solar_lag1"]),
            "wind_lag1": clean_val(r["wind_lag1"]),
            "target_y_input": None,
            "target_y_available": False,
            "actual_later": clean_val(r["y"]),
            "actual_later_status": "Evaluation holdout only (unobserved at T)",
        })

    # 4. Model protocol metadata
    model_protocol = {
        "pipeline": "StandardScaler -> Ridge(alpha=10.0)",
        "model_name": "Ridge Regression",
        "alpha": 10.0,
        "training_origin_count": len(train_origins_used),
        "horizons_per_origin": horizon,
        "total_training_rows": len(train_df),
        "origin_stride": 2,
        "target_name": "y(T+h)",
        "target_type": "scalar future load, MW",
        "strategy_name": "Pooled, horizon-conditioned direct multi-step regressor",
        "strategy_description": (
            f"We fit one separate StandardScaler -> Ridge(alpha=10) pipeline for each safe feature set. "
            f"Within a feature set, that one Ridge model is pooled across all {len(train_origins_used)} origins "
            f"and {horizon} horizons ({len(train_df)} rows). Horizon step h and forward calendar features are inputs. "
            f"The model produces one scalar prediction per row; {horizon} individual scalar predictions are assembled into the {horizon}-day forecast path."
        ),
        "model_count_note": (
            f"We fit one separate StandardScaler -> Ridge(alpha=10) pipeline for each safe feature set. "
            f"Within a feature set, that one Ridge model is pooled across all {len(train_origins_used)} origins and {horizon} horizons."
        ),
        "recursive": False,
        "models_per_horizon": False,
        "output_per_row": "scalar",
        "forecast_path_length": 30,
    }

    # 5. Feature groups metadata
    feature_groups = {
        "history_horizon": {
            "key": "history_horizon",
            "metric_key": "lags_only",
            "label": "History + horizon",
            "columns": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28", "h", "h_sin", "h_cos"],
            "feature_count": 9,
            "grouped_columns": [
                {"group": "History lags", "columns": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28"]},
                {"group": "Horizon", "columns": ["h", "h_sin", "h_cos"]},
            ],
            "purpose": "History + horizon asks whether frozen history alone carries the weekly shape when conditioned on horizon step h.",
            "question": "Can frozen autoregressive history alone carry the weekly demand cycle?",
        },
        "history_rolling": {
            "key": "history_rolling",
            "metric_key": "lags_rolling",
            "label": "+ origin-window rolling",
            "columns": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28", "roll_7", "roll_28", "h", "h_sin", "h_cos"],
            "feature_count": 11,
            "grouped_columns": [
                {"group": "History lags", "columns": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28"]},
                {"group": "Origin-window rolling", "columns": ["roll_7", "roll_28"]},
                {"group": "Horizon", "columns": ["h", "h_sin", "h_cos"]},
            ],
            "purpose": "+ origin-window rolling asks whether summaries of the same history add useful level information beyond raw lags; these windows end at origin T, so they are known and frozen for all horizons and are safe relative to y(T+h).",
            "question": "Do summary statistics of the same history add useful information?",
        },
        "safe_full": {
            "key": "safe_full",
            "metric_key": "safe_full",
            "label": "Full safe: + target calendar + origin-known renewables",
            "columns": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28", "roll_7", "roll_28", "dow_sin", "dow_cos", "is_weekend", "solar_lag1", "wind_lag1", "h", "h_sin", "h_cos"],
            "feature_count": 16,
            "grouped_columns": [
                {"group": "History lags", "columns": ["lag_1", "lag_2", "lag_3", "lag_7", "lag_14", "lag_28"]},
                {"group": "Origin-window rolling", "columns": ["roll_7", "roll_28"]},
                {"group": "Horizon", "columns": ["h", "h_sin", "h_cos"]},
                {"group": "Target-day calendar", "columns": ["dow_sin", "dow_cos", "is_weekend"]},
                {"group": "Origin-known renewables", "columns": ["solar_lag1", "wind_lag1"]},
            ],
            "purpose": "Full safe adds target-day calendar and origin-known renewables and asks whether known timing restores the weekly pattern.",
            "question": "Does knowing the target day's calendar position restore the weekly wave?",
        },
    }

    # 6. Benchmark metadata & Leakage diagnostic metadata
    benchmark_meta = {
        "name": "seasonal_naive",
        "label": "Seasonal Naive (7-day persistence)",
        "type": "heuristic benchmark",
        "why_separate": "Seasonal naive is an unfitted heuristic benchmark repeating the most recent observed day of the same weekday, not a fitted Ridge feature representation.",
        "rule": "y_hat(T+h) = y(T - 6 + ((h - 1) % 7))",
        "train_mae": clean_val(sn_train_mae),
        "test_mae": clean_val(sn_test_mae),
        "test_rmse": clean_val(sn_test_rmse),
    }

    leakage_diagnostic_meta = {
        "name": "target_load",
        "label": "Target-Load Leakage Diagnostic",
        "type": "intentionally invalid diagnostic",
        "why_separate": "The target_load model is an intentionally invalid educational diagnostic showing the fatal trap of lookahead leakage, not a valid feature representation.",
        "columns": ["target_load", "h", "h_sin", "h_cos"],
        "train_mae": clean_val(leaky_train_mae),
        "invalid_test_mae": clean_val(invalid_test_mae),
        "production_test_mae": clean_val(prod_test_mae),
        "production_test_rmse": clean_val(prod_test_rmse),
        "explanation": (
            f"target_load is a forbidden copy of the answer. The invalid test score "
            f"({clean_val(invalid_test_mae):.2f} MW) is not a forecast because future load is unknown at forecast time; "
            f"replacing it with origin load in deployment produces the flat red failure path "
            f"(MAE {clean_val(prod_test_mae):,.2f} MW)."
        ),
    }

    # 7. Safe vs leaky row comparison examples
    safe_vs_leaky_rows = [
        {
            "horizon": 1,
            "target_date": test_df.loc[0, "target_dt"].strftime("%Y-%m-%d"),
            "feature_set": "Safe Full",
            "input_target_load": "None (unobserved at T)",
            "calendar_used": f"dow={test_df.loc[0, 'dow']} ({dow_names[test_df.loc[0, 'dow']]})",
            "lag_1": clean_val(test_df.loc[0, "lag_1"]),
            "actual_outcome": clean_val(test_df.loc[0, "y"]),
            "status": "Safe: inputs strictly known at T",
        },
        {
            "horizon": 1,
            "target_date": test_df.loc[0, "target_dt"].strftime("%Y-%m-%d"),
            "feature_set": "Leaky Diagnostic (Train)",
            "input_target_load": clean_val(test_df.loc[0, "y"]),
            "calendar_used": "None",
            "lag_1": "None",
            "actual_outcome": clean_val(test_df.loc[0, "y"]),
            "status": "Invalid leak: feeds target load as feature",
        },
        {
            "horizon": 1,
            "target_date": test_df.loc[0, "target_dt"].strftime("%Y-%m-%d"),
            "feature_set": "Leaky Diagnostic (Production)",
            "input_target_load": clean_val(origin_load),
            "calendar_used": "None",
            "lag_1": "None",
            "actual_outcome": clean_val(test_df.loc[0, "y"]),
            "status": "Production fallback: substitutes origin load",
        },
    ]

    # 8. Column glossary / display metadata for exact time alignment and truthful labeling
    column_glossary = {
        "lag_1": {
            "internal_name": "lag_1",
            "plain_label": "Last observed load at origin (y_T)",
            "time_alignment": "y_T (observation at origin T)",
            "description": "Last observed load at origin (y_T); note internal column name lag_1 retained for numerical compatibility.",
        },
        "lag_2": {
            "internal_name": "lag_2",
            "plain_label": "Load one day before origin (y_{T-1})",
            "time_alignment": "y_{T-1}",
            "description": "Load one day before origin (y_{T-1}).",
        },
        "lag_3": {
            "internal_name": "lag_3",
            "plain_label": "Load two days before origin (y_{T-2})",
            "time_alignment": "y_{T-2}",
            "description": "Load two days before origin (y_{T-2}).",
        },
        "lag_7": {
            "internal_name": "lag_7",
            "plain_label": "Weekly reference at origin (y_{T-6})",
            "time_alignment": "y_{T-6}",
            "description": "Weekly reference at origin (y_{T-6}); seventh observation counting back including T.",
        },
        "lag_14": {
            "internal_name": "lag_14",
            "plain_label": "14th observed value counting back through T (y_{T-13})",
            "time_alignment": "y_{T-13}",
            "description": "14th observed value counting back through T (y_{T-13}).",
        },
        "lag_28": {
            "internal_name": "lag_28",
            "plain_label": "28th observed value counting back through T (y_{T-27})",
            "time_alignment": "y_{T-27}",
            "description": "28th observed value counting back through T (y_{T-27}).",
        },
        "roll_7": {
            "internal_name": "roll_7",
            "plain_label": "7-day mean ending at T",
            "time_alignment": "Mean of 7 observations ending at T (y_{T-6}..y_T)",
            "description": "7-day window mean ending at origin T; all values are known at T.",
        },
        "roll_28": {
            "internal_name": "roll_28",
            "plain_label": "28-day mean ending at T",
            "time_alignment": "Mean of 28 observations ending at T (y_{T-27}..y_T)",
            "description": "28-day window mean ending at origin T; all values are known at T.",
        },
        "solar_lag1": {
            "internal_name": "solar_lag1",
            "plain_label": "Solar observed at T",
            "time_alignment": "s_T (solar generation observed at origin T)",
            "description": "Solar observed at origin T; internal name solar_lag1 retained for numerical compatibility.",
        },
        "wind_lag1": {
            "internal_name": "wind_lag1",
            "plain_label": "Wind observed at T",
            "time_alignment": "w_T (wind generation observed at origin T)",
            "description": "Wind observed at origin T; internal name wind_lag1 retained for numerical compatibility.",
        },
        "h": {
            "internal_name": "h",
            "plain_label": "Forecast horizon step h",
            "time_alignment": "Lead time offset (h = 1..30)",
            "description": "Known horizon lead time step h.",
        },
        "h_sin": {
            "internal_name": "h_sin",
            "plain_label": "Horizon harmonic sine",
            "time_alignment": "sin(2*pi*h/H)",
            "description": "Known horizon harmonic sine encoding lead time.",
        },
        "h_cos": {
            "internal_name": "h_cos",
            "plain_label": "Horizon harmonic cosine",
            "time_alignment": "cos(2*pi*h/H)",
            "description": "Known horizon harmonic cosine encoding lead time.",
        },
        "dow": {
            "internal_name": "dow",
            "plain_label": "Target-day weekday index",
            "time_alignment": "Target date T+h calendar weekday",
            "description": "Known target-day day of week (0=Mon..6=Sun).",
        },
        "dow_sin": {
            "internal_name": "dow_sin",
            "plain_label": "Target-day weekday sine",
            "time_alignment": "sin(2*pi*dow/7)",
            "description": "Known target-day calendar weekday harmonic sine.",
        },
        "dow_cos": {
            "internal_name": "dow_cos",
            "plain_label": "Target-day weekday cosine",
            "time_alignment": "cos(2*pi*dow/7)",
            "description": "Known target-day calendar weekday harmonic cosine.",
        },
        "is_weekend": {
            "internal_name": "is_weekend",
            "plain_label": "Target-day weekend flag",
            "time_alignment": "Target date T+h calendar flag",
            "description": "Known target-day binary indicator (1 if Saturday or Sunday, 0 otherwise).",
        },
        "month": {
            "internal_name": "month",
            "plain_label": "Target-day month",
            "time_alignment": "Target date T+h calendar month",
            "description": "Known target-day calendar month (1..12).",
        },
    }

    # Evidence for the split introduction: same rows, features and cutoffs.
    assert train_df["target_dt"].max() <= origin_dt
    assert train_df["origin_dt"].max() < origin_dt
    full_columns = feature_tiers["safe_full"]
    ordinary = make_pipeline(StandardScaler(), LinearRegression())
    ordinary.fit(train_df[full_columns], train_df["y"])
    ordinary_test = ordinary.predict(test_df[full_columns])
    regression_comparison = {
        "ordinary": {
            "train_mae": clean_val(mean_absolute_error(train_df["y"], ordinary.predict(train_df[full_columns]))),
            "test_mae": clean_val(mean_absolute_error(test_df["y"], ordinary_test)),
            "test_rmse": clean_val(root_mean_squared_error(test_df["y"], ordinary_test)),
        },
        "ridge": tier_results["safe_full"],
    }
    groups = {
        "History": full_columns[:6],
        "Recent averages": ["roll_7", "roll_28"],
        "Calendar": ["dow_sin", "dow_cos", "is_weekend"],
        "Renewable observations": ["solar_lag1", "wind_lag1"],
        "Days ahead": ["h", "h_sin", "h_cos"],
    }
    full_pipe = fitted_pipelines["safe_full"]
    scaler, ridge_model = full_pipe.steps[0][1], full_pipe.steps[1][1]
    scaled_rows = scaler.transform(test_df[full_columns])
    contributions = scaled_rows * ridge_model.coef_
    prediction_traces = []
    for row_idx, row in test_df.iterrows():
        grouped = [{"group": label, "contribution_mw": clean_val(sum(contributions[row_idx, full_columns.index(col)] for col in cols), 4)}
                   for label, cols in groups.items()]
        reconstructed = float(ridge_model.intercept_) + sum(item["contribution_mw"] for item in grouped)
        assert abs(reconstructed - test_predictions_raw["safe_full"][row_idx]) < 0.001
        prediction_traces.append({
            "h": int(row["h"]), "target_date": row["target_dt"].strftime("%Y-%m-%d"),
            "intercept_mw": clean_val(ridge_model.intercept_, 4),
            "contributions": grouped,
            "prediction_mw": clean_val(test_predictions_raw["safe_full"][row_idx], 4),
        })
    linked_examples = []
    for row in training_table_preview:
        t = int(df.index[df["datetime"] == pd.Timestamp(row["origin_date"])][0])
        linked_examples.append({
            **row,
            "weekly_reference_date": df.loc[t - 6, "datetime"].strftime("%Y-%m-%d"),
            "average_source": [{"date": df.loc[j, "datetime"].strftime("%Y-%m-%d"), "load": clean_val(df.loc[j, "y"])} for j in range(t - 6, t + 1)],
            "source_rows": [{"date": df.loc[j, "datetime"].strftime("%Y-%m-%d"),
                             "load": clean_val(df.loc[j, "y"]),
                             "role": "Training answer (observed later)" if j == t + row["h"] else "History available at origin"}
                            for j in [t - 6, t, t + row["h"]]],
        })

    return {
        "origin_date": origin_dt.strftime("%Y-%m-%d"),
        "origin_index": 28,  # timeline position corresponding to cutoff
        "horizon": horizon,
        "training_origin_start": df.loc[train_origins[0], "datetime"].strftime("%Y-%m-%d"),
        "training_origin_end": df.loc[train_origins[-1], "datetime"].strftime("%Y-%m-%d"),
        "training_origins_full": len(train_origins),
        "training_origins_used": len(train_origins_used),
        "origin_stride": 2,
        "days_safe_closer": days_safe_closer,
        "days_total": 30,
        "largest_safe_miss": largest_safe_miss,
        "safe_test_rmse": safe_test_rmse,
        "naive_test_rmse": naive_test_rmse,
        "mae_gap_vs_naive": mae_gap_vs_naive,
        "mae_gap_pct_vs_naive": mae_gap_pct_vs_naive,
        "dataset_rows": len(df),
        "dataset_start": df["datetime"].min().strftime("%Y-%m-%d"),
        "dataset_end": df["datetime"].max().strftime("%Y-%m-%d"),
        "holdout_start": test_df["target_dt"].min().strftime("%Y-%m-%d"),
        "holdout_end": test_df["target_dt"].max().strftime("%Y-%m-%d"),
        "ridge_alpha": 10.0,
        "metrics": tier_results,
        "timeline": timeline,
        "sample_feature_table": sample_rows,
        "default_view": "Safe Ridge vs Seasonal Naive",
        "raw_series_preview": raw_series_preview,
        "raw_series_note": "Wholesale spot price exists in the raw source rows but is not used as a feature by this 6.1 Ridge model.",
        "raw_series_price_used": False,
        "training_table_preview": training_table_preview,
        "forecast_table_preview": forecast_table_preview,
        "model_protocol": model_protocol,
        "feature_groups": feature_groups,
        "benchmark": benchmark_meta,
        "leakage_diagnostic": leakage_diagnostic_meta,
        "safe_vs_leaky_rows": safe_vs_leaky_rows,
        "column_glossary": column_glossary,
        "linear_intro": build_linear_intro(df, train_df, test_df, feature_tiers, origin_idx),
        "intro_evidence": {
            "regression_comparison": regression_comparison,
            "prediction_traces": prediction_traces,
            "linked_examples": linked_examples,
            "feature_tiers": [{"key": key, "columns": cols, "feature_count": len(cols)} for key, cols in feature_tiers.items()],
            "sampled_origin_end": train_df["origin_dt"].max().strftime("%Y-%m-%d"),
            "label_start": train_df["target_dt"].min().strftime("%Y-%m-%d"),
            "label_end": train_df["target_dt"].max().strftime("%Y-%m-%d"),
            "history_lookback_days": 28,
            "average_windows_days": [7, 28],
            "load_units": "daily average MW",
            "renewable_units": "daily energy MWh (sum of hourly MW readings over one-hour intervals)",
            "availability_assumption": "Origin-day actuals treated as available after that day is observed; publication delays are not modelled.",
        },
    }


def gen_tab2() -> dict:
    return section_evidence.packed(section_evidence.tree_lesson())


def gen_tab3(df: pd.DataFrame) -> dict:
    return section_evidence.packed(section_evidence.arena(df))


def gen_tab4(df: pd.DataFrame) -> dict:
    return section_evidence.packed(section_evidence.multistep(df))


def gen_tab5() -> dict:
    return section_evidence.packed(section_evidence.trend_lesson())


def gen_tab6(df: pd.DataFrame) -> dict:
    return section_evidence.packed(section_evidence.uncertainty(df))


def json_default(o):
    """Custom JSON serializer for numpy and pandas data structures."""
    if isinstance(o, (np.integer, int)):
        return int(o)
    if isinstance(o, (np.floating, float)):
        if math.isnan(o) or math.isinf(o):
            return None
        return round(float(o), 2)
    if isinstance(o, (np.bool_, bool)):
        return bool(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    return str(o)


def main():
    if __package__:
        from .topic6_pairs import write
    else:
        from topic6_pairs import write
    write()


if __name__ == "__main__":
    main()


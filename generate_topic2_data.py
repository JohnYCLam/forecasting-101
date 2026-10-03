import json
import os
import numpy as np
import pandas as pd
import warnings
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.arima_process import arma_generate_sample
from statsmodels.tsa.exponential_smoothing.ets import ETSModel
from statsmodels.tsa.statespace.sarimax import SARIMAX

warnings.filterwarnings("ignore")

def generate_tab1():
    print("Generating Tab 1: ARMA(p,q) Grid...")
    results = {}
    train_size = 100
    test_size = 20
    
    # 0 <= p, q <= 8
    for p in range(9):
        for q in range(9):
            # Generate stationary/invertible coefficients
            ar = [1.0] + [-0.5**i for i in range(1, p+1)]
            ma = [1.0] + [0.5**j for j in range(1, q+1)]
            
            np.random.seed(p * 10 + q) # reproducible
            data = arma_generate_sample(ar, ma, nsample=train_size + test_size)
            
            train = data[:train_size]
            test = data[train_size:]
            
            try:
                # Fit ARIMA(p,0,q)
                model = ARIMA(train, order=(p, 0, q), enforce_stationarity=False, enforce_invertibility=False)
                res = model.fit()
                in_sample = res.predict(start=0, end=train_size-1).tolist()
                out_sample = res.forecast(steps=test_size).tolist()
            except Exception:
                in_sample = [0]*train_size
                out_sample = [0]*test_size
                
            key = f"p{p}_q{q}"
            results[key] = {
                "actual": data.tolist(),
                "in_sample": in_sample,
                "out_sample": out_sample,
                "train_size": train_size
            }
    return results

def fit_hw_and_arima(data, arima_order, hw_trend, train_size):
    train = data[:train_size]
    test = data[train_size:]
    
    try:
        model_a = ARIMA(train, order=arima_order)
        res_a = model_a.fit()
        arima_in = res_a.predict(start=0, end=train_size-1).tolist()
        arima_out = res_a.forecast(steps=len(test)).tolist()
    except Exception:
        arima_in = [0]*train_size; arima_out = [0]*len(test)
        
    try:
        model_h = ETSModel(train, error='add', trend=hw_trend, seasonal=None)
        res_h = model_h.fit(disp=False)
        hw_in = res_h.fittedvalues.tolist()
        hw_out = res_h.forecast(steps=len(test)).tolist()
    except Exception:
        hw_in = [0]*train_size; hw_out = [0]*len(test)

    return {
        "actual": data.tolist(),
        "train_size": train_size,
        "arima_in": arima_in,
        "arima_out": arima_out,
        "hw_in": hw_in,
        "hw_out": hw_out
    }

def generate_tab2():
    print("Generating Tab 2: ARIMA vs HW (Synthetic)...")
    results = {}
    train_size = 100
    
    # Example 1: MA(1)
    np.random.seed(42)
    data_ma1 = arma_generate_sample([1], [1, 0.9], nsample=120)
    results["MA1"] = fit_hw_and_arima(data_ma1, (0,0,1), None, train_size)
    
    # Example 2: AR(2)
    np.random.seed(42)
    data_ar2 = arma_generate_sample([1, -1.2, 0.7], [1], nsample=120)
    results["AR2"] = fit_hw_and_arima(data_ar2, (2,0,0), 'add', train_size)
    
    # Example 3: AR(1)
    np.random.seed(42)
    data_ar1 = arma_generate_sample([1, 0.8], [1], nsample=120)
    results["AR1"] = fit_hw_and_arima(data_ar1, (1,0,0), None, train_size)
    
    return results

def generate_tab3():
    print("Generating Tab 3: ARIMA vs HW (Real Data)...")
    results = {}
    
    # Sunspots
    dta_sun = sm.datasets.sunspots.load_pandas().data
    ts_sun = dta_sun['SUNACTIVITY']
    train_size_sun = len(dta_sun[dta_sun['YEAR'] <= 1920])
    
    model_arima_sun = ARIMA(ts_sun.iloc[:train_size_sun], order=(9,0,0)).fit()
    pred_sun = model_arima_sun.get_forecast(steps=len(ts_sun)-train_size_sun)
    
    model_hw_sun = ETSModel(ts_sun.iloc[:train_size_sun], error='add', trend='add', seasonal=None).fit(disp=False)
    pred_hw_sun = model_hw_sun.get_prediction(start=train_size_sun, end=len(ts_sun)-1)
    
    results["Sunspots"] = {
        "actual": ts_sun.tolist(),
        "train_size": train_size_sun,
        "arima_in": model_arima_sun.predict(start=0, end=train_size_sun-1).tolist(),
        "arima_out": pred_sun.predicted_mean.tolist(),
        "arima_ci_lower": pred_sun.conf_int(alpha=0.05).iloc[:, 0].tolist(),
        "arima_ci_upper": pred_sun.conf_int(alpha=0.05).iloc[:, 1].tolist(),
        "hw_in": model_hw_sun.fittedvalues.tolist(),
        "hw_out": pred_hw_sun.predicted_mean.tolist(),
        "hw_ci_lower": pred_hw_sun.pred_int(alpha=0.05).iloc[:, 0].tolist(),
        "hw_ci_upper": pred_hw_sun.pred_int(alpha=0.05).iloc[:, 1].tolist()
    }
    
    # T-Bill
    dta_macro = sm.datasets.macrodata.load_pandas().data
    dta_macro['date'] = pd.PeriodIndex(dta_macro['year'].astype(int).astype(str) + 'Q' + dta_macro['quarter'].astype(int).astype(str), freq='Q').to_timestamp()
    dta_macro.set_index('date', inplace=True)
    ts_tbil = dta_macro['tbilrate']
    train_size_tbil = len(dta_macro[:'1981-12-31'])
    test_size_tbil = len(dta_macro['1982-01-01':'1987-12-31'])
    ts_tbil = ts_tbil.iloc[:train_size_tbil + test_size_tbil]
    
    model_arima_tbil = ARIMA(ts_tbil.iloc[:train_size_tbil], order=(3,0,1)).fit()
    pred_tbil = model_arima_tbil.get_forecast(steps=test_size_tbil)
    
    model_hw_tbil = ETSModel(ts_tbil.iloc[:train_size_tbil], error='add', trend='add', seasonal=None).fit(disp=False)
    pred_hw_tbil = model_hw_tbil.get_prediction(start=ts_tbil.index[train_size_tbil], end=ts_tbil.index[-1])
    
    results["TBill"] = {
        "actual": ts_tbil.tolist(),
        "train_size": train_size_tbil,
        "arima_in": model_arima_tbil.predict(start=0, end=train_size_tbil-1).tolist(),
        "arima_out": pred_tbil.predicted_mean.tolist(),
        "arima_ci_lower": pred_tbil.conf_int(alpha=0.05).iloc[:, 0].tolist(),
        "arima_ci_upper": pred_tbil.conf_int(alpha=0.05).iloc[:, 1].tolist(),
        "hw_in": model_hw_tbil.fittedvalues.tolist(),
        "hw_out": pred_hw_tbil.predicted_mean.tolist(),
        "hw_ci_lower": pred_hw_tbil.pred_int(alpha=0.05).iloc[:, 0].tolist(),
        "hw_ci_upper": pred_hw_tbil.pred_int(alpha=0.05).iloc[:, 1].tolist()
    }
    
    return results

def generate_tab4():
    print("Generating Tab 4: Auto vs Manual ARIMA...")
    dta_macro = sm.datasets.macrodata.load_pandas().data
    dta_macro['date'] = pd.PeriodIndex(dta_macro['year'].astype(int).astype(str) + 'Q' + dta_macro['quarter'].astype(int).astype(str), freq='Q').to_timestamp()
    dta_macro.set_index('date', inplace=True)
    ts = dta_macro['unemp']
    
    train_size = len(dta_macro[:'1982-01-01'])
    test_size = len(dta_macro['1982-04-01':'1987-01-01'])
    ts = ts.iloc[:train_size + test_size]
    
    # Manual (Constrained d=0)
    model_manual = ARIMA(ts.iloc[:train_size], order=(3,0,1)).fit()
    out_manual = model_manual.forecast(steps=test_size).tolist()
    
    # Auto (Blind d=1 usually selected here. We will use (1,1,2) to simulate blind selection extrapolating trend)
    model_blind = ARIMA(ts.iloc[:train_size], order=(1,1,2)).fit()
    out_blind = model_blind.forecast(steps=test_size).tolist()
    
    return {
        "actual": ts.tolist(),
        "train_size": train_size,
        "manual_in": model_manual.predict(start=0, end=train_size-1).tolist(),
        "manual_out": out_manual,
        "blind_in": model_blind.predict(start=0, end=train_size-1).tolist(),
        "blind_out": out_blind
    }

def generate_tab5():
    print("Generating Tab 5: SARIMA vs HW...")
    results = {}
    
    # Australian Gas
    gas_data = [
        82, 85, 87, 102, 120, 137, 151, 145, 122, 108, 97, 86,       
        85, 91, 101, 124, 155, 172, 196, 192, 153, 137, 115, 102,    
        100, 109, 125, 145, 171, 199, 219, 210, 179, 152, 129, 116,  
        115, 112, 135, 155, 176, 212, 240, 230, 196, 161, 140, 119,  
        118, 121, 137, 160, 203, 232, 260, 247, 208, 185, 152, 137,  
        128, 136, 161, 182, 222, 258, 290, 273, 225, 194, 169, 150,  
        144, 150, 176, 197, 235, 272, 303, 285, 247, 212, 185, 163,  
        155, 161, 191, 213, 260, 298, 329, 311, 267, 229, 203, 174,  
        168, 175, 204, 230, 284, 322, 355, 335, 287, 244, 218, 187,  
        177, 182, 212, 242, 294, 335, 365, 345, 298, 256, 228, 197,  
        188, 195, 227, 259, 312, 355, 386, 367, 316, 271, 242, 208,  
        196, 201, 234, 267, 321, 366, 400, 378, 325, 280, 251, 216,  
        203, 209, 242, 278, 334, 381, 415, 393, 339, 293, 263, 226,  
        213, 219, 253, 290, 348, 396, 431, 409, 354, 307, 276, 238,  
        224, 231, 266, 305, 365, 415, 451, 429, 372, 323, 291, 252,  
        237, 246, 283, 325, 390, 442, 480, 457, 397, 346, 312, 271   
    ]
    train_gas = gas_data[:-24]
    
    hw_gas = ETSModel(train_gas, error='mul', trend='add', seasonal='mul', seasonal_periods=12).fit(disp=False)
    hw_gas_in = hw_gas.fittedvalues.tolist()
    hw_gas_out = hw_gas.forecast(steps=24).tolist()
    
    sarima_gas = SARIMAX(np.log(train_gas), order=(0,1,1), seasonal_order=(0,1,1,12), enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
    sarima_gas_in = np.exp(sarima_gas.predict(start=0, end=len(train_gas)-1)).tolist()
    sarima_gas_out = np.exp(sarima_gas.forecast(steps=24)).tolist()
    
    results["Gas"] = {
        "actual": gas_data,
        "train_size": len(train_gas),
        "sarima_in": sarima_gas_in,
        "sarima_out": sarima_gas_out,
        "hw_in": hw_gas_in,
        "hw_out": hw_gas_out
    }
    return results

def generate_tab6():
    print("Generating Tab 6: SARIMAX with Exogenous...")
    np.random.seed(42)
    periods = 120
    time = np.arange(periods)
    
    # Base sales
    trend = 0.5 * time
    seasonality = 15 * np.sin(2 * np.pi * time / 12)
    noise = np.random.normal(0, 3, periods)
    base_sales = 100 + trend + seasonality + noise
    
    # Exogenous factor (Promotions every ~14 months, huge spike)
    promo = np.zeros(periods)
    for i in range(10, periods, 14):
        promo[i] = 1
        promo[i+1] = 1
    
    sales = base_sales + 60 * promo
    
    train_size = 96
    test_size = 24
    
    # Without Exog
    model_no_exog = SARIMAX(sales[:train_size], order=(1,0,0), seasonal_order=(0,1,0,12)).fit(disp=False)
    out_no_exog = model_no_exog.forecast(steps=test_size).tolist()
    
    # With Exog
    model_exog = SARIMAX(sales[:train_size], exog=promo[:train_size], order=(1,0,0), seasonal_order=(0,1,0,12)).fit(disp=False)
    out_exog = model_exog.forecast(steps=test_size, exog=promo[train_size:]).tolist()
    
    return {
        "actual": sales.tolist(),
        "exog": promo.tolist(),
        "train_size": train_size,
        "no_exog_in": model_no_exog.predict(start=0, end=train_size-1).tolist(),
        "no_exog_out": out_no_exog,
        "exog_in": model_exog.predict(start=0, end=train_size-1).tolist(),
        "exog_out": out_exog
    }

if __name__ == "__main__":
    final_data = {
        "tab1": generate_tab1(),
        "tab2": generate_tab2(),
        "tab3": generate_tab3(),
        "tab4": generate_tab4(),
        "tab5": generate_tab5(),
        "tab6": generate_tab6()
    }
    
    out_path = os.path.join("public", "topic2_data.json")
    with open(out_path, "w") as f:
        json.dump(final_data, f)
    
    print(f"Successfully generated {out_path}!")

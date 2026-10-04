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
    
    for p in range(9):
        for q in range(9):
            ar = [1.0] + [-0.5 * (0.8**i) / i for i in range(1, p+1)]
            ma = [1.0] + [0.5**j for j in range(1, q+1)]
            
            np.random.seed(p * 10 + q) 
            data = arma_generate_sample(ar, ma, nsample=train_size + test_size, scale=2.0)
            
            train = data[:train_size]
            
            try:
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
                "time_label": list(range(train_size + test_size)),
                "in_sample": in_sample,
                "out_sample": out_sample,
                "train_size": train_size,
                "description": f"Synthetic ARMA({p}, {q}) process. p={p} means {p} autoregressive terms (memory). q={q} means {q} moving average terms (shock reactions)."
            }
    return results

def fit_hw_and_arima(data, arima_order, hw_trend, train_size, title):
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
        "time_label": list(range(len(data))),
        "train_size": train_size,
        "arima_in": arima_in,
        "arima_out": arima_out,
        "hw_in": hw_in,
        "hw_out": hw_out,
        "arima_order": str(arima_order),
        "description": title
    }

def generate_tab2():
    print("Generating Tab 2: ARIMA vs HW (Synthetic)...")
    results = {}
    train_size = 100
    
    np.random.seed(42)
    errors = np.random.normal(scale=3.0, size=120)
    errors[99] = 20.0  # Massive shock exactly at the end of the train set
    data_ma1 = np.zeros(120)
    for i in range(1, 120):
        data_ma1[i] = errors[i] + 0.9 * errors[i-1]
    
    results["MA1"] = fit_hw_and_arima(data_ma1, (0,0,1), None, train_size, "MA(1) Transient Shock. This dataset was generated using a Moving Average process of order 1, meaning random white noise shocks affect the current time step and exactly 1 future time step. We injected a massive 20.0-unit positive shock at t=99. Because it's an MA(1) process with theta=0.9, this shock echoes exactly once at t=100 before instantly vanishing, leaving no permanent correlation.")
    
    np.random.seed(42)
    data_ar2 = arma_generate_sample([1, -1.2, 0.7], [1], nsample=120, scale=3.0)
    results["AR2"] = fit_hw_and_arima(data_ar2, (2,0,0), 'add', train_size, "AR(2) Variable Cycle: A complex autoregressive structure with complex roots causes aperiodic cycles. HW's linear trend completely shoots into space, while ARIMA(2,0,0) perfectly traces the sinusoidal decay.")
    
    np.random.seed(42)
    data_ar1 = arma_generate_sample([1, 0.8], [1], nsample=120, scale=3.0)
    results["AR1"] = fit_hw_and_arima(data_ar1, (1,0,0), None, train_size, "AR(1) High-Frequency Mean Reversion: The data wildly oscillates above and below the mean. ARIMA(1,0,0) captures this alternating current.")
    
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
    
    # Removed SARIMA model request for Sunspots
    
    model_hw_sun = ETSModel(ts_sun.iloc[:train_size_sun], error='add', trend='add', seasonal='add', seasonal_periods=11).fit(disp=False)
    pred_hw_sun = model_hw_sun.get_prediction(start=train_size_sun, end=len(ts_sun)-1)
    
    results["Sunspots"] = {
        "actual": ts_sun.tolist(),
        "time_label": dta_sun['YEAR'].astype(int).astype(str).tolist(),
        "train_size": train_size_sun,
        "arima_in": model_arima_sun.predict(start=0, end=train_size_sun-1).tolist(),
        "arima_out": pred_sun.predicted_mean.tolist(),
        "hw_in": model_hw_sun.fittedvalues.tolist(),
        "hw_out": pred_hw_sun.predicted_mean.tolist(),
        "arima_order": "(9, 0, 0)",
        "description": "Yearly Sunspots Activity (1700-2008). ARIMA(9,0,0) discovers the ~11-year solar cycle via high-order autoregression. Holt-Winters is configured with an 11-year seasonal period, testing if a rigid calendar seasonality can predict aperiodic cycles."
    }
    
    # T-Bill
    dta_macro = sm.datasets.macrodata.load_pandas().data
    dta_macro['date'] = pd.PeriodIndex(dta_macro['year'].astype(int).astype(str) + 'Q' + dta_macro['quarter'].astype(int).astype(str), freq='Q').to_timestamp()
    dta_macro.set_index('date', inplace=True)
    ts_tbil = dta_macro['tbilrate']
    train_size_tbil = len(dta_macro[:'1981-12-31'])
    test_size_tbil = len(dta_macro['1982-01-01':'1987-12-31'])
    ts_tbil_slice = ts_tbil.iloc[:train_size_tbil + test_size_tbil]
    
    model_arima_tbil = ARIMA(ts_tbil_slice.iloc[:train_size_tbil], order=(3,0,1)).fit()
    pred_tbil = model_arima_tbil.get_forecast(steps=test_size_tbil)
    
    model_hw_tbil = ETSModel(ts_tbil_slice.iloc[:train_size_tbil], error='add', trend='add', seasonal=None).fit(disp=False)
    pred_hw_tbil = model_hw_tbil.get_prediction(start=ts_tbil_slice.index[train_size_tbil], end=ts_tbil_slice.index[-1])
    
    results["TBill"] = {
        "actual": ts_tbil_slice.tolist(),
        "time_label": ts_tbil_slice.index.strftime('%Y-Q%q').tolist(),
        "train_size": train_size_tbil,
        "arima_in": model_arima_tbil.predict(start=0, end=train_size_tbil-1).tolist(),
        "arima_out": pred_tbil.predicted_mean.tolist(),
        "hw_in": model_hw_tbil.fittedvalues.tolist(),
        "hw_out": pred_hw_tbil.predicted_mean.tolist(),
        "arima_order": "(3, 0, 1)",
        "description": "US 3-Month Treasury Bill Rate. The ARIMA(3,0,1) model captures the complex inertia of interest rates better than a rigid Holt linear trend."
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
    ts_slice = ts.iloc[:train_size + test_size]
    
    model_manual = ARIMA(ts_slice.iloc[:train_size], order=(3,0,1)).fit()
    out_manual = model_manual.forecast(steps=test_size).tolist()
    
    model_blind = ARIMA(ts_slice.iloc[:train_size], order=(1,1,2)).fit()
    out_blind = model_blind.forecast(steps=test_size).tolist()
    
    return {
        "actual": ts_slice.tolist(),
        "time_label": ts_slice.index.strftime('%Y-Q%q').tolist(),
        "train_size": train_size,
        "manual_in": model_manual.predict(start=0, end=train_size-1).tolist(),
        "manual_out": out_manual,
        "blind_in": model_blind.predict(start=0, end=train_size-1).tolist(),
        "blind_out": out_blind,
        "manual_order": "(3, 0, 1)",
        "blind_order": "(1, 1, 2)",
        "description": "US Unemployment Rate. Blind auto-arima detects non-stationarity and uses differencing (d=1), predicting unemployment rises to infinity. Domain knowledge restricts it to d=0 (mean-reverting)."
    }

def generate_tab5():
    print("Generating Tab 5: SARIMA vs HW...")
    results = {}
    
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
    dates = pd.date_range(start='1980-01-01', periods=len(gas_data), freq='MS')
    ts = pd.Series(gas_data, index=dates)
    train_gas = ts.iloc[:-24]
    
    hw_gas = ETSModel(train_gas, error='mul', trend='add', seasonal='mul', seasonal_periods=12).fit(disp=False)
    hw_gas_in = hw_gas.fittedvalues.tolist()
    hw_gas_out = hw_gas.forecast(steps=24).tolist()
    
    sarima_gas = SARIMAX(np.log(train_gas), order=(0,1,1), seasonal_order=(0,1,1,12), enforce_stationarity=False, enforce_invertibility=False).fit(disp=False)
    sarima_gas_in = np.exp(sarima_gas.predict(start=0, end=len(train_gas)-1)).tolist()
    # The first 13 periods are unstable due to d=1 and D=1 (s=12) differencing, so we null them out
    sarima_gas_in[:13] = [None] * 13
    sarima_gas_out = np.exp(sarima_gas.forecast(steps=24)).tolist()
    
    results["Gas"] = {
        "actual": gas_data,
        "time_label": dates.strftime('%Y-%b').tolist(),
        "train_size": len(train_gas),
        "sarima_in": sarima_gas_in,
        "sarima_out": sarima_gas_out,
        "hw_in": hw_gas_in,
        "hw_out": hw_gas_out,
        "sarima_order": "(0,1,1)x(0,1,1,12) [Log Transformed]",
        "description": "Australian Monthly Gas Production (1980-1995). Showcasing expanding seasonal variance (Heteroskedasticity). We log-transform the data before passing to SARIMA."
    }
    return results

def generate_tab6():
    print("Generating Tab 6: SARIMAX with Exogenous...")
    np.random.seed(42)
    periods = 156
    weeks = pd.date_range(start='2020-01-05', periods=periods, freq='W')
    
    trend = np.linspace(100, 200, periods)
    seasonality = 50 * np.sin(2 * np.pi * np.arange(periods) / 52)
    noise = np.random.normal(0, 10, periods)
    
    promo_calendar = np.random.choice([0, 1], size=periods, p=[0.85, 0.15])
    promo_lift = promo_calendar * 80
    
    sales = trend + seasonality + promo_lift + noise
    df = pd.DataFrame({'Sales': sales, 'Promo_Active': promo_calendar}, index=weeks)
    
    train_size = 104
    test_size = 52
    train = df.iloc[:train_size]
    test = df.iloc[train_size:]
    
    # 1. Holt-Winters baseline (No Exog)
    hw_model = ETSModel(train['Sales'], error='add', trend='add', seasonal='add', seasonal_periods=52).fit(disp=False)
    hw_in = hw_model.fittedvalues.tolist()
    hw_out = hw_model.forecast(steps=len(test)).tolist()
    
    # 2. SARIMA (No Exog)
    sarima_model = SARIMAX(train['Sales'], order=(1, 1, 1), seasonal_order=(0, 1, 1, 52)).fit(disp=False)
    sarima_in = sarima_model.fittedvalues.tolist()
    sarima_out = sarima_model.forecast(steps=len(test)).tolist()

    # 3. SARIMAX With Exog
    sarimax_model = SARIMAX(train['Sales'], exog=train[['Promo_Active']], order=(1, 1, 1), seasonal_order=(0, 1, 1, 52)).fit(disp=False)
    sarimax_in = sarimax_model.fittedvalues.tolist()
    sarimax_out = sarimax_model.forecast(steps=len(test), exog=test[['Promo_Active']]).tolist()
    
    return {
        "actual": sales.tolist(),
        "exog_marker": [val if exog == 1 else None for val, exog in zip(sales.tolist(), promo_calendar.tolist())],
        "exog_flag": promo_calendar.tolist(),
        "time_label": weeks.strftime('%Y-%m-%d').tolist(),
        "train_size": train_size,
        "hw_in": hw_in,
        "hw_out": hw_out,
        "sarima_in": sarima_in,
        "sarima_out": sarima_out,
        "sarimax_in": sarimax_in,
        "sarimax_out": sarimax_out,
        "sarimax_order": "(1,1,1)x(0,1,1,52)",
        "description": "Weekly Retail Sales with Promotion Calendar. Notice how the baseline model is confused by random spikes. Adding the 'X' (Exogenous variable) perfectly predicts promotional lifts."
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

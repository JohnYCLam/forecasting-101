"""Paired day-ahead rental experiments: real source and fixed-seed controlled counterpart."""
from pathlib import Path
import argparse
import hashlib
import json
import time
import warnings
import numpy as np
import pandas as pd
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor
from xgboost import XGBRegressor

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'experiments/section6_dataset_redesign_2026-11-07/canonical'
SOURCE=ROOT/'references/boost-vs-forest-ts/data/bike_sharing/hour.csv'
H=24
HISTORY=84*24
DEV=[str(x)[:16] for start in ['2011-07-31 23:00','2011-09-30 23:00','2011-11-30 23:00'] for x in pd.date_range(start,periods=7,freq='D')]
EVAL=pd.date_range('2011-12-31 23:00','2012-12-30 23:00',freq='D').strftime('%Y-%m-%d %H:%M').tolist()
DISPLAY=[f'{date} 23:00' for date in ['2011-12-31','2012-03-31','2012-06-30','2012-09-30']]
FEATURES=['lag_1','lag_2','lag_24','lag_168','mean_24','mean_168','casual_origin','registered_origin',
          'hour','hour_sin','hour_cos','hour2_sin','hour2_cos','dow_sin','dow_cos','workingday','holiday',
          'year_sin','year_cos','h','week_reference','four_week_reference','day_reference','temp_origin','humidity_origin','weather_origin','temp_mean24']
CANDIDATES={
    'linear':[{}],
    'svr':[dict(C=c,gamma=g,epsilon=.1) for c in [3.,30.] for g in [.01,.05]],
    'tree':[dict(max_depth=6,min_samples_leaf=10),dict(max_depth=10,min_samples_leaf=20)],
    'forest':[dict(max_depth=10,min_samples_leaf=5),dict(max_depth=None,min_samples_leaf=5)],
    'boosting':[dict(max_depth=3,min_child_weight=10),dict(max_depth=5,min_child_weight=10)],
}

def load():
    raw=pd.read_csv(SOURCE)
    raw['datetime']=pd.to_datetime(raw.dteday)+pd.to_timedelta(raw.hr,unit='h')
    assert not raw.datetime.duplicated().any()
    df=raw.set_index('datetime').reindex(pd.date_range(raw.datetime.min(),raw.datetime.max(),freq='h'))
    calendar=pd.read_csv(SOURCE.with_name('day.csv')).set_index('dteday').holiday
    df['holiday']=calendar.reindex(df.index.strftime('%Y-%m-%d')).to_numpy()
    df['workingday']=((df.index.day_of_week<5)&(df.holiday==0)).astype(int)
    df['observed']=df.cnt.notna()
    for name in ['cnt','casual','registered']:
        df[name+'_history']=df[name].ffill()
    for window in [24,168]:df['mean_'+str(window)]=df.cnt_history.rolling(window).mean()
    df['y']=df.cnt
    for original,name in [('temp','temp_history'),('hum','hum_history'),('weathersit','weather_history')]:df[name]=df[original].ffill()
    df['temp_mean24']=df.temp_history.rolling(24).mean()
    return df

def at(df,date):return df.index.get_loc(pd.Timestamp(date))
def records(df,o,h):
    o=np.asarray(o,dtype=int);h=np.asarray(h,dtype=int);target=o+h
    assert np.all((h>=1)&(h<=H)) and np.min(target-4*168)>=0
    timestamps=df.index[target];hour=timestamps.hour.to_numpy();dow=timestamps.day_of_week.to_numpy()
    y=df.cnt_history.to_numpy();values={f'lag_{lag}':y[o-lag+1] for lag in [1,2,24,168]}
    values.update({f'mean_{window}':df['mean_'+str(window)].to_numpy()[o] for window in [24,168]})
    values.update(hour=hour,hour_sin=np.sin(2*np.pi*hour/24),hour_cos=np.cos(2*np.pi*hour/24),
                  hour2_sin=np.sin(4*np.pi*hour/24),hour2_cos=np.cos(4*np.pi*hour/24),
                  dow_sin=np.sin(2*np.pi*dow/7),dow_cos=np.cos(2*np.pi*dow/7),
                  workingday=df.workingday.to_numpy()[target],holiday=df.holiday.to_numpy()[target],
                  year_sin=np.sin(2*np.pi*timestamps.day_of_year.to_numpy()/365.25),
                  year_cos=np.cos(2*np.pi*timestamps.day_of_year.to_numpy()/365.25),h=h)
    if 'casual_origin' in FEATURES:
        values.update(casual_origin=df.casual_history.to_numpy()[o],registered_origin=df.registered_history.to_numpy()[o])
    if 'week_reference' in FEATURES:
        assert np.all(target-168<=o)
        values['week_reference']=y[target-168]
        values['four_week_reference']=np.mean([y[target-168*k] for k in range(1,5)],axis=0)
    if 'day_reference' in FEATURES:
        assert np.all(target-24<=o)
        values['day_reference']=y[target-24]
    for key,column in [('temp_origin','temp_history'),('humidity_origin','hum_history'),('weather_origin','weather_history'),('temp_mean24','temp_mean24')]:
        if key in FEATURES:values[key]=df[column].to_numpy()[o]
    return pd.DataFrame(values)[FEATURES],df.y.to_numpy()[target]

def train(df,t):
    origins=np.arange(t-HISTORY+24,t-H+1,24)
    o=np.repeat(origins,H);h=np.tile(np.arange(1,H+1),len(origins))
    X,y=records(df,o,h);keep=np.isfinite(y)
    assert np.max(o+h)<=t
    return X.loc[keep].reset_index(drop=True),y[keep],o[keep],h[keep]
def test(df,t):return records(df,np.repeat(t,H),np.arange(1,H+1))
def baselines(df,t):
    history=df.cnt_history.to_numpy()
    weekly=np.resize(history[t-167:t+1],H)
    mean=np.mean([history[t-167-168*k:t+1-168*k] for k in range(4)],axis=0)
    return dict(naive=weekly,week_mean=mean[:H])
def make(name,settings):
    if name=='linear':return make_pipeline(StandardScaler(),LinearRegression())
    if name=='svr':return TransformedTargetRegressor(regressor=make_pipeline(StandardScaler(),SVR(**settings)),transformer=StandardScaler())
    if name=='tree':return DecisionTreeRegressor(random_state=42,**settings)
    if name=='forest':return RandomForestRegressor(n_estimators=80,random_state=42,n_jobs=2,**settings)
    if name=='boosting':return XGBRegressor(n_estimators=200,learning_rate=.05,random_state=42,n_jobs=2,tree_method='hist',**settings)
    raise ValueError(name)
def metrics(y,p):
    y=np.asarray(y);p=np.asarray(p);mask=np.isfinite(y)
    e=y[mask]-p[mask]
    return dict(mae=float(np.mean(abs(e))),rmse=float(np.sqrt(np.mean(e**2))),count=int(mask.sum()))
def interaction_matrix(X):
    out=X.drop(columns=['hour','hour_sin','hour_cos','hour2_sin','hour2_cos']).copy()
    hour=X.hour.to_numpy();work=X.workingday.to_numpy()
    for k in range(1,24):
        out[f'hour_{k}']=(hour==k).astype(float)
        out[f'work_hour_{k}']=(hour==k)*work
    return out

def development(df):
    cached={}
    for date in DEV:
        t=at(df,date);X,y,o,h=train(df,t);xt,yt=test(df,t)
        cached[date]=(X,y,xt,yt)
    evidence={};selected={}
    for name,candidates in CANDIDATES.items():
        runs=[]
        for settings in candidates:
            folds=[]
            for date,(X,y,xt,yt) in cached.items():
                started=time.perf_counter();model=make(name,settings).fit(X,y);pred=model.predict(xt)
                folds.append(dict(origin=date,**metrics(yt,pred),seconds=time.perf_counter()-started))
            run=dict(settings=settings,folds=folds,mae=float(np.mean([f['mae'] for f in folds])),rmse=float(np.mean([f['rmse'] for f in folds])))
            print('DEVELOPMENT',name,settings,round(run['mae'],2),round(run['rmse'],2),flush=True)
            runs.append(run)
        best=int(np.argmin([r['mae'] for r in runs]));selected[name]=candidates[best];evidence[name]=dict(selected=best,runs=runs)
    challengers=[]
    for date,(X,y,xt,yt) in cached.items():
        t=at(df,date);p=baselines(df,t)
        model=make_pipeline(StandardScaler(),LinearRegression()).fit(interaction_matrix(X),y)
        p['linear_interactions']=model.predict(interaction_matrix(xt))
        result=dict(origin=date,metrics={name:metrics(yt,pred) for name,pred in p.items()})
        print('BASELINES',result,flush=True);challengers.append(result)
    return dict(settings=selected,development=evidence,baselines=challengers,features=FEATURES,horizon=H,
                development_origins=DEV,evaluation_origins=EVAL,display_origins=DISPLAY,
                source_sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),source_rows=int(df.observed.sum()),missing_hours=int((~df.observed).sum()))


from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.api import VAR

def simulation():
    rng=np.random.default_rng(42)
    times=pd.date_range('2011-01-01','2012-12-31 23:00',freq='h')
    days=pd.date_range('2011-01-01','2012-12-31',freq='D')
    weather=np.empty(len(days));wet=np.zeros(len(days),dtype=int)
    deviation=0.
    for i,date in enumerate(days):
        deviation=.8*deviation+rng.normal(0,2)
        weather[i]=15+10*np.sin(2*np.pi*(date.day_of_year-80)/365.25)+deviation
        wet[i]=int(rng.random()<(.65 if i and wet[i-1] else .10))
    daily=np.arange(len(times))//24
    hour=times.hour.to_numpy();source_calendar=pd.read_csv(SOURCE.with_name('day.csv')).set_index('dteday').holiday
    holiday=source_calendar.reindex(times.strftime('%Y-%m-%d')).to_numpy()
    work=((times.day_of_week<5)&(holiday==0)).astype(int)
    commute=.04+2*np.exp(-.5*((hour-8)/1.4)**2)+2.4*np.exp(-.5*((hour-17)/1.8)**2)
    leisure=.04+2.2*np.exp(-.5*((hour-14)/3.3)**2)
    profile=np.where(work,commute,leisure)
    response=.5+.8/(1+np.exp(-(weather[daily]-10)/5))
    shock=np.exp(rng.normal(0,.08,len(days))-.5*.08**2)
    rate=200*profile*response*np.where(wet[daily],.55,1)*(1+.25*daily/(len(days)-1))*shock[daily]
    count=rng.poisson(rate)
    casual=rng.binomial(count,np.where(work,.2,.55))
    df=pd.DataFrame(index=times)
    df['cnt']=count;df['casual']=casual;df['registered']=count-casual
    df['holiday']=holiday;df['workingday']=work
    df['temp']=(weather[daily]+5*np.sin(2*np.pi*(hour-8)/24)+rng.normal(0,.5,len(times)))/41
    df['hum']=np.clip(.5+.25*wet[daily]+rng.normal(0,.05,len(times)),0,1)
    df['weathersit']=np.where(wet[daily],3,1)
    df['observed']=True;df['y']=count
    for name in ['cnt','casual','registered']:df[name+'_history']=df[name]
    for w in [24,168]:df['mean_'+str(w)]=df.cnt.rolling(w).mean()
    df['temp_history']=df.temp;df['hum_history']=df.hum;df['weather_history']=df.weathersit
    df['temp_mean24']=df.temp.rolling(24).mean()
    return df


def forecast(df,t,name,settings):
    history=df.cnt_history.iloc[t-HISTORY+1:t+1].to_numpy()
    started=time.perf_counter()
    with warnings.catch_warnings(record=True) as observed:
        warnings.simplefilter('always')
        if name=='ets':
            scale=max(float(np.std(history)),1.)
            model=ExponentialSmoothing(history/scale,trend=settings['trend'],damped_trend=settings['damped'],seasonal='add',seasonal_periods=settings.get('period',168),initialization_method='estimated').fit(optimized=True,use_brute=False,method='L-BFGS-B',minimize_kwargs={'options':{'maxiter':1000,'maxfun':300000}})
            pred=model.forecast(H)*scale
        elif name=='sarima' and (settings.get('weekly_difference') or settings.get('seasonal_difference')):
            period=settings.get('seasonal_difference',168)
            model=SARIMAX(history,order=tuple(settings['order']),seasonal_order=(0,1,0,period),simple_differencing=True,trend='c',enforce_stationarity=True,enforce_invertibility=True).fit(disp=False,maxiter=100)
            pred=history[-period:][:H]+model.forecast(H)
        elif name=='sarima':
            model=SARIMAX(history,order=tuple(settings['order']),seasonal_order=tuple(settings['seasonal_order']),trend='c',enforce_stationarity=True,enforce_invertibility=True).fit(disp=False,maxiter=100)
            pred=model.forecast(H)
        elif name=='reg_arima':
            X,y,o,h=train(df,t);xt,_=test(df,t)
            linear=make('linear',{}).fit(X,y)
            residual=y-linear.predict(X);targets=o+h
            errors=np.full(t-int(targets.min())+1,np.nan)
            errors[targets-targets.min()]=residual
            model=SARIMAX(errors,order=tuple(settings['order']),trend='n',enforce_stationarity=True,enforce_invertibility=True).fit(disp=False,maxiter=100)
            pred=linear.predict(xt)+model.forecast(H)
        elif name=='var':
            columns=['cnt_history','temperature_history'] if 'temperature_history' in df else ['casual_history','registered_history']
            levels=df[columns].iloc[t-HISTORY+1-168:t+1].to_numpy()
            differences=levels[168:]-levels[:-168]
            model=VAR(differences).fit(settings['lags'],trend='c')
            delta=model.forecast(differences[-model.k_ar:],steps=H)
            # Each of the next 168 hours refers to an already observed previous-week hour.
            components=levels[-168:][:H]+delta
            pred=components[:,0] if 'temperature_history' in df else components.sum(axis=1)
        else:raise ValueError(name)
    return np.asarray(pred),dict(seconds=time.perf_counter()-started,
                 warnings=sorted(set(str(w.message) for w in observed)),
                 converged=bool(model.mle_retvals.get('converged',model.mle_retvals.get('success',True))) if hasattr(model,'mle_retvals') else True)


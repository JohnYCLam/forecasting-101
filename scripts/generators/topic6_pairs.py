"""Generate a matched controlled/real chapter, including its classical-model panel."""
from __future__ import annotations
import json
import platform
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
import pandas as pd
import sklearn
import statsmodels
import xgboost
if __package__:
    from . import topic6_pairs_core as c
    from . import topic6_pairs_evidence as e
    from .topic6_sections import trend_lesson
else:
    import topic6_pairs_core as c
    import topic6_pairs_evidence as e
    from topic6_sections import trend_lesson

SELECTION=Path(__file__).with_name('topic6_pair_selection.json')
OUTPUT=Path(__file__).resolve().parents[2]/'public/topic6_data.json'
METHODS=['naive','week_mean','linear','svr','tree','forest','boosting','linear_interactions','ets','sarima','var','reg_arima']
CASE_NAMES={'controlled':'Controlled rental example','real':'Real Capital Bikeshare data'}

def evaluate(df,selection,case,output):
    folds=[];output.mkdir(parents=True,exist_ok=True)
    for date in c.EVAL:
        t=c.at(df,date);X,y,_,_=c.train(df,t);xt,actual=c.test(df,t);paths=c.baselines(df,t);timings={};diagnostics={}
        for name,s in selection['settings'].items():
            started=time.perf_counter();model=c.make(name,s).fit(X,y);paths[name]=model.predict(xt);timings[name]=time.perf_counter()-started
        model=c.make('linear',{}).fit(c.interaction_matrix(X),y);paths['linear_interactions']=model.predict(c.interaction_matrix(xt))
        for name,s in selection['classical_settings'].items():
            paths[name],diagnostics[name]=c.forecast(df,t,name,s);timings[name]=diagnostics[name]['seconds']
        timeline=[dict(h=i+1,date=e.stamp(df,t+i+1),actual=float(actual[i]) if np.isfinite(actual[i]) else None,**{k:float(p[i]) for k,p in paths.items()}) for i in range(c.H)]
        folds.append(dict(origin=date,timeline=timeline,metrics={name:c.metrics(actual,p) for name,p in paths.items()},seconds=timings,diagnostics=diagnostics))
        if len(folds)%30==0:print('REFIT',case,len(folds),'/',len(c.EVAL),flush=True)
    (output/'evaluation.json').write_text(json.dumps(dict(folds=folds),allow_nan=False),encoding='utf-8')
    return folds

def checkpoints(folder):
    ml=json.loads((folder/'evaluation.json').read_text())['folds']
    classical=json.loads((folder/'classical_evaluation.json').read_text())['folds']
    assert len(ml)==len(classical)==len(c.EVAL)
    for fold,other,date in zip(ml,classical,c.EVAL):
        assert fold['origin']==other['origin']==date
        fold['metrics'].update(other['metrics']);fold['diagnostics']=other['diagnostics']
        fold['seconds'].update({k:d['seconds'] for k,d in other['diagnostics'].items()})
        for i,row in enumerate(fold['timeline']):
            row['date']=pd.Timestamp(row['date']).strftime('%Y-%m-%d %H:%M')
            row.update({name:p[i] for name,p in other['predictions'].items()})
    return ml

def summaries(folds):
    base=np.array([f['metrics']['naive']['mae'] for f in folds]);linear=np.array([f['metrics']['linear']['mae'] for f in folds]);seasonal=np.array([f['metrics']['week_mean']['mae'] for f in folds])
    result={}
    for name in METHODS:
        metrics=[f['metrics'][name] for f in folds];mae=np.array([m['mae'] for m in metrics]);rmse=np.array([m['rmse'] for m in metrics]);n=np.array([m['count'] for m in metrics])
        valid_times=[f['seconds'][name] for f in folds if name in f['seconds']]
        result[name]=dict(mae=float(mae.mean()),rmse=float(rmse.mean()),gain=float((base.mean()-mae.mean())/base.mean()*100),
             wins_naive=int(sum(mae<base)),wins_linear=int(sum(mae<linear)),wins_week_mean=int(sum(mae<seasonal)),windows=len(folds),
             median_gain=float(np.median((base-mae)/base*100)),count=int(sum(n)),
             pooled_mae=float(np.sum(mae*n)/sum(n)),pooled_rmse=float(np.sqrt(np.sum(rmse**2*n)/sum(n))),
             leave_one_out_min_gain=float(min((sum(base)-b-sum(mae)+a)/(sum(base)-b)*100 for b,a in zip(base,mae))),
             mean_fit_seconds=float(np.mean(valid_times)) if valid_times else None)
    return result

def input_check(df,t):
    changed=df.copy(deep=True);later=changed.index>changed.index[t]
    for key in ['y','cnt','casual','registered','temp','hum','weathersit']:changed.loc[later,key]=-1e6
    for name in ['cnt','casual','registered']:changed[name+'_history']=changed[name].ffill()
    for n in [24,168]:changed['mean_'+str(n)]=changed.cnt_history.rolling(n).mean()
    for a,b in [('temp','temp_history'),('hum','hum_history'),('weathersit','weather_history')]:changed[b]=changed[a].ffill()
    changed['temp_mean24']=changed.temp_history.rolling(24).mean()
    a,y,o,h=c.train(df,t);b,y2,o2,h2=c.train(changed,t)
    assert a.equals(b) and np.array_equal(y,y2) and np.array_equal(o,o2) and np.array_equal(h,h2)
    a,_=c.test(df,t);b,_=c.test(changed,t);assert a.equals(b)

def anchor(df,date,selection,reference):
    t=c.at(df,date);input_check(df,t);X,y,o,h=c.train(df,t);xt,actual=c.test(df,t)
    models={};paths=c.baselines(df,t);seconds={};diagnostics={}
    for name,s in selection['settings'].items():
        started=time.perf_counter();models[name]=c.make(name,s).fit(X,y);paths[name]=models[name].predict(xt);seconds[name]=time.perf_counter()-started
    model=c.make('linear',{}).fit(c.interaction_matrix(X),y);paths['linear_interactions']=model.predict(c.interaction_matrix(xt))
    for name,s in selection['classical_settings'].items():paths[name],diagnostics[name]=c.forecast(df,t,name,s)
    # Independently re-fit every displayed forecast, even when using full-year checkpoints.
    for name,p in paths.items():
        assert np.allclose(p,[r[name] for r in reference['timeline']],atol=1e-5), (date,name)
        scored=c.metrics(actual,p)
        assert all(abs(scored[key]-reference['metrics'][name][key])<1e-5 for key in scored)
    timeline=[]
    for i in range(t-24,t+c.H+1):
        row=dict(time=i-t+24,date=e.stamp(df,i),actual=float(df.y.iloc[i]) if np.isfinite(df.y.iloc[i]) else None)
        if i>t:row.update({k:float(p[i-t-1]) for k,p in paths.items()})
        timeline.append(row)
    common=dict(origin=date,cutoff=24,timeline=timeline,metrics={k:c.metrics(actual,p) for k,p in paths.items()},
                fit_seconds=seconds,classical_diagnostics=diagnostics,protocol=e.protocol(df,t,o,h),conditions=e.conditions(df,t))
    common['profile']=[[hour,*[float(np.mean(y[(X.hour.to_numpy()==hour)&(X.workingday.to_numpy()==work)])) for work in [1,0]]] for hour in range(24)]
    common.update(e.traces(df,t,models,X,y,o,h))
    return common,e.intro(df,t,models,X,y,o,h)

def build_case(case,selection,reuse=False,canonical=False):
    df=c.load() if case=='real' else c.simulation()
    folder=c.ROOT/'experiments/section6_dataset_redesign_2026-11-07'/('bike_day' if case=='real' else 'controlled_day')
    all_folds=(json.loads((c.OUT/case/'evaluation.json').read_text())['folds'] if canonical else checkpoints(folder)) if (reuse or canonical) else evaluate(df,selection,case,c.OUT/case)
    assert [f['origin'] for f in all_folds]==c.EVAL
    # Verify every cached score independently from all target/prediction arrays.
    for fold in all_folds:
        actual=np.array([r['actual'] for r in fold['timeline']],dtype=float)
        for name in METHODS:
            scored=c.metrics(actual,[r[name] for r in fold['timeline']])
            assert all(abs(scored[k]-fold['metrics'][name][k])<1e-6 for k in scored)
    aggregate=summaries(all_folds);rec_selection=e.recursive_selection(df)
    folds=[];intros=[];strategies=[];ranges=[]
    lookup={f['origin']:f for f in all_folds}
    for date in c.DISPLAY:
        common,intro_=anchor(df,date,selection,lookup[date]);t=c.at(df,date)
        historical=e.historical_evidence(df,t,selection['settings']['boosting'],rec_selection['settings'])
        strategies.append(e.strategy_fold(df,t,common,rec_selection['settings'],historical))
        ranges.append(e.range_fold(df,t,common,selection['settings']['boosting'],historical))
        folds.append(common);intros.append(intro_);print('FITTED TEACHING EVIDENCE',case,date,flush=True)
    curve=[]
    for i in range(c.H):
        row=dict(time=i+1,h=i+1,origins=len(strategies))
        for name in ['pooled','recursive','corrected','naive']:
            errors=[abs(f['timeline'][i]['actual']-f['timeline'][i][name]) for f in strategies if f['timeline'][i]['actual'] is not None]
            row[name]=float(np.mean(errors))
        curve.append(row)
    interval_aggregate={}
    for level in ['80','90']:
        rows=[r for f in ranges for r in f['levels'][level]['timeline']];y=np.array([r['actual'] for r in rows],dtype=float)
        interval_aggregate[level]={name:e.interval_metrics(y,[r[name+'_lo'] for r in rows],[r[name+'_hi'] for r in rows],1-int(level)/100) for name in ['raw','calibrated','residual']}
    worst=max(all_folds,key=lambda f:f['metrics']['forest']['mae']-f['metrics']['naive']['mae']);t=c.at(df,worst['origin'])
    X,y,o,h=c.train(df,t)
    diagnostic=dict(origin=worst['origin'],selection='Largest daily forest MAE minus last-week MAE across the complete evaluation year',
       metrics={k:worst['metrics'][k] for k in ['naive','forest']},conditions=e.conditions(df,t),
       training_max=float(max(y)),future_max=float(np.nanmax([r['actual'] for r in worst['timeline']])),
       timeline=[dict(time=i,date=r['date'],actual=r['actual'],naive=r['naive'],forest=r['forest']) for i,r in enumerate(worst['timeline'])])
    diagnostic['forecast_mean']=float(np.mean([r['forest'] for r in worst['timeline']]))
    recent=df.iloc[t-7*24+1:t+c.H+1]
    diagnostic['recent_days']=[dict(date=str(date.date()),rentals=float(group.y.sum()),observed_hours=int(group.y.notna().sum()),holiday=bool(group.holiday.max())) for date,group in recent.groupby(recent.index.normalize())]
    compressed=dict(methods=METHODS,rows=[[f['origin'],f['metrics']['naive']['count'],*[[f['metrics'][k]['mae'],f['metrics'][k]['rmse']] for k in METHODS]] for f in all_folds])
    source=dict(kind=case,name=CASE_NAMES[case],unit='rentals/hour',source_rows=int(df.observed.sum()),missing_hours=int((~df.observed).sum()),
                first=e.stamp(df,0),last=e.stamp(df,len(df)-1),evaluation_days=len(all_folds),source_url='https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset',
                source_sha256=selection['source_sha256'],seed=42 if case=='controlled' else None)
    selected=dict(settings=selection['settings'],classical_settings=selection['classical_settings'],validation_origins=c.DEV)
    pairwise={a:{b:dict(wins=sum(f['metrics'][a]['mae']<f['metrics'][b]['mae'] for f in all_folds),mae_gain=(aggregate[b]['mae']-aggregate[a]['mae'])/aggregate[b]['mae']*100) for b in METHODS} for a in METHODS}
    shared=dict(dataset=source,folds=folds,aggregate=aggregate,features=c.FEATURES,horizon=c.H,selection=selected,pairwise=pairwise,
                evaluation=compressed,diagnostic=diagnostic,primary_metric='Mean daily MAE')
    return dict(tab1=dict(origins=intros),progression=dict(shared=shared,
       strategies=dict(folds=strategies,selection=rec_selection,lead_curve=curve,features=e.RECURSIVE,correction_features=e.CORRECTION),
       ranges=dict(folds=ranges,aggregate=interval_aggregate,horizon=c.H,score='max(lower minus actual, actual minus upper, zero)')))

def compact(value,key=None):
    if isinstance(value,dict):return {k:compact(v,k) for k,v in value.items()}
    if isinstance(value,(list,tuple,np.ndarray)):return [compact(v,key) for v in value]
    if isinstance(value,(np.integer,)):return int(value)
    if isinstance(value,(float,np.floating)):
        if not np.isfinite(value):return None
        rounded=round(float(value),8 if key in ['weight','value','contribution','intercept','threshold'] or key in c.FEATURES else 4)
        return int(rounded) if rounded.is_integer() else rounded
    if isinstance(value,np.bool_):return bool(value)
    return value

def build(reuse=False,canonical=False):
    selection=json.loads(SELECTION.read_text(encoding='utf-8'))
    assert selection['features']==c.FEATURES and selection['evaluation_origins']==c.EVAL
    if reuse or canonical:
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures={case:pool.submit(build_case,case,selection['cases'][case],reuse,canonical) for case in ['controlled','real']}
            datasets={case:future.result() for case,future in futures.items()}
    else:
        # Long statistical fits are run sequentially here; the CLI also supports
        # isolated per-case evaluation processes, avoiding nested thread pools.
        datasets={case:build_case(case,selection['cases'][case]) for case in ['controlled','real']}
    result=compact(dict(metadata=dict(topic=6,revision='2026-11-07-paired-day-ahead',seed=42,python=platform.python_version(),sklearn=sklearn.__version__,xgboost=xgboost.__version__,statsmodels=statsmodels.__version__,numpy=np.__version__,pandas=pd.__version__),
             datasets=datasets,tab5=trend_lesson(),comparison={case:dict(name=CASE_NAMES[case],aggregate=d['progression']['shared']['aggregate']) for case,d in datasets.items()}))
    validate(result)
    encoded=json.dumps(result,allow_nan=False,separators=(',',':'))
    assert len(encoded.encode('utf-8'))<1024*1024,len(encoded)
    return result

def validate(data):
    for case,d in data['datasets'].items():
        p=d['progression'];shared=p['shared']
        assert len(shared['evaluation']['rows'])==366
        for index,f in enumerate(shared['folds']):
            intro=d['tab1']['origins'][index]['linear_intro'];future=[r for r in f['timeline'] if 'linear' in r]
            assert f['protocol']['last_label']<=f['origin']
            assert f['protocol']['rows']==f['protocol']['unique_targets']
            for name,m in f['metrics'].items():
                scored=c.metrics(np.array([r['actual'] for r in future],dtype=float),[r[name] for r in future])
                assert all(abs(scored[k]-m[k])<.002 for k in scored)
            assert abs(intro['metrics']['safe_full']['test']['mae']-f['metrics']['linear']['mae'])<.002
            for x in f['examples']:
                assert abs(np.mean(x['forest_trees'])-x['forest_prediction'])<.002
                assert abs(x['svr']['intercept']+sum(t['contribution'] for t in x['svr']['terms'])+x['svr']['other']-x['svr']['prediction'])<.002
            strategy=p['strategies']['folds'][index];ranges=p['ranges']['folds'][index]
            assert strategy['correction']['last_label']<=f['origin'] and ranges['calibration']['last_label']<=f['origin']
            assert abs(strategy['traces'][1]['inputs']['lag_1']-strategy['traces'][0]['prediction'])<.002
            for r in strategy['timeline']:assert abs(r['recursive']+r['adjustment']-r['corrected'])<.002
            for level,values in ranges['levels'].items():
                assert np.allclose([r['boosting'] for r in future],[r['point'] for r in values['timeline']],atol=.002)
                for name,m in values['metrics'].items():
                    rows=values['timeline'];scored=e.interval_metrics(np.array([r['actual'] for r in rows],dtype=float),[r[name+'_lo'] for r in rows],[r[name+'_hi'] for r in rows],1-int(level)/100)
                    assert all(abs(scored[k]-m[k])<.002 for k in scored)
    return True

def write():
    data=build();OUTPUT.write_text(json.dumps(data,allow_nan=False,separators=(',',':')),encoding='utf-8')
    print('Saved paired Chapter 6 evidence:',OUTPUT.stat().st_size,'bytes')

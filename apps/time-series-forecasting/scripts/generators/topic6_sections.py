"""Fitted teaching evidence for Topic 6.2–6.6; no test-selected parameters."""
from __future__ import annotations

import json
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeRegressor
from statsmodels.tsa.statespace.sarimax import SARIMAX


def packed(value):
    """Portable finite JSON evidence with stable precision across both entry points."""
    if isinstance(value, dict): return {k: packed(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)): return [packed(v) for v in value]
    if isinstance(value, (bool, np.bool_)): return bool(value)
    if isinstance(value, (float, np.floating)):
        assert np.isfinite(value), 'Nonfinite evidence'
        return round(float(value), 6)
    if isinstance(value, np.integer): return int(value)
    return value


def scores(y, p):
    e = np.asarray(y) - np.asarray(p)
    return {"mae": float(np.mean(abs(e))), "rmse": float(np.sqrt(np.mean(e ** 2)))}


def booster():
    return xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=.08,
                            min_child_weight=3, random_state=42, tree_method="hist", n_jobs=2)


def forest():
    return RandomForestRegressor(n_estimators=80, max_depth=10, min_samples_leaf=3,
                                 random_state=42, n_jobs=2)


def tree_lesson():
    # Same synthetic process, seed and split as the reviewed demo.
    rng = np.random.RandomState(42)
    t = np.arange(730)
    temp = 16 + 10 * np.sin(2 * np.pi * t / 365) + rng.normal(0, 1.5, len(t))
    dow = t % 7
    weekend = (dow >= 5).astype(int)
    base = 50 + 12 * (1 - weekend)
    heat = .6 * np.maximum(0, 18 - temp)
    cooling = 3.5 * np.maximum(0, temp - 24) ** 2 * (1 - .7 * weekend)
    noise = rng.normal(0, 1.8, len(t))
    y = np.zeros(len(t))
    for i in t:
        y[i] = base[i] + heat[i] + cooling[i] + noise[i] + (.25 * (y[i-1] - 50) if i else 0)
    frame = pd.DataFrame(dict(day=t + 1, temp=temp, weekend=weekend, dow=dow,
                              lag_1=pd.Series(y).shift(1), lag_7=pd.Series(y).shift(7), y=y)).iloc[7:]
    train = frame[frame.day <= 366]
    test = frame[(frame.day >= 420) & (frame.day <= 551)].copy()
    cols = ["temp", "weekend", "dow", "lag_1", "lag_7"]
    models = {"linear": LinearRegression(), "tree": DecisionTreeRegressor(max_depth=3, min_samples_leaf=8, random_state=42),
              "forest": forest(), "boosting": booster()}
    for model in models.values():
        model.fit(train[cols], train.y)
    # Export the entire fitted teaching tree, including layout coordinates.
    # Display geometry follows in-order leaves; thresholds and means are fitted.
    tr = models['tree'].tree_
    tree_nodes = []
    leaf_order = []
    def describe_node(node, depth):
        leaf = tr.children_left[node] == tr.children_right[node]
        item = dict(id=int(node), depth=depth, leaf=bool(leaf),
                    samples=int(tr.n_node_samples[node]), prediction=float(tr.value[node,0,0]))
        if leaf:
            item['column'] = len(leaf_order)
            leaf_order.append(node)
        else:
            left = describe_node(tr.children_left[node], depth+1)
            right = describe_node(tr.children_right[node], depth+1)
            item.update(feature=cols[tr.feature[node]], threshold=float(tr.threshold[node]),
                        left=int(tr.children_left[node]), right=int(tr.children_right[node]),
                        column=(left['column']+right['column'])/2)
        tree_nodes.append(item)
        return item
    describe_node(0,0)
    tree_nodes.sort(key=lambda item:item['id'])
    pred = {k: m.predict(test[cols]) for k, m in models.items()}
    # Conditional one-step seasonal naive, with observed lag 7 on each test day.
    pred["naive"] = test.lag_7.to_numpy()
    metrics = {k: scores(test.y, p) for k, p in pred.items()}
    examples = []
    categories = [("Hot weekday", (test.temp > 24) & (test.weekend == 0)),
                  ("Cool weekday", (test.temp < 20) & (test.weekend == 0)),
                  ("Hot weekend", (test.temp > 24) & (test.weekend == 1))]
    for name, mask in categories:
        row = test[mask].iloc[0]
        record = pd.DataFrame([row[cols]], columns=cols)
        tr = models["tree"].tree_
        node, path = 0, []
        while tr.children_left[node] != tr.children_right[node]:
            col, threshold = cols[tr.feature[node]], float(tr.threshold[node])
            value = float(row[col]); left = value <= threshold
            path.append(dict(node=int(node), feature=col, threshold=threshold, value=value,
                             direction="left" if left else "right", comparison="≤" if left else ">"))
            node = tr.children_left[node] if left else tr.children_right[node]
        constituents = [float(est.predict(record.to_numpy())[0]) for est in models["forest"].estimators_]
        # Use real XGBoost stage predictions, including its fitted starting level.
        config = json.loads(models['boosting'].get_booster().save_config())
        base_text = config['learner']['learner_model_param']['base_score']
        start = float(str(base_text).strip('[]'))
        stages, previous = [], start
        for count in range(1, 4):
            cumulative = float(models['boosting'].predict(record, iteration_range=(0, count))[0])
            stages.append(dict(stage=count, correction=cumulative - previous, prediction=cumulative))
            previous = cumulative
        examples.append(dict(name=name, day=int(row.day), inputs={c: float(row[c]) for c in cols},
                             actual=float(row.y), path=path, leaf_id=int(node), leaf_count=int(tr.n_node_samples[node]),
                             tree_prediction=float(tr.value[node, 0, 0]), forest_trees=constituents,
                             forest_prediction=float(models['forest'].predict(record)[0]),
                             boosting_start=start, stages=stages,
                             boosting_prediction=float(models['boosting'].predict(record)[0])))
    anchor = train[cols].median().to_dict()
    response = []
    for value in np.linspace(train.temp.min(), train.temp.max(), 70):
        r = dict(temp=float(value))
        for kind, d, w in [("weekday", 0, 0), ("weekend", 5, 1)]:
            record = pd.DataFrame([{**anchor, 'temp': value, 'dow': d, 'weekend': w}])[cols]
            for key in ["linear", "forest", "boosting"]:
                r[f'{key}_{kind}'] = float(models[key].predict(record)[0])
        response.append(r)
    timeline = [dict(time=i, day=int(row.day), actual=float(row.y), **{k: float(p[i]) for k,p in pred.items()})
                for i, (_,row) in enumerate(test.iterrows())]
    return dict(metrics=metrics, examples=examples, response=response, timeline=timeline,
                tree_nodes=tree_nodes, tree_leaf_count=len(leaf_order),
                response_anchor={k: float(v) for k,v in anchor.items()}, features=cols,
                protocol=dict(seed=42, train_start=8, train_end=366, train_rows=len(train),
                              test_start=420, test_end=551, test_rows=len(test),
                              tree_depth=3, forest_trees=len(models['forest'].estimators_), boosting_trees=100,
                              temperature_threshold=24, weekend_reduction=.7))


BASE = ['dow', 'month', 'is_weekend', 'dow_sin', 'dow_cos', 'lag_1', 'lag_2', 'lag_3',
        'lag_7', 'lag_14', 'lag_28', 'roll_7', 'roll_28', 'solar_observed', 'wind_observed']
POOLED = ['h'] + BASE
ORIGINS = ['2019-10-01', '2019-12-15', '2020-03-01', '2020-05-15', '2020-08-01']


def matrix(df, origins, horizons):
    """Each row references load/renewables at or before origin; labels are separate."""
    origins = np.asarray(origins, dtype=int); horizons = np.asarray(horizons, dtype=int)
    target = origins + horizons
    y = df.y.to_numpy()
    dt = df.datetime.iloc[target].reset_index(drop=True)
    out = dict(h=horizons, dow=dt.dt.dayofweek.to_numpy(), month=dt.dt.month.to_numpy())
    out['is_weekend'] = (out['dow'] >= 5).astype(int)
    out['dow_sin'] = np.sin(2*np.pi*out['dow']/7)
    out['dow_cos'] = np.cos(2*np.pi*out['dow']/7)
    for lag in [1,2,3,7,14,28]:
        out[f'lag_{lag}'] = y[origins-lag+1]
    for w in [7,28]:
        out[f'roll_{w}'] = pd.Series(y).rolling(w).mean().to_numpy()[origins]
    out['solar_observed'] = df.solar.to_numpy()[origins]
    out['wind_observed'] = df.wind.to_numpy()[origins]
    return pd.DataFrame(out)[POOLED], y[target]


def training(df, cutoff):
    origins = np.arange(120, cutoff-29, 2)
    o = np.repeat(origins, 30); h = np.tile(np.arange(1,31), len(origins))
    assert np.max(o+h) <= cutoff
    X, y = matrix(df, o, h)
    return X, y, dict(rows=len(y), origins=len(origins),
                     first_origin=str(df.datetime.iloc[origins[0]].date()),
                     last_origin=str(df.datetime.iloc[origins[-1]].date()),
                     last_label=str(df.datetime.iloc[np.max(o+h)].date()))


def arena(df):
    folds = []
    for date in ORIGINS:
        cutoff = int(df.index[df.datetime == pd.Timestamp(date)][0])
        X, y, fit_meta = training(df, cutoff)
        test, actual = matrix(df, np.repeat(cutoff,30), np.arange(1,31))
        models = dict(linear=make_pipeline(StandardScaler(), LinearRegression()), forest=forest(), boosting=booster())
        predictions = {}
        for name, model in models.items():
            model.fit(X, y); predictions[name] = model.predict(test)
        predictions['naive'] = np.resize(df.y.iloc[cutoff-6:cutoff+1].to_numpy(),30)
        hist = df.y.iloc[cutoff-180:cutoff+1].to_numpy()
        # A fit failure is an error, never a silently relabelled naive forecast.
        fit = SARIMAX(hist,order=(1,0,0),seasonal_order=(1,1,0,7)).fit(disp=False)
        predictions['sarima'] = np.asarray(fit.forecast(30))
        metric = {name: scores(actual,p) for name,p in predictions.items()}
        for name in metric:
            metric[name]['gain'] = 100*(metric['naive']['mae']-metric[name]['mae'])/metric['naive']['mae']
        folds.append(dict(origin=date, training=fit_meta, sarima_rows=len(hist),
                          sarima_converged=bool(fit.mle_retvals.get('converged',False)),
                          metrics=metric, timeline=[dict(time=h-1, date=str(df.datetime.iloc[cutoff+h].date()),
                                                       actual=float(actual[h-1]), **{k:float(p[h-1]) for k,p in predictions.items()})
                                                    for h in range(1,31)]))
    aggregate = {name: dict(mean_mae=float(np.mean([f['metrics'][name]['mae'] for f in folds])),
                            mean_rmse=float(np.mean([f['metrics'][name]['rmse'] for f in folds])),
                            wins=sum(min(f['metrics'],key=lambda k:f['metrics'][k]['mae'])==name for f in folds))
                 for name in folds[0]['metrics']}
    return dict(folds=folds, aggregate=aggregate, features=POOLED,
                history_start=str(df.datetime.iloc[0].date()), target_unit='MW')


def recursive_record(df, history, cutoff, h):
    dt = df.datetime.iloc[cutoff+h]
    row = dict(dow=dt.dayofweek, month=dt.month, is_weekend=int(dt.dayofweek>=5),
               dow_sin=np.sin(2*np.pi*dt.dayofweek/7), dow_cos=np.cos(2*np.pi*dt.dayofweek/7),
               solar_observed=float(df.solar.iloc[cutoff]), wind_observed=float(df.wind.iloc[cutoff]))
    for lag in [1,2,3,7,14,28]: row[f'lag_{lag}'] = float(history[-lag])
    for w in [7,28]: row[f'roll_{w}'] = float(np.mean(history[-w:]))
    return pd.DataFrame([row])[BASE]


def multistep(df):
    folds = []
    for date in ORIGINS + ['2020-01-01']:
        cutoff = int(df.index[df.datetime == pd.Timestamp(date)][0])
        X, y, meta = training(df, cutoff)
        direct, actual = matrix(df, np.repeat(cutoff,30), np.arange(1,31))
        ro = np.arange(120, cutoff)
        rX, ry = matrix(df, ro, np.ones(len(ro),dtype=int))
        predictions = {}; traces = {}
        for family, factory in [('boosting',booster),('forest',forest)]:
            pooled, rec = factory(), factory()
            pooled.fit(X,y); rec.fit(rX[BASE],ry)
            predictions[f'{family}_pooled'] = pooled.predict(direct)
            history = list(df.y.iloc[:cutoff+1]); path=[]; examples=[]
            for h in range(1,31):
                row = recursive_record(df, history, cutoff, h)
                p = float(rec.predict(row)[0])
                if h in [1,2,7]:
                    provenance = {}
                    for c in BASE:
                        if c.startswith('lag_'):
                            idx = cutoff+h-int(c.split('_')[1])
                            provenance[c] = 'Predicted' if idx>cutoff else 'Observed'
                        elif c.startswith('roll_'):
                            provenance[c] = 'Includes predictions' if h>1 else 'Observed'
                        elif c.endswith('_observed'): provenance[c] = 'Frozen at origin'
                        else: provenance[c] = 'Known target calendar'
                    examples.append(dict(h=h, date=str(df.datetime.iloc[cutoff+h].date()),
                                         recursive=row.iloc[0].to_dict(), pooled=direct.iloc[h-1].to_dict(),
                                         provenance=provenance, recursive_prediction=p,
                                         pooled_prediction=float(predictions[f'{family}_pooled'][h-1])))
                path.append(p);history.append(p)
            predictions[f'{family}_recursive'] = path
            traces[family] = examples
        predictions['naive'] = np.resize(df.y.iloc[cutoff-6:cutoff+1].to_numpy(),30)
        metrics = {k:scores(actual,p) for k,p in predictions.items()}
        timeline = [dict(time=h-1, date=str(df.datetime.iloc[cutoff+h].date()), actual=float(actual[h-1]),
                         **{k:float(p[h-1]) for k,p in predictions.items()}) for h in range(1,31)]
        folds.append(dict(origin=date, training=meta, recursive_rows=len(ry), metrics=metrics, traces=traces, timeline=timeline))
    # First five predeclared origins; January is an illustrative case, excluded from this average.
    curve=[]
    for h in range(30):
        row=dict(time=h+1, h=h+1, origins=len(ORIGINS))
        for k in folds[0]['metrics']:
            errors=[abs(f['timeline'][h]['actual']-f['timeline'][h][k]) for f in folds[:len(ORIGINS)]]
            row[k]=float(np.mean(errors));row[k+'_min']=float(min(errors));row[k+'_max']=float(max(errors))
        curve.append(row)
    return dict(folds=folds, lead_curve=curve, features=BASE, horizons=30, average_origins=ORIGINS)


def trend_lesson():
    rng=np.random.RandomState(101);t=np.arange(500)
    y=100+.25*t+10*np.sin(2*np.pi*t/7)+rng.normal(0,2,len(t))
    cutoff=350; train_t=np.arange(7,cutoff+1);test_t=np.arange(cutoff+1,len(t))
    rawX=pd.DataFrame(dict(t=train_t,dow=train_t%7,lag_1=y[train_t-1],lag_7=y[train_t-7]))
    raw=booster().fit(rawX,y[train_t])
    slope,intercept=np.polyfit(train_t,y[train_t],1)
    residual=y[:cutoff+1]-(intercept+slope*np.arange(cutoff+1))
    # Shift with genuine earlier observations; never wrap later training residuals.
    detX=pd.DataFrame(dict(dow=train_t%7,lag_1=residual[train_t-1],lag_7=residual[train_t-7]))
    detrended=booster().fit(detX,residual[train_t])
    def trend_features(ts):
        return pd.DataFrame({'t':ts,**{f'weekday_{d}':(np.asarray(ts)%7==d).astype(int) for d in range(1,7)}})
    baseline=LinearRegression().fit(trend_features(train_t),y[train_t])
    boundary_tree=DecisionTreeRegressor(max_depth=3,min_samples_leaf=8,random_state=42).fit(train_t.reshape(-1,1),y[train_t])
    probe_times=np.array([cutoff,cutoff+1,int(test_t[-1])])
    boundary=dict(last_split=float(max(boundary_tree.tree_.threshold)),
                  rows=[dict(t=int(ti),leaf=int(leaf),prediction=float(pred)) for ti,leaf,pred in
                        zip(probe_times,boundary_tree.apply(probe_times.reshape(-1,1)),boundary_tree.predict(probe_times.reshape(-1,1)))])
    raw_hist=list(y[:cutoff+1]);res_hist=list(residual);raw_p=[];det_p=[];det_r=[]
    for ti in test_t:
        p=float(raw.predict(pd.DataFrame([dict(t=ti,dow=ti%7,lag_1=raw_hist[-1],lag_7=raw_hist[-7])]))[0])
        r=float(detrended.predict(pd.DataFrame([dict(dow=ti%7,lag_1=res_hist[-1],lag_7=res_hist[-7])]))[0])
        raw_p.append(p);raw_hist.append(p);det_r.append(r);res_hist.append(r);det_p.append(float(intercept+slope*ti+r))
    predictions=dict(raw=raw_p,detrended=det_p,linear=baseline.predict(trend_features(test_t)))
    metrics={k:scores(y[test_t],p) for k,p in predictions.items()}
    timeline=[]
    for ti in range(250,500):
        r=dict(time=ti,actual=float(y[ti]),trend=float(intercept+slope*ti))
        if ti>cutoff:
            r.update({k:float(p[ti-cutoff-1]) for k,p in predictions.items()})
        timeline.append(r)
    training_example=dict(t=int(train_t[0]),actual=float(y[train_t[0]]),trend=float(intercept+slope*train_t[0]),
                          remainder=float(residual[train_t[0]]),inputs=detX.iloc[0].to_dict(),
                          lag_dates=[int(train_t[0]-1),int(train_t[0]-7)])
    forecast_example=dict(t=int(test_t[0]),trend=float(intercept+slope*test_t[0]),remainder=det_r[0],prediction=det_p[0])
    return dict(metrics=metrics,timeline=timeline,training_example=training_example,forecast_example=forecast_example,boundary_example=boundary,
                protocol=dict(seed=101,cutoff=cutoff,train_start=7,train_rows=len(train_t),test_rows=len(test_t),
                              test_start=int(test_t[0]),test_end=int(test_t[-1]),slope=float(slope),intercept=float(intercept),
                              dgp_slope=.25,train_max=float(max(y[train_t]))))


def interval_summary(y,lo,hi,alpha):
    assert np.all(np.asarray(lo)<np.asarray(hi)), 'Crossed or empty interval'
    miss=(y<lo)|(y>hi)
    interval_score=hi-lo+2/alpha*(lo-y)*(y<lo)+2/alpha*(y-hi)*(y>hi)
    return dict(coverage=float(np.mean(~miss)*100),width=float(np.mean(hi-lo)),misses=int(sum(miss)),
                interval_score=float(np.mean(interval_score)))


def uncertainty(df):
    cols=['dow','month','is_weekend','lag_1','lag_7','roll_mean_7','wind_lag1','solar_lag1']
    frame=df.dropna(subset=cols+['y'])
    train=frame[(frame.datetime>='2017-01-01')&(frame.datetime<='2019-06-30')]
    cal=frame[(frame.datetime>='2019-07-01')&(frame.datetime<='2019-12-31')]
    test=frame[(frame.datetime>='2020-01-01')&(frame.datetime<='2020-09-30')]
    # Preserve reviewed point/quantile parameters; change the comparator's calibration source.
    def model(**kw):
        return xgb.XGBRegressor(n_estimators=100,max_depth=5,learning_rate=.08,random_state=42,tree_method='hist',n_jobs=2,**kw)
    point=model().fit(train[cols],train.y)
    point_test=point.predict(test[cols]);point_cal=point.predict(cal[cols])
    levels={}
    for coverage in [.8,.9]:
        alpha=round(1-coverage,2)
        lower=model(objective='reg:quantileerror',quantile_alpha=alpha/2).fit(train[cols],train.y)
        upper=model(objective='reg:quantileerror',quantile_alpha=1-alpha/2).fit(train[cols],train.y)
        cal_lo=lower.predict(cal[cols]);cal_hi=upper.predict(cal[cols])
        assert np.all(cal_lo < cal_hi), 'Crossed calibration quantiles'
        score=np.maximum(cal_lo-cal.y.to_numpy(),cal.y.to_numpy()-cal_hi)
        rank=int(np.ceil((len(cal)+1)*coverage));assert rank<=len(cal)
        offset=float(np.sort(score)[rank-1])
        residual_offset=float(np.sort(abs(cal.y.to_numpy()-point_cal))[rank-1])
        raw_lo=lower.predict(test[cols]);raw_hi=upper.predict(test[cols])
        bands={'raw':(raw_lo,raw_hi),'calibrated':(raw_lo-offset,raw_hi+offset),
               'fixed':(point_test-residual_offset,point_test+residual_offset)}
        metrics={k:interval_summary(test.y.to_numpy(),lo,hi,alpha) for k,(lo,hi) in bands.items()}
        timeline=[]
        for i,(_,r) in enumerate(test.iterrows()):
            item=dict(time=i,date=str(r.datetime.date()),actual=float(r.y),point=float(point_test[i]))
            for name,(lo,hi) in bands.items():
                item[name+'_lo']=float(lo[i]);item[name+'_hi']=float(hi[i]);item[name+'_band']=[float(lo[i]),float(hi[i])]
                item[name+'_miss']=float(r.y) if r.y<lo[i] or r.y>hi[i] else None
            timeline.append(item)
        # A genuine calibration record; first record chosen in advance, not by its score.
        example=dict(date=str(cal.datetime.iloc[0].date()),inputs=cal[cols].iloc[0].to_dict(),
                     test_inputs=test[cols].iloc[0].to_dict(),
                     actual=float(cal.y.iloc[0]),lower=float(cal_lo[0]),upper=float(cal_hi[0]),score=float(score[0]),
                     test_date=timeline[0]['date'],test_lower=float(raw_lo[0]),test_upper=float(raw_hi[0]),
                     adjusted_lower=float(raw_lo[0]-offset),adjusted_upper=float(raw_hi[0]+offset))
        levels[str(int(coverage*100))]=dict(nominal=coverage,offset=offset,rank=rank,calibration_rows=len(cal),
                                          residual_offset=residual_offset,metrics=metrics,timeline=timeline,example=example)
    return dict(levels=levels,features=cols,train=dict(start='2017-01-01',end='2019-06-30',rows=len(train)),
                calibration=dict(start='2019-07-01',end='2019-12-31',rows=len(cal)),
                test=dict(start='2020-01-01',end='2020-09-30',rows=len(test)))

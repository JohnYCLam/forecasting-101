"""Shared fixed-origin forecasting evidence for the continuous Chapter 6 story."""
from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import TransformedTargetRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor
import xgboost as xgb

if __package__:
    from .topic6_sections import packed, scores, trend_lesson
else:
    from topic6_sections import packed, scores, trend_lesson

HORIZON = 30
FEATURES = ['lag_1', 'lag_2', 'lag_3', 'lag_7', 'lag_14', 'lag_28', 'roll_7', 'roll_28',
            'dow_sin', 'dow_cos', 'is_weekend', 'solar_lag1', 'wind_lag1', 'h', 'h_sin', 'h_cos']
RECURSIVE_FEATURES = FEATURES[:13]
VALIDATION_ORIGINS = ['2019-01-01', '2019-04-01', '2019-07-01']
DISPLAY_ORIGINS = ['2019-09-30', '2019-12-15', '2020-03-01', '2020-05-15', '2020-08-01']
# Declared before the pilot. MAE is the selection objective; RMSE always accompanies it.
CANDIDATES = {
    'linear': [{}],
    'svr': [dict(C=c, gamma=g, epsilon=.1) for c in [3., 30.] for g in [.03, .1]],
    'tree': [dict(max_depth=4, min_samples_leaf=5), dict(max_depth=8, min_samples_leaf=10)],
    'forest': [dict(max_depth=6, min_samples_leaf=3), dict(max_depth=12, min_samples_leaf=3)],
    'boosting': [dict(max_depth=3, min_child_weight=5), dict(max_depth=5, min_child_weight=3)],
}


def index_of(df, date):
    return int(df.index[df.datetime == pd.Timestamp(date)][0])


def records(df, origins, horizons):
    """Same information and column meanings as the legitimate 6.1 full feature set."""
    origins = np.asarray(origins, dtype=int)
    horizons = np.asarray(horizons, dtype=int)
    targets = origins + horizons
    y = df.y.to_numpy()
    dow = df.datetime.iloc[targets].dt.dayofweek.to_numpy()
    out = {}
    for lag in [1, 2, 3, 7, 14, 28]:
        out[f'lag_{lag}'] = y[origins-lag+1]
    for window in [7, 28]:
        out[f'roll_{window}'] = pd.Series(y).rolling(window).mean().to_numpy()[origins]
    out.update(dow_sin=np.sin(2*np.pi*dow/7), dow_cos=np.cos(2*np.pi*dow/7),
               is_weekend=(dow >= 5).astype(int), solar_lag1=df.solar.to_numpy()[origins],
               wind_lag1=df.wind.to_numpy()[origins], h=horizons,
               h_sin=np.sin(2*np.pi*horizons/HORIZON), h_cos=np.cos(2*np.pi*horizons/HORIZON))
    return pd.DataFrame(out)[FEATURES], y[targets]


def historical_tasks(df, cutoff, recursive=False):
    start = cutoff-364
    if recursive:
        origins = np.arange(start, cutoff, 2)
        o, h = origins, np.ones(len(origins), dtype=int)
    else:
        origins = np.arange(start, cutoff-HORIZON+1, 2)
        o, h = np.repeat(origins, HORIZON), np.tile(np.arange(1, HORIZON+1), len(origins))
    assert min(o) >= 28 and max(o+h) <= cutoff
    X, y = records(df, o, h)
    return X, y, dict(rows=len(y), origins=len(origins), history_days=365,
                      first_origin=str(df.datetime.iloc[min(o)].date()),
                      last_origin=str(df.datetime.iloc[max(o)].date()),
                      last_label=str(df.datetime.iloc[max(o+h)].date()),
                      unique_targets=int(len(np.unique(o+h))))


def make_learner(name, settings):
    if name == 'linear': return make_pipeline(StandardScaler(), LinearRegression())
    if name == 'svr':
        # C and epsilon are in training-standardised target units, never arbitrary MW units.
        return TransformedTargetRegressor(
            regressor=make_pipeline(StandardScaler(), SVR(kernel='rbf', **settings)),
            transformer=StandardScaler())
    if name == 'tree': return DecisionTreeRegressor(random_state=42, **settings)
    if name == 'forest': return RandomForestRegressor(n_estimators=80, random_state=42, n_jobs=2, **settings)
    if name == 'boosting':
        return xgb.XGBRegressor(n_estimators=100, learning_rate=.08, random_state=42,
                                tree_method='hist', n_jobs=2, **settings)
    raise ValueError(name)


def test_records(df, cutoff):
    return records(df, np.repeat(cutoff, HORIZON), np.arange(1, HORIZON+1))


def seasonal_naive(df, cutoff):
    return np.resize(df.y.iloc[cutoff-6:cutoff+1].to_numpy(), HORIZON)


def select_learners(df):
    evidence = {}
    selections = {}
    cache = {}
    for date in VALIDATION_ORIGINS:
        cutoff = index_of(df, date)
        cache[date] = (*historical_tasks(df, cutoff)[:2], *test_records(df, cutoff))
    for name, candidates in CANDIDATES.items():
        runs = []
        for settings in candidates:
            windows = []
            for date, (X, y, test, actual) in cache.items():
                model = make_learner(name, settings)
                started = time.perf_counter();model.fit(X,y)
                elapsed = time.perf_counter()-started
                windows.append(dict(origin=date, **scores(actual,model.predict(test)), fit_seconds=elapsed))
            runs.append(dict(settings=settings, windows=windows,
                             mean_mae=float(np.mean([r['mae'] for r in windows])),
                             mean_rmse=float(np.mean([r['rmse'] for r in windows]))))
            print('validation', name, settings, 'MAE', round(runs[-1]['mean_mae'],1), flush=True)
        selected = min(range(len(runs)), key=lambda i:runs[i]['mean_mae'])
        selections[name] = candidates[selected]
        evidence[name] = dict(selected=selected, candidates=runs)
    naive=[]
    for date in VALIDATION_ORIGINS:
        cutoff=index_of(df,date);_,actual=test_records(df,cutoff)
        naive.append(dict(origin=date,**scores(actual,seasonal_naive(df,cutoff))))
    return dict(settings=selections,validation=evidence,naive_validation=naive,
                validation_origins=VALIDATION_ORIGINS,display_origins=DISPLAY_ORIGINS,
                objective='Mean MAE across the three chronological development windows',
                note='Display windows were previously inspected in earlier demos; illustrative evaluation, not untouched proof.')


def pilot(df, selection):
    folds=[]
    for date in DISPLAY_ORIGINS:
        cutoff=index_of(df,date);X,y,meta=historical_tasks(df,cutoff);test,actual=test_records(df,cutoff)
        metric={'naive':scores(actual,seasonal_naive(df,cutoff))}
        for name,settings in selection['settings'].items():
            model=make_learner(name,settings);started=time.perf_counter();model.fit(X,y)
            metric[name]={**scores(actual,model.predict(test)), 'fit_seconds':time.perf_counter()-started}
        folds.append(dict(origin=date,metrics=metric,protocol=meta))
        print('display',date,{k:round(v['mae'],1) for k,v in metric.items()},flush=True)
    summary={name:{key:float(np.mean([f['metrics'][name][key] for f in folds])) for key in ['mae','rmse']}
             for name in folds[0]['metrics']}
    return dict(folds=folds,summary=summary)


def dated_frame(df, cutoff, training=True):
    if training:
        origins=np.arange(cutoff-364,cutoff-HORIZON+1,2)
        o,h=np.repeat(origins,HORIZON),np.tile(np.arange(1,HORIZON+1),len(origins))
    else:
        o,h=np.repeat(cutoff,HORIZON),np.arange(1,HORIZON+1)
    X,y=records(df,o,h)
    X['origin_dt']=df.datetime.iloc[o].to_numpy();X['target_dt']=df.datetime.iloc[o+h].to_numpy()
    X['target_load']=y;X['y']=y
    return X


def linear_intro(df,date):
    if __package__:
        from .topic6_linear_intro import build_linear_intro
    else:
        from topic6_linear_intro import build_linear_intro
    cutoff=index_of(df,date);train=dated_frame(df,cutoff);test=dated_frame(df,cutoff,False)
    tiers={'lags_only':FEATURES[:6]+FEATURES[13:],
           'lags_rolling':FEATURES[:8]+FEATURES[13:],
           'history_calendar':FEATURES[:11]+FEATURES[13:], 'safe_full':FEATURES}
    e=build_linear_intro(df,train,test,tiers,cutoff)
    return dict(origin_date=date,horizon=HORIZON,origin_index=28,
                training_origin_start=e['training_examples'][0]['origin'],origin_stride=2,
                dataset_start=str(df.datetime.iloc[0].date()),dataset_end=str(df.datetime.iloc[-1].date()),
                holdout_start=str(test.target_dt.min().date()),holdout_end=str(test.target_dt.max().date()),linear_intro=e)


def tree_structure(model,cols):
    tr=model.tree_;nodes=[];leaves=[]
    def walk(node,depth):
        leaf=tr.children_left[node]==tr.children_right[node]
        r=dict(id=int(node),depth=depth,leaf=bool(leaf),samples=int(tr.n_node_samples[node]),prediction=float(tr.value[node,0,0]))
        if leaf:r['column']=len(leaves);leaves.append(node)
        else:
            left=walk(tr.children_left[node],depth+1);right=walk(tr.children_right[node],depth+1)
            r.update(feature=cols[tr.feature[node]],threshold=float(tr.threshold[node]),
                     left=int(tr.children_left[node]),right=int(tr.children_right[node]),column=(left['column']+right['column'])/2)
        nodes.append(r);return r
    walk(0,0);nodes.sort(key=lambda r:r['id'])
    return nodes,len(leaves)


def learner_examples(models,X,y,test,actual,training_frame,date):
    tree=models['tree'];tr=tree.tree_;nodes,leaves=tree_structure(tree,FEATURES)
    examples=[]
    svr=models['svr'];scaler,sv=svr.regressor_.steps[0][1],svr.regressor_.steps[1][1]
    scale=float(svr.transformer_.scale_[0]);shift=float(svr.transformer_.mean_[0])
    for h in [1,7,30]:
        row=test.iloc[[h-1]];node=0;path=[]
        while tr.children_left[node]!=tr.children_right[node]:
            col=FEATURES[tr.feature[node]];v=float(row.iloc[0][col]);threshold=float(tr.threshold[node]);left=v<=threshold
            path.append(dict(node=int(node),feature=col,threshold=threshold,value=v,
                             direction='left' if left else 'right',comparison='≤' if left else '>'))
            node=tr.children_left[node] if left else tr.children_right[node]
        focused=[];focused_leaves=[];route={r['node'] for r in path}
        def focus(node_id):
            full=nodes[int(node_id)];r=dict(full)
            if full['leaf'] or node_id not in route:
                r.update(leaf=True,collapsed=not full['leaf'],column=len(focused_leaves));focused_leaves.append(node_id)
            else:
                left=focus(full['left']);right=focus(full['right']);r['column']=(left['column']+right['column'])/2
            focused.append(r);return r
        focus(0);focused.sort(key=lambda r:r['id'])
        forest=models['forest'];constituents=[float(m.predict(row.to_numpy())[0]) for m in forest.estimators_]
        gb=models['boosting'];config=json.loads(gb.get_booster().save_config())
        start=float(str(config['learner']['learner_model_param']['base_score']).strip('[]'))
        stages=[];previous=start
        for count in range(1,4):
            prediction=float(gb.predict(row,iteration_range=(0,count))[0])
            stages.append(dict(stage=count,correction=prediction-previous,prediction=prediction));previous=prediction
        z=scaler.transform(row)[0];dist=np.sum((sv.support_vectors_-z)**2,axis=1)
        similarity=np.exp(-sv._gamma*dist);contributions=sv.dual_coef_[0]*similarity*scale
        important=np.argsort(-abs(contributions))[:6];shown=[]
        for i in important:
            train_index=int(sv.support_[i]);r=training_frame.iloc[train_index]
            shown.append(dict(training_origin=str(r.origin_dt.date()),target=str(r.target_dt.date()),
                              h=int(r.h),similarity=float(similarity[i]),weight=float(sv.dual_coef_[0][i]*scale),
                              contribution=float(contributions[i])))
        intercept=float(shift+scale*sv.intercept_[0]);pred=float(svr.predict(row)[0])
        assert abs(intercept+sum(contributions)-pred)<1e-4
        examples.append(dict(h=h,name=f'{h} days ahead',date=str(pd.Timestamp(date).date()+pd.Timedelta(days=h)),
                             inputs=row.iloc[0].to_dict(),actual=float(actual[h-1]),path=path,leaf_id=int(node),
                             tree_view_nodes=focused,tree_view_leaf_count=len(focused_leaves),
                             leaf_count=int(tr.n_node_samples[node]),tree_prediction=float(tree.predict(row)[0]),
                             forest_trees=constituents,forest_prediction=float(forest.predict(row)[0]),
                             boosting_start=start,stages=stages,boosting_prediction=float(gb.predict(row)[0]),
                             svr=dict(intercept=intercept,terms=shown,other=float(sum(contributions)-sum(contributions[important])),
                                      prediction=pred,support_count=len(sv.support_),epsilon_mw=float(sv.epsilon*scale))))
    # First historical origin's thirty training tasks; this is fitting, not holdout accuracy.
    ids=np.arange(HORIZON);p=svr.predict(X.iloc[ids]);tol=float(sv.epsilon*scale);support=set(sv.support_)
    tube=[dict(time=i,h=i+1,actual=float(y[i]),fit=float(p[i]),lo=float(p[i]-tol),hi=float(p[i]+tol),
               band=[float(p[i]-tol),float(p[i]+tol)],support=float(y[i]) if i in support else None)
          for i in ids]
    return dict(tree_nodes=nodes,tree_leaf_count=leaves,examples=examples,tube=tube,
                tube_origin=str(training_frame.origin_dt.iloc[0].date()),support_count=len(sv.support_),
                training_rows=len(y),epsilon_mw=tol)


def shared_comparison(df,selection):
    folds=[];intros=[]
    for date in DISPLAY_ORIGINS:
        cutoff=index_of(df,date);X,y,meta=historical_tasks(df,cutoff);test,actual=test_records(df,cutoff)
        models={};predictions={'naive':seasonal_naive(df,cutoff)};cost={}
        for name,settings in selection['settings'].items():
            started=time.perf_counter();model=make_learner(name,settings).fit(X,y)
            cost[name]=time.perf_counter()-started;models[name]=model;predictions[name]=model.predict(test)
        metrics={k:scores(actual,v) for k,v in predictions.items()}
        for k,m in metrics.items():m['gain']=100*(metrics['naive']['mae']-m['mae'])/metrics['naive']['mae']
        timeline=[]
        for i in range(cutoff-14,cutoff+HORIZON+1):
            r=dict(time=i-cutoff+14,date=str(df.datetime.iloc[i].date()),actual=float(df.y.iloc[i]))
            if i>cutoff:r.update({k:float(p[i-cutoff-1]) for k,p in predictions.items()})
            timeline.append(r)
        explanation=learner_examples(models,X,y,test,actual,dated_frame(df,cutoff),date)
        folds.append(dict(origin=date,protocol=meta,metrics=metrics,timeline=timeline,cutoff=14,
                          fit_seconds=cost,**explanation))
        intros.append(linear_intro(df,date))
        print('shared evidence',date,flush=True)
    aggregate={k:dict(mae=float(np.mean([f['metrics'][k]['mae'] for f in folds])),
                      rmse=float(np.mean([f['metrics'][k]['rmse'] for f in folds])),
                      mean_fit_seconds=float(np.mean([f['fit_seconds'].get(k,0) for f in folds])))
               for k in folds[0]['metrics']}
    for k,m in aggregate.items():m['gain']=100*(aggregate['naive']['mae']-m['mae'])/aggregate['naive']['mae']
    return dict(folds=folds,aggregate=aggregate,features=FEATURES,horizon=HORIZON,
                selection=selection,primary_metric='MAE',protocol='One year of training origins; all full-horizon labels available at fit cutoff'),intros


def rollout(df,cutoff,model,trace=False):
    history=list(df.y.iloc[:cutoff+1]);predictions=[];examples=[]
    for h in range(1,HORIZON+1):
        dow=df.datetime.iloc[cutoff+h].dayofweek
        r={f'lag_{lag}':float(history[-lag]) for lag in [1,2,3,7,14,28]}
        r.update(roll_7=float(np.mean(history[-7:])),roll_28=float(np.mean(history[-28:])),
                 dow_sin=np.sin(2*np.pi*dow/7),dow_cos=np.cos(2*np.pi*dow/7),is_weekend=int(dow>=5),
                 solar_lag1=float(df.solar.iloc[cutoff]),wind_lag1=float(df.wind.iloc[cutoff]))
        frame=pd.DataFrame([r])[RECURSIVE_FEATURES];p=float(model.predict(frame)[0])
        if trace and h in [1,2,7]:
            provenance={}
            for key in RECURSIVE_FEATURES:
                if key.startswith('lag_'):provenance[key]='Predicted' if cutoff+h-int(key[4:])>cutoff else 'Observed'
                elif key.startswith('roll_'):provenance[key]='Includes predictions' if h>1 else 'Observed'
                elif key in ['solar_lag1','wind_lag1']:provenance[key]='Frozen at origin'
                else:provenance[key]='Known calendar'
            pooled,_=test_records(df,cutoff)
            examples.append(dict(h=h,date=str(df.datetime.iloc[cutoff+h].date()),inputs=r,provenance=provenance,
                                 pooled=pooled.iloc[h-1].to_dict(),prediction=p))
        predictions.append(p);history.append(p)
    return np.array(predictions),examples


def recursive_fit(df,cutoff,settings):
    X,y,meta=historical_tasks(df,cutoff,True)
    return make_learner('boosting',settings).fit(X[RECURSIVE_FEATURES],y),meta


def select_recursive(df):
    runs=[]
    for settings in CANDIDATES['boosting']:
        errors=[]
        for date in VALIDATION_ORIGINS:
            cutoff=index_of(df,date);model,_=recursive_fit(df,cutoff,settings)
            p,_=rollout(df,cutoff,model);_,actual=test_records(df,cutoff)
            errors.append(scores(actual,p))
        runs.append(dict(settings=settings,mae=float(np.mean([e['mae'] for e in errors])),windows=errors))
    best=min(range(len(runs)),key=lambda i:runs[i]['mae'])
    return dict(settings=runs[best]['settings'],candidates=runs,selected=best,
                objective='Mean full thirty-step rollout MAE on the same historical development origins')


CORRECTION_COLS=['h','dow_sin','dow_cos','is_weekend','lag_1','roll_7','base_forecast']


def corrected_rollout(df,cutoff,settings,base_forecast):
    # These targets have already occurred by the FINAL cutoff, but were not inputs
    # to the base models reconstructed at the individual historical origins.
    rows=[];errors=[];origin_ids=[];target_ids=[]
    for origin in np.arange(cutoff-364,cutoff-HORIZON+1,14):
        model,_=recursive_fit(df,int(origin),settings)
        p,_=rollout(df,int(origin),model);X,y=test_records(df,int(origin))
        X=X.copy();X['base_forecast']=p
        rows.append(X[CORRECTION_COLS]);errors.extend(y-p)
        origin_ids.extend([origin]*HORIZON);target_ids.extend(origin+np.arange(1,HORIZON+1))
    X=pd.concat(rows,ignore_index=True);y=np.array(errors);o=np.array(origin_ids);target=np.array(target_ids)
    split=cutoff-100;train=target<=split;validation=o>=split
    assert train.any() and validation.any() and max(target)<=cutoff
    candidates=[]
    for alpha in [10.,100.,1000.]:
        model=make_pipeline(StandardScaler(),Ridge(alpha=alpha)).fit(X.loc[train],y[train])
        candidate=model.predict(X.loc[validation]);raw=float(np.mean(abs(y[validation])))
        candidates.append(dict(alpha=alpha,corrected_mae=float(np.mean(abs(y[validation]-candidate))),raw_mae=raw))
    best=min(candidates,key=lambda r:r['corrected_mae'])
    model=make_pipeline(StandardScaler(),Ridge(alpha=best['alpha'])).fit(X,y)
    test,_=test_records(df,cutoff);test['base_forecast']=base_forecast
    adjustments=model.predict(test[CORRECTION_COLS])
    return base_forecast+adjustments,adjustments,dict(alpha=best['alpha'],candidates=candidates,rows=len(y),
          historical_origins=int(len(np.unique(o))),first_origin=str(df.datetime.iloc[min(o)].date()),
          last_origin=str(df.datetime.iloc[max(o)].date()),last_label=str(df.datetime.iloc[max(target)].date()),
          validation_split=str(df.datetime.iloc[split].date()),
          supported_by_validation=best['corrected_mae']<best['raw_mae'])


def strategy_comparison(df,shared):
    selection=select_recursive(df);folds=[]
    for common in shared['folds']:
        date=common['origin'];cutoff=index_of(df,date);started=time.perf_counter()
        model,meta=recursive_fit(df,cutoff,selection['settings']);base,traces=rollout(df,cutoff,model,True)
        fixed,adjustments,correction=corrected_rollout(df,cutoff,selection['settings'],base)
        actual=np.array([r['actual'] for r in common['timeline'] if 'boosting' in r])
        direct=np.array([r['boosting'] for r in common['timeline'] if 'boosting' in r])
        naive=seasonal_naive(df,cutoff)
        paths={'pooled':direct,'recursive':base,'corrected':fixed,'naive':naive}
        timeline=[dict(time=h-1,h=h,date=str(df.datetime.iloc[cutoff+h].date()),actual=float(actual[h-1]),
                       adjustment=float(adjustments[h-1]),**{k:float(p[h-1]) for k,p in paths.items()}) for h in range(1,HORIZON+1)]
        folds.append(dict(origin=date,timeline=timeline,traces=traces,correction=correction,
                          metrics={k:scores(actual,p) for k,p in paths.items()},recursive_protocol=meta,
                          fit_seconds=time.perf_counter()-started))
        print('recursive remedy',date,{k:round(scores(actual,p)['mae'],1) for k,p in paths.items()},flush=True)
    curve=[]
    for h in range(HORIZON):
        r=dict(time=h+1,h=h+1,origins=len(folds))
        for k in ['pooled','recursive','corrected','naive']:
            e=[abs(f['timeline'][h]['actual']-f['timeline'][h][k]) for f in folds]
            r[k]=float(np.mean(e));r[k+'_min']=float(min(e));r[k+'_max']=float(max(e))
        curve.append(r)
    return dict(folds=folds,selection=selection,lead_curve=curve,
                features=RECURSIVE_FEATURES,correction_features=CORRECTION_COLS)


def quantile_model(settings,alpha):
    return xgb.XGBRegressor(n_estimators=100,learning_rate=.08,random_state=42,
                            tree_method='hist',n_jobs=2,objective='reg:quantileerror',
                            quantile_alpha=alpha,**settings)


def interval_metrics(y,lo,hi,alpha):
    y=np.asarray(y,dtype=float);lo=np.asarray(lo,dtype=float);hi=np.asarray(hi,dtype=float)
    assert np.all(lo<=hi)
    misses=(y<lo)|(y>hi)
    score=hi-lo+2/alpha*(np.maximum(lo-y,0)+np.maximum(y-hi,0))
    return dict(coverage=float(np.mean(~misses)*100),width=float(np.mean(hi-lo)),
                misses=int(sum(misses)),count=len(y),score=float(np.mean(score)))


def ranges(df,shared):
    """Past-origin calibration keeps final point fits identical to earlier sections.

    This is empirical historical calibration, NOT standard split-conformal CQR.
    Nonnegative outside-band scores give a declared widening-only adjustment.
    """
    settings=shared['selection']['settings']['boosting'];folds=[]
    for common in shared['folds']:
        cutoff=index_of(df,common['origin']);origins=np.arange(cutoff-364,cutoff-HORIZON+1,14)
        hist={a:[] for a in [.05,.1,.9,.95]};actual_history=[];point_history=[]
        for origin in origins:
            X,y,_=historical_tasks(df,int(origin));test,actual=test_records(df,int(origin))
            for alpha in hist:
                model=quantile_model(settings,alpha).fit(X,y);hist[alpha].append(model.predict(test))
            point=make_learner('boosting',settings).fit(X,y)
            point_history.append(point.predict(test));actual_history.append(actual)
        hist={a:np.array(v) for a,v in hist.items()};historical_y=np.array(actual_history)
        point_history=np.array(point_history)
        X,y,meta=historical_tasks(df,cutoff);test,actual=test_records(df,cutoff)
        final_quantiles={a:quantile_model(settings,a).fit(X,y).predict(test) for a in hist}
        point=np.array([r['boosting'] for r in common['timeline'] if 'boosting' in r])
        levels={}
        for nominal in [.8,.9]:
            alpha=round(1-nominal,2);low_a=.1 if nominal==.8 else .05;high_a=.9 if nominal==.8 else .95
            hist_low=np.minimum(hist[low_a],hist[high_a]);hist_high=np.maximum(hist[low_a],hist[high_a])
            outside=np.maximum(np.maximum(hist_low-historical_y,historical_y-hist_high),0)
            rank=int(np.ceil((len(origins)+1)*nominal));assert rank<=len(origins)
            adjustment=np.sort(outside,axis=0)[rank-1]
            margin=np.sort(abs(historical_y-point_history),axis=0)[rank-1]
            lo=np.minimum(final_quantiles[low_a],final_quantiles[high_a]);hi=np.maximum(final_quantiles[low_a],final_quantiles[high_a])
            bands={'raw':(lo,hi),'calibrated':(lo-adjustment,hi+adjustment),'residual':(point-margin,point+margin)}
            timeline=[]
            for h in range(HORIZON):
                r=dict(time=h,h=h+1,date=str(df.datetime.iloc[cutoff+h+1].date()),actual=float(actual[h]),
                       point=float(point[h]),adjustment=float(adjustment[h]))
                for name,(lower,upper) in bands.items():
                    r[name+'_lo']=float(lower[h]);r[name+'_hi']=float(upper[h]);r[name+'_band']=[float(lower[h]),float(upper[h])]
                    r[name+'_miss']=float(actual[h]) if actual[h]<lower[h] or actual[h]>upper[h] else None
                timeline.append(r)
            chosen=6
            example=dict(h=chosen+1,historical_origin=str(df.datetime.iloc[origins[0]].date()),
                         historical_target=str(df.datetime.iloc[origins[0]+chosen+1].date()),
                         historical_lower=float(hist_low[0,chosen]),historical_upper=float(hist_high[0,chosen]),
                         historical_actual=float(historical_y[0,chosen]),score=float(outside[0,chosen]),
                         adjustment=float(adjustment[chosen]),raw_lower=float(lo[chosen]),raw_upper=float(hi[chosen]),
                         lower=float(lo[chosen]-adjustment[chosen]),upper=float(hi[chosen]+adjustment[chosen]),
                         inputs=test.iloc[chosen].to_dict(),rank=rank,calibration_origins=len(origins))
            levels[str(int(nominal*100))]=dict(nominal=nominal,timeline=timeline,example=example,
                     metrics={k:interval_metrics(actual,l,u,alpha) for k,(l,u) in bands.items()})
        folds.append(dict(origin=common['origin'],levels=levels,protocol=meta,
                          calibration=dict(origins=len(origins),first_origin=str(df.datetime.iloc[min(origins)].date()),
                                           last_origin=str(df.datetime.iloc[max(origins)].date()),
                                           last_label=str(df.datetime.iloc[max(origins)+HORIZON].date()))))
        print('historical interval calibration',common['origin'],flush=True)
    aggregate={}
    for level in ['80','90']:
        combined=[row for f in folds for row in f['levels'][level]['timeline']]
        y=[r['actual'] for r in combined];alpha=1-int(level)/100
        aggregate[level]={name:interval_metrics(y,[r[name+'_lo'] for r in combined],[r[name+'_hi'] for r in combined],alpha)
                          for name in ['raw','calibrated','residual']}
    return dict(folds=folds,aggregate=aggregate,horizon=HORIZON,
                method='Historical rolling-origin widening calibration; not a split-conformal guarantee',
                score='max(lower minus actual, actual minus upper, zero)',features=FEATURES)


def validate_progression(data):
    shared=data['progression']['shared']
    for i,fold in enumerate(shared['folds']):
        intro=data['tab1']['origins'][i]
        assert intro['origin_date']==fold['origin']
        assert intro['linear_intro']['protocol']['training_rows']==fold['protocol']['rows']
        assert fold['protocol']['last_label']<=fold['origin']
        rows=[r for r in fold['timeline'] if 'linear' in r]
        for name,m in fold['metrics'].items():
            calc=scores([r['actual'] for r in rows],[r[name] for r in rows])
            for key in ['mae','rmse']:assert abs(calc[key]-m[key])<1e-3
        expected=intro['linear_intro']['metrics']['safe_full']['test']
        assert abs(expected['mae']-fold['metrics']['linear']['mae'])<1e-3
        for e in fold['examples']:
            nodes={node['id']:node for node in fold['tree_nodes']};node=nodes[0];visited=[]
            while not node['leaf']:
                visited.append(node['id'])
                node=nodes[node['left'] if e['inputs'][node['feature']]<=node['threshold'] else node['right']]
            assert visited==[r['node'] for r in e['path']] and node['id']==e['leaf_id']
            assert abs(node['prediction']-e['tree_prediction'])<1e-3
            assert abs(np.mean(e['forest_trees'])-e['forest_prediction'])<1e-3
            assert abs(e['svr']['intercept']+sum(x['contribution'] for x in e['svr']['terms'])+e['svr']['other']-e['svr']['prediction'])<1e-3
    for fold in data['progression']['strategies']['folds']:
        assert fold['correction']['last_label']<=fold['origin']
        assert fold['recursive_protocol']['last_label']<=fold['origin']
        assert abs(fold['traces'][1]['inputs']['lag_1']-fold['traces'][0]['prediction'])<1e-3
        for r in fold['timeline']:assert abs(r['recursive']+r['adjustment']-r['corrected'])<1e-3
        for name,m in fold['metrics'].items():
            calc=scores([r['actual'] for r in fold['timeline']],[r[name] for r in fold['timeline']])
            assert all(abs(calc[k]-m[k])<1e-3 for k in calc)
    for i,fold in enumerate(data['progression']['ranges']['folds']):
        assert fold['calibration']['last_label']<=fold['origin']
        point=[r['boosting'] for r in shared['folds'][i]['timeline'] if 'boosting' in r]
        for level,e in fold['levels'].items():
            assert np.allclose(point,[r['point'] for r in e['timeline']],atol=1e-4)
            for name,m in e['metrics'].items():
                calc=interval_metrics([r['actual'] for r in e['timeline']],
                                      [r[name+'_lo'] for r in e['timeline']],
                                      [r[name+'_hi'] for r in e['timeline']],1-int(level)/100)
                assert all(abs(calc[k]-m[k])<1e-3 for k in calc)
    return True


def unavailable_future_check(df):
    for date in DISPLAY_ORIGINS:
        cutoff=index_of(df,date);changed=df.copy();changed.loc[cutoff+1:,['y','solar','wind']]=-1e9
        a,y,ma=historical_tasks(df,cutoff);b,y2,mb=historical_tasks(changed,cutoff)
        assert a.equals(b) and np.array_equal(y,y2) and ma==mb
        a,_=test_records(df,cutoff);b,_=test_records(changed,cutoff);assert a.equals(b)


def build_progression(df,selection,cache_dir=None):
    unavailable_future_check(df)
    shared,intros=shared_comparison(df,selection)
    if cache_dir:
        (cache_dir/'shared_evidence.json').write_text(json.dumps(packed(dict(shared=shared,intros=intros))),encoding='utf-8')
    strategies=strategy_comparison(df,shared)
    if cache_dir:
        (cache_dir/'strategy_evidence.json').write_text(json.dumps(packed(strategies)),encoding='utf-8')
    intervals=ranges(df,shared)
    if cache_dir:
        (cache_dir/'range_evidence.json').write_text(json.dumps(packed(intervals)),encoding='utf-8')
    return dict(shared=shared,strategies=strategies,ranges=intervals),intros


def chapter_payload(df,progression,intros,trend=None):
    import platform
    result=dict(metadata=dict(topic=6,title='Traditional ML: one fixed-origin forecasting experiment',
                              python_version=platform.python_version(),xgboost_version=xgb.__version__,
                              section_revision='2026-11-07-shared-fixed-origin-progression',
                              random_seed=42,dataset_source='OPSD / ENTSO-E German daily electricity load'),
                tab1={**intros[0],'origins':intros},tab5=trend if trend is not None else packed(trend_lesson()),
                progression=progression)
    result=packed(result);validate_progression(result)
    assert len(json.dumps(result,separators=(',',':')).encode('utf-8'))<1024*1024
    return result

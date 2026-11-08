"""Fitted teaching records and traces for paired real/controlled rental forecasts."""
from __future__ import annotations
import json
import time
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
if __package__:
    from . import topic6_pairs_core as c
    from .topic6_progression import tree_structure
else:
    import topic6_pairs_core as c
    from topic6_progression import tree_structure

LEADS=[1,8,24]
LABELS={
 'lag_1':'Origin rentals','lag_2':'Rentals one hour before origin','lag_24':'Rentals 23 hours before origin',
 'lag_168':'Rentals 167 hours before origin','mean_24':'Last 24-hour mean','mean_168':'Last 168-hour mean',
 'casual_origin':'Origin casual rentals','registered_origin':'Origin registered rentals','hour':'Target hour',
 'hour_sin':'Target hour: sine','hour_cos':'Target hour: cosine','hour2_sin':'Target hour: second sine',
 'hour2_cos':'Target hour: second cosine','dow_sin':'Target weekday: sine','dow_cos':'Target weekday: cosine',
 'workingday':'Target working-day flag','holiday':'Target holiday flag','year_sin':'Target annual position: sine',
 'year_cos':'Target annual position: cosine','h':'Hours ahead','week_reference':'Same target hour last week',
 'four_week_reference':'Same target hour: four-week mean','day_reference':'Same target hour yesterday',
 'temp_origin':'Origin temperature (source units)','humidity_origin':'Origin humidity (source units)',
 'weather_origin':'Origin weather category','temp_mean24':'Last 24-hour mean temperature (source units)',
}
HISTORY_KEYS=['lag_1','lag_2','lag_24','lag_168','casual_origin','registered_origin','h']
MEAN_KEYS=HISTORY_KEYS+['mean_24','mean_168']
CALENDAR_KEYS=[x for x in c.FEATURES if x not in ['week_reference','four_week_reference','day_reference','temp_origin','humidity_origin','weather_origin','temp_mean24']]
TIERS={'lags_only':HISTORY_KEYS,'lags_rolling':MEAN_KEYS,'history_calendar':CALENDAR_KEYS,'safe_full':c.FEATURES}

def stamp(df,i):return df.index[int(i)].strftime('%Y-%m-%d %H:%M')
def protocol(df,t,o,h):
    return dict(rows=len(o),training_rows=len(o),origins=len(np.unique(o)),unique_targets=len(np.unique(o+h)),
                first_origin=stamp(df,min(o)),last_origin=stamp(df,max(o)),last_label=stamp(df,max(o+h)),
                origin_start=stamp(df,min(o)),origin_end=stamp(df,max(o)),label_start=stamp(df,min(o+h)),label_end=stamp(df,max(o+h)),
                history_days=84,preprocessing='Scaling is fitted on eligible training records only.')

def feature_unit(key):
    if key in ['h']:return 'hours'
    if key.startswith(('lag_','mean_')) or key in ['casual_origin','registered_origin','week_reference','four_week_reference','day_reference']:return 'rentals/hour'
    return 'source units' if key in ['temp_origin','humidity_origin','temp_mean24'] else 'unitless'

def raw_record(df,i,role):
    r=df.iloc[int(i)];fields={}
    keys=['instant','dteday','season','yr','mnth','hr','weekday','holiday','workingday','weathersit','temp','atemp','hum','windspeed','casual','registered','cnt']
    for key in keys:
        if key in df.columns:
            value=r[key]
            fields[key]=None if pd.isna(value) else value.item() if hasattr(value,'item') else value
    return dict(date=stamp(df,i),rentals=None if pd.isna(r.y) else float(r.y),fields=fields,role=role)

def source(df,key,o,h):
    target=o+h
    if key.startswith('lag_'):return stamp(df,o-int(key.split('_')[1])+1)+'; past observation or causal gap fill'
    if key.startswith('mean_'):return stamp(df,o-int(key.split('_')[1])+1)+' through '+stamp(df,o)
    if key=='day_reference':return stamp(df,target-24)+'; known before issue'
    if key=='week_reference':return stamp(df,target-168)+'; known before issue'
    if key=='four_week_reference':return 'Mean of '+', '.join(stamp(df,target-168*k) for k in range(1,5))
    if key in ['casual_origin','registered_origin','temp_origin','humidity_origin','weather_origin']:return stamp(df,o)+'; origin observation or causal gap fill'
    if key=='temp_mean24':return stamp(df,o-23)+' through '+stamp(df,o)+'; historical weather only'
    if key=='h':return f'Known request: {h} hours'
    return 'Known calendar of '+stamp(df,target)

def intro(df,t,models,X,y,o,h):
    xt,actual=c.test(df,t);linear=models['linear'];scaler,reg=[part for _,part in linear.steps]
    weights=reg.coef_/scaler.scale_;intercept=float(reg.intercept_-np.dot(weights,scaler.mean_))
    definitions=[dict(key=key,label=LABELS[key],unit=feature_unit(key),weight=float(weights[i]),
                      changes_with_horizon=key not in HISTORY_KEYS[:-1]+['mean_24','mean_168','temp_origin','humidity_origin','weather_origin','temp_mean24']) for i,key in enumerate(c.FEATURES)]
    predictions={};metrics={}
    for name,cols in TIERS.items():
        model=linear if name=='safe_full' else c.make('linear',{}).fit(X[cols],y)
        predictions[name]=model.predict(xt[cols]);metrics[name]=dict(test=c.metrics(actual,predictions[name]),feature_count=len(cols))
    bad=X.copy();bad['future_answer']=y;invalid=c.make('linear',{}).fit(bad,y)
    mask=np.isfinite(actual);bad_test=xt.loc[mask].copy();bad_test['future_answer']=actual[mask]
    bad_pred=np.full(c.H,np.nan);bad_pred[mask]=invalid.predict(bad_test)
    def record(index,lead,historical):
        row,_=c.records(df,[index],[lead]);values=row.iloc[0].to_numpy()
        prediction=float(linear.predict(row)[0]);contribution=values*weights
        assert abs(intercept+sum(contribution)-prediction)<1e-7
        result=dict(origin=stamp(df,index),target_date=stamp(df,index+lead),weekday=df.index[index+lead].day_name(),h=lead,
                    values=[dict(value=float(v),contribution=float(a),source=source(df,key,index,lead)) for key,v,a in zip(c.FEATURES,values,contribution)],
                    prediction=prediction)
        answer=float(df.y.iloc[index+lead]) if np.isfinite(df.y.iloc[index+lead]) else None
        if historical:
            result.update(target=answer,raw_origin=raw_record(df,index,'Observed origin'),raw_target=raw_record(df,index+lead,'Later answer, known before the final fit cutoff'))
        else:result['actual_later']=answer
        return result
    eligible=[i for i in np.unique(o) if all(np.isfinite(df.y.iloc[i+lead]) for lead in LEADS)]
    historical=[eligible[len(eligible)//2],eligible[-1]]
    examples=[record(int(index),lead,True) for index in historical for lead in LEADS]
    forecast=[record(t,lead,False) for lead in LEADS]
    naive=c.baselines(df,t)['naive'];timeline=[]
    for i in range(t-24,t+c.H+1):
        row=dict(time=i-t+24,date=stamp(df,i),actual=float(df.y.iloc[i]) if np.isfinite(df.y.iloc[i]) else None)
        if i>t:
            row.update({key:float(p[i-t-1]) for key,p in predictions.items()})
            row.update(repeat_week=float(naive[i-t-1]),invalid=float(bad_pred[i-t-1]) if np.isfinite(bad_pred[i-t-1]) else None)
        timeline.append(row)
    biggest=int(np.nanargmax(abs(actual-predictions['safe_full'])))
    e=dict(model='Ordinary linear regression',features=definitions,intercept=intercept,metrics=metrics,
           invalid_metrics=c.metrics(actual,bad_pred),training_examples=examples,forecast_records=forecast,timeline=timeline,
           repeat_week=dict(metrics=c.metrics(actual,naive)),protocol=protocol(df,t,o,h),
           largest_miss=dict(date=stamp(df,t+biggest+1),model_error=float(abs(actual[biggest]-predictions['safe_full'][biggest])),baseline_error=float(abs(actual[biggest]-naive[biggest]))))
    return dict(origin_date=stamp(df,t),horizon=c.H,origin_index=24,training_origin_start=examples[0]['origin'],origin_stride=24,
                dataset_start=stamp(df,0),dataset_end=stamp(df,len(df)-1),holdout_start=stamp(df,t+1),holdout_end=stamp(df,t+c.H),linear_intro=e)

def traces(df,t,models,X,y,o,h):
    xt,actual=c.test(df,t);tree=models['tree'];tr=tree.tree_;nodes,_=tree_structure(tree,c.FEATURES)
    svr=models['svr'];scaler,sv=[v for _,v in svr.regressor_.steps]
    target_scale=float(svr.transformer_.scale_[0]);target_shift=float(svr.transformer_.mean_[0]);examples=[]
    for lead in LEADS:
        row=xt.iloc[[lead-1]];node=0;path=[]
        while tr.children_left[node]!=tr.children_right[node]:
            key=c.FEATURES[tr.feature[node]];value=float(row.iloc[0][key]);threshold=float(tr.threshold[node]);left=value<=threshold
            path.append(dict(node=int(node),feature=key,threshold=threshold,value=value,comparison='≤' if left else '>'))
            node=tr.children_left[node] if left else tr.children_right[node]
        route={r['node'] for r in path};focused=[];leaves=[]
        def focus(node_id):
            r=dict(nodes[int(node_id)])
            if r['leaf'] or node_id not in route:r.update(leaf=True,collapsed=not r['leaf'],column=len(leaves));leaves.append(node_id)
            else:
                a=focus(r['left']);b=focus(r['right']);r['column']=(a['column']+b['column'])/2
            focused.append(r);return r
        focus(0);focused.sort(key=lambda r:r['id'])
        constituents=[float(m.predict(row.to_numpy())[0]) for m in models['forest'].estimators_]
        forest=float(models['forest'].predict(row)[0]);assert abs(np.mean(constituents)-forest)<1e-5
        gb=models['boosting'];cfg=json.loads(gb.get_booster().save_config());start=float(str(cfg['learner']['learner_model_param']['base_score']).strip('[]'))
        stages=[];previous=start
        for stage in range(1,4):
            p=float(gb.predict(row,iteration_range=(0,stage))[0]);stages.append(dict(stage=stage,correction=p-previous,prediction=p));previous=p
        z=scaler.transform(row)[0];similarity=np.exp(-sv._gamma*np.sum((sv.support_vectors_-z)**2,axis=1))
        contribution=sv.dual_coef_[0]*similarity*target_scale;important=np.argsort(-abs(contribution))[:6]
        terms=[]
        for i in important:
            index=int(sv.support_[i]);terms.append(dict(training_origin=stamp(df,o[index]),target=stamp(df,o[index]+h[index]),h=int(h[index]),similarity=float(similarity[i]),contribution=float(contribution[i])))
        intercept=float(target_shift+target_scale*sv.intercept_[0]);prediction=float(svr.predict(row)[0])
        assert abs(intercept+sum(contribution)-prediction)<1e-4
        examples.append(dict(h=lead,name=f'{lead} hours ahead',date=stamp(df,t+lead),inputs=row.iloc[0].to_dict(),
            actual=float(actual[lead-1]) if np.isfinite(actual[lead-1]) else None,path=path,leaf_id=int(node),
            tree_view_nodes=focused,tree_view_leaf_count=len(leaves),leaf_count=int(tr.n_node_samples[node]),tree_prediction=float(tree.predict(row)[0]),
            forest_trees=constituents,forest_prediction=forest,boosting_start=start,stages=stages,boosting_prediction=float(gb.predict(row)[0]),
            svr=dict(intercept=intercept,terms=terms,other=float(sum(contribution)-sum(contribution[important])),prediction=prediction)))
    full_origin=next(i for i in np.unique(o) if sum(o==i)==c.H);ids=np.where(o==full_origin)[0]
    fitted=svr.predict(X.iloc[ids]);tol=float(sv.epsilon*target_scale);support=set(sv.support_)
    tube=[dict(time=int(h[i]),h=int(h[i]),actual=float(y[i]),fit=float(p),training_band=[float(p-tol),float(p+tol)],training_lo=float(p-tol),training_hi=float(p+tol),support=float(y[i]) if i in support else None) for i,p in zip(ids,fitted)]
    return dict(examples=examples,tube=tube,tube_origin=stamp(df,full_origin),epsilon_mw=tol,support_count=len(sv.support_),training_rows=len(y))

def conditions(df,t):
    future=df.iloc[t+1:t+c.H+1];previous=df.iloc[t+1-168:t+c.H+1-168]
    return dict(origin_weather=float(df.weather_history.iloc[t]),future_weather=float(future.weathersit.max()),
                origin_temperature=float(df.temp_history.iloc[t]),future_temperature=float(future.temp.mean()),
                previous_week_temperature=float(previous.temp.mean()),future_holiday=bool(future.holiday.max()),
                actual_mean=float(future.y.mean()),last_week_mean=float(previous.y.mean()),
                recent_day_mean=float(df.mean_24.iloc[t]),previous_day_mean=float(df.mean_24.iloc[t-168]),
                recent_week_mean=float(df.mean_168.iloc[t]),previous_week_mean=float(df.mean_168.iloc[t-168]))

RECURSIVE=[x for x in c.FEATURES if x not in ['h','casual_origin','registered_origin']]
CORRECTION=['h','hour_sin','hour_cos','workingday','day_reference','week_reference','mean_24','base_forecast']

def recursive_fit(df,t,settings):
    o=np.arange(t-c.HISTORY+24,t);h=np.ones(len(o),dtype=int)
    X,y=c.records(df,o,h);keep=np.isfinite(y)
    model=c.make('boosting',settings).fit(X.loc[keep,RECURSIVE],y[keep])
    return model,protocol(df,t,o[keep],h[keep])

def rollout(df,t,model,explain=False):
    direct,_=c.test(df,t);history=df.cnt_history.iloc[:t+1].tolist();predictions=[];examples=[]
    for lead in range(1,c.H+1):
        r=direct.iloc[lead-1][RECURSIVE].to_dict()
        for lag in [1,2,24,168]:r['lag_'+str(lag)]=history[-lag]
        for window in [24,168]:r['mean_'+str(window)]=float(np.mean(history[-window:]))
        p=float(model.predict(pd.DataFrame([r])[RECURSIVE])[0])
        if explain and lead in [1,2,8]:
            provenance={}
            for key in RECURSIVE:
                if key.startswith('lag_'):provenance[key]='Predicted' if lead-int(key[4:])>0 else 'Observed history or causal gap fill'
                elif key.startswith('mean_'):provenance[key]='Observed history plus predictions' if lead>1 else 'Observed history or causal gap fill'
                elif key in ['temp_origin','humidity_origin','weather_origin','temp_mean24']:provenance[key]='Frozen original-origin weather'
                elif key.endswith('reference'):provenance[key]='Observed before the original origin'
                else:provenance[key]='Known target calendar'
            examples.append(dict(h=lead,date=stamp(df,t+lead),inputs=r,pooled=direct.iloc[lead-1].to_dict(),prediction=p,provenance=provenance))
        predictions.append(p);history.append(p)
    return np.array(predictions),examples

def recursive_selection(df):
    runs=[]
    for settings in c.CANDIDATES['boosting']:
        errors=[]
        for date in c.DEV:
            t=c.at(df,date);model,_=recursive_fit(df,t,settings);p,_=rollout(df,t,model);_,y=c.test(df,t)
            errors.append(c.metrics(y,p)['mae'])
        runs.append(dict(settings=settings,mae=float(np.mean(errors))))
    best=int(np.argmin([r['mae'] for r in runs]))
    return dict(settings=runs[best]['settings'],candidates=runs,selected=best,objective='Mean complete 24-hour rollout MAE on the earlier development days')

def interval_metrics(y,lo,hi,alpha):
    y=np.asarray(y,dtype=float);lo=np.asarray(lo,dtype=float);hi=np.asarray(hi,dtype=float);mask=np.isfinite(y)
    y,lo,hi=y[mask],lo[mask],hi[mask];assert np.all(lo<=hi)
    missed=(y<lo)|(y>hi)
    return dict(coverage=float(np.mean(~missed)*100),width=float(np.mean(hi-lo)),misses=int(sum(missed)),count=len(y),
                score=float(np.mean(hi-lo+2/alpha*(np.maximum(lo-y,0)+np.maximum(y-hi,0)))))

def historical_evidence(df,t,settings,rec_settings):
    origins=np.arange(t-21*24,t,24);actual=[];points=[];recursive=[];records=[]
    quantiles={a:[] for a in [.05,.1,.9,.95]}
    for o in origins:
        X,y,_,_=c.train(df,int(o));xt,yt=c.test(df,int(o));actual.append(yt)
        points.append(c.make('boosting',settings).fit(X,y).predict(xt))
        for a in quantiles:
            q=c.make('boosting',settings);q.set_params(objective='reg:quantileerror',quantile_alpha=a)
            quantiles[a].append(q.fit(X,y).predict(xt))
        rec,_=recursive_fit(df,int(o),rec_settings);p,_=rollout(df,int(o),rec);recursive.append(p)
        xt=xt.copy();xt['base_forecast']=p;records.append(xt[CORRECTION])
    return dict(origins=origins,actual=np.array(actual),point=np.array(points),recursive=np.array(recursive),
                quantiles={a:np.array(v) for a,v in quantiles.items()},records=pd.concat(records,ignore_index=True))

def strategy_fold(df,t,common,rec_settings,historical):
    started=time.perf_counter();model,meta=recursive_fit(df,t,rec_settings);base,traces_=rollout(df,t,model,True)
    xt,y=c.test(df,t);xt=xt.copy();xt['base_forecast']=base
    hist=historical;error=(hist['actual']-hist['recursive']).reshape(-1);origins=np.repeat(hist['origins'],c.H)
    targets=origins+np.tile(np.arange(1,c.H+1),len(hist['origins']));mask=np.isfinite(error)
    X=hist['records'].loc[mask];error=error[mask];origins=origins[mask];targets=targets[mask]
    split=t-7*24;training=targets<=split;validation=origins>=split;candidates=[]
    assert targets.max()<=t and training.any() and validation.any()
    for alpha in [10.,100.,1000.]:
        corrector=make_pipeline(StandardScaler(),Ridge(alpha=alpha)).fit(X.loc[training],error[training])
        candidate=corrector.predict(X.loc[validation])
        candidates.append(dict(alpha=alpha,corrected_mae=float(np.mean(abs(error[validation]-candidate))),raw_mae=float(np.mean(abs(error[validation])))))
    best=min(candidates,key=lambda r:r['corrected_mae'])
    corrector=make_pipeline(StandardScaler(),Ridge(alpha=best['alpha'])).fit(X,error)
    adjustment=corrector.predict(xt[CORRECTION]);fixed=base+adjustment
    direct=np.array([r['boosting'] for r in common['timeline'] if 'boosting' in r]);naive=c.baselines(df,t)['naive']
    paths=dict(pooled=direct,recursive=base,corrected=fixed,naive=naive)
    timeline=[dict(time=i,h=i+1,date=stamp(df,t+i+1),actual=float(y[i]) if np.isfinite(y[i]) else None,adjustment=float(adjustment[i]),**{k:float(p[i]) for k,p in paths.items()}) for i in range(c.H)]
    return dict(origin=stamp(df,t),timeline=timeline,traces=traces_,metrics={k:c.metrics(y,p) for k,p in paths.items()},recursive_protocol=meta,
                correction=dict(alpha=best['alpha'],candidates=candidates,rows=len(error),historical_origins=len(hist['origins']),
                  first_origin=stamp(df,hist['origins'][0]),last_origin=stamp(df,hist['origins'][-1]),last_label=stamp(df,int(targets.max())),
                  validation_split=stamp(df,split),supported_by_validation=best['corrected_mae']<best['raw_mae']),fit_seconds=time.perf_counter()-started)

def range_fold(df,t,common,settings,hist):
    X,y,o,h=c.train(df,t);xt,actual=c.test(df,t);final={}
    for a in hist['quantiles']:
        q=c.make('boosting',settings);q.set_params(objective='reg:quantileerror',quantile_alpha=a);final[a]=q.fit(X,y).predict(xt)
    point=np.array([r['boosting'] for r in common['timeline'] if 'boosting' in r]);levels={}
    for nominal in [.8,.9]:
        alpha=round(1-nominal,2);a=.1 if nominal==.8 else .05;b=.9 if nominal==.8 else .95
        hlo=np.minimum(hist['quantiles'][a],hist['quantiles'][b]);hhi=np.maximum(hist['quantiles'][a],hist['quantiles'][b])
        outside=np.maximum(np.maximum(hlo-hist['actual'],hist['actual']-hhi),0)
        rawlo=np.minimum(final[a],final[b]);rawhi=np.maximum(final[a],final[b]);adjustment=[];margin=[];ranks=[];counts=[]
        for lead in range(c.H):
            valid=np.isfinite(hist['actual'][:,lead]);n=int(sum(valid));rank=int(np.ceil((n+1)*nominal));assert 0<rank<=n
            adjustment.append(np.sort(outside[valid,lead])[rank-1]);margin.append(np.sort(abs(hist['actual'][valid,lead]-hist['point'][valid,lead]))[rank-1]);ranks.append(rank);counts.append(n)
        adjustment=np.array(adjustment);margin=np.array(margin)
        bands=dict(raw=(rawlo,rawhi),calibrated=(rawlo-adjustment,rawhi+adjustment),residual=(point-margin,point+margin))
        timeline=[]
        for i in range(c.H):
            row=dict(time=i,h=i+1,date=stamp(df,t+i+1),actual=float(actual[i]) if np.isfinite(actual[i]) else None,point=float(point[i]))
            for name,(lo,hi) in bands.items():
                row[name+'_lo']=float(lo[i]);row[name+'_hi']=float(hi[i]);row[name+'_band']=[float(lo[i]),float(hi[i])]
                row[name+'_miss']=float(actual[i]) if np.isfinite(actual[i]) and (actual[i]<lo[i] or actual[i]>hi[i]) else None
            timeline.append(row)
        lead=7;sample=int(np.where(np.isfinite(hist['actual'][:,lead]))[0][0])
        example=dict(h=lead+1,historical_origin=stamp(df,hist['origins'][sample]),historical_target=stamp(df,hist['origins'][sample]+lead+1),
          historical_lower=float(hlo[sample,lead]),historical_upper=float(hhi[sample,lead]),historical_actual=float(hist['actual'][sample,lead]),
          score=float(outside[sample,lead]),adjustment=float(adjustment[lead]),raw_lower=float(rawlo[lead]),raw_upper=float(rawhi[lead]),
          lower=float(rawlo[lead]-adjustment[lead]),upper=float(rawhi[lead]+adjustment[lead]),inputs=xt.iloc[lead].to_dict(),rank=ranks[lead],calibration_origins=counts[lead])
        levels[str(int(nominal*100))]=dict(nominal=nominal,timeline=timeline,example=example,
           metrics={name:interval_metrics(actual,lo,hi,alpha) for name,(lo,hi) in bands.items()},calibration_counts=counts)
    return dict(origin=stamp(df,t),levels=levels,protocol=protocol(df,t,o,h),calibration=dict(origins=len(hist['origins']),
                first_origin=stamp(df,hist['origins'][0]),last_origin=stamp(df,hist['origins'][-1]),last_label=stamp(df,int(hist['origins'][-1]+c.H))))

"""Regenerate only 6.2–6.6, preserving the approved 6.1 payload exactly."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np

from generate_topic6_data import load_german_load
import topic6_sections as evidence


def generate():
    df = load_german_load()
    # Perturb every unavailable future measurement: eligible training tasks and
    # fixed-origin predictors must not change (future evaluation labels may).
    for date in evidence.ORIGINS:
        cutoff = int(df.index[df.datetime == date][0])
        changed = df.copy()
        changed.loc[cutoff+1:, ['y', 'solar', 'wind']] = -1e9
        origins, horizons = np.repeat(cutoff, 30), np.arange(1, 31)
        X, _ = evidence.matrix(df, origins, horizons)
        other, _ = evidence.matrix(changed, origins, horizons)
        assert X.equals(other), 'Unavailable future measurement in predictors'
        X, y, meta = evidence.training(df, cutoff)
        other, other_y, _ = evidence.training(changed, cutoff)
        assert X.equals(other) and np.array_equal(y, other_y)
        assert meta['last_label'] <= date
    result = {}
    for key, fun in [('tab2', lambda: evidence.tree_lesson()), ('tab3', lambda: evidence.arena(df)),
                     ('tab4', lambda: evidence.multistep(df)), ('tab5', lambda: evidence.trend_lesson()),
                     ('tab6', lambda: evidence.uncertainty(df))]:
        print('Fitting', key, flush=True)
        result[key] = evidence.packed(fun())
    return result


def validate(j):
    if 'tree_nodes' in j['tab2']:
        nodes={item['id']:item for item in j['tab2']['tree_nodes']}
        for node in nodes.values():
            if not node['leaf']:
                left,right=nodes[node['left']],nodes[node['right']]
                assert left['samples']+right['samples']==node['samples']
                weighted=(left['prediction']*left['samples']+right['prediction']*right['samples'])/node['samples']
                assert abs(weighted-node['prediction'])<1e-4
        for example in j['tab2']['examples']:
            node=nodes[0]
            visited=[]
            while not node['leaf']:
                visited.append(node['id'])
                node=nodes[node['left'] if example['inputs'][node['feature']]<=node['threshold'] else node['right']]
            assert visited==[step['node'] for step in example['path']]
            assert node['id']==example['leaf_id']
            assert abs(node['prediction']-example['tree_prediction'])<1e-4
    for e in j['tab2']['examples']:
        assert abs(np.mean(e['forest_trees'])-e['forest_prediction'])<1e-4
        assert abs(e['boosting_start']+sum(s['correction'] for s in e['stages'])-e['stages'][-1]['prediction'])<1e-4
    groups = [(j['tab2']['timeline'],j['tab2']['metrics'])]
    groups += [(f['timeline'],f['metrics']) for key in ['tab3','tab4'] for f in j[key]['folds']]
    groups += [([r for r in j['tab5']['timeline'] if 'raw' in r],j['tab5']['metrics'])]
    for rows, metrics in groups:
        for name, m in metrics.items():
            calculated=evidence.scores([r['actual'] for r in rows],[r[name] for r in rows])
            for key in ['mae','rmse']: assert abs(m[key]-calculated[key])<1e-4, (name,key)
    for f in j['tab4']['folds']:
        for family, trace in f['traces'].items():
            assert abs(trace[1]['recursive']['lag_1']-trace[0]['recursive_prediction'])<1e-4
            assert trace[1]['pooled']['lag_1']==trace[0]['pooled']['lag_1']
    folds=j['tab4']['folds'][:len(evidence.ORIGINS)]
    for index,row in enumerate(j['tab4']['lead_curve']):
        for name in folds[0]['metrics']:
            actual=np.mean([abs(f['timeline'][index]['actual']-f['timeline'][index][name]) for f in folds])
            assert abs(actual-row[name])<1e-4
    e=j['tab5']['forecast_example'];assert abs(e['prediction']-e['trend']-e['remainder'])<1e-4
    boundary=j['tab5']['boundary_example']['rows']
    assert len({row['leaf'] for row in boundary})==1
    assert len({row['prediction'] for row in boundary})==1
    for level in j['tab6']['levels'].values():
        rows=level['timeline'];assert len(rows)==j['tab6']['test']['rows']
        for name,m in level['metrics'].items():
            lo=np.array([r[name+'_lo'] for r in rows]);hi=np.array([r[name+'_hi'] for r in rows])
            calc=evidence.interval_summary(np.array([r['actual'] for r in rows]),lo,hi,1-level['nominal'])
            for key in calc:assert abs(calc[key]-m[key])<1e-3,(name,key)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check', action='store_true');args=parser.parse_args()
    output=Path(__file__).resolve().parents[2]/'public/topic6_data.json'
    original=json.loads(output.read_text(encoding='utf-8'))
    if 'progression' in original or 'datasets' in original:
        raise SystemExit('Use regenerate_topic6_pairs.py: the learner sections now share one forecasting contract.')
    new=generate();validate(new)
    if args.check:
        assert all(original[k]==v for k,v in new.items()), 'Regeneration differs from stored evidence'
        print('PASS: deterministic regeneration and numerical invariants')
    else:
        updated={**original,**new}
        updated['metadata']['section_revision']='2026-11-03-evidence-and-story'
        assert updated['tab1']==original['tab1']
        output.write_text(json.dumps(updated,allow_nan=False,separators=(',',':')),encoding='utf-8')
        print('PASS: fitted evidence saved; 6.1 preserved; bytes',output.stat().st_size)
        print('SHA256',hashlib.sha256(output.read_bytes()).hexdigest())

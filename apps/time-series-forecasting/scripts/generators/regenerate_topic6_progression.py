"""Build the shared-learner Chapter 6 evidence; freeze development-selected settings."""
import argparse
import json
from pathlib import Path

from generate_topic6_data import load_german_load
from topic6_progression import build_progression, chapter_payload


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--selection',type=Path,default=Path(__file__).with_name('topic6_model_selection.json'))
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    output=Path(__file__).resolve().parents[2]/'public/topic6_data.json'
    before=json.loads(output.read_text(encoding='utf-8'))
    if 'datasets' in before:
        raise SystemExit('Use regenerate_topic6_pairs.py for the paired day-ahead chapter.')
    selection=json.loads(args.selection.read_text(encoding='utf-8'))
    cache=Path(__file__).resolve().parents[3]/'experiments/section6_progression_2026-11-07'
    cache.mkdir(parents=True,exist_ok=True)
    df=load_german_load()
    progression,intros=build_progression(df,selection,cache)
    data=chapter_payload(df,progression,intros)
    # Fit times are measured diagnostics, not deterministic model evidence.
    def deterministic(value):
        if isinstance(value,dict):return {k:deterministic(v) for k,v in value.items() if k not in ['fit_seconds','mean_fit_seconds']}
        if isinstance(value,list):return [deterministic(v) for v in value]
        return value
    if args.check:
        assert deterministic(before['progression'])==deterministic(data['progression'])
        assert before['tab1']['origins']==data['tab1']['origins']
        print('PASS: deterministic evidence and all shared/correction/interval invariants')
    else:
        output.write_text(json.dumps(data,allow_nan=False,separators=(',',':')),encoding='utf-8')
        print('PASS: saved continuous Chapter 6 evidence; bytes',output.stat().st_size)

"""Build paired evidence; optional checkpoints are independently checked and anchor-refitted."""
import argparse
import json
from pathlib import Path
from topic6_pairs import build,evaluate,OUTPUT,SELECTION,c

def stable(value):
    if isinstance(value,dict):return {k:stable(v) for k,v in value.items() if k not in ['fit_seconds','mean_fit_seconds','seconds']}
    if isinstance(value,list):return [stable(v) for v in value]
    return value

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--reuse-checkpoints',action='store_true');parser.add_argument('--reuse-canonical',action='store_true');parser.add_argument('--evaluate-case',choices=['controlled','real']);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    if args.evaluate_case:
        case=args.evaluate_case;selection=json.loads(SELECTION.read_text())['cases'][case]
        evaluate(c.load() if case=='real' else c.simulation(),selection,case,c.OUT/case)
        print('PASS: refitted every reserved-year forecast',case)
        raise SystemExit(0)
    before=json.loads(OUTPUT.read_text(encoding='utf-8')) if args.check else None
    data=build(reuse=args.reuse_checkpoints,canonical=args.reuse_canonical)
    if args.check:
        snapshot=Path(__file__).resolve().parents[3]/'experiments/section6_dataset_redesign_2026-11-07/canonical_refit_payload.json'
        snapshot.write_text(json.dumps(data,allow_nan=False,separators=(',',':')),encoding='utf-8')
        assert stable(before)==stable(data)
        print('PASS: deterministic paired evidence, forecast chronology, fitted traces and interval arithmetic')
    else:
        OUTPUT.write_text(json.dumps(data,allow_nan=False,separators=(',',':')),encoding='utf-8')
        print('PASS: saved paired evidence',OUTPUT.stat().st_size,'bytes')

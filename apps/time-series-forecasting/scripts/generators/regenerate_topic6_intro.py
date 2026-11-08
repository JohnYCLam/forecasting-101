"""Regenerate tab1 only, preserving other Topic 6 teaching experiments."""
import argparse
import json
from generate_topic6_data import gen_tab1, load_german_load, OUTPUT_FILE, json_default


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify the saved payload without rewriting it')
    args = parser.parse_args()
    original = json.loads(OUTPUT_FILE.read_text(encoding='utf-8'))
    if 'progression' in original or 'datasets' in original:
        raise SystemExit('Use regenerate_topic6_pairs.py: the introduction now shares its training tasks with the learner comparisons.')
    df = load_german_load()
    tab = json.loads(json.dumps(gen_tab1(df), default=json_default, allow_nan=False))
    second = json.loads(json.dumps(gen_tab1(df), default=json_default, allow_nan=False))
    assert tab == second, 'Non-deterministic introduction'
    evidence = tab['linear_intro']
    for row in evidence['training_examples'] + evidence['forecast_records']:
        reconstructed = evidence['intercept'] + sum(v['contribution'] for v in row['values'])
        assert abs(reconstructed - row['prediction']) < 1e-5
        for feature, value in zip(evidence['features'], row['values']):
            assert feature['key'] == value['key']
            assert abs(feature['weight'] * value['value'] - value['contribution']) < 1e-5
        source = df.loc[df['datetime'] == row['origin']].iloc[0]
        latest = next(v['value'] for v in row['values'] if v['key'] == 'lag_1')
        assert abs(latest - source['y']) < 1e-5
        actual = float(df.loc[df['datetime'] == row['target_date'], 'y'].iloc[0])
        assert abs(actual - row['actual_later']) < 1e-5
        if row['target'] is not None:
            assert abs(actual - row['target']) < 1e-5
    for row in evidence['repeat_week']['mapping']:
        actual = float(df.loc[df['datetime'] == row['source_date'], 'y'].iloc[0])
        assert abs(actual - row['prediction']) < 1e-5
        assert row['source_date'] <= tab['origin_date'] < row['target_date']
    assert evidence['protocol']['label_end'] <= tab['origin_date']
    assert evidence['invalid_metrics']['mae'] < .01
    if args.check:
        assert original['tab1'] == tab, 'Saved data differs from the canonical generator'
    else:
        original['tab1'] = tab
        OUTPUT_FILE.write_text(json.dumps(original, default=json_default, separators=(',', ':'), allow_nan=False), encoding='utf-8')
        saved = json.loads(OUTPUT_FILE.read_text(encoding='utf-8'))
        assert saved['tab1'] == tab, 'Serialization changed the canonical introduction'
        assert all(saved[k] == original[k] for k in original if k != 'tab1')
    print(json.dumps({'deterministic':True, 'canonical_matches_saved':True,
                      'full_set':evidence['metrics']['safe_full'], 'repeat_week':evidence['repeat_week']['metrics'],
                      'invalid_diagnostic':evidence['invalid_metrics'], 'training_examples':len(evidence['training_examples']),
                      'input_columns':len(evidence['features']), 'size_kb':round(OUTPUT_FILE.stat().st_size/1024,1)}))


if __name__ == '__main__':
    main()

"""Auditable OLS evidence for the four-tab 6.1 introduction."""
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, root_mean_squared_error
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


def build_linear_intro(df, train, test, tiers, origin_idx):
    cutoff = df.loc[origin_idx, 'datetime']
    assert train['target_dt'].max() <= cutoff < test['target_dt'].min()
    full = tiers['safe_full']
    models, predictions, metrics = {}, {}, {}

    def score(actual, predicted):
        return {'mae': round(float(mean_absolute_error(actual, predicted)), 6),
                'rmse': round(float(root_mean_squared_error(actual, predicted)), 6)}

    for key, names in tiers.items():
        pipe = make_pipeline(StandardScaler(), LinearRegression())
        pipe.fit(train[names], train['y'])
        models[key] = pipe
        predictions[key] = pipe.predict(test[names])
        metrics[key] = {'train': score(train['y'], pipe.predict(train[names])),
                        'test': score(test['y'], predictions[key]), 'feature_count': len(names)}

    # The sole changed information condition: append the actual future answer.
    invalid_columns = full + ['target_load']
    invalid = make_pipeline(StandardScaler(), LinearRegression())
    invalid.fit(train[invalid_columns], train['y'])
    invalid_predictions = invalid.predict(test[invalid_columns])
    invalid_metrics = score(test['y'], invalid_predictions)

    scaler, model = models['safe_full'].steps[0][1], models['safe_full'].steps[1][1]
    raw_weights = model.coef_ / scaler.scale_
    raw_intercept = float(model.intercept_ - np.dot(raw_weights, scaler.mean_))
    assert np.allclose(raw_intercept + test[full].values @ raw_weights, predictions['safe_full'])

    labels = {
        'lag_1': 'Latest observed load', 'lag_2': 'Load one day before origin',
        'lag_3': 'Load two days before origin', 'lag_7': 'Load six days before origin',
        'lag_14': 'Load thirteen days before origin', 'lag_28': 'Load twenty-seven days before origin',
        'roll_7': 'Recent 7-day average', 'roll_28': 'Recent 28-day average',
        'dow_sin': 'Target weekday: sine', 'dow_cos': 'Target weekday: cosine',
        'is_weekend': 'Target weekend flag', 'solar_lag1': 'Origin solar generation',
        'wind_lag1': 'Origin wind generation', 'h': 'Days ahead',
        'h_sin': 'Horizon position: sine', 'h_cos': 'Horizon position: cosine',
    }

    def unit(name):
        return 'MWh' if name in ['solar_lag1', 'wind_lag1'] else 'MW' if name.startswith(('lag_', 'roll_')) else 'days' if name == 'h' else 'unitless'

    features = [{'key': name, 'label': labels[name], 'unit': unit(name),
                 'weight': float(raw_weights[i]),
                 'changes_with_horizon': name in ['h', 'h_sin', 'h_cos', 'dow_sin', 'dow_cos', 'is_weekend']}
                for i, name in enumerate(full)]

    def date(index):
        return df.loc[index, 'datetime'].strftime('%Y-%m-%d')

    def raw_record(index, role):
        return {'date': date(index), 'load': round(float(df.loc[index, 'y']), 6),
                'solar': round(float(df.loc[index, 'solar']), 6),
                'wind': round(float(df.loc[index, 'wind']), 6),
                'price': round(float(df.loc[index, 'price']), 6) if np.isfinite(df.loc[index, 'price']) else None,
                'role': role}

    def source(name, index, row):
        if name.startswith('lag_'):
            return date(index - int(name.split('_')[1]) + 1)
        if name.startswith('roll_'):
            return f"{date(index - int(name.split('_')[1]) + 1)} to {date(index)}"
        if name in ['solar_lag1', 'wind_lag1']:
            return date(index)
        if name in ['dow_sin', 'dow_cos', 'is_weekend']:
            return f"Calendar of {row['target_dt'].strftime('%Y-%m-%d')}"
        return f"Known lead time: {int(row['h'])} days"

    def record(row, historical):
        index = int(df.index[df['datetime'] == row['origin_dt']][0])
        values = [{'key': name, 'value': float(row[name]), 'source': source(name, index, row),
                   'contribution': float(raw_weights[i] * row[name])}
                  for i, name in enumerate(full)]
        prediction = float(models['safe_full'].predict(row[full].to_frame().T)[0])
        assert abs(raw_intercept + sum(v['contribution'] for v in values) - prediction) < 1e-6
        return {'origin': date(index), 'target_date': row['target_dt'].strftime('%Y-%m-%d'),
                'h': int(row['h']), 'weekday': row['target_dt'].strftime('%A'), 'values': values,
                'target': float(row['y']) if historical else None,
                'actual_later': float(row['y']), 'prediction': prediction,
                'raw_origin': raw_record(index, 'Latest observation'),
                'raw_target': raw_record(index + int(row['h']), 'Training answer, observed later') if historical else None,
                'history': [raw_record(j, 'Observed history') for j in range(index - 27, index + 1)] if historical else []}

    origins = sorted(train['origin_dt'].unique())
    example_origins = [origins[0], origins[7]]
    examples = [record(row, True) for _, row in train.iterrows()
                if row['origin_dt'] in example_origins and int(row['h']) in [1, 7, 30]]
    forecast_records = [record(row, False) for _, row in test.iterrows() if int(row['h']) in [1, 7, 30]]

    last_week = df.loc[origin_idx - 6:origin_idx, 'y'].values
    repeat = np.array([float(last_week[(h - 1) % 7]) for h in range(1, len(test) + 1)])
    mapping = [{'target_date': row['target_dt'].strftime('%Y-%m-%d'), 'weekday': row['target_dt'].strftime('%A'),
                'source_date': date(origin_idx - 6 + (int(row['h']) - 1) % 7),
                'prediction': float(repeat[i])} for i, (_, row) in enumerate(test.iterrows())]
    timeline = []
    for index in range(origin_idx - 28, origin_idx + len(test) + 1):
        item = {'time': index - origin_idx + 28, 'date': date(index), 'actual': float(df.loc[index, 'y'])}
        if index > origin_idx:
            step = index - origin_idx - 1
            item.update({key: float(values[step]) for key, values in predictions.items()})
            item.update({'invalid': float(invalid_predictions[step]), 'repeat_week': float(repeat[step])})
        timeline.append(item)
    biggest = int(np.argmax(abs(test['y'].values - predictions['safe_full'])))
    return {
        'model': 'Ordinary linear regression', 'feature_sets': [{'key': key, 'columns': names} for key, names in tiers.items()],
        'features': features, 'intercept': raw_intercept, 'metrics': metrics,
        'invalid_metrics': invalid_metrics, 'invalid_extra_column': 'Actual future target load',
        'training_examples': examples, 'forecast_records': forecast_records, 'timeline': timeline,
        'repeat_week': {'metrics': score(test['y'], repeat), 'mapping': mapping,
                        'observations': [raw_record(i, 'Week repeated into the future') for i in range(origin_idx - 6, origin_idx + 1)]},
        'largest_miss': {'date': test.iloc[biggest]['target_dt'].strftime('%Y-%m-%d'),
                         'model_error': float(abs(test.iloc[biggest]['y'] - predictions['safe_full'][biggest])),
                         'baseline_error': float(abs(test.iloc[biggest]['y'] - repeat[biggest]))},
        'protocol': {'training_rows': len(train), 'origins': int(train['origin_dt'].nunique()),
                     'unique_targets': int(train['target_dt'].nunique()),
                     'origin_start': train['origin_dt'].min().strftime('%Y-%m-%d'),
                     'origin_end': train['origin_dt'].max().strftime('%Y-%m-%d'),
                     'label_start': train['target_dt'].min().strftime('%Y-%m-%d'),
                     'label_end': train['target_dt'].max().strftime('%Y-%m-%d'),
                     'preprocessing': 'StandardScaler fitted on training rows only; displayed weights converted back to original input units.'},
    }

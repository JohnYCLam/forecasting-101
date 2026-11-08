# Per-family notes (planning hints; verify before relying on them)

## Topic 6: Traditional ML (tree-based models, regression)
- Libraries: scikit-learn (RandomForest, GradientBoosting, Ridge), optionally lightgbm / xgboost.
- Turn forecasting into supervised learning: lag features (`y.shift(k)`), rolling mean/std computed on shifted data, calendar features
  (day of week, month), optionally exogenous variables.
- Trees cannot extrapolate a trend: demonstrate it, then fix by differencing or detrending (links back to Topic 2 "I" in ARIMA).
- Validation: walk-forward with `TimeSeriesSplit`, never shuffled K-fold (show the leakage failure as a teaching tab).
- Multi-step: recursive vs direct, with the error accumulation difference as a demo.
- Show feature importance honestly (importance is not causation).
- Baselines: seasonal naive, ARIMA/ETS from earlier topics.

## Topic 7: Facebook Prophet
- Library: `prophet` (installation may require a C++ toolchain/cmdstan; check import first and ask the user if it fails).
- Concepts to teach: additive model = trend + seasonality (yearly/weekly) + holidays + noise; changepoints; uncertainty intervals.
- Demo ideas: changepoint prior slider (underfit vs overfit trend), components plot, effect of holidays.
- Needs data with real seasonality and a trend change. Baselines: seasonal naive, SARIMA/ETS.
- Limitation to state: Prophet is not always more accurate than classical models; it is convenient and interpretable.

## Topic 8: Traditional Deep Learning (RNN, LSTM, CNN)
- Library: PyTorch or TensorFlow/Keras (ask the user which; check import).
- Sliding windows -> (samples, window, features). Scale on train only. Small networks, CPU training in minutes.
- Seed everything; record the loss curve per epoch (train and validation) in the JSON, since the loss curve is a good demo.
- Demo ideas: window length control, hidden size control, overfitting as epochs grow, LSTM vs CNN vs MLP.
- Honest comparison with ETS/ARIMA and Topic 6 models; DL often does not win on small single series. Say so.

## Topic 9: Modern DL (Transformers)
- Keep models tiny for the demo (few layers, small d_model), trained offline, outputs saved to JSON.
- Teach: self-attention as "which past steps matter", positional encoding, why Transformers can use long context.
- Attention weights can be exported as a matrix and drawn as a heatmap; state that attention is not a full explanation.
- Same protocol and honesty rules as Topic 8.

## Topic 10: RAG demo for time series
- Idea: retrieve similar historical patterns (nearest neighbours of the recent window by shape/embedding distance) and use what followed them to
  condition the forecast. Needs a retrieval index built on TRAIN data only (no leakage of the test future).
- Keep it deterministic and offline. No API keys in the repo. If an LLM is involved, precompute outputs, store prompts and outputs in the JSON, and
  label them clearly as precomputed.
- Compare retrieval-based forecast with a baseline; show cases where retrieved neighbours are poor matches.

## Topic 11: Foundation models (zero-shot forecasting)
- Candidates (check current availability/licences with the user): Chronos, TimesFM, Moirai, Lag-Llama, and similar.
- Large downloads and possibly GPU. If it cannot be run locally, STOP and ask. Never fabricate or imitate outputs.
- Record model name, version and checkpoint id in the JSON metadata. Run zero-shot (no fine-tuning) and compare with tuned classical baselines
  and Topic 6-9 models on the same windows.
- Teach: what zero-shot means, where it shines (short history, many series), and where it fails (domain shift, unusual seasonality).

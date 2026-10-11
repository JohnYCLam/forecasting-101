import json
import numpy as np
import pandas as pd
from arch import arch_model
import statsmodels.api as sm


def safe_qlike(proxy_var, est_var, eps_val=1e-6):
    proxy_safe = np.maximum(proxy_var, eps_val)
    est_safe = np.maximum(est_var, eps_val)
    ratio = proxy_safe / est_safe
    return float(np.mean(ratio - np.log(ratio) - 1))


def finite_or_none_list(arr):
    return [float(x) if np.isfinite(x) else None for x in arr]


def gen_tab1():
    # Tab 1: Introduction to ARCH: Real vs Fake White Noise & Damping Effect
    np.random.seed(42)
    n = 500

    # 1. Real White Noise
    real_noise = np.random.normal(0, 1, n)

    # 2. Fake White Noise (ARCH(2) process)
    omega = 0.2
    alpha1 = 0.5
    alpha2 = 0.3

    eps = np.random.normal(0, 1, n)
    fake_noise = np.zeros(n)
    sigma2 = np.zeros(n)

    sigma2[0] = omega / (1 - alpha1 - alpha2)
    sigma2[1] = omega / (1 - alpha1 - alpha2)
    fake_noise[0] = np.sqrt(sigma2[0]) * eps[0]
    fake_noise[1] = np.sqrt(sigma2[1]) * eps[1]

    for t in range(2, n):
        sigma2[t] = omega + alpha1 * fake_noise[t - 1] ** 2 + alpha2 * fake_noise[t - 2] ** 2
        fake_noise[t] = np.sqrt(sigma2[t]) * eps[t]

    train_size = 400
    train = fake_noise[:train_size]
    test = fake_noise[train_size:]

    model = arch_model(train, mean="Constant", vol="ARCH", p=2).fit(disp="off")

    params = model.params
    mu = float(params.get("mu", 0.0))
    omega_hat = float(params["omega"])
    alpha1_hat = float(params.get("alpha[1]", 0.0))
    alpha2_hat = float(params.get("alpha[2]", 0.0))

    one_step_sigma = np.zeros(n)
    one_step_sigma[:train_size] = np.asarray(model.conditional_volatility)

    for t in range(train_size, n):
        e_lag1 = fake_noise[t - 1] - mu
        e_lag2 = fake_noise[t - 2] - mu
        var_t = omega_hat + alpha1_hat * (e_lag1**2) + alpha2_hat * (e_lag2**2)
        one_step_sigma[t] = np.sqrt(max(var_t, 1e-8))

    h = len(test)
    multi_var = np.zeros(h)
    e_last_1 = train[-1] - mu
    e_last_2 = train[-2] - mu
    var_prev_1 = one_step_sigma[train_size - 1] ** 2
    var_prev_2 = one_step_sigma[train_size - 2] ** 2

    for i in range(h):
        if i == 0:
            var_i = omega_hat + alpha1_hat * (e_last_1**2) + alpha2_hat * (e_last_2**2)
        elif i == 1:
            var_i = omega_hat + alpha1_hat * multi_var[i - 1] + alpha2_hat * (e_last_1**2)
        else:
            var_i = omega_hat + alpha1_hat * multi_var[i - 1] + alpha2_hat * multi_var[i - 2]
        multi_var[i] = max(var_i, 1e-8)

    multi_sigma = np.full(n, np.nan)
    multi_sigma[train_size:] = np.sqrt(multi_var)

    point_mean = np.full(n, np.nan)
    point_mean[train_size:] = mu

    unconditional_var = omega_hat / max(1e-6, (1 - alpha1_hat - alpha2_hat))

    return {
        "real_noise": real_noise.tolist(),
        "fake_noise": fake_noise.tolist(),
        "real_rolling_var": pd.Series(real_noise**2).rolling(20, min_periods=1).mean().tolist(),
        "fake_rolling_var": pd.Series(fake_noise**2).rolling(20, min_periods=1).mean().tolist(),
        "forecast_series": fake_noise.tolist(),
        "train_size": train_size,
        "point_mean": finite_or_none_list(point_mean),
        "one_step_sigma": finite_or_none_list(one_step_sigma),
        "multi_step_sigma": finite_or_none_list(multi_sigma),
        "unconditional_vol": float(np.sqrt(unconditional_var)),
        "mu": mu
    }


def gen_tab2():
    # Tab 2: behavior generator. Each order generates data from that GARCH(p,q).
    rng = np.random.default_rng(42)
    n = 600
    burn = 300
    train_size = 500
    innovations = rng.normal(0, 1, n + burn)
    model_grid = {}
    for p in range(1, 6):
        for q in range(0, 6):
            # Decreasing lag weights make earlier shocks/variances more influential.
            alpha_total = 0.65 if q == 0 else 0.18
            beta_total = 0.0 if q == 0 else 0.75
            alpha_weights = 0.6 ** np.arange(p)
            alpha_lags = alpha_total * alpha_weights / alpha_weights.sum()
            if q:
                beta_weights = 0.72 ** np.arange(q)
                beta_lags = beta_total * beta_weights / beta_weights.sum()
            else:
                beta_lags = np.array([])

            persistence = alpha_lags.sum() + beta_lags.sum()
            omega = 1.0 - persistence  # Sets unconditional variance to 1.
            max_lag = max(p, q, 1)
            returns = np.zeros(n + burn)
            sigma2 = np.ones(n + burn)
            returns[:max_lag] = innovations[:max_lag]

            for t in range(max_lag, n + burn):
                shock_term = sum(alpha_lags[i] * returns[t - i - 1] ** 2 for i in range(p))
                memory_term = sum(beta_lags[j] * sigma2[t - j - 1] for j in range(q))
                sigma2[t] = omega + shock_term + memory_term
                returns[t] = np.sqrt(sigma2[t]) * innovations[t]

            sample_returns = returns[burn:]
            sample_sigma2 = sigma2[burn:]
            if q == 0:
                model_type = "ARCH"
                model_name = f"ARCH({p})"
                fitted = arch_model(
                    sample_returns[:train_size], mean="Zero", vol="ARCH", p=p
                ).fit(disp="off")
            else:
                model_type = "GARCH"
                model_name = f"GARCH({p},{q})"
                fitted = arch_model(
                    sample_returns[:train_size], mean="Zero", vol="Garch", p=p, q=q
                ).fit(disp="off")

            fitted_alpha = [float(fitted.params[f"alpha[{i}]"]) for i in range(1, p + 1)]
            fitted_beta = [float(fitted.params[f"beta[{j}]"]) for j in range(1, q + 1)]
            forecast_var = np.asarray(
                fitted.forecast(horizon=n - train_size, reindex=False).variance
            )[-1]

            key = f"p{p}_q{q}"
            model_grid[key] = {
                "model_type": model_type,
                "model_name": model_name,
                "returns": sample_returns.tolist(),
                "squared_returns": (sample_returns**2).tolist(),
                "true_cond_var": sample_sigma2.tolist(),
                "fitted_var": (np.asarray(fitted.conditional_volatility) ** 2).tolist(),
                "forecast_var": forecast_var.tolist(),
                "train_size": train_size,
                "omega": float(omega),
                "alpha": alpha_lags.tolist(),
                "beta": beta_lags.tolist(),
                "persistence": float(persistence),
                "fitted_omega": float(fitted.params["omega"]),
                "fitted_alpha": fitted_alpha,
                "fitted_beta": fitted_beta,
            }

    return {"models": model_grid}


def gen_tab3():
    # Tab 3: Performance Validation with latent truth + constant-vol baseline
    np.random.seed(123)
    n = 500

    omega = 0.1
    alpha = 0.2
    beta = 0.7

    eps = np.random.normal(0, 1, n)
    returns = np.zeros(n)
    true_sigma2 = np.zeros(n)
    true_sigma2[0] = omega / (1 - alpha - beta)
    returns[0] = np.sqrt(true_sigma2[0]) * eps[0]

    for t in range(1, n):
        true_sigma2[t] = omega + alpha * returns[t - 1] ** 2 + beta * true_sigma2[t - 1]
        returns[t] = np.sqrt(true_sigma2[t]) * eps[t]

    garch_model = arch_model(returns, vol="Garch", p=1, q=1).fit(disp="off")
    garch_sigma2 = np.asarray(garch_model.conditional_volatility) ** 2
    const_sigma2 = np.full(n, np.var(returns))
    proxy = returns**2

    metrics = {
        "garch": {
            "mse_true": float(np.mean((true_sigma2 - garch_sigma2) ** 2)),
            "mse_proxy": float(np.mean((proxy - garch_sigma2) ** 2)),
            "qlike_proxy": safe_qlike(proxy, garch_sigma2),
        },
        "constant_vol": {
            "mse_true": float(np.mean((true_sigma2 - const_sigma2) ** 2)),
            "mse_proxy": float(np.mean((proxy - const_sigma2) ** 2)),
            "qlike_proxy": safe_qlike(proxy, const_sigma2),
        },
    }

    return {
        "returns": returns.tolist(),
        "true_vol": np.sqrt(true_sigma2).tolist(),
        "garch_vol": np.sqrt(garch_sigma2).tolist(),
        "const_vol": np.sqrt(const_sigma2).tolist(),
        "proxy": proxy.tolist(),
        "metrics": metrics,
    }


def gen_tab4():
    # Tab 4: VaR (Historical vs GARCH) — multi-level confidence
    np.random.seed(42)
    n = 1000
    returns = np.zeros(n)
    sigma2 = np.zeros(n)
    eps = np.random.normal(0, 1, n)
    sigma2[0] = 1.0
    returns[0] = eps[0]
    for t in range(1, n):
        sigma2[t] = 0.05 + 0.15 * returns[t - 1] ** 2 + 0.8 * sigma2[t - 1]
        returns[t] = np.sqrt(sigma2[t]) * eps[t]

    window = 100
    z_scores = {1: 2.3263, 5: 1.6449, 10: 1.2816}

    hist_var = {}
    hist_breaches = {}
    hist_breach_flags = {}
    for pct in [1, 5, 10]:
        hv = np.full(n, np.nan)
        for t in range(window, n):
            hv[t] = np.percentile(returns[t - window : t], pct)
        hist_var[str(pct)] = [None if np.isnan(x) else float(x) for x in hv]
        breach_arr = returns < hv
        hist_breaches[str(pct)] = int(np.nansum(breach_arr[window:]))
        hist_breach_flags[str(pct)] = [bool(x) if i >= window else False for i, x in enumerate(breach_arr)]

    garch = arch_model(returns, vol="Garch", p=1, q=1).fit(disp="off")
    cond_vol = np.asarray(garch.conditional_volatility)

    garch_var = {}
    garch_breaches = {}
    garch_breach_flags = {}
    for pct in [1, 5, 10]:
        garch_var_level = -z_scores[pct] * cond_vol
        garch_var[str(pct)] = garch_var_level.tolist()
        breach_arr = returns < garch_var_level
        garch_breaches[str(pct)] = int(np.sum(breach_arr[window:]))
        garch_breach_flags[str(pct)] = [bool(x) if i >= window else False for i, x in enumerate(breach_arr)]

    return {
        "returns": returns.tolist(),
        "hist_var": hist_var,
        "garch_cond_vol": cond_vol.tolist(),
        "garch_var": garch_var,
        "hist_breaches": hist_breaches,
        "garch_breaches": garch_breaches,
        "hist_breach_flags": hist_breach_flags,
        "garch_breach_flags": garch_breach_flags,
        "window": window,
    }


def gen_tab5():
    # Tab 5: walk-forward out-of-sample ARIMA vs sequential ARIMA-GARCH
    rng = np.random.default_rng(16)
    n = 700
    train_size = 500
    z = rng.normal(0, 1, n)
    innovations = np.zeros(n)
    sigma2 = np.zeros(n)
    y = np.zeros(n)
    sigma2[0] = 0.02 / (1 - 0.22 - 0.76)
    innovations[0] = np.sqrt(sigma2[0]) * z[0]
    y[0] = innovations[0]

    for t in range(1, n):
        sigma2[t] = 0.02 + 0.22 * innovations[t - 1] ** 2 + 0.76 * sigma2[t - 1]
        innovations[t] = np.sqrt(sigma2[t]) * z[t]
        y[t] = 0.4 + 0.55 * y[t - 1] + 0.25 * innovations[t - 1] + innovations[t]

    train = y[:train_size]
    test = y[train_size:]

    arima_result = sm.tsa.ARIMA(train, order=(1, 0, 1)).fit()
    train_residuals = np.asarray(arima_result.resid)
    constant_vol = float(np.std(train_residuals, ddof=1))

    garch_result = arch_model(train_residuals, mean="Zero", vol="Garch", p=1, q=1).fit(disp="off")
    omega_hat = float(garch_result.params["omega"])
    alpha_hat = float(garch_result.params["alpha[1]"])
    beta_hat = float(garch_result.params["beta[1]"])

    means = np.zeros(len(test))
    residuals = np.zeros(len(test))
    garch_vol = np.zeros(len(test))
    state = arima_result
    previous_residual = float(train_residuals[-1])
    previous_variance = float(np.asarray(garch_result.conditional_volatility)[-1] ** 2)

    for i, observed in enumerate(test):
        means[i] = float(np.asarray(state.forecast(steps=1))[0])
        next_variance = omega_hat + alpha_hat * previous_residual**2 + beta_hat * previous_variance
        garch_vol[i] = np.sqrt(max(next_variance, 1e-8))
        residuals[i] = observed - means[i]

        state = state.append([observed], refit=False)
        previous_residual = residuals[i]
        previous_variance = next_variance

    arma_vol = np.full(len(test), constant_vol)
    rolling_var = pd.Series(residuals**2).rolling(window=20, min_periods=1).mean().values

    z_95 = 1.96
    const_upper = means + z_95 * arma_vol
    const_lower = means - z_95 * arma_vol
    garch_upper = means + z_95 * garch_vol
    garch_lower = means - z_95 * garch_vol

    const_outside = (test > const_upper) | (test < const_lower)
    garch_outside = (test > garch_upper) | (test < garch_lower)

    def interval_score(actual, lower, upper, alpha=0.05):
        width = upper - lower
        below = (actual < lower) * (2.0 / alpha) * (lower - actual)
        above = (actual > upper) * (2.0 / alpha) * (actual - upper)
        return float(np.mean(width + below + above))

    point_rmse = float(np.sqrt(np.mean((test - means) ** 2)))

    metrics = {
        "constant_band": {
            "outside_count": int(np.sum(const_outside)),
            "outside_pct": float(np.mean(const_outside) * 100.0),
            "inside_pct": float((1.0 - np.mean(const_outside)) * 100.0),
            "coverage_error": float(abs((1.0 - np.mean(const_outside)) * 100.0 - 95.0)),
            "average_width": float(np.mean(const_upper - const_lower)),
            "interval_score": interval_score(test, const_lower, const_upper),
        },
        "garch_band": {
            "outside_count": int(np.sum(garch_outside)),
            "outside_pct": float(np.mean(garch_outside) * 100.0),
            "inside_pct": float((1.0 - np.mean(garch_outside)) * 100.0),
            "coverage_error": float(abs((1.0 - np.mean(garch_outside)) * 100.0 - 95.0)),
            "average_width": float(np.mean(garch_upper - garch_lower)),
            "interval_score": interval_score(test, garch_lower, garch_upper),
        },
        "point_rmse": point_rmse,
    }

    return {
        "actual": test.tolist(),
        "arma_mean": means.tolist(),
        "residuals": residuals.tolist(),
        "arma_vol": arma_vol.tolist(),
        "garch_vol": garch_vol.tolist(),
        "rolling_var": rolling_var.tolist(),
        "const_outside_flags": const_outside.tolist(),
        "garch_outside_flags": garch_outside.tolist(),
        "train_size": train_size,
        "test_size": len(test),
        "interval_level": 95,
        "metrics": metrics,
    }


def gen_tab6():
    # Tab 6: Extensions (EGARCH, APARCH)
    np.random.seed(42)
    n = 500
    eps = np.random.normal(0, 1, n)
    returns = np.zeros(n)
    ln_sigma2 = np.zeros(n)
    ln_sigma2[0] = 0
    returns[0] = np.exp(ln_sigma2[0] / 2) * eps[0]

    omega = 0.1
    alpha = 0.1
    gamma = -0.2
    beta = 0.8

    for t in range(1, n):
        z = eps[t - 1]
        ln_sigma2[t] = omega + alpha * (np.abs(z) - np.sqrt(2 / np.pi)) + gamma * z + beta * ln_sigma2[t - 1]
        returns[t] = np.exp(ln_sigma2[t] / 2) * eps[t]

    garch = arch_model(returns, vol="Garch", p=1, q=1).fit(disp="off")
    egarch = arch_model(returns, vol="EGARCH", p=1, o=1, q=1).fit(disp="off")
    aparch = arch_model(returns, vol="APARCH", p=1, o=1, q=1).fit(disp="off")

    z_vals = np.linspace(-3, 3, 100)
    baseline_sigma = float(np.std(returns, ddof=1))
    baseline_variance = baseline_sigma**2
    shocks = z_vals * baseline_sigma
    garch_ni = (
        garch.params["omega"]
        + garch.params["alpha[1]"] * (shocks**2)
        + garch.params["beta[1]"] * baseline_variance
    )

    alpha_param = egarch.params.get("alpha[1]", 0)
    gamma_param = egarch.params.get("gamma[1]", 0)
    baseline_log_variance = np.log(max(baseline_variance, 1e-8))
    egarch_ni = np.exp(
        egarch.params["omega"]
        + alpha_param * (np.abs(z_vals) - np.sqrt(2 / np.pi))
        + gamma_param * z_vals
        + egarch.params.get("beta[1]", 0.0) * baseline_log_variance
    )

    aparch_omega = aparch.params.get("omega", 0.0)
    aparch_alpha = aparch.params.get("alpha[1]", 0.0)
    aparch_gamma = aparch.params.get("gamma[1]", 0.0)
    aparch_beta = aparch.params.get("beta[1]", 0.0)
    aparch_delta = aparch.params.get("delta", 2.0)
    aparch_power = (
        aparch_omega
        + aparch_alpha * (np.abs(shocks) - aparch_gamma * shocks) ** aparch_delta
        + aparch_beta * baseline_sigma**aparch_delta
    )
    aparch_ni = np.maximum(aparch_power, 1e-6) ** (2.0 / aparch_delta)

    return {
        "returns": returns.tolist(),
        "garch_vol": np.asarray(garch.conditional_volatility).tolist(),
        "egarch_vol": np.asarray(egarch.conditional_volatility).tolist(),
        "aparch_vol": np.asarray(aparch.conditional_volatility).tolist(),
        "news_impact": {
            "z": z_vals.tolist(),
            "garch": garch_ni.tolist(),
            "egarch": egarch_ni.tolist(),
            "aparch": aparch_ni.tolist(),
        },
    }


if __name__ == "__main__":
    data = {
        "tab1": gen_tab1(),
        "tab2": gen_tab2(),
        "tab3": gen_tab3(),
        "tab4": gen_tab4(),
        "tab5": gen_tab5(),
        "tab6": gen_tab6(),
    }

    with open("public/topic4_data.json", "w") as f:
        json.dump(data, f)

    print("Generated public/topic4_data.json successfully.")

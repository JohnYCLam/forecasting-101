import json
import os
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from statsmodels.tsa.api import VAR
from statsmodels.tsa.arima.model import ARIMA

# High-quality clean aesthetics
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 1.0

demo_root = Path(__file__).resolve().parents[2]
output_dir = str(demo_root / "public" / "incident_plots")
os.makedirs(output_dir, exist_ok=True)

# ------------------------------------------------------------------------------
# 1. SHARED GROUND TRUTH DATA: MILD-SPIKE TRAINING + OUT-OF-SAMPLE TEST SHOCK
# ------------------------------------------------------------------------------
np.random.seed(42)
prices_hist = [50.0]
dispatch_hist = [0.0]

for t in range(1, 126):
    # Routine mild operational bumps (~$92 at 02:30 and ~$104 at 07:00)
    spike = 40.0 if t == 84 else (35.0 if t == 30 else 0.0)
    d_target = max(0.0, (prices_hist[-1] - 75.0) * 0.45)
    d = d_target + float(np.random.normal(0, 0.4)) if d_target > 0 else max(0.0, float(np.random.normal(0, 0.1)))
    p_ar = 50.0 + 0.60 * (prices_hist[-1] - 50.0)
    p = p_ar + spike - (2.2 * dispatch_hist[-1]) + float(np.random.normal(0, 1.2))
    p = max(20.0, p)
    prices_hist.append(float(p))
    dispatch_hist.append(float(d))

# Focus window: interval 80 (06:40) to 125 (10:25)
window_indices = np.arange(80, 126)
time_labels = [f"{(i*5)//60:02d}:{(i*5)%60:02d}" for i in window_indices]

# Historical training slice for intervals 80..120 (Identical in both plots)
train_p_window = [prices_hist[i] for i in range(80, 120)] + [250.0]
train_d_window = [dispatch_hist[i] for i in range(80, 120)] + [0.0]
train_x = window_indices[:41] # intervals 80..120
test_x = window_indices[40:]  # intervals 120..125

shock_val = 250.0

# Ground Truth Physical Simulation (Identical across both plots)
actual_p = [shock_val]
actual_d = [0.0]
p_curr = shock_val
d_curr = 0.0
for step in range(5):
    d_phys = max(0.0, (p_curr - 75.0) * 0.45)
    p_phys = 50.0 + 0.60 * (p_curr - 50.0) - 2.2 * d_phys
    p_curr = max(20.0, p_phys)
    d_curr = max(0.0, d_phys)
    actual_p.append(round(p_curr, 1))
    actual_d.append(round(d_curr, 1))

# Peak actual dispatch is 78.8 MW in both plots!

# ------------------------------------------------------------------------------
# PLOT 1: THE HARDCODED VERSION (PERFECTLY MATCHED PLOT ON THIS EXACT DATA)
# ------------------------------------------------------------------------------
# In the legacy cheat, the VAR forecast was artificially manufactured to match
# the actual ground truth within 1.2 MW, and price was forced down immediately:
var_d_fake = [0.0, round(actual_d[1] - 1.2, 1), 18.0, 1.0, 0.0, 0.0]  # 77.6 MW vs 78.8 MW!
arima_d_fake = [0.0, 0.2, 0.2, 0.2, 0.2, 0.2]

var_p_fake = [shock_val, 43.5, 46.2, 48.8, 50.1, 50.0]  # Forced instant collapse
arima_p_fake = [shock_val] + [round(50.0 + (0.71**h) * (shock_val - 50.0), 1) for h in range(1, 6)]

fig1, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
fig1.suptitle("Hardcoded Forecast Implementation (Synthetic Perfect Match)", fontsize=13, fontweight='bold', color='#1e293b')

# Price
ax1.plot(train_x, train_p_window, color='#334155', marker='.', linewidth=1.6, markersize=4, label='In-Sample History')
ax1.plot(test_x, actual_p, color='#2563eb', marker='o', linewidth=2.0, markersize=5, label='Actual Spot Price')
ax1.plot(test_x, var_p_fake, color='#16a34a', linestyle='--', marker='s', linewidth=2.0, markersize=5, label='VAR Forecast (Hardcoded Match)')
ax1.plot(test_x, arima_p_fake, color='#dc2626', linestyle=':', marker='^', linewidth=1.6, markersize=4, label='ARIMA Forecast (Hardcoded)')
ax1.axvline(120, color='#94a3b8', linestyle='--', linewidth=1.2, label='Shock Origin (10:00 AM)')
ax1.set_ylabel("Spot Price ($/MWh)", fontsize=10, fontweight='bold')
ax1.set_title("Wholesale Spot Price ($/MWh)", fontsize=11, fontweight='bold', color='#334155')
ax1.legend(loc='upper right', framealpha=0.95, fontsize=9)
ax1.grid(True, linestyle='--', alpha=0.5)

# Dispatch
ax2.plot(train_x, train_d_window, color='#334155', marker='.', linewidth=1.6, markersize=4, label='In-Sample History')
ax2.plot(test_x, actual_d, color='#2563eb', marker='o', linewidth=2.0, markersize=5, label='Actual Battery Dispatch (Peak = 78.8 MW)')
ax2.plot(test_x, var_d_fake, color='#16a34a', linestyle='--', marker='s', linewidth=2.0, markersize=5, label='VAR Forecast (Hardcoded: 77.6 MW)')
ax2.plot(test_x, arima_d_fake, color='#dc2626', linestyle=':', marker='^', linewidth=1.6, markersize=4, label='ARIMA Forecast (Hardcoded)')
ax2.axvline(120, color='#94a3b8', linestyle='--', linewidth=1.2)
ax2.set_ylabel("Battery Dispatch (MW)", fontsize=10, fontweight='bold')
ax2.set_xlabel("Time (5-Minute Settlement Intervals)", fontsize=10, fontweight='bold')
ax2.set_title("Grid-Scale Battery Dispatch (MW)", fontsize=11, fontweight='bold', color='#334155')
ax2.legend(loc='upper left', framealpha=0.95, fontsize=9)
ax2.grid(True, linestyle='--', alpha=0.5)

tick_steps = range(0, len(window_indices), 4)
ax2.set_xticks([window_indices[i] for i in tick_steps])
ax2.set_xticklabels([time_labels[i] for i in tick_steps], rotation=45)

plt.tight_layout()
plot1_path = os.path.join(output_dir, "hardcoded_matched_plot.png")
plt.savefig(plot1_path, dpi=300)
plt.close()
print(f"Generated clean Plot 1 (aligned ground truth): {plot1_path}")


# ------------------------------------------------------------------------------
# PLOT 2: REAL FORECAST ON THE EXACT SAME DATA (FORECAST WITH GAP)
# ------------------------------------------------------------------------------
df_train = pd.DataFrame({'price': prices_hist[:120], 'dispatch': dispatch_hist[:120]})
var1 = VAR(df_train).fit(1)
ari_p = ARIMA(df_train['price'], order=(0, 1, 2)).fit()
ari_d = ARIMA(df_train['dispatch'], order=(1, 0, 0)).fit()

# Real VAR(1) forecast conditioned on shock origin (120)
state1 = np.array([[float(shock_val), 0.0]])
fc_v1 = var1.forecast(state1, steps=5)
var_p_real = [shock_val] + [round(float(v), 1) for v in fc_v1[:, 0]]
var_d_real = [0.0] + [round(max(0.0, float(v)), 1) for v in fc_v1[:, 1]]  # Peak is 29.1 MW!

p_ext = pd.concat([df_train['price'], pd.Series([float(shock_val)], index=[120])])
d_ext = pd.concat([df_train['dispatch'], pd.Series([0.0], index=[120])])
fc_ari_p = [round(float(v), 1) for v in ari_p.apply(p_ext).forecast(steps=5).values]
fc_ari_d = [round(max(0.0, float(v)), 1) for v in ari_d.apply(d_ext).forecast(steps=5).values]
arima_p_real = [shock_val] + fc_ari_p
arima_d_real = [0.0] + fc_ari_d

fig2, (bx1, bx2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)
fig2.suptitle("Real Econometric Forecast (Direct Fix to Hardcode — Genuine Gap)", fontsize=13, fontweight='bold', color='#1e293b')

# Price
bx1.plot(train_x, train_p_window, color='#334155', marker='.', linewidth=1.6, markersize=4, label='In-Sample History')
bx1.plot(test_x, actual_p, color='#2563eb', marker='o', linewidth=2.0, markersize=5, label='Actual Spot Price')
bx1.plot(test_x, var_p_real, color='#16a34a', linestyle='--', marker='s', linewidth=2.0, markersize=5, label='Real VAR(1) Forecast')
bx1.plot(test_x, arima_p_real, color='#dc2626', linestyle=':', marker='^', linewidth=1.6, markersize=4, label='Real ARIMA(0,1,2) Forecast')
bx1.axvline(120, color='#94a3b8', linestyle='--', linewidth=1.2, label='Shock Origin (10:00 AM)')
bx1.set_ylabel("Spot Price ($/MWh)", fontsize=10, fontweight='bold')
bx1.set_title("Wholesale Spot Price ($/MWh)", fontsize=11, fontweight='bold', color='#334155')
bx1.legend(loc='upper right', framealpha=0.95, fontsize=9)
bx1.grid(True, linestyle='--', alpha=0.5)

# Dispatch
bx2.plot(train_x, train_d_window, color='#334155', marker='.', linewidth=1.6, markersize=4, label='In-Sample History')
bx2.plot(test_x, actual_d, color='#2563eb', marker='o', linewidth=2.0, markersize=5, label='Actual Battery Dispatch (Peak = 78.8 MW)')
bx2.plot(test_x, var_d_real, color='#16a34a', linestyle='--', marker='s', linewidth=2.0, markersize=5, label='Real VAR(1) Forecast (Peak = 29.1 MW)')
bx2.plot(test_x, arima_d_real, color='#dc2626', linestyle=':', marker='^', linewidth=1.6, markersize=4, label='Real ARIMA(1,0,0) Forecast')
bx2.axvline(120, color='#94a3b8', linestyle='--', linewidth=1.2)
bx2.set_ylabel("Battery Dispatch (MW)", fontsize=10, fontweight='bold')
bx2.set_xlabel("Time (5-Minute Settlement Intervals)", fontsize=10, fontweight='bold')
bx2.set_title("Grid-Scale Battery Dispatch (MW)", fontsize=11, fontweight='bold', color='#334155')
bx2.legend(loc='upper left', framealpha=0.95, fontsize=9)
bx2.grid(True, linestyle='--', alpha=0.5)

bx2.set_xticks([window_indices[i] for i in tick_steps])
bx2.set_xticklabels([time_labels[i] for i in tick_steps], rotation=45)

plt.tight_layout()
plot2_path = os.path.join(output_dir, "real_forecast_with_gap_plot.png")
plt.savefig(plot2_path, dpi=300)
plt.close()
print(f"Generated clean Plot 2 (aligned ground truth): {plot2_path}")

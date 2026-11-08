# Adapted from "Introduction to Stochastic Calculus" by Ji-Ha Kim.
# https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/
# Original material licensed by the author under CC BY 4.0:
# https://creativecommons.org/licenses/by/4.0/
# Changes in this adaptation: Accumulates one Brownian path before applying the exact GBM solution.
# See the project ATTRIBUTION.md for the overall adaptation notice.

# Accumulates one Brownian path before applying the exact GBM solution.
import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)

# Simulate Geometric Brownian Motion (exact path solution along a single Brownian trajectory)
T_gbm = 10.0  # Longer time horizon to show exponential nature
N_gbm = 1000
dt_gbm = T_gbm / N_gbm
t_gbm = np.linspace(0, T_gbm, N_gbm + 1)
S0 = 100.0  # Initial stock price
mu, sigma = 0.15, 0.2

# Accumulate Brownian increments properly via cumsum
dW_gbm = np.sqrt(dt_gbm) * np.random.normal(0, 1, size=N_gbm)
W_gbm = np.concatenate([[0.0], np.cumsum(dW_gbm)])

S = S0 * np.exp((mu - 0.5 * sigma**2) * t_gbm + sigma * W_gbm)

plt.figure(figsize=(8, 4))
plt.plot(t_gbm, S, label=f"μ={mu}, σ={sigma}")
plt.title("Sample Path: Geometric Brownian Motion")
plt.xlabel("Time t")
plt.ylabel("S(t)")
plt.legend()
plt.grid(True)
plt.savefig("gbm_path.png", dpi=300, bbox_inches="tight")
plt.show()


# Adapted from "Introduction to Stochastic Calculus" by Ji-Ha Kim.
# https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/
# Original material licensed by the author under CC BY 4.0:
# https://creativecommons.org/licenses/by/4.0/
# Changes in this adaptation: Euler updates are exact at grid points for these additive constant coefficients.
# See the project ATTRIBUTION.md for the overall adaptation notice.

# Euler updates are exact at grid points for these additive constant coefficients.
import numpy as np
import matplotlib.pyplot as plt

# Simulate simple SDE: dX = mu dt + sigma dW
np.random.seed(42)
T = 1.0
N = 1000
dt = T / N
t = np.linspace(0, T, N + 1)
mu, sigma = 1.0, 0.5

X = np.zeros(N + 1)
for i in range(N):
    dW = np.sqrt(dt) * np.random.normal(0, 1)
    X[i + 1] = X[i] + mu * dt + sigma * dW

plt.plot(t, X, label=f"μ={mu}, σ={sigma}")
plt.title("Sample Path of dX = μ dt + σ dW")
plt.xlabel("Time t")
plt.ylabel("X(t)")
plt.legend()
plt.grid(True)
plt.show()


# Adapted from "Introduction to Stochastic Calculus" by Ji-Ha Kim.
# https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/
# Original material licensed by the author under CC BY 4.0:
# https://creativecommons.org/licenses/by/4.0/
# Changes in this adaptation: Brownian motion starts at zero on a time grid including zero.
# See the project ATTRIBUTION.md for the overall adaptation notice.

# Brownian motion starts at zero on a time grid including zero.
import numpy as np
import matplotlib.pyplot as plt

# Simulate Brownian motion
np.random.seed(42)
t = np.linspace(0, 1, 1000)  # Time from 0 to 1
dt = t[1] - t[0]
dW = np.sqrt(dt) * np.random.normal(0, 1, size=len(t) - 1)  # Increments
W = np.concatenate([[0], np.cumsum(dW)])  # Cumulative sum starts at 0

# Plot
plt.plot(t, W)
plt.title("Sample Brownian Motion Path")
plt.xlabel("Time t")
plt.ylabel("W(t)")
plt.grid(True)
plt.show()


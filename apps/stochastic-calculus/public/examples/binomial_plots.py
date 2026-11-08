# Adapted from "Introduction to Stochastic Calculus" by Ji-Ha Kim.
# https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/
# Original material licensed by the author under CC BY 4.0:
# https://creativecommons.org/licenses/by/4.0/
# Changes in this adaptation: Plots exact binomial probability masses at reachable positions.
# See the project ATTRIBUTION.md for the overall adaptation notice.

# Plots exact binomial probability masses at reachable positions.
import numpy as np
np.random.seed(2026)
import matplotlib.pyplot as plt
from scipy.stats import binom

n_values = [5, 10, 25, 50, 100]
p = 0.5

# Individual plots
for n in n_values:
    k = np.arange(0, n + 1)
    positions = 2 * k - n
    probs = binom.pmf(k, n, p)
    plt.figure(figsize=(6, 4))
    plt.bar(positions, probs, width=1.0, color='skyblue', edgecolor='black')
    plt.title(f'n = {n}')
    plt.xlabel('Position (# wins - # losses)')
    plt.ylabel('Probability')
    plt.ylim(0, max(probs) * 1.2)
    plt.savefig(f'random_walk_n_{n}.png', dpi=300, bbox_inches='tight')
    plt.close()

# Combined plot
fig, axes = plt.subplots(5, 1, figsize=(8, 12), sharex=True)
for i, n in enumerate(n_values):
    k = np.arange(0, n + 1)
    positions = 2 * k - n
    probs = binom.pmf(k, n, p)
    axes[i].bar(positions, probs, width=1.0, color='skyblue', edgecolor='black')
    axes[i].set_title(f'n = {n}')
    axes[i].set_ylabel('Probability')
    axes[i].set_ylim(0, max(probs) * 1.2)
axes[-1].set_xlabel('Position (# wins - # losses)')
plt.tight_layout()
plt.savefig('random_walk_combined.png', dpi=300, bbox_inches='tight')
plt.close()


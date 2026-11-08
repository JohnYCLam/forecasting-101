# Adapted from "Introduction to Stochastic Calculus" by Ji-Ha Kim.
# https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/
# Original material licensed by the author under CC BY 4.0:
# https://creativecommons.org/licenses/by/4.0/
# Changes in this adaptation: Initial Brownian samples match the plotted time. Random-walk histograms use lattice-aligned density bins, omit the singular t=0 density, and do not clip the peak.
# See the project ATTRIBUTION.md for the overall adaptation notice.

# Initial Brownian samples match the plotted time. Random-walk histograms use lattice-aligned density bins, omit the singular t=0 density, and do not clip the peak.
import numpy as np
np.random.seed(2026)
import matplotlib.pyplot as plt
from scipy.stats import norm
import imageio.v3 as imageio
import os

os.makedirs('gif_frames', exist_ok=True)

# 1. Continuous Brownian Motion with Sample Paths
t_values = np.linspace(0.1, 5, 50)
x = np.linspace(-5, 5, 100)

num_sample_paths = 5
dt_cont = t_values[1] - t_values[0]
sample_paths = np.zeros((num_sample_paths, len(t_values)))
increments = np.random.normal(0, np.sqrt(dt_cont), size=(num_sample_paths, len(t_values) - 1))
initial_w = np.random.normal(0, np.sqrt(t_values[0]), size=num_sample_paths)
sample_paths[:, 0] = initial_w
sample_paths[:, 1:] = initial_w[:, None] + np.cumsum(increments, axis=1)

frames = []
for i, t in enumerate(t_values):
    p = (1 / np.sqrt(2 * np.pi * t)) * np.exp(-x**2 / (2 * t))
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(x, p, 'b-', label=f't = {t:.2f}')
    plt.title('Brownian Motion Distribution')
    plt.xlabel('x')
    plt.ylabel('Density p(x,t)')
    plt.ylim(bottom=0)
    plt.legend()
    plt.grid(True)

    plt.subplot(1, 2, 2)
    for sp in sample_paths:
        plt.plot(t_values[:i + 1], sp[:i + 1], '-o', markersize=3)
    plt.title('Sample Brownian Paths')
    plt.xlabel('Time')
    plt.ylabel('Position')
    plt.xlim(0, 5)
    plt.grid(True)

    frame_path = f'gif_frames/continuous_t_{t:.2f}.png'
    plt.tight_layout()
    plt.savefig(frame_path)
    plt.close()
    frames.append(imageio.imread(frame_path))

imageio.imwrite('continuous_brownian.gif', frames, duration=100)

# 2. Discrete Random Walk with Sample Paths
def simulate_random_walk(dt, T, num_paths):
    """Simulate random walk paths with step size sqrt(dt)."""
    n_steps = int(T / dt)
    positions = np.zeros((num_paths, n_steps + 1))
    for i in range(num_paths):
        increments = np.random.choice([-1, 1], size=n_steps) * np.sqrt(dt)
        positions[i, 1:] = np.cumsum(increments)
    return positions

dt = 0.01
T = 5.0
num_paths = 10000
times = np.arange(0, T + dt, dt)
positions = simulate_random_walk(dt, T, num_paths)
sample_indices = np.arange(5)

frames = []
for i, t in enumerate(times):
    if i > 0 and i % 10 == 0:
        current_positions = positions[:, i]
        x_vals = np.linspace(-5, 5, 100)
        p_theoretical = norm.pdf(x_vals, 0, np.sqrt(t) if t > 0 else 1e-5)

        plt.figure(figsize=(12, 4))
        plt.subplot(1, 2, 1)
        lattice_spacing = 2 * np.sqrt(dt)
        edges = np.arange(current_positions.min() - lattice_spacing / 2, current_positions.max() + lattice_spacing, lattice_spacing)
        plt.hist(current_positions, bins=edges, density=True, alpha=0.6, label=f't = {t:.2f}')
        plt.plot(x_vals, p_theoretical, 'r-', label='N(0,t)')
        plt.title('Discrete Random Walk Distribution')
        plt.xlabel('Position')
        plt.ylabel('Density')
        plt.ylim(bottom=0)
        plt.legend()
        plt.grid(True)

        plt.subplot(1, 2, 2)
        for idx in sample_indices:
            plt.plot(times[:i + 1], positions[idx, :i + 1], '-o', markersize=3)
        plt.title('Sample Random Walk Paths')
        plt.xlabel('Time')
        plt.ylabel('Position')
        plt.xlim(0, T)
        plt.grid(True)

        frame_path = f'gif_frames/discrete_t_{t:.2f}.png'
        plt.tight_layout()
        plt.savefig(frame_path)
        plt.close()
        frames.append(imageio.imread(frame_path))

imageio.imwrite('discrete_random_walk.gif', frames, duration=100, loop=0)


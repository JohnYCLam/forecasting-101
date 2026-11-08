# Adapted from "Introduction to Stochastic Calculus" by Ji-Ha Kim.
# https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/
# Original material licensed by the author under CC BY 4.0:
# https://creativecommons.org/licenses/by/4.0/
# Changes in this adaptation: Initial Brownian sample has variance equal to the first positive plotted time. GIF durations are in milliseconds.
# See the project ATTRIBUTION.md for the overall adaptation notice.

# Initial Brownian sample has variance equal to the first positive plotted time. GIF durations are in milliseconds.
import numpy as np
np.random.seed(2026)
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from scipy.stats import norm
import imageio.v3 as imageio
import os

os.makedirs('gif_frames', exist_ok=True)

num_frames = 100
t_values = np.linspace(0.1, 5, num_frames)
x = np.linspace(-5, 5, 200)
num_sample_paths = 5

sample_paths = np.zeros((num_sample_paths, len(t_values)))
dt_cont = t_values[1] - t_values[0]
for i in range(num_sample_paths):
    increments = np.random.normal(0, np.sqrt(dt_cont), size=len(t_values) - 1)
    initial_w = np.random.normal(0, np.sqrt(t_values[0]))
    sample_paths[i, 0] = initial_w
    sample_paths[i, 1:] = initial_w + np.cumsum(increments)

frames = []
for i, t in enumerate(t_values):
    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_subplot(111, projection='3d')

    mask = t_values <= t
    T_sub, X_sub = np.meshgrid(t_values[mask], x)
    P_sub = (1 / np.sqrt(2 * np.pi * T_sub)) * np.exp(-X_sub**2 / (2 * T_sub))

    ax.plot_surface(X_sub, T_sub, P_sub, cmap='viridis', alpha=0.7, edgecolor='none')

    for sp in sample_paths:
        ax.plot(sp[:i + 1], t_values[:i + 1], np.zeros(i + 1), 'r-', marker='o', markersize=3)

    ax.set_xlabel('Position (x)')
    ax.set_ylabel('Time (t)')
    ax.set_zlabel('Density')
    ax.set_title(f'Continuous Brownian Motion at t = {t:.2f}')
    ax.view_init(elev=30, azim=-60)

    frame_path = f'gif_frames/continuous_3d_smooth_t_{t:.2f}.png'
    plt.savefig(frame_path)
    plt.close()
    frames.append(imageio.imread(frame_path))

imageio.imwrite('continuous_brownian_3d_smooth.gif', frames, duration=100, loop=0)


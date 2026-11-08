# Adapted from "Introduction to Stochastic Calculus" by Ji-Ha Kim.
# https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/
# Original material licensed by the author under CC BY 4.0:
# https://creativecommons.org/licenses/by/4.0/
# Changes in this adaptation: Normal curve is integrated over width-two bins to compare probability mass with mass. GIF durations are in milliseconds.
# See the project ATTRIBUTION.md for the overall adaptation notice.

# Normal curve is integrated over width-two bins to compare probability mass with mass. GIF durations are in milliseconds.
import numpy as np
np.random.seed(2026)
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import imageio.v3 as imageio
import os
from scipy.special import comb
from scipy.stats import norm

os.makedirs('gif_frames', exist_ok=True)

##############################################
# Part 1: Discrete Binomial Random Walk (N = 15)
##############################################
N = 15
num_sample_paths = 5

sample_paths = []
for i in range(num_sample_paths):
    steps = np.random.choice([-1, 1], size=N)
    path = np.concatenate(([0], np.cumsum(steps)))
    sample_paths.append(path)
sample_paths = np.array(sample_paths)

frames = []
for t_step in range(N + 1):
    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_subplot(111, projection='3d')

    for t in range(t_step + 1):
        x_values = np.arange(-t, t + 1, 2)
        if t == 0:
            p_values = np.array([1.0])
        else:
            k = (x_values + t) // 2
            p_values = comb(t, k) * (0.5 ** t)

        ax.scatter(x_values, [t] * len(x_values), p_values, color='blue', s=50)
        ax.plot(x_values, [t] * len(x_values), p_values, color='blue', alpha=0.5)

    for sp in sample_paths:
        ax.plot(
            sp[:t_step + 1],
            np.arange(t_step + 1),
            np.zeros(t_step + 1),
            'r-o',
            markersize=5,
            label='Sample Path' if t_step == 0 else ""
        )

    ax.set_xlabel('Position (x)')
    ax.set_ylabel('Time (steps)')
    ax.set_zlabel('Probability')
    ax.set_title(f'Discrete Binomial Random Walk: Step {t_step}')
    ax.set_zlim(0, 1.0)
    ax.view_init(elev=30, azim=-60)

    frame_path = f'gif_frames/discrete_binomial_{t_step:02d}.png'
    plt.savefig(frame_path)
    plt.close()
    frames.append(imageio.imread(frame_path))

durations = [250] * (len(frames) - 1) + [2000]
imageio.imwrite('discrete_binomial.gif', frames, duration=durations, loop=0)

##############################################
# Part 2: Discrete Random Walk Normalizing (N = 50)
##############################################
N = 50
num_sample_paths = 5

sample_paths = []
for i in range(num_sample_paths):
    steps = np.random.choice([-1, 1], size=N)
    path = np.concatenate(([0], np.cumsum(steps)))
    sample_paths.append(path)
sample_paths = np.array(sample_paths)

frames = []
for t_step in range(N + 1):
    fig = plt.figure(figsize=(10, 7))
    ax = fig.add_subplot(111, projection='3d')

    for t in range(t_step + 1):
        x_values = np.arange(-t, t + 1, 2)
        if t == 0:
            p_values = np.array([1.0])
        else:
            k = (x_values + t) // 2
            p_values = comb(t, k) * (0.5 ** t)

        ax.scatter(x_values, [t] * len(x_values), p_values, color='blue', s=50)
        ax.plot(x_values, [t] * len(x_values), p_values, color='blue', alpha=0.5)

        if t == t_step and t > 0:
            x_cont = np.linspace(-t, t, 200)
            normal_pdf = norm.cdf(x_cont + 1, 0, np.sqrt(t)) - norm.cdf(x_cont - 1, 0, np.sqrt(t))
            ax.plot(x_cont, [t] * len(x_cont), normal_pdf, 'r-', linewidth=2, label='Normal bin-mass approximation')

    for sp in sample_paths:
        ax.plot(
            sp[:t_step + 1],
            np.arange(t_step + 1),
            np.zeros(t_step + 1),
            'g-o',
            markersize=5,
            label='Sample Path' if t_step == 0 else ""
        )

    ax.set_xlabel('Position (x)')
    ax.set_ylabel('Time (steps)')
    ax.set_zlabel('Probability')
    ax.set_title(f'Discrete Binomial Random Walk at Step {t_step}')
    ax.set_zlim(0, 1.0)
    ax.view_init(elev=30, azim=-60)

    frame_path = f'gif_frames/discrete_binomial_{t_step:02d}.png'
    plt.savefig(frame_path)
    plt.close()
    frames.append(imageio.imread(frame_path))

durations = [250] * (len(frames) - 1) + [2000]
imageio.imwrite('discrete_binomial_normalizing.gif', frames, duration=durations, loop=0)


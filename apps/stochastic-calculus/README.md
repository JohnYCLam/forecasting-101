# Stochastic Calculus — interactive introduction

One Vite app containing the full teaching progression, 21 guided experiments, detailed derivations, applications, notation, companion code, primary references, and explicit source attribution. Plain JavaScript, CSS, and Canvas; no React or backend required.

Based on and adapted from **[Introduction to Stochastic Calculus by Ji-Ha Kim](https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/)**, licensed by the author under **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**. This project rewrites and reorganizes the explanations, expands or corrects derivations and example code, rebuilds illustrations as interactive experiments, and adds numerical and ML examples. See [ATTRIBUTION.md](ATTRIBUTION.md) for the source credit, license, and description of changes.

For a preview without installation or a running server, open `dist/preview.html` directly in your browser. It includes the math fonts, experiments and companion downloads.

## Run

Node.js 22.12+ is recommended. Vite also supports Node.js 20.19+, though KaTeX's optional command-line dependency can print an engine warning on Node 20; this app uses KaTeX's browser library.

```powershell
npm install
npm run dev
```

Open the localhost address printed by Vite. In this delivered workspace, dependencies are already installed.

On Windows, you can also double-click `Start app.cmd` to start Vite and open the app. Keep its terminal open while using the app; press Ctrl+C there to stop it.

## Build and preview

```powershell
npm test
npm run build
npm run preview
```

The main source files are:

- `src/chapters.js`: chapter order, titles, and descriptions; exported through `src/lesson.js`.
- `src/content/foundations.js`: introduction and coin walks.
- `src/content/continuous.js`: step-size scaling, finite drift, and Brownian motion.
- `src/content/ito.js`: finite increments, the multiplication table, the integral, and the Itô chain rule.
- `src/content/calculus.js`: reading SDEs, the transformation strategy, OU and GBM solutions, and Euler approximation.
- `src/content/technical-notes.js`: optional proofs and more technical background, kept in the reference chapter.
- `src/content/applications.js`: Stratonovich and the lambda-family, jumps, and correlated noise.
- `src/content/generative.js`: Section 8B, Fokker–Planck and score-based generation.
- `src/content/learning.js`: Section 8A, fitting dynamics and evaluating forecasts.
- `src/content/pricing.js`: Section 8C, Black–Scholes and Deep BSDE methods.
- `src/content/sampling.js`: Section 8D, parameter sampling and noisy optimization.
- `src/ou-comparison.js` and `src/content/sde-demos.js`: coupled exact OU/Euler comparison.
- `src/content/reference.js`: source attribution, key references, notation, and companion code.
- `src/content/sources.js`: Ji-Ha Kim attribution, CC BY 4.0 notice, and references mapped to related discussions.
- `src/content/helpers.js`: local KaTeX rendering before content is inserted into HTML.
- `src/demos.json`: the guided demo panels and their explanatory captions.
- `src/math.js`: pure seeded simulation routines.
- `src/predictive-ml.js` and `src/content/predictive-ml.js`: synthetic point-versus-stochastic forecasting experiment, fitted from shared observations and evaluated on 2,000 unseen futures. Open `#learning/learn-random-motion` for its introduction or `#learning/demo-prediction` for its controls.
- `src/switching-ml.js` and `src/content/switching-ml.js`: nonlinear two-valley experiment comparing shared learned drift with and without noise against a nonparametric probabilistic transition model. Open `#learning/learn-switching` for the explanation or `#learning/demo-switching` for the controls. Endpoint CRPS and target-reaching Brier scores use 2,000 independent source paths.
- `src/barrier-ml.js` and `src/content/barrier-ml.js`: infer continuous threshold crossings between sparse readings. Open `#learning/crossing-between-readings` or `#learning/demo-barrier`. A separate irregular-increment likelihood fit supplies drift and diffusion; 4,000 independent bridges supply test events. The discrete model with the same bridge correction intentionally reproduces the SDE calculation.
- `src/content/deep-bsde.js` and `src/bsde.js`: square-payoff derivation, neural network training and held-out evaluation.
- `src/main.js`: navigation, controls, and chart drawing.
- `src/style.css`: responsive reading and demo layouts.
- `src/coverage.json`: internal test index of destinations for the 54 source headings; not imported by the app.
- `public/examples/`: nine corrected Python/TikZ appendix downloads and Python requirements.

`dist/` is the compiled site for static hosting, generated from this same app. Serve it over HTTP rather than opening `index.html` directly with a file URL. Direct subsection links use routes such as `#ito/multiplication-table` or `#diffusion/reverse-sde`.

LaTeX equations are typeset with KaTeX, bundled with its fonts in the app. No accounts, analytics, external script or font downloads, AI calls, or backend services. All experiments run in the browser. External references load only if clicked. The app is not published to a hosting provider.

## Editorial scope

The original files are not edited. This app rewrites and corrects their teaching content, removes the repeated editorial prefix, and retains the original progression from discrete steps to stochastic calculus and applications. The sources page credits Ji-Ha Kim’s foundational post and lists four additional key works. The source-heading index is retained only for internal checks.

Section 0 introduces predictable motion, uncertain disturbances, and the reason to study coin-driven steps. It has no interactive demo or early shortcut button. The first experiment in Section 1 reveals actual coin tosses one at a time. The former opening demo now follows the additive-SDE derivation in Section 5 and starts at zero noise.

Sections 1–4 explain the notation and transitions before using them. The coin demo distinguishes replaying a fixed sequence from drawing a new one, and labels right as +1 and left as −1. The twelve-walk plot highlights one path in blue; darker overlaps are not a probability scale. The scaling experiment uses two fixed endpoint windows (−4 to 4 and −128 to 128), reports out-of-view endpoints, and keeps its path range fixed. Brownian roughness is introduced through its consequence for velocity and Taylor expansion. The weighted-squares discussion follows the Taylor term that needs it; formal background is retained in optional reference notes.

Core derivations are expanded in the main reading flow: finite increment rules, the multiplication table, the isometry, Taylor expansion, the square example, GBM, Fokker–Planck, and integral-convention conversion. The ML chapter includes general forward and reverse-time SDEs, the reverse-generator argument, learned scores, probability-flow transport, conditioning, likelihoods, neural SDEs, SGLD, and a worked Deep BSDE example with an in-browser trainer.

Section 3 derives the average squared-change total and leaves its concentration to Section 4. Section 4 calculates each accumulated product before introducing its differential shorthand, distinguishes `(dW)^2` from `d(W^2)`, and introduces weighted sums and integrals after the product rules. The finite square identity motivates the changing weight; the full differential of squared position follows the integral and chain rule.

Source article attribution and primary mathematical references are included in the app. This is an independent adaptation, not an official publication by the source author. All nine original Python/TikZ code appendices are restored as viewable and downloadable examples, with specific corrections noted in the app. Their Python syntax was checked; the full animation scripts were not all executed to render their outputs during this revision.

## Verification

The synthetic ML experiment uses linear regression for the shared conditional mean and learns Gaussian residual variance for the stochastic transition model. It samples the source SDE exactly and separates training paths from test paths. Its checks cover coefficient recovery, analytic multistep moments, held-out interval coverage and the zero-noise limit. The comparison isolates point and distribution forecasting; it is not a claim that neural SDEs universally outperform other probabilistic models.

The second ML experiment fits cubic drift and constant diffusion from double-well observations. Its empirical comparator resamples increments from the 64 nearest training states. It tests coefficient recovery, distribution scores, observation-grid first hits, held-out branching and numerical step refinement. Its source is numerically simulated, rather than exact. Finite observation intervals bias the local-coefficient estimates, and residuals can include drift approximation error even when source noise is zero. It does not guarantee that the SDE outperforms the empirical model.

The third experiment fixes two known endpoint readings and infers crossings in their gap. Nested observations reveal the same source bridges. Independent exact conditional maxima on the 1,024 drawing intervals supply continuous event labels, avoiding a biased fine-grid-only reference. Checks cover irregular-increment fitting, the reflection-principle formula, maxima, nested-grid bias, calibration grouping and source-law agreement across different drawing grids. The selected illustrative path is deliberately chosen to show a missed crossing; all benchmark paths enter scores. This establishes behavior under the stated synthetic path law, not that endpoint data identify the real between-observation law.

`npm test` checks formula rendering, source coverage destinations, introductory/demo ordering, the three scaling laws, histogram normalization and out-of-window accounting, exact finite-sum identities, binomial laws, seeded Gaussian moments, Brownian and OU moments, scalar drift conversion, fractional Gaussian covariance, Poisson jump rendering data, the analytic mixture score, and reverse-diffusion distribution recovery, and held-out Deep BSDE error against its analytic grid benchmark. A finite simulation illustrates a theorem; it does not establish the continuous-time result.

Section 5 follows one question: specify an SDE, solve a constant-coefficient case, learn the change-of-variables tool, apply it to OU and GBM, then test Euler–Maruyama against a coupled exact solution. Neuron firing is removed. Section 8 is split into 8A–8D, each with its own navigation entry, outline, and purpose. Old subsection and demo bookmarks redirect to their relocated content. The OU demo shows a chosen initial value returning toward zero; the Euler demo uses nested Brownian increments and exact weighted-integral coupling, with zero-drift and zero-noise checks.

## Local Appendix B

Review and revision notes have been exported to `research-local/APPENDIX_B_REVIEW_AND_REVISION.md`. The entire `research-local/` folder is ignored by Git and is outside Vite’s public assets and module imports. Appendix B is not part of the site navigation, application bundle, or offline lesson. The source article’s B.1–B.5 and C.1–C.4 companion examples remain available with author, source, license, and modification notices.

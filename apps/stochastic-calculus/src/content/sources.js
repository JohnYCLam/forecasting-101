import { prose, h, link } from './helpers.js';

export const sourceAttribution = () => prose`
${h('sources','Foundation of this lesson: attribution and license')}
<p>This interactive introduction is <strong>based on and adapted from <a href="https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/" target="_blank" rel="noopener noreferrer"><cite>Introduction to Stochastic Calculus</cite> by Ji-Ha Kim</a></strong>, published on Ji-Ha’s Blog on 22 February 2025 and updated on 16 March 2026. The author licenses the original post under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.</p>
<p>The post provides the foundation and much of the mathematical progression, from coin-driven walks through Brownian motion, Itô calculus, SDEs, and integral conventions. This project builds on that work as an interactive teaching adaptation.</p>
<p><strong>Changes made:</strong> explanations have been rewritten and reorganized; notation and assumptions have been clarified; derivations and example code have been expanded or corrected; illustrations have been rebuilt as interactive browser experiments; and new numerical and machine-learning examples have been added. These adaptation choices are the responsibility of this project’s maintainers. Attribution identifies the original source and does not imply the author’s endorsement.</p>
<p>The original material’s CC BY 4.0 notice is retained here and with the adapted companion examples. The other works below are cited for specific parts of this lesson; their own licenses and terms apply. This attribution does not assign the post’s license to third-party software.</p>
`;

const references = [
  {author:'Lawrence C. Evans',title:'An Introduction to Stochastic Differential Equations, version 1.2',url:'https://www.math.uh.edu/~sanders/Math3338/LawrenceEvans-SDE-course.pdf',chapter:'sde',section:'general-ito',use:'Brownian motion, stochastic integration, the Itô chain rule, and solving SDEs in Sections 4–6.'},
  {author:'Yang Song et al.',title:'Score-Based Generative Modeling through Stochastic Differential Equations (2021)',url:'https://arxiv.org/abs/2011.13456',chapter:'diffusion',section:'forward-sde',use:'Section 10’s forward and reverse SDEs, score matching, probability-flow ODE, conditioning, and density relationships.'},
  {author:'Jiequn Han, Arnulf Jentzen, and Weinan E',title:'Solving High-Dimensional Partial Differential Equations Using Deep Learning (2018)',url:'https://arxiv.org/abs/1707.02568',chapter:'pricing',section:'deep-bsde',use:'The Deep BSDE approach behind Section 11’s small square-payoff trainer and its connection to value equations.'},
  {author:'Max Welling and Yee Whye Teh',title:'Bayesian Learning via Stochastic Gradient Langevin Dynamics (2011)',url:'https://icml.cc/2011/papers/398_icmlpaper.pdf',chapter:'sampling',section:'langevin',use:'Section 12’s parameter-sampling update, stochastic gradients, and step-size qualifications.'},
];

export const lessonReferences = () => prose`
${h('further-reading','Key references')}
<p>Alongside Ji-Ha Kim’s foundational post credited above, these four works support the main mathematical and machine-learning discussions. Specialized sources are linked where their results are used.</p>
<ol class="source-list">${references.map(r=>`<li>${r.author}. <a href="${r.url}" target="_blank" rel="noopener noreferrer"><cite>${r.title}</cite></a>.<small>${r.use} ${link(r.chapter,r.section,'Related discussion ↗')}</small></li>`).join('')}</ol>
`;

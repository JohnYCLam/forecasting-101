import { prose, h, link } from './helpers.js';

export const sourceAttribution = () => prose`
${h('sources','Foundation of this lesson: attribution and license')}
<p>This interactive introduction is <strong>based on and adapted from <a href="https://jiha-kim.github.io/posts/introduction-to-stochastic-calculus/" target="_blank" rel="noopener noreferrer"><cite>Introduction to Stochastic Calculus</cite> by Ji-Ha Kim</a></strong>, published on Ji-Ha’s Blog on 22 February 2025 and updated on 16 March 2026. The author licenses the original post under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.</p>
<p>The post provides the foundation and much of the mathematical progression, from coin-driven walks through Brownian motion, Itô calculus, SDEs, and integral conventions. This project builds on that work as an interactive teaching adaptation.</p>
<p><strong>Changes made:</strong> explanations have been rewritten and reorganized; notation and assumptions have been clarified; derivations and example code have been expanded or corrected; illustrations have been rebuilt as interactive browser experiments; and new numerical comparisons have been added. These adaptation choices are the responsibility of this project’s maintainers. Attribution identifies the original source and does not imply the author’s endorsement.</p>
<p>The original material’s CC BY 4.0 notice is retained here and with the adapted companion examples. The other works below are cited for specific parts of this lesson; their own licenses and terms apply. This attribution does not assign the post’s license to third-party software.</p>
`;

const references = [
  {author:'Paul Bourgade',title:'Stochastic Analysis',url:'https://cims.nyu.edu/~bourgade/SA2010/StochasticAnalysis.pdf',chapter:'reference',section:'brownian-regularity',use:'Formal background for Brownian path regularity and the optional core calculus notes.'},
  {author:'Lawrence C. Evans',title:'An Introduction to Stochastic Differential Equations, version 1.2',url:'https://www.math.uh.edu/~sanders/Math3338/LawrenceEvans-SDE-course.pdf',chapter:'sde',section:'general-ito',use:'Brownian motion, stochastic integration, the Itô chain rule, and solving SDEs in Sections 4–7.'},
  {author:'Patrick Kidger and colleagues',title:'Neural SDEs as Infinite-Dimensional GANs',url:'https://arxiv.org/abs/2102.03657',chapter:'learning',section:'neural-sde',use:'Learning the drift and noise of a time series from trajectories, discussed after the four examples in Section 9.'},
];

export const lessonReferences = () => prose`
${h('further-reading','Key references')}
<p>Alongside Ji-Ha Kim’s foundational post credited above, these works cover Brownian motion, stochastic calculus, and learning dynamics from data. Specialized sources are linked where their results are used.</p>
<ol class="source-list">${references.map(r=>`<li>${r.author}. <a href="${r.url}" target="_blank" rel="noopener noreferrer"><cite>${r.title}</cite></a>.<small>${r.use} ${link(r.chapter,r.section,'Related discussion ↗')}</small></li>`).join('')}</ol>
`;

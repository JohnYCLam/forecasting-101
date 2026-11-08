import demos from './demos.json' with { type: 'json' };
import { typeset } from './content/helpers.js';
import { introduction, randomWalk } from './content/foundations.js';
import { scaling, brownian } from './content/continuous.js';
import { sdes } from './content/calculus.js';
import { ito } from './content/ito.js';
import { stratonovich, beyond } from './content/applications.js';
import { learnedDynamics } from './content/learning.js';
import { generativeModels } from './content/generative.js';
import { payoffLearning } from './content/pricing.js';
import { parameterSampling } from './content/sampling.js';
import { reference } from './content/reference.js';

const definitions = [
  {id:'intro', number:'00', label:'The big picture', title:'A little noise. A different calculus.', deck:'', content:introduction},
  {id:'walk', number:'01', label:'Coin flips and random walks', title:'One toss.<br>One uncertain step.', deck:'Build a path first. Then count all the routes it could have taken.', content:()=>randomWalk(demos)},
  {id:'scaling', number:'02', label:'From steps to continuous limits', title:'Why the square root<br>of time matters.', deck:'Shrink the steps while keeping the accumulated randomness finite.', content:()=>scaling(demos)},
  {id:'brownian', number:'03', label:'Brownian motion', title:'Unpredictable paths.<br>Predictable distributions.', deck:'Follow the limiting random walk, then see why ordinary velocity no longer works.', content:()=>brownian(demos)},
  {id:'ito', number:'04', label:'Itô calculus and its derivation', title:'The squares<br>that refuse to vanish.', deck:'Derive the product rules, build the integral, and obtain the chain rule from finite steps.', content:()=>ito(demos)},
  {id:'sde', number:'05', label:'Reading and solving SDEs', title:'Write the rule.<br>Find the evolution.', deck:'Read an SDE, use changes of variables to solve it, then check a numerical approximation.', content:()=>sdes(demos)},
  {id:'stratonovich', number:'06', label:'Stratonovich and the λ-family', title:'Change the convention.<br>Keep track of the model.', deck:'Derive the midpoint rule, convert the drift, and see where these choices matter.', content:()=>stratonovich(demos)},
  {id:'beyond', number:'07', label:'Jumps, memory, and beyond', title:'When the noise<br>needs a different model.', deck:'Explore what changes when continuity or independent increments no longer fits.', content:()=>beyond(demos)},
  {id:'learning', number:'08A', label:'ML: learn random dynamics', title:'Observe the motion.<br>Learn its law.', deck:'Fit models from trajectories, then test their predictions of spread, switching, and hidden crossings.', content:learnedDynamics},
  {id:'diffusion', number:'08B', label:'ML: distributions and generation', title:'Follow a distribution.<br>Generate new samples.', deck:'Derive Fokker–Planck, learn what a score describes, and compare reverse SDE and ODE samplers.', content:()=>generativeModels(demos)},
  {id:'pricing', number:'08C', label:'ML: payoffs and equation solving', title:'Specify a future payoff.<br>Learn its value today.', deck:'Connect Black–Scholes to value equations, then train a Deep BSDE model on a checkable example.', content:()=>payoffLearning(demos)},
  {id:'sampling', number:'08D', label:'ML: sampling and optimization', title:'Move the parameters.<br>Explore a distribution.', deck:'Distinguish Bayesian parameter sampling from process noise, generation, and noisy optimization.', content:parameterSampling},
  {id:'reference', number:'A', label:'Sources, notation, and code', title:'Credit the foundation.<br>Follow the references.', deck:'Source attribution, licensing, references used in this lesson, notation, and companion code.', content:reference},
];

export const chapters=definitions.map(({content,...chapter})=>({...chapter,html:()=>typeset(content())}));

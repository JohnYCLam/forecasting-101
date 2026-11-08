import demos from './demos.json' with { type: 'json' };
import { typeset } from './content/helpers.js';
import { introduction, randomWalk } from './content/foundations.js';
import { scaling, brownian } from './content/continuous.js';
import { sdes } from './content/calculus.js';
import { ito } from './content/ito.js';
import { reference } from './content/reference.js';

const definitions = [
  {id:'intro', number:'1', label:'The big picture', title:'A little noise. A different calculus.', deck:'', content:introduction},
  {id:'walk', number:'2', label:'Coin flips and random walks', title:'One toss.<br>One uncertain step.', deck:'Build a path first. Then count all the routes it could have taken.', content:()=>randomWalk(demos)},
  {id:'scaling', number:'3', label:'From steps to continuous limits', title:'Why the square root<br>of time matters.', deck:'Shrink the steps while keeping the accumulated randomness finite.', content:()=>scaling(demos)},
  {id:'brownian', number:'4', label:'Brownian motion', title:'Unpredictable paths.<br>Predictable distributions.', deck:'Follow the limiting random walk, then see why ordinary velocity no longer works.', content:()=>brownian(demos)},
  {id:'ito', number:'5', label:'Itô calculus and its derivation', title:'The squares<br>that refuse to vanish.', deck:'Derive the product rules, build the integral, and obtain the chain rule from finite steps.', content:()=>ito(demos)},
  {id:'sde', number:'6', label:'Reading and solving SDEs', title:'Write the rule.<br>Find the evolution.', deck:'Read an SDE, use changes of variables to solve it, then check a numerical approximation.', content:()=>sdes(demos)},
  {id:'reference', number:'A', label:'Sources, notation, and code', title:'Credit the foundation.<br>Follow the references.', deck:'Source attribution, licensing, references used in this lesson, notation, and companion code.', content:reference},
];

export const chapters=definitions.map(({content,...chapter})=>({...chapter,html:()=>typeset(content())}));

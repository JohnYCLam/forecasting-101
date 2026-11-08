import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const SUBSCRIPT_MAP = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  'ₜ': 't', 'ₕ': 'h', '₋': '-', '₊': '+'
};

const convertUnicodeSubscripts = (text) => {
  let result = '';
  for (let index = 0; index < text.length; index += 1) {
    const mapped = SUBSCRIPT_MAP[text[index]];
    if (mapped === undefined) {
      result += text[index];
      continue;
    }

    let subscript = mapped;
    while (index + 1 < text.length && SUBSCRIPT_MAP[text[index + 1]] !== undefined) {
      index += 1;
      subscript += SUBSCRIPT_MAP[text[index]];
    }
    result += `_{${subscript}}`;
  }
  return result;
};

const textToTex = (value) => {
  let text = String(value)
    .replace(/\\/g, '\\backslash ')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/%/g, '\\%')
    .replace(/√\[([^\]]+)\]/g, '\\sqrt{$1}')
    .replace(/σ̄/g, '\\bar{\\sigma}')
    .replace(/ŷ/g, '\\hat{y}');

  text = convertUnicodeSubscripts(text);

  return text
    .replace(/²/g, '^{2}')
    .replace(/ᵟ/g, '^{\\delta}')
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/γ/g, '\\gamma ')
    .replace(/δ/g, '\\delta ')
    .replace(/θ/g, '\\theta ')
    .replace(/μ/g, '\\mu ')
    .replace(/σ/g, '\\sigma ')
    .replace(/ε/g, '\\varepsilon ')
    .replace(/ℱ/g, '\\mathcal{F}')
    .replace(/Σ/g, '\\sum ')
    .replace(/×/g, '\\times ')
    .replace(/−/g, '-')
    .replace(/≈/g, '\\approx ')
    .replace(/∈/g, '\\in ')
    .replace(/…/g, '\\ldots ')
    .replace(/\bUpper\b/g, '\\mathrm{Upper}')
    .replace(/\bLower\b/g, '\\mathrm{Lower}');
};

const childrenToTex = (children) => React.Children.toArray(children).map((child) => {
  if (typeof child === 'string' || typeof child === 'number') {
    return textToTex(child);
  }
  if (!React.isValidElement(child)) return '';

  if (child.type === 'sub') return `_{${childrenToTex(child.props.children)}}`;
  if (child.type === 'sup') return `^{${childrenToTex(child.props.children)}}`;
  if (child.type === MathOperator) return `\\operatorname{${childrenToTex(child.props.children)}}`;
  return childrenToTex(child.props.children);
}).join('');

const RenderedMath = ({ tex, displayMode = false }) => {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    strict: 'ignore',
    displayMode,
    output: 'html'
  });
  const Tag = displayMode ? 'div' : 'span';
  return <Tag className="inline-math" dangerouslySetInnerHTML={{ __html: html }} />;
};

export const MathText = ({ children, tex, displayMode }) => (
  <RenderedMath tex={tex ?? childrenToTex(children)} displayMode={displayMode} />
);

export const MathOperator = ({ children }) => children;

export const ModelOrder = ({ name, children }) => (
  <RenderedMath tex={`\\operatorname{${name}}\\!\\left(${childrenToTex(children)}\\right)`} />
);

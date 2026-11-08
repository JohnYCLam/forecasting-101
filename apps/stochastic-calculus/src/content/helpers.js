import katex from 'katex';

export const prose = (strings, ...values) => `<div class="story">${String.raw(strings, ...values)}</div>`;
export const h = (id, title) => `<h2 data-section="${id}" tabindex="-1">${title}</h2>`;
export const check = (question, answer) => `<section class="check"><h3>Pause for a prediction</h3><p>${question}</p><details><summary>See the reasoning</summary><p>${answer}</p></details></section>`;
export const link = (chapter, section, text) => `<a href="#${chapter}${section ? '/'+section : ''}">${text}</a>`;
export const note = text => `<div class="insight">${text}</div>`;
export function typeset(source) {
  // Render math before assigning HTML, so a LaTeX inequality cannot become a tag.
  return source.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g, (_, display, inline) => {
    const tex = (display ?? inline).replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
    const rendered = katex.renderToString(tex, { displayMode: display !== undefined, throwOnError: true, output: 'htmlAndMathml' });
    return display === undefined ? rendered : `<div class="equation">${rendered}</div>`;
  });
}

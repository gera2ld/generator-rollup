<% if (features.includes('jsxDom')) { -%>
import * as React from '@gera2ld/jsx-dom';
<% } -%>
import css from './style.css';

<% if (features.includes('jsxDom')) { -%>
export const element = (
  <>
    <h1>hello</h1>
    <style>{css}</style>
  </>
);
<% } else { -%>
export const element = createElement(
  'div',
  null,
  createElement('h1', { textContent: 'hello' }),
  createElement('style', {
    textContent: css,
  }),
);

function createElement(tagName, props, ...children) {
  const el = document.createElement(tagName);
  if (props) {
    Object.keys(props).forEach((key) => { el[key] = props[key]; });
  }
  if (children.length) el.append(...children);
  return el;
}
<% } -%>

export function add(a, b) {
  return a + b;
}

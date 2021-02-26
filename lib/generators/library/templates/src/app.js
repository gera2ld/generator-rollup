<% if (jsx) { -%>
import * as React from '@gera2ld/jsx-dom';
<% } -%>
<% if (css) { -%>
import css from './style.css';
<% } -%>
<% if (jsx || css) { -%>

<% } -%>
<% if (jsx) { -%>
export const element = (
  <>
    <h1>hello</h1>
<% if (css) { -%>
    <style>{css}</style>
<% } -%>
  </>
);
<% } else { -%>
export const element = createElement(
  'div',
  null,
  createElement('h1', { textContent: 'hello' }),
<% if (css) { -%>
  createElement('style', {
    textContent: css,
  }),
<% } -%>
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

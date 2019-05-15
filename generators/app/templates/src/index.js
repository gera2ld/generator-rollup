<% if (jsx) { -%>
import React from '@gera2ld/jsx-dom';
<% } -%>
<% if (css) { -%>
import { css } from './style.css';
<% } -%>

<% if (jsx) { -%>
document.body.append((
  <>
    <h1>hello</h1>
<% if (css) { -%>
    <style>{css}</style>
<% } -%>
  </>
));
<% } else { -%>
document.body.append(
  createElement('h1', { textContent: 'hello' }),
<% if (css) { -%>
  createElement('style', {
    textContent: css,
  }),
<% } -%>
);
<% } -%>
<% if (!jsx) { -%>

function createElement(tagName, props) {
  const el = document.createElement(tagName);
  if (props) {
    Object.keys(props).forEach((key) => { el[key] = props[key]; });
  }
  return el;
}
<% } -%>

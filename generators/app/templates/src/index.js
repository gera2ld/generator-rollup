<% if (jsx) { -%>
import h from '@gera2ld/jsx-dom';
<% } -%>
<% if (css) { -%>
import { css } from './style.css';
<% } -%>

<% if (jsx) { -%>
document.body.append(<h1>hello</h1>);
<% if (css) { -%>
document.head.append(<style>{css}</style>);
<% } -%>
<% } else { -%>
document.body.prepend(createElement('h1', { textContent: 'hello' }));
<% if (css) { -%>
document.head.append(createElement('style', {
  textContent: css,
}));
<% } -%>

function createElement(tagName, props) {
  const el = document.createElement(tagName);
  if (props) {
    Object.keys(props).forEach(key => { el[key] = props[key]; });
  }
  return el;
}
<% } -%>

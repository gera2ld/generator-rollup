import { css } from './style.css';

document.head.append(createElement('style', {
  textContent: css,
}));
document.body.prepend(createElement('h1', { textContent: 'hello' }));

function createElement(tagName, props) {
  const el = document.createElement(tagName);
  if (props) {
    Object.keys(props).forEach(key => { el[key] = props[key]; });
  }
  return el;
}

document.head.append(createElement('style', {
  textContent: process.env.CSS,
}));
document.body.prepend(createElement('h1', { textContent: 'hello' }));

function createElement(tagName, props) {
  const el = document.createElement(tagName);
  if (props) {
    Object.keys(props).forEach(key => { el[key] = props[key]; });
  }
  return el;
}

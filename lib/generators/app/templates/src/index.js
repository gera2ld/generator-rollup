import './style.css';

function hello() {
  const { body } = document;
  const div = document.createElement('div');
  div.className = 'container mx-auto p-4';
  div.innerHTML = '<div class="bg-orange-200 p-4"><div class="bg-orange-400 p-4">hello, world</div></div>';
  body.appendChild(div);
}

hello();

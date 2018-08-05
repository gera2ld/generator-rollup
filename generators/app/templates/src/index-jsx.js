import h from '@gera2ld/jsx-dom';
<% if (css) { -%>
import { css } from './style.css';
<% } -%>

document.body.append(<h1>hello</h1>);
<% if (css) { -%>
document.head.append(<style>{css}</style>);
<% } -%>

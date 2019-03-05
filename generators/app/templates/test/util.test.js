import test from 'tape';
import { add } from '#/util';

test('src/util', t => {
  t.test('ok', q => {
    q.equal(add(1, 2), 3);
    q.end();
  });
});

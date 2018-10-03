import test from 'tape';

test('src/index', t => {
  t.test('ok', q => {
    q.ok(true);
    q.end();
  });
});

const ol = require('../src/ol').ol;

test('testset magic-square-3x3', () => {
  const magicSquare = require('../src/magic-square/magic-square-3x3');
  const res = magicSquare();
  expect(res.length).toBe(4);
});
const ol = require('../src/algorithms/ol').ol;

test('testset magic-square-3x3', () => {
  const magicSquare = require('../src/algorithms/magic-square/magic-square-3x3');
  const res = magicSquare();
  expect(res.length).toBe(4);
});

test('testset magic-square-4x4', () => {
  const magicSquare = require('../src/algorithms/magic-square/magic-square-4x4');
  ol.range(1).forEach(() => {
    expect(magicSquare().length).toBe(880);
  })
});

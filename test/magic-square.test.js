test('magic-square-3x3', () => {
  const solver = require('../src/magic-square/magic-square').magic3x3Solver;
  expect(solver().length).toBe(8);
});

test('magic-square-4x4', () => {
  const solver = require('../src/magic-square/magic-square').magic4x4Solver1;
  expect(solver().length).toBe(880);
});


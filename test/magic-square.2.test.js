test('testset magic-square-3x3', () => {
  const magic3x3Solver = require('../src/magic-square/magic-square-4x4').magic3x3Solver;
  expect(magic3x3Solver().length).toBe(4);
});
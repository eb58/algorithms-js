test('testset magic-square-3x3', () => {
  const magic3x3Solver = require('../src/magic-square/magic-square').magic3x3Solver;
  expect(magic3x3Solver().length).toBe(4);
});

test('testset magic-square-4x4', () => {
  const magic4x4Solver = require('../src/magic-square/magic-square').magic4x4Solver;
  expect(magic4x4Solver().length).toBe(880); 
});


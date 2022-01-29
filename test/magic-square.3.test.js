test('testset magic-square-4x4', () => {
  const magic4x4Solver = require('../src/magic-square/magic-square-4x4').magic4x4Solver;
  expect(magic4x4Solver().length).toBe(880); 
});


const ms       = require('../src/magic-square/magic-square')
const msSimple = require('../src/magic-square/magic-square-simple')
test('magic-square-3x3-simple', () => {
  const solver = msSimple.magicSquare3x3;
  expect(solver([1,2,3,4,5,6,7,8,9]).length).toBe(8);
});

// xtest('magic-square-4x4-simple', () => { // working, but very slow!!
//   const solver = msSimple.magicSquare4x4
//   expect(solver([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]).length).toBe(880);
// });

test('magic-square-3x3', () => {
  const solver = ms.magic3x3Solver;
  expect(solver().length).toBe(8);
});

test('magic-square-4x4 1', () => {
  const solver = ms.magic4x4Solver1;
  expect(solver().length).toBe(880);
});

// xtest('magic-square-4x4 2', () => { // not working yet
//   const solver = ms.magic4x4Solver2;
//   expect(solver().length).toBe(880);
// });

const ol = require('../src/ol').ol;

test('testset magic-square-4x4', () => {
  const magicSquare = require('../src/magic-square/magic-square-4x4BS');
  expect(magicSquare().length).toBe(880); 
});


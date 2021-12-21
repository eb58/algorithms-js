const ol = require('../src/ol').ol;

test('testset magic-square-4x4', () => {
  const magicSquare = require('../src/magic-square/magic-square-4x4');
  ol.range(1).forEach(() => {
    expect(magicSquare().length).toBe(880); 
  })
});


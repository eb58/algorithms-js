const magicSquare = require('../src/algorithms/magic-square-1');

test('testset magic-square-1 4x4', () => {
    const res = magicSquare(4);
    expect(res.length).toEqual(880*2);
});


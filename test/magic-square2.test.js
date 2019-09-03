const magicSquare = require('../src/algorithms/magic-square');

test('testset magic-square2 mit dim 3', () => {
    const res = magicSquare.magicSquare(3);
    expect(res.length).toEqual(8);
});

test('testset magic-square2 mit dim 4', () => {
    const res = magicSquare.magicSquare(4);
    expect(res.length).toEqual(7040);
});


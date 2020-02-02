/* global expect */

test('testset magic-square-3x3', () => {
    const magicSquare = require('../src/algorithms/magic-square/magic-square-3x3');
    const res = magicSquare();
    expect(res.length).toEqual(8);
});

test('testset magic-square-4x4', () => {
    const magicSquare = require('../src/algorithms/magic-square/magic-square-4x4');
    const res = magicSquare();
    expect(res.length).toEqual(7040);
});

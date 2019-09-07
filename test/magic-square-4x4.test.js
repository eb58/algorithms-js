
test('testset magic-square-1 4x4', () => {
    const magicSquare = require('../src/algorithms/magic-square-1');
    const res = magicSquare(4);
    expect(res.length).toEqual(880*2);
});


test('testset magic-square-3 4x4', () => {
    const magicSquare = require('../src/algorithms/magic-square-3');
    const res = magicSquare(4);
    expect(res.length).toEqual(880*2);
});

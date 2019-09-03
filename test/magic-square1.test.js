const magicSquare = require('../src/algorithms/magic-square');

test('testset magic-square ', () => {
    const res = magicSquare.magicSquare3x3( [1,2,3,4,5,6,7,8,9] )
    expect(res.length).toEqual(8);
});

test('testset magic-square-2 perm', () => {
    const magicSquare = require('../src/magic-square/magic-square-2');
    const res = magicSquare.magicSquare3x3( [1,2,3,4,5,6,7,8,9] )
    expect(res.length).toEqual(8);
});


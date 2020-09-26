test('testset magic-square-2 perm', () => {
    const magicSquare = require('../src/algorithms/magic-square/magic-square-2');
    const res = magicSquare.magicSquare3x3( [1,2,3,4,5,6,7,8,9] )
    expect(res.length).toEqual(8);
});

///// 

test('testset magic-square-1 3x3', () => {
    const magicSquare = require('../src/algorithms/magic-square/magic-square-1');
    const res = magicSquare(3);
    expect(res.length).toEqual(4);
});

xtest('testset magic-square-1 4x4', () => {
    const magicSquare = require('../src/algorithms/magic-square/magic-square-1');
    const res = magicSquare(4);
    expect(res.length).toEqual(880*2);
});

xtest('testset magic-square-1 5x5', () => {
    const magicSquare = require('../src/algorithms/magic-square/magic-square-1');
    // expect( magicSquare(5).length).toEqual(880*2);
});


test('testset magic-square perm', () => {
    const magicSquare = require('../src/algorithms/magic-square-2');
    const res = magicSquare.magicSquare3x3( [1,2,3,4,5,6,7,8,9] )
    expect(res.length).toEqual(8);
});

///// 

test('testset magic-square-1 3x3', () => {
    const magicSquare = require('../src/algorithms/magic-square-1');
    debugger;
    const res = magicSquare(3);
    expect(res.length).toEqual(4);
});

test('testset magic-square-1 4x4', () => {
    const magicSquare = require('../src/algorithms/magic-square-1');
    debugger;
    const res = magicSquare(4);
    expect(res.length).toEqual(880*2);
});

test('testset magic-square-1 5x5', () => {
    const magicSquare = require('../src/algorithms/magic-square-1');
    // expect( magicSquare(5).length).toEqual(880*2);
});


///// 
test('testset magic-square-3 4x4', () => {
    const magicSquare = require('../src/algorithms/magic-square-3');
    debugger;
    const res = magicSquare(4);
    expect(res.length).toEqual(4);
});



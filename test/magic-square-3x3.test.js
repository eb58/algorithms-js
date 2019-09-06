const magicSquare = require('../src/algorithms/magic-square-1');

test('testset magic-square-1 3x3 ', () => {
    debugger;
    const res = magicSquare(3);
    expect(res.length).toEqual(4);
});


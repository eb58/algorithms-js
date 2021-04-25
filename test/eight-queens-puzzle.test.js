const solve = require('../src/eight-queens-puzzle');

test('eight-queens-puzzle', () => {
    expect(solve().length).toEqual(92);
});

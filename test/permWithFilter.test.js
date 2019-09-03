const _ = require('underscore');
const permWithFilter = require('../src/algorithms/permWithFilter');
const fac = require('../src/algorithms/fac');


test('testset permWithFilter', () => {
    const perm = permWithFilter( ()=> true);
    const res = JSON.stringify(perm("ABC".split('')).map(x => x.join('')).sort());
    const expected = JSON.stringify(["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"]);
    expect(res).toEqual(expected);
});

test('testset sort with permWithFilter', () => {
    const sortFilter = x => x.reduce( (acc,elem,idx) => idx === 0 ? true : x[idx-1] < x[idx] );
    const permSorter = permWithFilter( sortFilter );
    const res = permSorter([2,4,5,1,3]);
    const expected = [[1,2,3,4,5]];
    expect(res).toEqual(expected);
});

test('testset magic quad  with permWithFilter', () => {
    const magicFilter = x => x.reduce( (acc,elem,idx) => idx === 0 ? true : x[idx-1] < x[idx] );
    const permSorter = permWithFilter( magicFilter );
    const res = permSorter([2,4,5,1,3]);
    const expected = [[1,2,3,4,5]];
    expect(res).toEqual(expected);
});

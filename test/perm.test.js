const range = require('../src/ol').ol.range;
const fac = require('../src/ol').ol.fac;
const perm = require('../src/perm');

const perms = Object.keys(perm).filter(name => name !== 'permWithFilter').map(k => perm[k]);
const permWithFilter = perm.permWithFilter;

perms.forEach(perm => test('testset1 ' + perm.name, () => {
  const res = JSON.stringify(perm("ABC".split('')).map(x => x.join('')).sort());
  const expected = JSON.stringify(["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"]);
  expect(res).toEqual(expected);
}));

perms.forEach(perm => test('testset2 ' + perm.name, () => {
  const res = JSON.stringify(perm("ABB".split('')).map(x => x.join('')).sort());
  const expected = JSON.stringify(["ABB", "ABB", "BAB", "BAB", "BBA", "BBA"]);
  expect(res).toEqual(expected);
}));

perms.forEach(perm => test('testset3 ' + perm.name, () => {
  expect(perm(range(1)).length).toEqual(fac(1));
  expect(perm(range(2)).length).toEqual(fac(2));
  expect(perm(range(3)).length).toEqual(fac(3));
}));

perms.forEach(perm => test('testset4 ' + perm.name, () =>
  expect(perm(range(9)).length).toEqual(fac(9))
));

test('testset permWithFilter', () => {
  const perm = permWithFilter(() => true);
  const res = JSON.stringify(perm("ABC".split('')).map(x => x.join('')).sort());
  const expected = JSON.stringify(["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"]);
  expect(res).toEqual(expected);
});

test('testset sort with permWithFilter', () => {
  const sortFilter = x => x.reduce((acc, elem, idx) => idx === 0 ? true : x[idx - 1] < x[idx]);
  const permSorter = permWithFilter(sortFilter);
  const res = permSorter([2, 4, 5, 1, 3]);
  const expected = [[1, 2, 3, 4, 5]];
  expect(res).toEqual(expected);
});

test('testset magic quad  with permWithFilter', () => {
  const magicFilter = x => x.reduce((acc, elem, idx) => idx === 0 ? true : x[idx - 1] < x[idx]);
  const permSorter = permWithFilter(magicFilter);
  const res = permSorter([2, 4, 5, 1, 3]);
  const expected = [[1, 2, 3, 4, 5]];
  expect(res).toEqual(expected);
});

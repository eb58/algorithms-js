const { range, fac } = require('../src/ol').ol;
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
  const sortFilter = x => x.length < 2 || x[x.length - 2] < x[x.length - 1];
  const permSorter = permWithFilter(sortFilter);
  const res = permSorter([2, 4, 5, 1, 3]);
  const expected = [[1, 2, 3, 4, 5]];
  expect(res).toEqual(expected);
});

test('empty input', () => {
  perms.forEach((perm) => expect(perm([])).toEqual([[]]));
  expect(permWithFilter(() => true)([])).toEqual([[]]);
});

perms.forEach(perm => test('all permutations of 0..8 elements ' + perm.name, () => {
  const sorted = xs => [...xs].sort((a, b) => a - b);
  for (let n = 0; n <= 8; n++) {
    const xs = range(n);
    const res = perm([...xs]);
    expect(res.length).toBe(fac(n));
    expect(new Set(res.map(p => p.join())).size).toBe(fac(n));
    expect(res.every(p => JSON.stringify(sorted(p)) === JSON.stringify(xs))).toBe(true);
  }
}));

perms.forEach(perm => test('small cases ' + perm.name, () => {
  const byKey = ps => ps.map(p => p.join('')).sort();
  expect(perm([])).toEqual([[]]);
  expect(perm([7])).toEqual([[7]]);
  expect(byKey(perm([1, 2]))).toEqual(['12', '21']);
  expect(byKey(perm([1, 2, 3, 4]))).toEqual([
    '1234', '1243', '1324', '1342', '1423', '1432', '2134', '2143', '2314', '2341', '2413', '2431',
    '3124', '3142', '3214', '3241', '3412', '3421', '4123', '4132', '4213', '4231', '4312', '4321',
  ]);
}));

perms.forEach(perm => test('input stays untouched ' + perm.name, () => {
  for (let n = 0; n <= 7; n++) {
    const xs = range(n).map(i => i * 10);
    const copy = [...xs];
    perm(xs);
    expect(xs).toEqual(copy);
  }
}));

perms.forEach(perm => test('result does not share arrays with the input ' + perm.name, () => {
  for (const xs of [[], [5]]) {
    const res = perm(xs);
    expect(res[0]).not.toBe(xs);
    res[0].push(99);
    expect(xs).toEqual(xs.length ? [5] : []);
  }
}));

test('perm.js does not extend Array.prototype', () => {
  const keys = [];
  for (const key in [1, 2]) keys.push(key);
  expect(keys).toEqual(['0', '1']);
  expect([].without).toBeUndefined();
  expect([].withoutIndex).toBeUndefined();
});

test('permWithFilter: pruning gives the same result as filtering all permutations', () => {
  // 3x3 square: every row sums up to 15; a row is checked as soon as it is complete
  const rowsSum15 = x => [0, 3, 6].every(r => x[r] + x[r + 1] + x[r + 2] === 15);
  const rowFilter = x => x.length % 3 !== 0 || x[x.length - 3] + x[x.length - 2] + x[x.length - 1] === 15;
  const numbers = range(9).map(i => i + 1);
  const byKey = ps => ps.map(p => p.join('')).sort();
  const expected = perm.permFast(numbers).filter(rowsSum15);
  const res = permWithFilter(rowFilter)(numbers);
  expect(expected.length).toBeGreaterThan(0);
  expect(byKey(res)).toEqual(byKey(expected));
});

test('permWithFilter: a rejected prefix is never extended', () => {
  const calls = [];
  const res = permWithFilter(x => (calls.push(x.length), x[x.length - 2] < x[x.length - 1]))([2, 4, 5, 1, 3]);
  expect(res).toEqual([[1, 2, 3, 4, 5]]);
  expect(Math.min(...calls)).toBe(2); // single elements are not filtered
  expect(calls.length).toBeLessThan(320); // 20 + 60 + 120 + 120 prefixes without pruning
});

test('permCached maps the cached index permutations onto any elements', () => {
  const byKey = ps => ps.map(p => p.join('')).sort();
  expect(byKey(perm.permCached(['a', 'b', 'c']))).toEqual(['abc', 'acb', 'bac', 'bca', 'cab', 'cba']);
  expect(byKey(perm.permCached([1, 2, 3]))).toEqual(['123', '132', '213', '231', '312', '321']);
  expect(byKey(perm.permCached(['x', 'x', 'y']))).toEqual(['xxy', 'xxy', 'xyx', 'xyx', 'yxx', 'yxx']);
});

test('permCached: changing a result does not leak into later calls', () => {
  const first = perm.permCached([1, 2, 3]);
  first.forEach(p => p.fill(0));
  first.length = 0;
  const second = perm.permCached([1, 2, 3]);
  expect(second.length).toBe(6);
  expect(second.every(p => [...p].sort().join('') === '123')).toBe(true);
});

test('permCached works above and below the cached length limit', () => {
  for (const n of [8, 9]) {
    const xs = range(n).map(i => i + 100);
    const res = perm.permCached(xs);
    expect(res.length).toBe(fac(n));
    expect(res.every(p => p.every(v => xs.includes(v)))).toBe(true);
    expect(xs).toEqual(range(n).map(i => i + 100));
  }
});

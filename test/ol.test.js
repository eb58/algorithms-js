const { ol, num, interval, array } = require('../src/ol');
const {
  id,
  sqr,
  abs,
  cube,
  fac,
  fib,
  range,
  reshape,
  rangeFilled,
  randomArray,
  randomInRange,
  randomIntArray,
  randomIntInRange,
  cmp,
  isLeapYear,
  odd,
  even,
  not,
  or,
  and,
  xor,
  comb,
  every,
  some,
  isInInterval,
  add2obj,
  groupBy,
  sum,
  without,
  withoutIndex,
  sort,
  uniq,
  uniqBy,
  flatten,
  shuffle,
  vadd,
} = ol;

test('simple', () => {
  expect(id('a')).toEqual('a');
  expect(id(3)).toEqual(3);

  expect(sqr(3)).toEqual(9);
  expect(sqr(-4)).toEqual(16);

  expect(abs(2)).toEqual(2);
  expect(abs(-2)).toEqual(2);

  expect(cube(0)).toEqual(0);
  expect(cube(1)).toEqual(1);
  expect(cube(2)).toEqual(8);
  expect(cube(3)).toEqual(27);
});

test('faculty', () => {
  expect(fac(0)).toEqual(1);
  expect(fac(1)).toEqual(1);
  expect(fac(2)).toEqual(2);
  expect(fac(3)).toEqual(6);
  expect(fac(4)).toEqual(24);
});

test('randomInRange', () => {
  const res = {};
  for (let i = 0; i < 1000; i++) {
    const x = Math.floor(randomInRange(1, 6));
    res[x] = (res[x] || 0) + 1;
    expect(x).toBeGreaterThanOrEqual(1);
    expect(x).toBeLessThanOrEqual(6);
  }
});

test('randomIntInRange', () => {
  const res = {};
  for (let i = 0; i < 1000; i++) {
    const x = randomIntInRange(1, 6);
    res[x] = (res[x] || 0) + 1;
    expect(x).toBeGreaterThanOrEqual(1);
    expect(x).toBeLessThanOrEqual(6);
  }
});

test('fibonacci', () => {
  expect(fib(1)).toEqual(1);
  expect(fib(2)).toEqual(1);
  expect(fib(3)).toEqual(2);
  expect(fib(4)).toEqual(3);
  expect(fib(5)).toEqual(5);
  expect(fib(6)).toEqual(8);
});

test('odd & even', () => {
  expect(odd(3)).toBe(true);
  expect(odd(4)).toBe(false);
  expect(even(3)).toBe(false);
  expect(even(4)).toBe(true);
});

test('isInInterval', () => {
  expect(isInInterval(3, 3, 4)).toEqual(true);
  expect(isInInterval(3.5, 4, 6)).toEqual(false);
  expect(isInInterval(0, 0, 1)).toBe(true);
  expect(isInInterval(1, 0, 1)).toBe(true);
  expect(isInInterval(0.5, 0, 1)).toBe(true);
  expect(isInInterval(1.1, 0, 1)).toBe(false);
  expect(isInInterval(-0.1, 0, 1)).toBe(false);
});

test('isLeapYear', () => {
  expect(isLeapYear(1800)).toBe(false);
  expect(isLeapYear(1900)).toBe(false);
  expect(isLeapYear(2000)).toBe(true);
  expect(isLeapYear(2001)).toBe(false);
  expect(isLeapYear(2004)).toBe(true);
  expect(isLeapYear(2005)).toBe(false);
  expect(isLeapYear(2008)).toBe(true);
});

test('combine predicates', () => {
  expect(not(isLeapYear)(1800)).toBe(true);
  expect(not(not(even))(2)).toBe(true);
  expect(or(isLeapYear, odd)(1804)).toBe(true);
  expect(or(isLeapYear, odd)(1801)).toBe(true);
  expect(and(even, odd)(1804)).toBe(false);
  expect(and(even, isLeapYear)(1804)).toBe(true);
  expect(xor(even, odd)(54)).toBe(true);
  expect(every(isLeapYear, even)(1804)).toBe(true);
  expect(every(isLeapYear, even)(1800)).toBe(false);
  expect(some(isLeapYear, even)(1804)).toBe(true);
  expect(some(isLeapYear, even)(1800)).toBe(true);
});

test('cmp', () => {
  expect(cmp(1, 1)).toBe(0);
  expect(cmp(1, 2)).toBe(-1);
  expect(cmp(2, 1)).toBe(+1);
  expect(cmp('a', 'a')).toBe(0);
  expect(cmp('a', 'b')).toBe(-1);
  expect(cmp('b', 'a')).toBe(+1);
});

test('vector functions', () => {
  expect(vadd([1,3],  [1,7])).toEqual([2,10]);
});

test('range', () => {
  expect(range(0)).toEqual([]);
  expect(range(1)).toEqual([0]);
  expect(range(2)).toEqual([0, 1]);
  expect(range(3)).toEqual([0, 1, 2]);
});

test('reshape', () => {
  expect(reshape([1,2,3,4],2)).toEqual([[1,2],[3,4]]);
});

test('rangeFilled', () => {
  expect(rangeFilled(0, 'a')).toEqual([]);
  expect(rangeFilled(1, 'a')).toEqual(['a']);
  expect(rangeFilled(2, 1)).toEqual([1, 1]);
  expect(rangeFilled(3, 10)).toEqual([10, 10, 10]);
});

test('randomArray', () => {
  const arr = randomArray(100, 1, 2);
  // console.log(arr)
  expect(arr.every((x) => isInInterval(x, 1, 2))).toBe(true);
});

test('randomIntArray', () => {
  const arr = randomIntArray(100, 1, 3);
  expect(arr.every((x) => x === 1 || x === 2 || x === 3)).toBe(true);

  const groups = array(arr).groupBy(id);
  expect(Object.keys(groups).every((x) => groups[x].length > 10)).toBe(true);
});

test('sum of arrays', () => {
  expect(sum([])).toBe(0);
  expect(sum([10])).toBe(10);
  expect(sum([10, 20, 30])).toBe(60);
  expect(sum(interval(1, 3).range())).toBe(6);
  expect(sum(interval(1, 100).range())).toBe(5050);
});

test('without', () => {
  expect(without([], 2)).toEqual([]);
  expect(without([3], 2)).toEqual([3]);
  expect(without([1, 2, 3], 2)).toEqual([1, 3]);
  expect(without([1, 2, 3, 4], 2)).toEqual([1, 3, 4]);
});

test('withoutIndex', () => {
  expect(withoutIndex([], 2)).toEqual([]);
  expect(withoutIndex([3], 0)).toEqual([]);
  expect(withoutIndex([1, 2, 3], 2)).toEqual([1, 2]);
  expect(withoutIndex([1, 2, 3, 4], 2)).toEqual([1, 2, 4]);
});

test('add2obj', () => {
  const o = {};
  expect(add2obj(o, 'key', 1)).toEqual({ key: [1] });
  expect(add2obj(o, 'key', 2)).toEqual({ key: [1, 2] });
  expect(add2obj({ a: undefined }, 'a', 1)).toEqual({ a: [1] });
});

test('shuffle & sort', () => {
  const xs = range(10);
  const ys = shuffle(xs);
  expect(xs).toEqual(sort(ys));
});

test('groupBy', () => {
  const xs = [1, 2, 3, 4, 5, 6];
  const groups = groupBy(xs, odd);
  expect(groups).toEqual({ true: [1, 3, 5], false: [2, 4, 6] });
});

test('uniq', () => {
  expect(uniq([1, 2, 2], id)).toEqual([1, 2]);
});

test('uniqBy', () => {
  expect(uniqBy([1, 2, 2], id)).toEqual([1, 2]);
  expect(uniqBy([{ id: 1 }, { id: 2 }, { id: 2 }], (x) => x.id)).toEqual([{ id: 1 }, { id: 2 }]);
});

test('flatten', () => {
  expect(flatten([1, 2, 3, 4, 5, 6, [1]])).toEqual([1, 2, 3, 4, 5, 6, 1]);
  expect(flatten([[1, [2]], 3, 4, 5, 6, [1]])).toEqual([1, 2, 3, 4, 5, 6, 1]);
  expect(uniq(sort(flatten([[1, [2]], 3, 4, 5, 6, [1]])))).toEqual([1, 2, 3, 4, 5, 6]);
});

// Wrappers
{
  test('num', () => {
    expect(num(0).sqr()).toBe(0);
    expect(num(1).sqr()).toBe(1);
    expect(num(2).sqr()).toBe(4);

    expect(num(0).cube()).toBe(0);
    expect(num(1).cube()).toBe(1);
    expect(num(2).cube()).toBe(8);

    expect(num(0).abs()).toBe(0);
    expect(num(1).abs()).toBe(1);
    expect(num(-1).abs()).toBe(1);

    expect(num(2).isInInterval(2, 3)).toBe(true);
    expect(num(2).isInInterval(2, 4)).toBe(true);
    expect(num(3).isInInterval(2, 3)).toBe(true);
    expect(num(3).isInInterval(2, 4)).toBe(true);
    expect(num(2).isInInterval(3, 4)).toBe(false);
    expect(num(3).isInInterval(1, 2)).toBe(false);
  });

  test('interval', () => {
    expect(interval(1, 2).range()).toEqual([1, 2]);
    expect(interval(0, 10).range()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    expect(interval(1, 10).contains(1)).toBe(true);
    expect(interval(1, 10).contains(2)).toBe(true);
    expect(interval(1, 10).contains(0.5)).toBe(false);
    expect(interval(1, 10).contains(10.5)).toBe(false);

    expect(interval(1, 2).intersects(0.5, 1.5)).toBe(true);
    expect(interval(1, 2).intersects(1.5, 2, 5)).toBe(true);
    expect(interval(1, 2).intersects(0.5, 0.7)).toBe(false);
    expect(interval(1, 2).intersects(2.1, 2, 5)).toBe(false);

    expect(interval(1, 10).inc(1)).toBe(2);
    expect(interval(1, 10).inc(9)).toBe(10);
    expect(interval(1, 10).inc(10)).toBe(10);

    expect(interval(0, 10).dec(10)).toBe(9);
    expect(interval(0, 10).dec(9)).toBe(8);
    expect(interval(0, 10).dec(1)).toBe(0);
    expect(interval(0, 10).dec(0)).toBe(0);
  });

  test('array wrapper', () => {
    expect(array([1, 2, 3]).sum()).toBe(6);

    expect(array(['a', 'a', 'b', 'b']).uniq()).toEqual(['a', 'b']);
    expect(array([1, 2, 3, 3]).uniq()).toEqual([1, 2, 3]);

    expect(array([]).unite([])).toEqual([]);
    expect(array(['a', 'b']).unite([1])).toEqual(['a', 'b', 1]);
    expect(array(['a', 'b']).unite(['b', 'c', 'd'])).toEqual(['a', 'b', 'c', 'd']);

    expect(array([]).intersect([])).toEqual([]);
    expect(array([1, 2, 3]).intersect([3, 4, 5])).toEqual([3]);

    expect(array([]).without(3)).toEqual([]);
    expect(array([3]).without(3)).toEqual([]);
    expect(array([1]).without(3)).toEqual([1]);
    expect(array([1]).max()).toEqual(1);

    expect(array([]).max()).toEqual(undefined);
    expect(array([1]).max()).toEqual(1);
    expect(array([1, 2]).max()).toEqual(2);
    expect(array([]).min()).toEqual(undefined);
    expect(array([1]).min()).toEqual(1);
    expect(array([1, 2]).min()).toEqual(1);
  });
}

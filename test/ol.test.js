const ol = require('../src/ol').ol;
const num = require('../src/ol').num;
const interval = require('../src/ol').interval;
const array = require('../src/ol').array;

test('testset simple', () => {

  expect(ol.id('a')).toEqual('a');
  expect(ol.id(3)).toEqual(3);

  expect(ol.sqr(3)).toEqual(9);
  expect(ol.sqr(-4)).toEqual(16);

  expect(ol.abs(2)).toEqual(2);
  expect(ol.abs(-2)).toEqual(2);

  expect(ol.cube(0)).toEqual(0);
  expect(ol.cube(1)).toEqual(1);
  expect(ol.cube(2)).toEqual(8);
  expect(ol.cube(3)).toEqual(27);

});

test('testset faculty', () => {
  expect(ol.fac(0)).toEqual(1);
  expect(ol.fac(1)).toEqual(1);
  expect(ol.fac(2)).toEqual(2);
  expect(ol.fac(3)).toEqual(6);
  expect(ol.fac(4)).toEqual(24);
});

test('testset randomInRange', () => {
  const res = {};
  for (let i = 0; i < 1000; i++) {
    const x = Math.floor(ol.randomInRange(1, 6));
    res[x] = (res[x] || 0) + 1;
    expect(x).toBeGreaterThanOrEqual(1);
    expect(x).toBeLessThanOrEqual(6);
  }
  //console.log(res);  
});

test('testset randomIntInRange', () => {
  const res = {};
  for (let i = 0; i < 1000; i++) {
    const x = ol.randomIntInRange(1, 6);
    res[x] = (res[x] || 0) + 1;
    expect(x).toBeGreaterThanOrEqual(1);
    expect(x).toBeLessThanOrEqual(6);
  }
  //console.log(res);  
});

test('testset fibonacci', () => {
  expect(ol.fib(1)).toEqual(1);
  expect(ol.fib(2)).toEqual(1);
  expect(ol.fib(3)).toEqual(2);
  expect(ol.fib(4)).toEqual(3);
  expect(ol.fib(5)).toEqual(5);
  expect(ol.fib(6)).toEqual(8);
});

test('testset odd & even', () => {
  expect(ol.odd(3)).toBe(true);
  expect(ol.odd(4)).toBe(false);
  expect(ol.even(3)).toBe(false);
  expect(ol.even(4)).toBe(true);
});

test('testset ininterval', () => {
  expect(ol.ininterval(3, 3, 4)).toEqual(true);
  expect(ol.ininterval(3.5, 4, 6)).toEqual(false);
  expect(ol.ininterval(0, 0, 1)).toBe(true);
  expect(ol.ininterval(1, 0, 1)).toBe(true);
  expect(ol.ininterval(0.5, 0, 1)).toBe(true);
  expect(ol.ininterval(1.1, 0, 1)).toBe(false);
  expect(ol.ininterval(-0.1, 0, 1)).toBe(false);
});

test('testset leapyear', () => {
  expect(ol.leapyear(1800)).toBe(false);
  expect(ol.leapyear(1900)).toBe(false);
  expect(ol.leapyear(2000)).toBe(true);
  expect(ol.leapyear(2001)).toBe(false);
  expect(ol.leapyear(2004)).toBe(true);
  expect(ol.leapyear(2005)).toBe(false);
  expect(ol.leapyear(2008)).toBe(true);
});

test('testset combine predicates', () => {
  expect(ol.not(ol.leapyear)(1800)).toBe(true);
  expect(ol.not(ol.not(ol.even))(2)).toBe(true);
  expect(ol.or(ol.leapyear, ol.odd)(1804)).toBe(true);
  expect(ol.or(ol.leapyear, ol.odd)(1801)).toBe(true);
  expect(ol.and(ol.even, ol.odd)(1804)).toBe(false);
  expect(ol.and(ol.even, ol.leapyear)(1804)).toBe(true);
  expect(ol.xor(ol.even, ol.odd)(54)).toBe(true);
  expect(ol.every(ol.leapyear, ol.even)(1804)).toBe(true);
  expect(ol.every(ol.leapyear, ol.even)(1800)).toBe(false);
  expect(ol.some(ol.leapyear, ol.even)(1804)).toBe(true);
  expect(ol.some(ol.leapyear, ol.even)(1800)).toBe(true);
});



test('testset cmp', () => {
  expect(ol.cmp(1, 1)).toBe(0);
  expect(ol.cmp(1, 2)).toBe(-1);
  expect(ol.cmp(2, 1)).toBe(+1);
  expect(ol.cmp('a', 'a')).toBe(0);
  expect(ol.cmp('a', 'b')).toBe(-1);
  expect(ol.cmp('b', 'a')).toBe(+1);
});

test('testset range', () => {
  expect(ol.range(0)).toEqual([]);
  expect(ol.range(1)).toEqual([0]);
  expect(ol.range(2)).toEqual([0, 1]);
  expect(ol.range(3)).toEqual([0, 1, 2]);
});

test('testset rangeFilled', () => {
  expect(ol.rangeFilled(0, 'a')).toEqual([]);
  expect(ol.rangeFilled(1, 'a')).toEqual(['a']);
  expect(ol.rangeFilled(2, 1)).toEqual([1, 1]);
  expect(ol.rangeFilled(3, 10)).toEqual([10, 10, 10]);
});

test('testset randomArray', () => {
  const arr = ol.randomArray(100, 1, 2);
  // console.log(arr)
  expect(arr.every(x => ol.ininterval(x, 1, 2))).toBe(true);
});

test('testset randomIntArray', () => {
  const arr = ol.randomIntArray(100, 1, 3);
  const grps = array(arr).groupBy(ol.id);
  // console.log(grps)
  expect(arr.every(x => x === 1 || x === 2 || x === 3)).toBe(true);
  expect(Object.keys(grps).every(x => grps[x].length > 10)).toBe(true);
});

test('testset sum of arrays', () => {
  expect(ol.sum([])).toBe(0);
  expect(ol.sum([10])).toBe(10);
  expect(ol.sum([10, 20, 30])).toBe(60);
  expect(ol.sum(interval(1, 3).array())).toBe(6);
  expect(ol.sum(interval(1, 100).array())).toBe(5050);
});

test('testset without', () => {
  expect(ol.without([], 2)).toEqual([]);
  expect(ol.without([3], 2)).toEqual([3]);
  expect(ol.without([1, 2, 3], 2)).toEqual([1, 3]);
  expect(ol.without([1, 2, 3, 4], 2)).toEqual([1, 3, 4]);
});

test('testset withoutIndex', () => {
  expect(ol.withoutIndex([], 2)).toEqual([]);
  expect(ol.withoutIndex([3], 0)).toEqual([]);
  expect(ol.withoutIndex([1, 2, 3], 2)).toEqual([1, 2]);
  expect(ol.withoutIndex([1, 2, 3, 4], 2)).toEqual([1, 2, 4]);
});

test('testset add2arr', () => {
  expect(ol.add2arr(undefined, 1)).toEqual([1]);
  expect(ol.add2arr([], 1)).toEqual([1]);
  expect(ol.add2arr([1, 2, 3], 4)).toEqual([1, 2, 3, 4]);
});

test('testset add2obj', () => {
  const o = {};
  expect(ol.add2obj(o, 'key', 1)).toEqual({ 'key': [1] });
  expect(ol.add2obj(o, 'key', 2)).toEqual({ 'key': [1, 2] });
  //expect( ol.add2obj({'a':undefined},'a',1) ).toEqual({'a':[1]});
});

// Wrappers
{
  test('testset num', () => {
    expect(num(0).sqr()).toBe(0);
    expect(num(1).sqr()).toBe(1);
    expect(num(2).sqr()).toBe(4);

    expect(num(0).cube()).toBe(0);
    expect(num(1).cube()).toBe(1);
    expect(num(2).cube()).toBe(8);

    expect(num(0).abs()).toBe(0);
    expect(num(1).abs()).toBe(1);
    expect(num(-1).abs()).toBe(1);

    expect(num(2).ininterval(2, 3)).toBe(true);
    expect(num(2).ininterval(2, 4)).toBe(true);
    expect(num(3).ininterval(2, 3)).toBe(true);
    expect(num(3).ininterval(2, 4)).toBe(true);
    expect(num(2).ininterval(3, 4)).toBe(false);
    expect(num(3).ininterval(1, 2)).toBe(false);
  });

  test('testset interval', () => {
    expect(interval(1, 2).array()).toEqual([1, 2]);
    expect(interval(0, 10).array()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

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

  test('testset arraywrapper', () => {
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


  })
}
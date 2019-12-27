/* global expect */
const ol = require('../src/ol/ol').ol;
const num = require('../src/ol/ol').num;
test('testset simple', () => {
  expect(ol.sqr(3)).toEqual(9);
  expect(ol.abs(2)).toEqual(2);
  expect(ol.abs(-2)).toEqual(2);
  expect(ol.cub(3)).toEqual(27);
  expect(ol.odd(3)).toBe(true);
  expect(ol.odd(4)).toBe(false);
  expect(ol.even(3)).toBe(false);
  expect(ol.even(4)).toBe(true);
});

test('testset fac', () => {
  expect(ol.fac(1)).toEqual(1);
  expect(ol.fac(2)).toEqual(2);
  expect(ol.fac(3)).toEqual(6);
  expect(ol.fac(4)).toEqual(24);
});

test('testset fac', () => {
  expect(ol.fib(3)).toEqual(2);
  expect(ol.fib(4)).toEqual(3);
  expect(ol.fib(5)).toEqual(5);
});

test('testset inrange', () => {
  expect(ol.inrange(3, 3, 4)).toEqual(true);
  expect(ol.inrange(3.5, 4, 6)).toEqual(false);
  expect(ol.inrange(0, 0, 1)).toBe(true);
  expect(ol.inrange(1, 0, 1)).toBe(true);
  expect(ol.inrange(0.5, 0, 1)).toBe(true);
  expect(ol.inrange(1.1, 0, 1)).toBe(false);
  expect(ol.inrange(-0.1, 0, 1)).toBe(false);
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

test('testset randomInRangeInt', () => {
  const res = {};
  for (let i = 0; i < 1000; i++) {
    const x = ol.randomInRangeInt(1, 6);
    res[x] = (res[x] || 0) + 1;
    expect(x).toBeGreaterThanOrEqual(1);
    expect(x).toBeLessThanOrEqual(6);
  }
  //console.log(res);  
});

test('testset cmp', () => {
  expect(ol.cmp(1, 1)).toBe(0);
  expect(ol.cmp(1, 2)).toBe(-1);
  expect(ol.cmp(2, 1)).toBe(+1);
});

test('testset leapyear', () => {
  expect(ol.leapyear(1900)).toBe(false);
  expect(ol.leapyear(2000)).toBe(true);
  expect(ol.leapyear(2001)).toBe(false);
  expect(ol.leapyear(2004)).toBe(true);
  expect(ol.leapyear(2005)).toBe(false);
  expect(ol.leapyear(2008)).toBe(true);
});

test('testset range', () => {
  expect(ol.range(0)).toEqual([]);
  expect(ol.range(1)).toEqual([0]);
  expect(ol.range(2)).toEqual([0, 1]);
  expect(ol.range(3)).toEqual([0, 1, 2]);
});

test('testset sum of arrays', () => {
  expect(ol.sum([])).toBe(0);
  expect(ol.sum([10])).toBe(10);
  expect(ol.sum([10, 20, 30])).toBe(60);
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

    expect(num(2).inrange(2,3)).toBe(true);
    expect(num(2).inrange(2,4)).toBe(true);
    expect(num(3).inrange(2,3)).toBe(true);
    expect(num(3).inrange(2,4)).toBe(true);
    expect(num(2).inrange(3,4)).toBe(false);
    expect(num(3).inrange(1,2)).toBe(false);

  });

}

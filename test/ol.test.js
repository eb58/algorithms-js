/* global expect */
const ol = require('../src/ol/ol');
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
  expect(ol.inrange(3, 3,4)).toEqual(true);
  expect(ol.inrange(3.5, 4,6)).toEqual(false);
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
    expect(ol.cmp(1,1)).toBe(0);
    expect(ol.cmp(1,2)).toBe(-1);
    expect(ol.cmp(2,1)).toBe(+1);
});

test('testset leapyear', () => {
    expect(ol.leapyear(1900)).toBe(false);
    expect(ol.leapyear(2000)).toBe(true); 
    expect(ol.leapyear(2001)).toBe(false);
    expect(ol.leapyear(2004)).toBe(true);
    expect(ol.leapyear(2005)).toBe(false);
    expect(ol.leapyear(2008)).toBe(true);
});


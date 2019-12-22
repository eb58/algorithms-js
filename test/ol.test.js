/* global expect */
const ol = require('../src/ol/ol');
test('testset simple', () => {
    expect(ol.sqr(3)).toEqual(9);
    expect(ol.abs(2)).toEqual(2);
    expect(ol.abs(-2)).toEqual(2);
    expect(ol.cub(3)).toEqual(27);
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


const V$ = require('../src/vector');

const vals = { v1: [1, 2], v2: [2, 1], v3: [1, -1] }

test('exceptions', () => {
    expect(() => V$('')).toThrow('Operand expected. Pos:0');
    expect(() => V$('?5')).toThrow('Unexpected character "?" at position 0');
    expect(V$('5')).toBe(5);
    expect(() => V$('(v1+v2', vals)).toThrow('Closing bracket not found!');
    expect(() => V$('v1-*v2', vals)).toThrow('Operand expected. Pos:4');
    expect(() => V$('v1+v2(', vals)).toThrow('Unexpected symbol. Pos:6');
    expect(() => V$()).toThrow('False initialisation of V$');
});

test('init', () => {
    expect(V$([])).toEqual([]);
    expect(V$([1])).toEqual([1]);
    expect(V$([1, 1, 3])).toEqual([1, 1, 3]);
    expect(V$('[]')).toEqual([]);
    expect(V$('[1]')).toEqual([1]);
    expect(V$('[1, 1, 3]')).toEqual([1, 1, 3]);
});

test('simple calculations', () => {
    expect(V$('-[1,2]')).toEqual([-1, -2]);
    expect(V$('[1,2] + [3,6]', vals)).toEqual([4, 8]);
});

test('simple calculations with variables', () => {
    expect(V$('-v1', vals)).toEqual([-1, -2]);
    expect(V$('v1 + v2', vals)).toEqual([3, 3]);
    expect(V$('v1 - v2', vals)).toEqual([-1, 1]);
    expect(V$('(v1 - v2) + v3', vals)).toEqual([0, 0]);
    expect(V$('v1 - v2 + v3', vals)).toEqual([0, 0]);
    expect(V$('v1 - (v2 + v3)', vals)).toEqual([-2, 2]);
});

test('scalar product', () => {
    expect(V$('v1 * v2', vals)).toEqual(4);
    expect(V$('v2 * v3', vals)).toEqual(1);
});

test('powers and scalars', () => {
    expect(V$('v1 ^ 2', vals)).toEqual([1, 4]);
});

test('numbers as operands', () => {
    expect(V$('5 + 3')).toBe(8);
    expect(V$('2 * 3 * 4')).toBe(24);
    expect(V$('-(2 + 3)')).toBe(-5);
    expect(V$('2 ^ 3')).toBe(8);
    expect(V$('2 * v1', vals)).toEqual([2, 4]);
    expect(V$('v1 * 2', vals)).toEqual([2, 4]);
    expect(V$('2 * v1 - v2', vals)).toEqual([0, 3]);
    expect(V$('2 * v1 * v2', vals)).toBe(8);
});

test('numbers as variables', () => {
    expect(V$('n * v1', { ...vals, n: 3 })).toEqual([3, 6]);
    expect(V$('z', { z: 0 })).toBe(0);
});

test('mixing numbers and vectors is an error', () => {
    expect(() => V$('v1 + 2', vals)).toThrow('Cannot add a number and a vector');
    expect(() => V$('2 - v1', vals)).toThrow('Cannot subtract a number and a vector');
});

test('vectors of different length are an error', () => {
    const v = { ...vals, v4: [1, 2, 3] };
    expect(() => V$('v1 + v4', v)).toThrow('Cannot add vectors of different length (2 and 3)');
    expect(() => V$('v4 - v1', v)).toThrow('Cannot subtract vectors of different length (3 and 2)');
    expect(() => V$('v1 * v4', v)).toThrow('Cannot multiply vectors of different length (2 and 3)');
});

test('identifiers', () => {
    expect(() => V$('x + v1', vals)).toThrow('Unknown identifier x');
    expect(() => V$('constructor', vals)).toThrow('Unknown identifier constructor');
});

test('functions', () => {
    const fcts = { ...vals, dbl: (v) => v.map((x) => 2 * x), plus: (a, b) => a.map((x, i) => x + b[i]) };
    expect(V$('dbl(v1)', fcts)).toEqual([2, 4]);
    expect(V$('plus(v1, v2) - v3', fcts)).toEqual([2, 4]);
});

test('function call needs an opening bracket', () => {
    const fcts = { ...vals, dbl: (v) => v.map((x) => 2 * x) };
    expect(() => V$('dbl v1)', fcts)).toThrow('Opening bracket expected');
    expect(() => V$('dbl', fcts)).toThrow('Opening bracket expected');
});

test('unary plus', () => {
    expect(V$('+v1', vals)).toEqual([1, 2]);
    expect(V$('v1 - +v2', vals)).toEqual([-1, 1]);
});

test('missing closing brackets', () => {
    const fcts = { ...vals, dbl: (v) => v.map((x) => 2 * x) };
    expect(() => V$('[1, 2')).toThrow('rbracket not found!');
    expect(() => V$('dbl(v1', fcts)).toThrow('Closing bracket not found!');
});

test('exponent must be a number', () => {
    expect(() => V$('v1 ^ v2', vals)).toThrow('Operand expected. Pos:7');
    expect(() => V$('v1 ^ -1', vals)).toThrow('Operand expected. Pos:6');
});

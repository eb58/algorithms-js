const V$ = require('../src/vector');

const vals = { v1: [1, 2], v2: [2, 1], v3: [1, -1] }

test('exceptions', () => {
    expect(() => V$('')).toThrow('Operand expected. Pos:0');
    expect(() => V$('?5')).toThrow('Char ? not allowed. Pos:0');
    expect(() => V$('5')).toThrow('Operand expected. Pos:1');
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

test('scalarprodukt', () => {
    expect(V$('v1 * v2', vals)).toEqual(4);
    expect(V$('v2 * v3', vals)).toEqual(1);
});




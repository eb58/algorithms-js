const C$ = require('../src/complex');

const range = (n) => [...Array(n).keys()];
const csqr = (z) => C$('z*z', { z });
const I = C$(0, 1);

test('simple for debug', () => {
  expect(C$('pi*5')).toEqual({ r: Math.PI * 5, i: 0 });
});

test('exceptions', () => {
  expect(() => C$('')).toThrow('Operand expected. Pos:0');
  expect(() => C$('?5')).toThrow('Char ? not allowed. Pos:0');
  expect(() => C$('5#4')).toThrow('Char # not allowed. Pos:1');
  expect(() => C$('(1+5')).toThrow('Closing bracket not found!');
  expect(() => C$('1-*5')).toThrow('Operand expected. Pos:3');
  expect(() => C$('5+5(')).toThrow('Unexpected symbol. Pos:4');
  expect(() => C$('pow(3,2')).toThrow('Closing bracket not found! Pos:7');

  expect(() => C$()).toThrow('False initialisation of C$');
  expect(() => C$({ s: 7 })).toThrow('False initialisation of C$');
});

test('init complex with object', () => {
  expect(C$({ r: 0 })).toEqual({ r: 0, i: 0 });
  expect(C$({ r: 1, i: 1 })).toEqual({ r: 1, i: 1 });
});

test('init complex with numbers or object', () => {
  expect(C$(0, 0)).toEqual({ r: 0, i: 0 });
  expect(C$(-0, -0)).toEqual({ r: 0, i: 0 });
  expect(C$(1)).toEqual({ r: 1, i: 0 });
  expect(C$(1, 1)).toEqual({ r: 1, i: 1 });
});

test('init complex with strings', () => {
  expect(C$('+1')).toEqual({ r: 1, i: 0 });
  expect(C$('1')).toEqual({ r: 1, i: 0 });
  expect(C$('-1')).toEqual({ r: -1, i: 0 });

  expect(C$('+i')).toEqual({ r: 0, i: 1 });
  expect(C$('i')).toEqual({ r: 0, i: 1 });
  expect(C$('-i')).toEqual({ r: 0, i: -1 });
  expect(C$('1+i')).toEqual({ r: 1, i: 1 });
});

test('simple calculations', () => {
  expect(C$('i*i')).toEqual(C$(-1));
  expect(C$('i*i*i')).toEqual(C$(0, -1));
  expect(C$('i*i*i*i')).toEqual(C$(1));
  expect(C$('i*i*i*i')).toEqual(C$(1, 0));

  expect(C$('1+i')).toEqual(C$(1, 1));
  expect(C$('1+2*i')).toEqual(C$(1, 2));
  expect(C$('1-i')).toEqual(C$(1, -1));
  expect(C$('1-2*i')).toEqual(C$(1, -2));
  expect(C$('(1+2)*i')).toEqual(C$(0, 3));
  expect(C$('1+i*i')).toEqual(C$(0));
  expect(C$('(1+i)*i')).toEqual(C$(-1, 1));
  expect(C$('3*(1+i)')).toEqual(C$(3, 3));
  expect(C$('2*(1+i)*2')).toEqual(C$(4, 4));
  expect(C$('(1+i)*5')).toEqual(C$(5, 5));
  expect(C$('pi*5')).toEqual(C$(5 * Math.PI));

  expect(C$('2.4 + i*3.2')).toEqual(C$(2.4, 3.2));
  expect(C$('2.4 - i*3.2')).toEqual(C$(2.4, -3.2));
  expect(C$('2.4')).toEqual(C$(2.4));
  expect(C$('-2.4')).toEqual(C$(-2.4));
  expect(C$('-2.4 - i*3.2')).toEqual(C$(-2.4, -3.2));
  expect(C$('-i*3.2')).toEqual(C$(0, -3.2));
});

test('simple calculations with variables', () => {
  const vars1 = { a: C$(3), b: C$(7) };
  expect(C$('a', vars1)).toEqual(C$(3));
  expect(C$('-a', vars1)).toEqual(C$(-3));
  expect(C$('a+b', vars1)).toEqual(C$(10));
  expect(C$('a*b', vars1)).toEqual(C$(21));
  expect(C$('(a)+(b)', vars1)).toEqual(C$(10));

  const vars2 = { a: C$('2+2*i'), b: C$(3, 0) };
  expect(C$('a', vars2)).toEqual(C$(2, 2));
  expect(C$('-a', vars2)).toEqual(C$(-2, -2));
  expect(C$('a+b', vars2)).toEqual(C$(5, 2));
  expect(C$('a*a', vars2)).toEqual(C$(0, 8));
  expect(C$('5*a', vars2)).toEqual(C$(10, 10));
});

test('complexFunction type 1', () => {
  // call functions of form (z) => f(z) e.g. csqr = z => C$(z*z)
  expect(csqr(1)).toEqual(C$(1));
  expect(csqr(2)).toEqual(C$(4));
  expect(csqr(I)).toEqual(C$(-1));
  expect(csqr('2*i')).toEqual(C$(-4));

  const g = (z) => C$('z*z*(z-1)/(z+1)', { z });
  expect(g('2*i')).toEqual(C$(-2.4, -3.2));
  expect(g('i')).toEqual(C$(0, -1));
});

test('complexFunction type 2', () => {
  expect(C$('csqr(z)', { csqr, z: C$(0, 2) })).toEqual(C$(-4));
  expect(C$('csqr(z)*csqr(z)', { csqr, z: C$(0, 2) })).toEqual(C$(16));

  const g = (z) => C$('z*z*(z-1)/(z+1)', { z });
  const f = (z) => C$('-i*(z+1)*(z+1)*(z*z*z*z)', { z });
  expect(C$('g(i)', { g })).toEqual(C$('-i'));
  expect(C$('g(1)', { g })).toEqual(C$('0'));
  expect(C$('g(2*i)', { g })).toEqual(C$('-2.4-i*3.2'));

  expect(C$('g(z)', { z: C$(9), g })).toEqual(C$(64.8));
  expect(C$('g(z)', { z: C$(9, 1), g })).toEqual(C$(63.8019801980198, 16.019801980198018));

  expect(C$('f(z)', { z: C$(1, 1), f })).toEqual(C$(-16, 12));
  expect(C$('f(z)', { z: C$(1, 1), f })).toEqual(C$(-16, 12));

  expect(C$('f(z)*g(z)', { f, g, z: C$(0, 2) })).toEqual(C$(2.842170943040401e-14, -320));
});

test('complexFunction type 3', () => {
  const f1 = (a) => C$('a+2', { a });
  const f2 = (a, b) => C$(' a+b', { a, b });
  const f3 = (a, b) => C$(' a*b', { a, b });

  expect(f1(1)).toEqual(C$(3));
  expect(f3(I, I)).toEqual(C$(-1));
  expect(f2(I, I)).toEqual(C$(0, 2));

  expect(((a) => C$('i*a', { a }))(I)).toEqual(C$(-1));
  expect(((a) => C$('2*a', { a }))(I)).toEqual(C$(0, 2));
  expect(((z1, z2) => C$('z1+z2', { z1, z2 }))(1, I)).toEqual(C$(1, 1));
});

test('external variables and functions ', () => {
  const f1 = (z) => C$('sqr(z)', { z });
  const f2 = (z) => C$('f1(z)+1', { z, f1 });
  const f3 = (z) => C$('-i*(z+1)*(z+1)*(z*z*z*z)', { z });
  const cube = (z) => C$('z*z*z', { z });

  expect(C$('sqr(2*i)')).toEqual(C$(-4));
  expect(C$('cube(2*i)', { cube })).toEqual(C$(0, -8));

  expect(f1('2*i')).toEqual(C$(-4));
  expect(f2('2*i')).toEqual(C$(-3));

  const b = C$(0, 2);
  expect(C$('f3(b)', { b, f3 })).toEqual({ r: 64, i: 48 });
});

test('exponential z**2 ', () => {
  expect(C$('1**0')).toEqual(C$(1));
  expect(C$('1**1')).toEqual(C$(1));
  expect(C$('1**2')).toEqual(C$(1));
  expect(C$('2**1')).toEqual(C$(2));
  expect(C$('2**2')).toEqual(C$(4));
  expect(C$('3**3')).toEqual(C$(27));
  expect(C$('z**2', { z: C$(3) })).toEqual(C$(9));
  expect(C$('z**2', { z: C$('3*i') })).toEqual(C$(-9));
  expect(C$('2*z**2', { z: C$('3') })).toEqual(C$(18));
  expect(C$('z**2 * 2', { z: C$('3') })).toEqual(C$(18));
  expect(C$('z**2 + 2', { z: C$('3') })).toEqual(C$(11));
  expect(C$('1 + z**2 *2 + 2', { z: C$('3') })).toEqual(C$(21));
  expect(C$('z^2 * 2', { z: C$('3') })).toEqual(C$(18));
});

test('functions with several parameters ', () => {
  const pow = (z, n) => range(n.r - 1).reduce((res) => C$('res*z', { res, z }), z);
  const f = (z1, z2) => C$('z1+z2', { z1, z2 });

  expect(C$('f(3,4)', { f })).toEqual(C$(7));
  expect(C$('2+2+csqr(3)', { csqr })).toEqual(C$(13));
  expect(C$('pow(3,2)', { pow })).toEqual(C$(9));
  expect(C$('pow(3,2)')).toEqual(C$(9));
});

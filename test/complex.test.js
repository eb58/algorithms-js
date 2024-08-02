const C$ = require('../src/complex');

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
  const csqr = C$('(z) => z*z');
  const I = C$(0, 1);

  expect(csqr(1)).toEqual(C$(1));
  expect(csqr(2)).toEqual(C$(4));
  expect(csqr(I)).toEqual(C$(-1));
  expect(csqr('2*i')).toEqual(C$(-4));

  const g = C$('z => z*z*(z-1)/(z+1)');
  expect(g('2*i')).toEqual(C$(-2.4, -3.2));
  expect(g('i')).toEqual(C$(0, -1));
});

test('complexFunction type 2', () => {
  const csqr = C$('(z) => z*z');
  expect(C$('csqr(z)', { csqr, z: C$(0, 2) })).toEqual(C$(-4));
  expect(C$('csqr(z)*csqr(z)', { csqr, z: C$(0, 2) })).toEqual(C$(16));

  const g = C$('(z) => z*z*(z-1)/(z+1)');
  const f = C$('(z) => -i*(z+1)*(z+1)*(z*z*z*z)');
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
  const I = C$(0, 1);

  // functions with unbound parameters
  // then C$ return a function, with as many paramters
  // as unbound vars are found in expression
  // C$('z => z+2') -> (z) => z+2
  // C$('(a,b) => a*b') -> (a,b) => a*b
  // not working with functions yet: => C$('csqr(a)')(1) does not work!

  expect(C$('(a) => a+2')(1)).toEqual(C$(3));
  expect(C$('(a, b) => a*b')(I, I)).toEqual(C$(-1));
  expect(C$('(a, b) => a+b')(I, I)).toEqual(C$(0, 2));

  expect(C$('a => i*a')(I)).toEqual(C$(-1));
  expect(C$('a => 2*a')(I)).toEqual(C$(0, 2));
  expect(C$('a => a*a')(I)).toEqual(C$(-1));
  expect(C$('a => 2*a')(C$(3, 1))).toEqual(C$(6, 2));
  expect(C$('a => a*a')(3)).toEqual(C$(9, 0));
  expect(C$('a => 2*a')(C$('3+i'))).toEqual(C$(6, 2));

  expect(C$('(z1, z2) => z1+z2')(1, I)).toEqual(C$(1, 1));

  expect(C$('(a, b, c) => a*(b-c)')(3, 5, 1)).toEqual(C$(12));
  expect(C$('(a, b, c) => a*(b+c)')(C$(3), C$(5), C$(1))).toEqual(C$(18));
  expect(C$('(a) => a*a*a')(2)).toEqual(C$(8));
});

test('external variables and functions ', () => {
  const f1 = (z) => C$('sqr(z)', { z });
  const f2 = (z) => C$('f1(z)+1', { z, f1 });
  const f3 = (z) => C$('-i*(z+1)*(z+1)*(z*z*z*z)', { z });
  const cube = (z) => C$('z*z*z', { z });

  expect(C$('sqr(2*i)')).toEqual(C$(-4));
  expect(C$('cube(2*i)',{cube})).toEqual(C$(0,-8));

  expect(f1(C$('2*i'))).toEqual(C$(-4));
  expect(f2(C$('2*i'))).toEqual(C$(-3));

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
  expect(C$('z**2', {z:C$(3)})).toEqual(C$(9));
  expect(C$('z**2', {z:C$('3*i')})).toEqual(C$(-9));
  expect(C$('2*z**2', {z:C$('3')})).toEqual(C$(18));
  expect(C$('z**2 * 2', {z:C$('3')})).toEqual(C$(18));
  expect(C$('z**2 + 2', {z:C$('3')})).toEqual(C$(11));
  expect(C$('1 + z**2 *2 + 2', {z:C$('3')})).toEqual(C$(21));
});

const { C$ } = require('../src/complex');

const I = C$(0, 1);
const csqr = C$('z*z');
const g = C$('z*z*(z-1)/(z+1)');
const f = C$('-i*(z+1)*(z+1)*(z*z*z*z)');

test('exceptions', () => {
  expect(() => C$('(1+5')).toThrow('Closing bracket not found!');
  expect(() => C$('1-*5')).toThrow('Operand expected. Pos:3');
});

test('init', () => {
  // init with numbers or object
  expect(C$(1)).toEqual({ r: 1, i: 0 });
  expect(C$(1, 1)).toEqual({ r: 1, i: 1 });
  expect(C$({ r: 1, i: 1 })).toEqual({ r: 1, i: 1 });

  // init with strings
  expect(C$('+1')).toEqual(C$(1));
  expect(C$('1')).toEqual(C$(1, 0));
  expect(C$('1')).toEqual(C$(1));
  expect(C$('-1')).toEqual(C$(-1));

  expect(C$('+i')).toEqual(C$(0, 1));
  expect(C$('i')).toEqual(C$(0, 1));
  expect(C$('-i')).toEqual(C$(0, -1));

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
  expect(C$('PI*5')).toEqual(C$(5 * Math.PI));

  expect(C$('2.4+i*3.2')).toEqual(C$(2.4, 3.2));
  expect(C$('2.4-i*3.2')).toEqual(C$(2.4, -3.2));
  expect(C$('2.4')).toEqual(C$(2.4));
  expect(C$('-2.4')).toEqual(C$(-2.4));
  expect(C$('-2.4-i*3.2')).toEqual(C$(-2.4, -3.2));
  expect(C$('-i*3.2')).toEqual(C$(0, -3.2));

  // with variables
  const vars1 = { a: C$(3), b: C$(7) };
  expect(C$('a', vars1)).toEqual(C$(3));
  expect(C$('-a', vars1)).toEqual(C$(-3));
  expect(C$('a+b', vars1)).toEqual(C$(10));
  expect(C$('a*b', vars1)).toEqual(C$(21));
  expect(C$('(a)+(b)', vars1)).toEqual(C$(10));

  const vars2 = { a: C$(2, 2), b: C$(3, 0) };
  expect(C$('a', vars2)).toEqual(C$(2, 2));
  expect(C$('a+b', vars2)).toEqual(C$(5, 2));
  expect(C$('a*a', vars2)).toEqual(C$(0, 8));
  expect(C$('5*a', vars2)).toEqual(C$(10, 10));
});

test('complexFunction type 1', () => {
  // functions with unbound parameters
  // then C$ return a function, with as many paramters
  // as unbound vars are found in expression
  // C$('z+2') -> (z) => z+2
  // C$('a*b') -> (a,b) => a*b
  // not working with functions yet: => C$('csqr(a)')(1) does not work!

  expect(C$('a+2')(1)).toEqual(C$(3));
  expect(C$('a*b')(I, I)).toEqual(C$(-1));
  expect(C$('a+b')(I, I)).toEqual(C$(0, 2));

  expect(C$('i*a')(I)).toEqual(C$(-1));
  expect(C$('2*a')(I)).toEqual(C$(0, 2));
  expect(C$('a*a')(I)).toEqual(C$(-1));
  expect(C$('2*a')(C$(3, 1))).toEqual(C$(6, 2));
  expect(C$('a*a')(3)).toEqual(C$(9, 0));
  expect(C$('2*a')(C$('3+i'))).toEqual(C$(6, 2));

  expect(C$('z1+z2')(1, I)).toEqual(C$(1, 1));

  expect(C$('a*(b-c)')(3, 5, 1)).toEqual(C$(12));
  expect(C$('a*(b+c)')(C$(3), C$(5), C$(1))).toEqual(C$(18));
});

test('complexFunction type 2', () => {
  // call functions of form (z) => f(z)
  // e.g. csqr = z => C$(z*z)
  expect(csqr(1)).toEqual(C$(1));
  expect(csqr(2)).toEqual(C$(4));
  expect(csqr(I)).toEqual(C$(-1));
  expect(csqr('2*I')).toEqual(C$(-4));

  expect(g('2*I')).toEqual(C$(-2.4, -3.2));
  expect(g('I')).toEqual(C$(0, -1));
});

test('complexFunction type 3', () => {
  expect(C$('g(I)', { g })).toEqual(C$('-i'));
  expect(C$('g(1)', { g })).toEqual(C$('0'));
  expect(C$('g(2*I)', { g })).toEqual(C$('-2.4-i*3.2'));

  expect(C$('g(z)', { z: C$(9), g })).toEqual(C$(64.8));
  expect(C$('g(z)', { z: C$(9, 1), g })).toEqual(C$(63.8019801980198, 16.019801980198018));

  expect(C$('f(z)', { z: C$(1, 1), f })).toEqual(C$(-16, 12));
  expect(C$('f(z)', { z: C$(1, 1), f })).toEqual(C$(-16, 12));

  expect(C$('csqr(z)*csqr(z)', { csqr, z: C$(0, 2) })).toEqual(C$(16, 0));
  expect(C$('f(z)*g(z)', { f, g, z: C$(0, 2) })).toEqual(C$(2.842170943040401e-14, -320));
});

test('external variables or functions', () => {
  xcsqr = csqr;
  a = 3;
  // console.log('XXX', C$('csqr(a)'));
  ff = f;
  gg = g;
  z = C$(0, 2);
  expect(C$('xcsqr(a)')).toEqual(C$(9));
  expect(C$('ff(z)')).toEqual({r:64, i:48});
});

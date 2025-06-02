const math = require('mathjs')
const C$ = (...args) => (typeof args[0] === 'string' ? math.evaluate(...args) : math.complex(...args))

test('simple', () => {
  expect(C$('i*i')).toEqual(C$(-1))
  expect(C$('i * pi * 5')).toEqual(C$(0, 5 * Math.PI))
  expect(C$('1+i')).toEqual(C$(1, 1))
  expect(C$('1+2i')).toEqual(C$(1, 2))
  expect(C$('1-i')).toEqual(C$(1, -1))
  expect(C$('1-2i')).toEqual(C$(1, -2))
  expect(C$('3i')).toEqual(C$(0, 3))
  expect(C$('1 + i*i')).toEqual(C$(0))
})

test('simple function', () => {
  const sqr = C$('f(z) = z^2')
  const f = C$('f(z) = sqr(z) + 1', {sqr})
  const g = z => C$('sqr(z) + 1', { sqr, z })
  expect(f(C$('2 + 3i'))).toEqual(C$(-4, 12))

  expect(C$('sqr(2 + 3i)', { sqr })).toEqual(C$(-5, 12))
  expect(C$('f(2 + 3i)', { f })).toEqual(C$(-4, 12))
  expect(C$('g(2 + 3i)', { g })).toEqual(C$(-4, 12))
})

test('simple calculations with variables 1', () => {
  const vars = { a: 3, b: 7 }
  expect(C$('a', vars)).toEqual(3)
  expect(C$('-a', vars)).toEqual(-3)
  expect(C$('a+b', vars)).toEqual(10)
  expect(C$('a*b', vars)).toEqual(21)
  expect(C$('(a)+(b)', vars)).toEqual(10)
})

test('simple calculations with variables 2', () => {
  const vars = { a: C$('2+2*i'), b: C$(3), c: C$(7) }
  expect(C$('a + b - 2*a', vars)).toEqual(C$('b-a', vars))
  expect(C$('a - b + c', vars)).toEqual(C$('(a - b) + c', vars))
})

test('external variables and functions ', () => {
  const parser = math.parser()
  parser.evaluate('sqr(z) = z*z')
  parser.evaluate('cube(z) = z^3')
  parser.evaluate('pow(z,n) = z^n')
  parser.evaluate('f1(z) = sqr(z)')
  parser.evaluate('f2(z) = f1(z)+1')
  parser.evaluate('f3(z) = -i*(z+1)*(z+1)* z^4')

  expect(parser.evaluate('sqr(3)+2+2')).toEqual(13)
  expect(parser.evaluate('pow(3,2)')).toEqual(9)

  expect(parser.evaluate('sqr(i)')).toEqual(C$(-1))
  expect(parser.evaluate('sqr(2*i)')).toEqual(C$(-4))
  expect(parser.evaluate('cube(2*i)')).toEqual(C$(0, -8))
  expect(parser.evaluate('pow(i,2)')).toEqual(C$(-1, 0))
  expect(parser.evaluate('f1(2*i)')).toEqual(C$(-4))
  expect(parser.evaluate('f2(2*i)')).toEqual(C$(-3))
  expect(parser.evaluate('f3(2*i)')).toEqual(C$(64, 48))

  parser.evaluate('a = 1 + i')
  expect(parser.evaluate('sqr(a)')).toEqual(C$(0, 2))
})

test('functions with several parameters ', () => {
  const parser = math.parser()
  parser.evaluate('f(z1, z2) = z1 + z2')

  expect(parser.evaluate('f( 3+i, 4 )')).toEqual(C$(7, 1))
  expect(parser.evaluate('f( 3+i, 4+7i )')).toEqual(C$(7, 8))
})
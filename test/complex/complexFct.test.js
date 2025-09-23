const C$ = require('../../src/complex/complex')

test('basis tests', () => {
  expect(C$('i')).toEqual(C$(0, 1))
  expect(C$('2*(1+1)')).toEqual(C$('4'))
  expect(C$('2*6')).toEqual(C$('12'))
  expect(C$('1+1')).toEqual(C$('2'))
  expect(C$('1')).toEqual(C$('1'))
  expect(C$('pi')).toEqual(C$(Math.PI))
  expect(cops.toString(C$('1 + 2*i'))).toEqual('1+2i')

  const eulerFormula = C$('e^(i*pi)+1')
  expect(eulerFormula.re).toBe(0)
  expect(Math.abs(eulerFormula.im)).toBeLessThan(1e-15)
})

test('basis function tests ', () => {
  const f1 = C$('z+z')
  const f2 = C$('2*z')
  const f3 = C$('z^2')

  expect(f1(C$(3, 4))).toEqual(C$(6, 8))
  expect(f2(C$(3, 4))).toEqual(C$(6, 8))
  expect(f2(1)).toEqual(C$(2))
  expect(f3(C$(3, 4))).toEqual(C$(-7, 24))
})

test('function test', () => {
  const f1 = C$('2*z')
  const f2 = C$('f1(z)+3', { f1 })
  const f3 = C$('f1(z) + f2(z)', { f1, f2 })
  const f4 = C$('f3(2*f1(z))', { f1, f3 })

  expect(f1(C$(3, 4))).toEqual(C$('6+8*i'))
  expect(f2(C$(3, 4))).toEqual(C$('9+8*i'))
  expect(f3(C$(3, 4))).toEqual(C$('15+16*i'))
  expect(f4(C$(3, 4))).toEqual(C$(51, 64))

  const circleArea = C$('pi*r^2')
  const exponential = C$('e^x')
  expect(circleArea(2)).toEqual(C$(12.566370614359172))
  expect(exponential(2)).toEqual(C$(7.3890560989306495))
})

test('functions with two parameters A', () => {
  const [a, b] = [C$(3, 4), C$(1, 4)]
  const f1 = C$('z1+z2')
  const f2 = C$('f1(a,b)', { f1 })
  expect(f1(a, b)).toEqual(C$(4, 8))
  expect(f2(a, b)).toEqual(C$(4, 8))
})

test('functions with two parameters B', () => {
  const f1 = C$('z1+z2')
  expect(f1(C$(3, 4), C$(1, 4))).toEqual(C$(4, 8))
  const f2 = C$('f1(z1,z2)', { f1 })
  const [a, b] = [C$('3'), C$('3')]
  expect(C$('f2(a, b)', { f2 })(a, b)).toEqual(C$(6))
})

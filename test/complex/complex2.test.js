const C$ = require('../../src/complex/complex')
const cops = require('../../src/complex/cops')

describe('Complex numbers basis tests', () => {
  test('parsing basic numbers', () => {
    expect(C$('i')).toEqual(C$(0, 1))
    expect(C$('1+1')).toEqual(C$('2'))
    expect(C$('2*6')).toEqual(C$('12'))
    expect(C$('1')).toEqual(C$('1'))
    expect(C$('pi')).toEqual(C$(Math.PI))
    expect(C$('e')).toEqual(C$(Math.E))
  })

  test("Euler's formula", () => {
    const eulerFormula = C$('e^(i*pi)+1')
    expect(eulerFormula.re).toBeCloseTo(0)
    expect(eulerFormula.im).toBeCloseTo(0)
  })

  test('toString method', () => {
    expect(cops.toString(C$('1+2*i'))).toEqual('1+2i')
    expect(cops.toString(C$('1'))).toEqual('1')
    expect(cops.toString(C$('i'))).toEqual('i')
    expect(cops.toString(C$('0'))).toEqual('0')
    expect(cops.toString(C$(3, -4))).toEqual('3-4i')
  })
})
describe('Complex number functions', () => {
  test('basis function tests', () => {
    const f1 = C$('z => z+z')
    const f2 = C$('z => 2*z')
    const f3 = C$('z => z^2')

    expect(cops.equals(f1(C$(3, 4)), C$(6, 8))).toBeTruthy()
    expect(cops.equals(f2(C$(3, 4)), C$(6, 8))).toBeTruthy()
    expect(cops.equals(f2(1), C$(2))).toBeTruthy()
    expect(cops.equals(f3(C$(3, 4)), C$(-7, 24))).toBeTruthy()
  })

  test('functions with other functions', () => {
    const f1 = C$('z => 2*z')
    const f2 = C$('z => f1(z)+3', { f1 })
    const f3 = C$('z => f1(z) + f2(z)', { f1, f2 })
    const f4 = C$('z => f3(2*f1(z))', { f1, f3 })

    expect(cops.equals(f1(C$(3, 4)), C$('6+8*i'))).toBeTruthy()
    expect(cops.equals(f2(C$(3, 4)), C$('9+8*i'))).toBeTruthy()
    expect(cops.equals(f3(C$(3, 4)), C$('15+16*i'))).toBeTruthy()
    expect(cops.equals(f4(C$(3, 4)), C$(51, 64))).toBeTruthy()
  })
})

describe('Mathematical functions', () => {
  test('sin and cos', () => {
    const z = C$('pi/2+i')
    const sinZ = C$('z => sin(z)')(z)
    const cosZ = C$('z => cos(z)')(z)
    expect(sinZ.re).toBeCloseTo(Math.cosh(1))
    expect(sinZ.im).toBeCloseTo(0, 3)
    expect(cosZ.re).toBeCloseTo(0, 1)
    expect(cosZ.im).toBeCloseTo(-Math.sinh(1), 1)
  })

  test('sqrt', () => {
    expect(C$('sqrt(4)')).toEqual(C$(2))
    expect(C$('sqrt(0)')).toEqual(C$(0))
  })

  test('exponential and logarithm', () => {
    const z = C$(1, 1)
    const expZ = C$('z => exp(z)')(z)
    expect(expZ.re).toBeCloseTo(Math.E * Math.cos(1))
    expect(expZ.im).toBeCloseTo(Math.E * Math.sin(1))

    const lnZ = C$('z => ln(z)')(expZ)
    expect(lnZ.re).toBeCloseTo(z.re)
    expect(lnZ.im).toBeCloseTo(z.im)
  })
})

describe('Direct cops operations', () => {
  test('arithmetic', () => {
    expect(cops.add({ re: 1, im: 2 }, { re: 3, im: 4 })).toEqual({ re: 4, im: 6 })
    expect(cops.sub({ re: 5, im: 3 }, { re: 2, im: 1 })).toEqual({ re: 3, im: 2 })
    expect(cops.mul({ re: 2, im: 3 }, { re: 4, im: 5 })).toEqual({ re: -7, im: 22 })
    expect(cops.div({ re: 1, im: 0 }, { re: 0, im: 1 }).im).toBeCloseTo(-1)
    expect(cops.neg({ re: 3, im: 4 })).toEqual({ re: -3, im: -4 })
    expect(cops.conj({ re: 3, im: 4 })).toEqual({ re: 3, im: -4 })
    expect(cops.sqr({ re: 3, im: 4 })).toEqual({ re: -7, im: 24 })
    expect(cops.cub({ re: 1, im: 1 }).re).toBeCloseTo(-2)
    expect(cops.cub({ re: 1, im: 1 }).im).toBeCloseTo(2)
    expect(cops.len({ re: 3, im: 4 })).toBe(5)
  })

  test('pow optimizations n=4,5,6 and negative', () => {
    expect(cops.pow({ re: 2, im: 0 }, 4)).toEqual({ re: 16, im: 0 })
    expect(cops.pow({ re: 2, im: 0 }, 5)).toEqual({ re: 32, im: 0 })
    expect(cops.pow({ re: 2, im: 0 }, 6)).toEqual({ re: 64, im: 0 })
    expect(cops.pow({ re: 2, im: 0 }, -1).re).toBeCloseTo(0.5)
  })
})

describe('Functions with multiple parameters', () => {
  test('functions with two parameters A', () => {
    const [a, b] = [C$(3, 4), C$(1, 4)]
    const f1 = C$('(z1,z2) =>z1+z2')
    const f2 = C$('(a,b) =>f1(a,b)', { f1 })
    expect(cops.equals(f1(a, b), C$(4, 8))).toBeTruthy()
    expect(cops.equals(f2(a, b), C$(4, 8))).toBeTruthy()
  })

  test('functions with two parameters B', () => {
    const f1 = C$('(z1,z2) => z1+z2')
    expect(f1(C$(3, 4), C$(1, 4))).toEqual(C$(4, 8))
    const f2 = C$('(z1,z2) => f1(z1,z2)', { f1 })
    const [a, b] = [C$('3'), C$('3')]
    expect(C$('(a,b) => f2(a, b)', { f2 })(a, b)).toEqual(C$(6))
  })
})

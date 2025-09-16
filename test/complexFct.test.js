const { Complex, complex } = require('../src/complexFct')
const C$ = complex

test('basis tests 1 ', () => {
  const eulerFormula = Complex('e^(i*pi)')
  expect(Complex('i')).toEqual(C$(0, 1))
  expect(Complex('pi')).toEqual(C$(Math.PI))
  expect(eulerFormula.re).toBe(-1)
   expect(Math.abs(eulerFormula.im)).toBeLessThan(1e-15)
})

test('basis tests 2 ', () => {
  const f1 = Complex('z+z', 'f1')
  const f2 = Complex('2*z', 'f2')
  const f3 = Complex('z^2', 'f3')
  const f4 = Complex('f3(f1(z))', 'f4')

  expect(f1(C$(3, 4))).toEqual(C$(6, 8))
  expect(f2(C$(3, 4))).toEqual(C$(6, 8))
  expect(f2(1)).toEqual(C$(2))
  expect(f3(C$(3, 4))).toEqual(C$(-6.999999999999997, 24))
  expect(f4(C$(3, 4))).toEqual(C$(-28.000000000000004, 96.00000000000004))
})

test('implicit functions 1', () => {
  const f1 = Complex('2*z', 'f1')
  const f2 = Complex('f1(z)+3', 'f2')
  const f3 = Complex('f1(z) + f2(z)', 'f3')
  const circleArea = Complex('pi*r^2')
  const exponential = Complex('e^x')

  expect(f1(complex(3, 4)).toString()).toEqual('6+8i')
  expect(f2(complex(3, 4)).toString()).toEqual('9+8i')
  expect(f3(complex(3, 4)).toString()).toEqual('15+16i')
  expect(circleArea(complex(2))).toEqual(C$(12.566370614359172))
  expect(exponential(complex(2))).toEqual(C$(7.38905609893065))
})

test('implicit functions 2 ', () => {
  const f1 = Complex('z1+z2', 'f1')
  const f2 = Complex('z1 + z2 + z1*z2', 'f2')
  expect(f1(C$(3, 4), C$(1, 4))).toEqual(C$(4, 8))
  expect( f2(complex(3, 4), complex(1, -2))).toEqual(C$(15, 0))
})

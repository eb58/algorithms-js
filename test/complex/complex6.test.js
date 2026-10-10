const math = require('mathjs')
const C$ = require('../../src/complex/complex')
const cops = require('../../src/complex/cops')

const closeTo = (actual, expected, tolerance = 1e-11) => {
  const expectedValue = typeof expected === 'number' ? { re: expected, im: 0 } : expected
  const scale = Math.max(1, Math.hypot(expectedValue.re, expectedValue.im))
  expect(Math.hypot(actual.re - expectedValue.re, actual.im - expectedValue.im)).toBeLessThanOrEqual(tolerance * scale)
}

const createRandom = (initialSeed) => {
  let seed = initialSeed >>> 0
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
}

describe('branch cuts', () => {
  test('sqrt observes the signed side of the negative real axis', () => {
    expect(cops.sqrt({ re: -4, im: 0 })).toEqual({ re: 0, im: 2 })
    expect(cops.sqrt({ re: -4, im: -0 })).toEqual({ re: 0, im: -2 })
  })

  test('ln approaches opposite arguments above and below its cut', () => {
    const above = cops.ln({ re: -2, im: Number.EPSILON })
    const below = cops.ln({ re: -2, im: -Number.EPSILON })
    expect(above.re).toBeCloseTo(Math.log(2), 14)
    expect(below.re).toBeCloseTo(Math.log(2), 14)
    expect(above.im).toBeCloseTo(Math.PI, 14)
    expect(below.im).toBeCloseTo(-Math.PI, 14)
  })

  test('fractional powers select conjugate values on opposite sides of the cut', () => {
    const above = cops.pow({ re: -4, im: Number.EPSILON }, 0.5)
    const below = cops.pow({ re: -4, im: -Number.EPSILON }, 0.5)
    closeTo(above, { re: 0, im: 2 })
    closeTo(below, { re: 0, im: -2 })
  })

  test('inverse functions agree with mathjs near their branch cuts', () => {
    const samples = [
      { re: -2, im: 1e-10 },
      { re: -2, im: -1e-10 },
      { re: 2, im: 1e-10 },
      { re: 2, im: -1e-10 }
    ]

    for (const name of ['asin', 'acos', 'atanh']) {
      for (const z of samples) {
        closeTo(cops[name](z), math[name](math.complex(z.re, z.im)), 1e-9)
      }
    }
  })
})

describe('deterministic complex properties', () => {
  const random = createRandom(0x5eed1234)
  const sample = () => C$(random() * 6 - 3, random() * 6 - 3)

  test('preserves core algebraic identities', () => {
    for (let index = 0; index < 250; index++) {
      const a = sample()
      const b = sample()
      const c = sample()

      closeTo(cops.add(a, b), cops.add(b, a))
      closeTo(cops.mul(a, cops.add(b, c)), cops.add(cops.mul(a, b), cops.mul(a, c)))
      closeTo(cops.mul(a, cops.conj(a)), { re: cops.len(a) ** 2, im: 0 })
      closeTo(cops.exp(cops.ln(a)), a)
      closeTo(cops.sqr(cops.sqrt(a)), a)
    }
  })

  test('matches mathjs for elementary and inverse functions', () => {
    const functions = ['sqrt', 'exp', 'sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh', 'asin', 'acos', 'atan', 'asinh', 'acosh', 'atanh']

    for (let index = 0; index < 100; index++) {
      const z = sample()
      const reference = math.complex(z.re, z.im)
      closeTo(cops.ln(z), math.log(reference))
      for (const name of functions) closeTo(cops[name](z), math[name](reference), 1e-9)
    }
  })

  test('matches mathjs when parsing representative arithmetic expressions', () => {
    for (let index = 0; index < 100; index++) {
      const z = sample()
      const ours = C$.evaluate('(z^3 + 2*z - i) / (z^2 + 1)', { z })
      const reference = math.evaluate('(z^3 + 2*z - i) / (z^2 + 1)', { z: math.complex(z.re, z.im) })
      closeTo(ours, reference, 1e-9)
    }
  })
})

const C$ = require('../../src/complex/complex')
const cops = require('../../src/complex/cops')
const tokenizer = require('../../src/complex/tokenizer')

describe('parser precedence and validation', () => {
  test('applies exponentiation before unary signs', () => {
    expect(C$('-2^2')).toEqual(C$(-4))
    expect(C$('(-2)^2')).toEqual(C$(4))
    expect(C$('2^-2')).toEqual(C$(0.25))
  })

  test('supports zero-argument functions and validates parameters', () => {
    const answer = () => C$(42)
    expect(C$('answer()', { answer })).toEqual(C$(42))
    expect(() => C$('(x,x) => x')).toThrow('Duplicate parameter name')
    expect(() => C$('(x-y) => x')).toThrow('Invalid parameter name')
    expect(() => C$('x =>')).toThrow('Function expression must not be empty')
  })

  test('exposes structured syntax and tokenizer errors', () => {
    expect(() => C$('2+')).toThrow(C$.ComplexSyntaxError)
    expect(() => C$('2+')).toThrow('Operand expected')
    expect(() => tokenizer('2#')).toThrow(tokenizer.TokenizerError)
    expect(() => tokenizer('2#')).toThrow('Char # not allowed')
  })

  test('rejects non-finite complex values', () => {
    expect(() => C$(Number.NaN)).toThrow('finite numbers')
    expect(() => C$(1, Number.POSITIVE_INFINITY)).toThrow('finite numbers')
    expect(() => C$('z', { z: Number.NaN })).toThrow('finite number')
  })
})

describe('complex arithmetic edge cases', () => {
  test('preserves basic algebraic identities', () => {
    const samples = [C$(1, 2), C$(-3, 0.5), C$(0, -4)]
    samples.forEach((a, index) => {
      const b = samples[(index + 1) % samples.length]
      const c = samples[(index + 2) % samples.length]
      expect(cops.equals(cops.add(a, b), cops.add(b, a))).toBeTruthy()
      expect(cops.equals(cops.mul(a, cops.add(b, c)), cops.add(cops.mul(a, b), cops.mul(a, c)))).toBeTruthy()
      expect(cops.equals(cops.mul(a, cops.div(b, b)), a)).toBeTruthy()
    })
  })

  test('uses fast integer powers and protects singular operations', () => {
    expect(cops.pow(C$(2), 100)).toEqual(C$(2 ** 100))
    expect(() => cops.div(C$(1), C$(0))).toThrow('Division by zero')
    expect(() => C$('1/0')).toThrow('Division by zero')
    expect(() => cops.ln(C$(0))).toThrow('Logarithm of zero')
    expect(() => cops.pow(C$(0), C$(1, 1))).toThrow('complex power')
  })

  test('compares values with a scale-aware tolerance', () => {
    expect(cops.equals(C$(1e12), C$(1e12 + 0.001))).toBeTruthy()
    expect(cops.equals(C$(1e12), C$(1e12 + 1))).toBeFalsy()
    expect(cops.equals(C$(1), C$(1.001), 0.01)).toBeTruthy()
  })

  test('formats negative unit imaginary values cleanly', () => {
    expect(cops.toString(C$(0, -1))).toBe('-i')
    expect(cops.toString(C$(3, -1))).toBe('3-i')
    expect(cops.toString(C$(0, 2))).toBe('2i')
  })
})

describe('additional complex functions', () => {
  test('provides magnitude, phase, components and polar conversion', () => {
    const z = C$(3, 4)
    expect(cops.abs(z)).toBe(5)
    expect(cops.arg(z)).toBeCloseTo(Math.atan2(4, 3))
    expect(cops.real(z)).toBe(3)
    expect(cops.imag(z)).toBe(4)
    expect(cops.equals(cops.polar(5, Math.atan2(4, 3)), z)).toBeTruthy()
    expect(() => cops.polar(-1, 0)).toThrow('must not be negative')
  })

  test('supports trigonometric and hyperbolic functions', () => {
    expect(cops.equals(C$('tan(pi/4)'), C$(1))).toBeTruthy()
    expect(C$('atan(1)').re).toBeCloseTo(Math.PI / 4)
    expect(C$('acos(1)')).toEqual(C$(0))
    expect(C$('atanh(0)')).toEqual(C$(0))
    expect(cops.sinh(C$(0))).toEqual(C$(0))
    expect(cops.cosh(C$(0))).toEqual(C$(1))
    expect(cops.tanh(C$(0))).toEqual(C$(0))
  })

  test('round-trips inverse functions on real values', () => {
    const value = C$(0.3)
    expect(cops.sin(cops.asin(value)).re).toBeCloseTo(value.re)
    expect(cops.tan(cops.atan(value)).re).toBeCloseTo(value.re)
    expect(cops.sinh(cops.asinh(value)).re).toBeCloseTo(value.re)
    expect(cops.cosh(cops.acosh(C$(1.5))).re).toBeCloseTo(1.5)
  })
})

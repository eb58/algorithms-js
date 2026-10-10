const C$ = require('../../src/complex/complex')
const cops = require('../../src/complex/cops')
const tokenizer = require('../../src/complex/tokenizer')

describe('explicit C$ API', () => {
  test('constructs, evaluates and compiles without overload ambiguity', () => {
    expect(C$.fromParts(3, -4)).toEqual(C$(3, -4))
    expect(C$.evaluate('offset + i', { offset: 2 })).toEqual(C$(2, 1))

    const square = C$.compile('z => z^2')
    expect(square(C$(1, 2))).toEqual(C$(-3, 4))
  })

  test('rejects the wrong source kind for explicit entry points', () => {
    expect(() => C$.evaluate('z => z')).toThrow('C$.evaluate expects an expression')
    expect(() => C$.compile('1 + 2')).toThrow('C$.compile expects a function definition')
    expect(() => C$.fromParts(Number.NaN, 0)).toThrow('Complex parts must be finite numbers')
  })
})

describe('parser precedence and validation', () => {
  test('applies exponentiation before unary signs', () => {
    expect(C$('-2^2')).toEqual(C$(-4))
    expect(C$('(-2)^2')).toEqual(C$(4))
    expect(C$('2^-2')).toEqual(C$(0.25))
  })

  test('supports zero-argument functions and validates parameters', () => {
    const answer = () => C$(42)
    expect(C$('answer()', { answer })).toEqual(C$(42))
    const compiledAnswer = C$('() => 6 * 7')
    expect(compiledAnswer).toEqual(expect.any(Function))
    expect(compiledAnswer()).toEqual(C$(42))
    expect(() => C$('(x,x) => x')).toThrow('Duplicate parameter name')
    expect(() => C$('(x-y) => x')).toThrow('Invalid parameter name')
    expect(() => C$('x =>')).toThrow('Function expression must not be empty')
  })

  test('keeps binary operator associativity explicit', () => {
    expect(C$('10-3-2')).toEqual(C$(5))
    expect(C$('16/4/2')).toEqual(C$(2))
    expect(C$('2^3^2')).toEqual(C$(512))
  })

  test('parses nested function arguments and rejects incomplete lists', () => {
    const sum = (left, right) => cops.add(left, right)
    expect(C$('sum(1, sum(2, 3))', { sum })).toEqual(C$(6))
    expect(() => C$('sum(,1)', { sum })).toThrow('Expected an operand')
    expect(() => C$('sum(1,)', { sum })).toThrow('Expected an operand')
    expect(() => C$('sum(1 2)', { sum })).toThrow('Expected ")" to close function call')
  })

  test('validates known function arities while allowing flexible scope functions', () => {
    expect(() => C$('pow(2)')).toThrow('Function "pow" expects 2 arguments, received 1')
    expect(() => C$('sin(1, 2)')).toThrow('Function "sin" expects 1 arguments, received 2')
    const pair = C$.compile('(left, right) => left + right')
    expect(() => C$('pair(1)', { pair })).toThrow('Function "pair" expects 2 arguments, received 1')

    const optional = (value, increment = 1) => cops.add(value, increment)
    expect(C$('optional(2)', { optional })).toEqual(C$(3))
  })

  test('exposes structured syntax and tokenizer errors', () => {
    expect(() => C$('2+')).toThrow(C$.ComplexSyntaxError)
    expect(() => C$('2+')).toThrow('Expected an operand')
    expect(() => tokenizer('2#')).toThrow(tokenizer.TokenizerError)
    expect(() => tokenizer('2#')).toThrow('Unexpected character "#" at position 1')
  })

  test('rejects non-finite complex values', () => {
    expect(() => C$(Number.NaN)).toThrow('finite numbers')
    expect(() => C$(1, Number.POSITIVE_INFINITY)).toThrow('finite numbers')
    expect(() => C$('z', { z: Number.NaN })).toThrow('finite number')
  })
})

describe('tokenizer', () => {
  test('exposes stable token types and tokenizes operators', () => {
    const stream = tokenizer('value ** 2, i')
    expect(tokenizer.TOKENS).toBe(stream.getTOKENS())
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.ident, name: 'value' })
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.pow })
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.number, value: 2 })
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.comma })
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.ident, name: 'i' })
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.end })
  })

  test('validates input and reports structured error positions', () => {
    expect(() => tokenizer()).toThrow('Tokenizer input must be a string')

    try {
      tokenizer('12 # 3')
    } catch (error) {
      expect(error).toBeInstanceOf(tokenizer.TokenizerError)
      expect(error.input).toBe('12 # 3')
      expect(error.position).toBe(3)
      expect(error.message).toBe('Unexpected character "#" at position 3')
    }
  })

  test('records start and end offsets for every token', () => {
    const stream = tokenizer('  alpha + 12')
    expect(stream.consume()).toMatchObject({ name: 'alpha', start: 2, end: 7 })
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.plus, start: 8, end: 9 })
    expect(stream.consume()).toMatchObject({ value: 12, start: 10, end: 12 })
    expect(stream.consume()).toMatchObject({ symbol: tokenizer.TOKENS.end, start: 12, end: 12 })
  })
})

describe('complex arithmetic edge cases', () => {
  test('accepts real scalars and rejects malformed operands', () => {
    expect(cops.add(2, C$(3, 4))).toEqual(C$(5, 4))
    expect(cops.mul(C$(1, 2), 3)).toEqual(C$(3, 6))
    expect(() => cops.add({ re: 1 }, C$(2))).toThrow('left operand must be a finite number or complex value')
    expect(() => cops.equals(C$(1), C$(1), -1)).toThrow('Tolerance must be a non-negative finite number')
  })

  test('keeps built-in constants immutable', () => {
    expect(Object.isFrozen(cops.i)).toBeTruthy()
    expect(Object.isFrozen(cops.pi)).toBeTruthy()
    expect(Object.isFrozen(cops.e)).toBeTruthy()
  })

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

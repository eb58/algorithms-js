const C$ = require('../../src/complex/complex')
const cops = require('../../src/complex/cops')

describe('strict complex expression syntax', () => {
  test('supports implicit multiplication', () => {
    expect(C$('2z', { z: C$(3) })).toEqual(C$(6))
    expect(C$('3i')).toEqual(C$(0, 3))
    expect(C$('2e')).toEqual(C$(2 * Math.E))
    expect(C$('2sin(0)')).toEqual(C$(0))
    expect(() => C$('2(3)')).toThrow('Unexpected symbol')
  })

  test('rejects trailing input and unknown identifiers', () => {
    expect(() => C$('2+')).toThrow('Operand expected')
    expect(() => C$('unknown')).toThrow('Unknown identifier unknown')
    expect(() => C$('invalid', { invalid: null })).toThrow('Invalid value for identifier invalid')
  })

  test('accepts valid decimal notation', () => {
    expect(C$('1.25e2')).toEqual(C$(125))
    expect(C$('.5')).toEqual(C$(0.5))
  })

  test('rejects malformed numbers', () => {
    ;['.', '1.', '1.2.3'].forEach((expression) => {
      expect(() => C$(expression)).toThrow('Invalid number')
    })
    expect(() => C$('1e+')).toThrow('Operand expected')
  })
})

describe('negative real powers', () => {
  test('calculates negative integer powers', () => {
    expect(cops.pow(C$(2), -1)).toEqual(C$(0.5))
    expect(cops.pow(C$(-2), -2)).toEqual(C$(0.25))
  })

  test('rejects zero to a negative power', () => {
    expect(() => cops.pow(C$(0), -1)).toThrow('Zero cannot be raised to a negative power')
  })
})

describe('additional parser and math edge cases', () => {
  test('checks function argument counts', () => {
    const identity = C$('x => x')

    expect(() => identity()).toThrow()
    expect(() => identity(1, 2)).toThrow()
  })

  test('supports alternate and right-associative powers', () => {
    expect(C$('2**3')).toEqual(C$(8))
    expect(C$('2^3^2')).toEqual(C$(512))
    expect(cops.pow(C$(2), 7)).toEqual(C$(128))
  })

  test('supports implicit multiplication around identifiers', () => {
    expect(C$('2 z', { z: C$(3) })).toEqual(C$(6))
    expect(C$('(1+i)z', { z: C$(2) })).toEqual(C$(2, 2))
  })

  test('handles fractional negative powers and complex square roots', () => {
    expect(C$('2^-0.5').re).toBeCloseTo(1 / Math.sqrt(2))
    expect(C$('sqrt(-1)')).toEqual(C$(0, 1))
  })

  test('rejects numeric overflow', () => {
    expect(() => C$('1e309')).toThrow('Invalid number')
  })
})

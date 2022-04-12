const { evalComplex, evalScalar } = require('../src/complex')

test('exceptions', () => {
  expect(() => evalScalar('p+5')).toThrow('Unknow identifier <p>. Pos:1')
  expect(() => evalScalar('(1+5')).toThrow('Closing bracket not found!')
  expect(() => evalScalar('1+')).toThrow('Operand expected.')
  expect(() => evalScalar('%1+')).toThrow('Char % not allowed. Pos:0')
  expect(() => evalScalar('1+3 sa')).toThrow('Unexpected symbol <sa>. Pos:6')

  expect(() => evalComplex('p+5')).toThrow('Unknow identifier <p>. Pos:1')
  expect(() => evalComplex('p*5')).toThrow('Unknow identifier <p>. Pos:1')
})

test('evalScalar', () => {
  expect(evalScalar('0')).toBe(0)
  expect(evalScalar('+0')).toBe(0)
  expect(evalScalar('-0')).toBe(0)

  expect(evalScalar('5')).toBe(5)
  expect(evalScalar('+5')).toBe(5)
  expect(evalScalar('-5')).toBe(-5)
  expect(evalScalar('--5')).toBe(5)
  expect(evalScalar(' 5 ')).toBe(5)
  expect(evalScalar('( 5 )')).toBe(5)
  expect(evalScalar('-( 5 )')).toBe(-5)
  expect(evalScalar('5*-3')).toBe(-15)
  expect(evalScalar('-5*3')).toBe(-15)
  expect(evalScalar('--5*-3')).toBe(-15)

  expect(evalScalar('1+3')).toBe(4)
  expect(evalScalar('1+3+5')).toBe(9)
  expect(evalScalar('2*7+3')).toBe(17)
  expect(evalScalar('1+3+5')).toBe(9)
  expect(evalScalar('3*3')).toBe(9)
  expect(evalScalar('1*2*3*4')).toBe(24)
  expect(evalScalar('(1+1)*(3+3)')).toBe(12)
  expect(evalScalar('(7+4*3+13)')).toBe(32)
  expect(evalScalar('(1+1)*(3*3)')).toBe(18)
  expect(evalScalar('3*3+5*5')).toBe(34)
  expect(evalScalar('3*(3+5)*5')).toBe(120)

  expect(evalScalar('3/5')).toBe(3 / 5)
  expect(evalScalar('PI*3')).toBe(Math.PI * 3)
  expect(evalScalar('pi*3')).toBe(Math.PI * 3)
  expect(evalScalar('E*3')).toBe(Math.exp(1) * 3)

  expect(evalScalar('1/2')).toBe(0.5)
  expect(evalScalar('0.5')).toBe(0.5)
  expect(evalScalar('0.5 * 3')).toBe(1.5)

  // with variables
  const [a, b] = [3, 7]
  vars = { a, b }
  expect(evalScalar('a', vars)).toBe(3)
  expect(evalScalar('-a', vars)).toBe(-3)
  expect(evalScalar('a+b', vars)).toBe(10)
  expect(evalScalar('a*b', vars)).toBe(21)
  expect(evalScalar('(a)+(b)', vars)).toBe(10)

  // with variables and functions
  vars = { a, b, f: (x) => x * x }
  expect(evalScalar('f(7)', vars)).toBe(49)
  expect(evalScalar('f(5)', vars)).toBe(25)
  expect(evalScalar('f(5)*f(5)', vars)).toBe(625)

  expect(evalScalar('f(a)', vars)).toBe(9)
  expect(evalScalar('f(b)', vars)).toBe(49)
  expect(evalScalar('10+f(b)', vars)).toBe(59)
})

test('evalComplex', () => {
  expect(C$('+i')).toEqual(C$(0, 1))
  expect(C$('i')).toEqual(C$(0, 1))
  expect(C$('i*i')).toEqual(C$(-1))
  expect(C$('i*i*i')).toEqual(C$(0, -1))
  expect(C$('i*i*i*i')).toEqual(C$(1))
  expect(C$('i*i*i*i')).toEqual(C$(1, 0))
  expect(C$('1+2*i')).toEqual(C$(1, 2))
  expect(C$('(1+2)*i')).toEqual(C$(0, 3))
  expect(C$('1+i*i')).toEqual(C$(0))
  expect(C$('(1+i)*i')).toEqual(C$(-1, 1))
  expect(C$('1+i')).toEqual(C$(1, 1))
  expect(C$('3*(1+i)')).toEqual(C$(3, 3))
  expect(C$('2*(1+i)*2')).toEqual(C$(4, 4))
  expect(C$('(1+i)*5')).toEqual(C$(5, 5))
  expect(C$('PI*5')).toEqual(C$(5 * Math.PI))

  // with variables
  vars = { a: C$(3), b: C$(7) }
  expect(C$('a', vars)).toEqual(C$(3))
  expect(C$('-a', vars)).toEqual(C$(-3))
  expect(C$('a+b', vars)).toEqual(C$(10))
  expect(C$('a*b', vars)).toEqual(C$(21))
  expect(C$('(a)+(b)', vars)).toEqual(C$(10))

  vars = { a: C$(2, 2), b: C$(3, 0) }
  expect(C$('a', vars)).toEqual(C$(2, 2))
  expect(C$('a+b', vars)).toEqual(C$(5, 2))
  expect(C$('a*a', vars)).toEqual(C$(0, 8))
  expect(C$('5*a', vars)).toEqual(C$(10, 10))
})

test('complexFunction', () => {
  const I = C$(0, 1)

  expect(C$('a*(b-c)')(C$(3), C$(5), C$(1))).toEqual(C$(12))
  expect(C$('a*(b+c)')(C$(3), C$(5), C$(1))).toEqual(C$(18))
  expect(C$('a*b')(I, I)).toEqual(C$(-1))
  expect(C$('a+b')(I, I)).toEqual(C$(0, 2))

  expect(C$('i*a')(I)).toEqual(C$(-1))
  expect(C$('2*a')(I)).toEqual(C$(0, 2))
  expect(C$('a*a')(I)).toEqual(C$(-1))
  expect(C$('2*a')(C$(3, 1))).toEqual(C$(6, 2))
  expect(C$('a*a')(3)).toEqual(C$(9, 0))

  expect(C$('2*a')(C$('3+i'))).toEqual(C$(6, 2))
  expect(C$('z1+z2')(C$(1), I)).toEqual(C$(1, 1)) 


  const csqr = C$('z*z');
  const x = C$("2*I")
  expect(csqr(I)).toEqual(C$(-1)) 
  expect(csqr(1)).toEqual(C$(1)) 
  expect(csqr(2)).toEqual(C$(4)) 
  expect(csqr(x)).toEqual(C$(-4)) 


  //const g = C$('z*z*(z-1)/(z+1)')
  // const a = C$('(z+1)*-i')
  // const f = C$('-i*(z+1)*(z+1)*(z*z*z*z)')
})

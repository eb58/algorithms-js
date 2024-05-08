const { evalScalar } = require('../src/complex');

test('exceptions', () => {
  expect(() => evalScalar('(1+5')).toThrow('Closing bracket not found!');
  expect(() => evalScalar('1+')).toThrow('Operand expected. Pos:2');
  expect(() => evalScalar('%1+')).toThrow('Char % not allowed. Pos:0');
  expect(() => evalScalar('1+3 sa')).toThrow('Unexpected symbol <sa>. Pos:6');
});

test('evalScalar 1', () => {
    expect(evalScalar('0')).toBe(0);
    expect(evalScalar('+0')).toBe(0);
    expect(evalScalar('-0')).toBe(-0);
  
    expect(evalScalar('5')).toBe(5);
    expect(evalScalar('+5')).toBe(5);
    expect(evalScalar('-5')).toBe(-5);
    expect(evalScalar('--5')).toBe(5);
    expect(evalScalar(' 5 ')).toBe(5);
    expect(evalScalar('( 5 )')).toBe(5);
    expect(evalScalar('-( 5 )')).toBe(-5);
    expect(evalScalar('5*-3')).toBe(-15);
    expect(evalScalar('-5*3')).toBe(-15);
    expect(evalScalar('--5*-3')).toBe(-15);
  
    expect(evalScalar('1+3')).toBe(4);
    expect(evalScalar('1+3+5')).toBe(9);
    expect(evalScalar('2*7+3')).toBe(17);
    expect(evalScalar('1+3+5')).toBe(9);
    expect(evalScalar('3*3')).toBe(9);
    expect(evalScalar('1*2*3*4')).toBe(24);
    expect(evalScalar('(1+1)*(3+3)')).toBe(12);
    expect(evalScalar('(7+4*3+13)')).toBe(32);
    expect(evalScalar('(1+1)*(3*3)')).toBe(18);
    expect(evalScalar('3*3+5*5')).toBe(34);
    expect(evalScalar('3*(3+5)*5')).toBe(120);
  
    expect(evalScalar('3/5')).toBe(3 / 5);
    expect(evalScalar('PI*3')).toBe(Math.PI * 3);
    expect(evalScalar('pi*3')).toBe(Math.PI * 3);
    expect(evalScalar('E*3')).toBe(Math.exp(1) * 3);
  
    expect(evalScalar('1/2')).toBe(0.5);
    expect(evalScalar('0.5')).toBe(0.5);
    expect(evalScalar('0.5 * 3')).toBe(1.5);
  
    // with variables
    const vars1 = { a: 3, b: 7 };
    expect(evalScalar('a', vars1)).toBe(3);
    expect(evalScalar('-a', vars1)).toBe(-3);
    expect(evalScalar('a+b', vars1)).toBe(10);
    expect(evalScalar('a*b', vars1)).toBe(21);
    expect(evalScalar('(a)+(b)', vars1)).toBe(10);
  });
  
  test('evalScalar 2', () => {
    const f = (x) => x * x;
    // with variables and functions
    expect(evalScalar('f(7)', { f })).toBe(49);
    expect(evalScalar('f(5)', { f })).toBe(25);
    expect(evalScalar('f(5)*f(5)', { f })).toBe(625);
  
    // with variables and functions
    const vars2 = { a: 3, b: 7, f };
    expect(evalScalar('f(a)', vars2)).toBe(9);
    expect(evalScalar('f(b)', vars2)).toBe(49);
    expect(evalScalar('10+f(b)', vars2)).toBe(59);
  });
  
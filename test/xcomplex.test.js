const { evalComplex, evalScalar } = require('../src/complex')

test('evalScalar', () => {
  // with variables and functions
  const [a, b] = [3, 7]
  // const vars = { a, b }
  const vars = { a, b, f: (x) => x * x }
  console.log( evalScalar('f(5)*f(5)', vars) ) 
})

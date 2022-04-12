const { evalComplex, evalScalar } = require('../src/complex')

test('evalScalar', () => {
  // with variables and functions
  const [a, b] = [3, 7]
  vars = { a, b }
  vars = { a, b, f: (x) => x * x }
  evalScalar('f(5)*f(5)', vars)
})

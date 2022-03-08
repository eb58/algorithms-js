C$ = (r, i) => (typeof r === 'number' ? { r, i: i || 0 } : r)
feedx = (x, f) => f(x)
uniq = (xs) => Array.from(new Set(xs))

cops = {
  id: (x) => C$(x),
  neg: (c) => C$(-c.r, -c.i),
  add: (c1, c2) => C$(c1.r + c2.r, c1.i + c2.i),
  sub: (c1, c2) => C$(c1.r - c2.r, c1.i - c2.i),
  mul: (c1, c2) => C$(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r),
  div: (c1, c2) => feedx(c2.r * c2.r + c2.i * c2.i, (x) => C$((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x)),
}

sops = {
  id: (x) => x,
  neg: (x) => -x,
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  mul: (x, y) => x * y,
  div: (x, y) => x / y,
}

csops = {
  id: (x) => `C$(${x})`,
  neg: (x) => `C$(-${x})`,
  add: (x, y) => `cops.add(C$(${x}), C$(${y}))`,
  sub: (x, y) => `cops.sub(C$(${x}), C$(${y}))`,
  mul: (x, y) => `cops.mul(C$(${x}), C$(${y}))`,
  div: (x, y) => `cops.div(C$(${x}), C$(${y}))`,
}

tokens = ['ident', 'number', 'minus', 'plus', 'times', 'divide', 'lparen', 'rparen', 'end'].reduce(
  (acc, s) => ({ ...acc, [s]: s }),
  {}
)

lexParser = (input) => {
  mapCharToToken = {
    '+': tokens.plus,
    '-': tokens.minus,
    '*': tokens.times,
    '/': tokens.divide,
    '(': tokens.lparen,
    ')': tokens.rparen,
  }

  let strpos = 0

  isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
  isDigit = (c) => c >= '0' && c <= '9'
  isNumberChar = (c) => isDigit(c) || c === '.'
  isIdentifierChar = (c) => isLetter(c) || isDigit(c)
  isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r'
  getIdentOrNumber = (qualifier) => (qualifier(input[strpos]) ? input[strpos++] + getIdentOrNumber(qualifier) : '')

  getIdentifier = () => ({
    token: tokens.ident,
    name: getIdentOrNumber(isIdentifierChar),
    strpos,
  })

  getNumber = () => ({
    token: tokens.number,
    value: parseFloat(getIdentOrNumber(isNumberChar)),
    strpos,
  })

  return {
    getToken: () => {
      while (isSpace(input[strpos])) strpos++
      if (strpos >= input.length) return tokens.end

      const c = input[strpos]
      if (isLetter(c)) return getIdentifier()
      if (isDigit(c)) return getNumber()
      if (!mapCharToToken[c]) throw `Char ${c} not allowed. Pos:${strpos}`
      return {
        strpos: ++strpos,
        token: mapCharToToken[c],
      }
    },
  }
}

doEval = (s, variables, ops) => {
  const CONSTS = {
    I: ops === csops ? 'C$(0, 1)' : C$(0, 1),
    PI: Math.PI,
    E: Math.exp(1),
  }

  variables = variables || {}
  ops = ops || sops
  let token
  let params = []

  operand = () => {
    const op = () => {
      if (token.token === tokens.minus) return ops.neg(operand())
      if (token.token === tokens.number) return ops.id(token.value)
      if (token.token === tokens.ident) {
        let ret = CONSTS[token.name.toUpperCase()] || variables[token.name]
        if (ret === undefined && ops === csops) {
          ret = token.name
          params = uniq([...params, token.name])
        }
        if (ret === undefined) throw `Unknow identifier <${token.name}>. Pos:${token.strpos}`
        return ret
      }
      if (token.token === tokens.lparen) {
        const ret = expression()
        if (token.token !== tokens.rparen) {
          throw `Closing bracket not found!. Pos:${token.strpos}`
        }
        return ret
      }
      throw `Operand expected.`
    }

    token = lex.getToken()
    const ret = op()
    token = lex.getToken()
    return ret
  }

  term = () => {
    let val = operand()
    if (token.token === tokens.times) {
      return ops.mul(val, term())
    } else if (token.token === tokens.divide) {
      return ops.div(val, term())
    }
    return val
  }

  expression = () => {
    let val = term()
    if (token.token === tokens.plus) {
      return ops.add(val, expression())
    } else if (token.token === tokens.minus) {
      return ops.sub(val, expression())
    }
    return val
  }

  const lex = lexParser(s)
  const val = expression()
  if (token != tokens.end) throw `Unexpected symbol <${token.name}>. Pos:${token.strpos}`

  if (ops === csops) {
    console.log(val)
    return eval(`(${params.join(',')}) => ${val}`)
  } else if (ops === cops) {
    if (val.i === -0) val.i = 0
    if (val.r === -0) val.r = 0
  }

  return val
}

evalScalar = (s, variables) => doEval(s, variables, sops)
evalComplex = (s, variables) => doEval(s, variables, cops)
complexFunction = (s) => doEval(s, {}, csops)

f = complexFunction('2*a')
a = C$(3, 1)
console.log('xxx', f(a))

f = complexFunction('a*a')
v = f(C$(3, 1))
console.log('AAA', v)

f = complexFunction('a*(b-c)')
v = f(C$(3), C$(5), C$(1))
console.log('AAA', v)

const I = C$(0, 1)
console.log('BBB', complexFunction('a*b')(I, I))
console.log('CCC', complexFunction('a+b')(I, I))
console.log('DDD', complexFunction('i*i')())
// const z = complexFunction("I*a")(C$(0,1))

// const I = C$(0, 1)
// console.log('BBB', complexFunction('a*b')(I, I))
// console.log('CCC', complexFunction('a+b')(I, I))
// const z = genFct("I*a")(C$(0,1))

module &&
  (module.exports = {
    evalScalar,
    evalComplex,
    complexFunction,
  })

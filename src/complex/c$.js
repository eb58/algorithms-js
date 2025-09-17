if (typeof tokenizer === 'undefined') tokenizer = require('./tokenizer.js')
if (typeof cops === 'undefined') cops = require('./cops.js')

const C$ = (() => {
  const evalComplex = (s, varsOrFcts = {}) => {
    const t = tokenizer(s)
    const tokens = t.getTokens()

    varsOrFcts = {
      ...varsOrFcts,
      sqr: (z) => cops.mul(z, z),
      pow: (z, n) => cops.pow(z, n),
      i: C$(0, 1),
      e: C$(Math.E),
      pi: C$(Math.PI)
    }
    let token

    const operand = () => {
      token = t.getToken()
      if (token.symbol === tokens.minus) return cops.neg(operand())
      if (token.symbol === tokens.plus) return operand()
      if (token.symbol === tokens.number) return C$(token.value)
      if (token.symbol === tokens.lparen) {
        const ret = expression()
        if (token.symbol !== tokens.rparen) throw Error(`Closing bracket not found!. Pos:${t.strpos()}`)
        return ret
      }
      if (token.symbol === tokens.ident) {
        const valOrFct = varsOrFcts[token.name]
        if (!valOrFct) throw Error(`Unknown identifier ${token.name}. Pos:${t.strpos()}`)
        if (typeof valOrFct !== 'function') return C$(valOrFct)
        token = t.getToken()
        const expressions = [expression()]
        while (token.symbol === tokens.comma) expressions.push(expression())
        if (token.symbol !== tokens.rparen) throw Error(`Closing bracket not found! Pos:${t.strpos()}`)
        return valOrFct(...expressions)
      }
      throw Error(`Operand expected. Pos:${t.strpos()}`)
    }

    const term = () => {
      const val = operand()
      token = t.getToken()
      return token.symbol !== tokens.pow ? val : cops.pow(val, term())
    }

    const factor = () => {
      let val = term()
      while (token.symbol === tokens.times || token.symbol === tokens.divide) {
        if (token.symbol === tokens.times) val = cops.mul(val, term())
        if (token.symbol === tokens.divide) val = cops.div(val, term())
      }
      return val
    }

    const expression = () => {
      let val = factor()
      while (token.symbol === tokens.plus || token.symbol === tokens.minus) {
        if (token.symbol === tokens.plus) val = cops.add(val, factor())
        if (token.symbol === tokens.minus) val = cops.sub(val, factor())
      }
      return val
    }

    const val = expression()
    if (token.symbol !== tokens.end) throw Error(`Unexpected symbol. Pos:${t.strpos()}`)
    //** console.log('***', s, val, varsOrFcts, params || '' );
    return val
  }

  return (re, im) => {
    if (typeof re === 'number') return { re: re || 0, im: im || 0 } // C$(1, 1)
    if (typeof re === 'object' && Object.keys(re).every((k) => k === 're' || k === 'im')) return { re: 0, im: 0, ...re } // C$({ re: 1, im: 1 })
    if (typeof re === 'string') return evalComplex(re, im || {}) // C$("3+i") ->
    throw Error(`False initialisation of C$ ${re} ${im || ''}`)
  }
})()

if (typeof module !== 'undefined' && module.exports) module.exports = C$

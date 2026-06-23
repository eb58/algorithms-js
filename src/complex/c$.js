const tokenizerRef = typeof tokenizer === 'undefined' ? require('./tokenizer.js') : tokenizer
const copsRef = typeof cops === 'undefined' ? require('./cops.js') : cops

const C$ = (() => {
  const evalComplex = (s, scope = {}) => {
    const t = tokenizerRef(s)
    const TOKENS = t.getTOKENS()
    const is = (kind) => token.symbol === kind

    scope = { ...copsRef, ...scope }
    let token

    const operand = () => {
      token = t.getToken()
      if (is(TOKENS.minus)) return copsRef.neg(operand())
      if (is(TOKENS.plus)) return operand()
      if (is(TOKENS.number)) return C$(token.value)
      if (is(TOKENS.lparen)) {
        const ret = expression()
        if (!is(TOKENS.rparen)) throw Error(`Closing bracket not found!. Pos:${t.strpos()}`)
        return ret
      }
      if (is(TOKENS.ident)) {
        const valOrFct = scope[token.name]
        if (!Object.hasOwn(scope, token.name)) throw Error(`Unknown identifier ${token.name}. Pos:${t.strpos()}`)
        if (typeof valOrFct !== 'function') return C$(valOrFct)
        token = t.getToken()
        const expressions = [expression()]
        while (is(TOKENS.comma)) expressions.push(expression())
        if (!is(TOKENS.rparen)) throw Error(`Closing bracket not found! Pos:${t.strpos()}`)
        return valOrFct(...expressions)
      }
      throw Error(`Operand expected. Pos:${t.strpos()}`)
    }

    const term = () => {
      const val = operand()
      token = t.getToken()
      return !is(TOKENS.pow) ? val : copsRef.pow(val, term())
    }

    const factor = () => {
      let val = term()
      while (is(TOKENS.times) || is(TOKENS.divide)) {
        if (is(TOKENS.times)) val = copsRef.mul(val, term())
        if (is(TOKENS.divide)) val = copsRef.div(val, term())
      }
      return val
    }

    const expression = () => {
      let val = factor()
      while (is(TOKENS.plus) || is(TOKENS.minus)) {
        if (is(TOKENS.plus)) val = copsRef.add(val, factor())
        if (is(TOKENS.minus)) val = copsRef.sub(val, factor())
      }
      return val
    }

    const val = expression()
    if (!is(TOKENS.end)) throw Error(`Unexpected symbol. Pos:${t.strpos()}`)
    //** console.log('***', s, val, varsOrFcts, params || '' );
    return val
  }

  return (re, im) => {
    if (typeof re === 'number') return { re: re || 0, im: im || 0 } // C$(1, 1)
    if (typeof re === 'string') return evalComplex(re, im || {}) // C$("3+i") ->
    throw Error(`False initialisation of C$ ${re} ${im || ''}`)
  }
})()

if (typeof module !== 'undefined' && module.exports) module.exports = C$

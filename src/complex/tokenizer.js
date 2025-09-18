tokenizer = (input) => {
  const TOKENS = Object.freeze({
    ident: Symbol('ident'),
    number: Symbol('number'),
    minus: Symbol('ident'),
    plus: Symbol('plus'),
    times: Symbol('times'),
    divide: Symbol('divide'),
    pow: Symbol('pow'),
    lparen: Symbol('lparen'),
    rparen: Symbol('rparen'),
    lbracket: Symbol('lbracket'),
    rbracket: Symbol('rbracket'),
    comma: Symbol('comma'),
    end: Symbol('end')
  })

  const mapCharToToken = Object.freeze({
    '+': TOKENS.plus,
    '-': TOKENS.minus,
    '*': TOKENS.times,
    '/': TOKENS.divide,
    '(': TOKENS.lparen,
    ')': TOKENS.rparen,
    '[': TOKENS.lbracket,
    ']': TOKENS.rbracket,
    '^': TOKENS.pow,
    ',': TOKENS.comma
  })

  input = input.replace(/\s+/g, '')
  let strpos = 0

  const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
  const isDigit = (c) => c >= '0' && c <= '9'
  const isNumberChar = (c) => isDigit(c) || c === '.'
  const isIdentifierChar = (c) => isLetter(c) || isDigit(c)
  const getIdentOrNumber = (qualifier) => (qualifier(input[strpos]) ? input[strpos++] + getIdentOrNumber(qualifier) : '')

  const getIdentifier = () => ({
    symbol: TOKENS.ident,
    name: getIdentOrNumber(isIdentifierChar)
  })

  const getNumber = () => ({
    symbol: TOKENS.number,
    value: parseFloat(getIdentOrNumber(isNumberChar))
  })

  const getToken = () => {
    if (strpos >= input.length) return { symbol: TOKENS.end }

    const c = input[strpos]
    if (isLetter(c)) return getIdentifier()
    if (isDigit(c)) return getNumber()
    if (c === '*' && input[strpos + 1] === '*') {
      strpos += 2
      return { symbol: TOKENS.pow, strpos }
    }
    if (!mapCharToToken[c]) throw Error(`Char ${c} not allowed. Pos:${strpos}`)
    if (strpos < input.length) strpos++
    return { symbol: mapCharToToken[c], strpos }
  }

    return {
    strpos: ()  => strpos,
    getTOKENS: () => TOKENS,
    getToken,
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = tokenizer

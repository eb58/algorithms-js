const tokenStrings = Object.freeze([
  'ident',
  'number',
  'minus',
  'plus',
  'times',
  'divide',
  'pow',
  'lparen',
  'rparen',
  'lbracket',
  'rbracket',
  'comma',
  'end'
])
const tokens = Object.freeze(tokenStrings.reduce((acc, s) => ({ ...acc, [s]: s }), {}))

tokenizer = (input) => {
  input = input.replace(/\s+/g, '')
  let strpos = 0

  const mapCharToToken = Object.freeze({
    '+': tokens.plus,
    '-': tokens.minus,
    '*': tokens.times,
    '/': tokens.divide,
    '(': tokens.lparen,
    ')': tokens.rparen,
    '[': tokens.lbracket,
    ']': tokens.rbracket,
    '^': tokens.pow,
    ',': tokens.comma
  })

  const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'
  const isDigit = (c) => c >= '0' && c <= '9'
  const isNumberChar = (c) => isDigit(c) || c === '.'
  const isIdentifierChar = (c) => isLetter(c) || isDigit(c)
  const getIdentOrNumber = (qualifier) => (qualifier(input[strpos]) ? input[strpos++] + getIdentOrNumber(qualifier) : '')

  const getIdentifier = () => ({
    symbol: tokens.ident,
    name: getIdentOrNumber(isIdentifierChar)
  })

  const getNumber = () => ({
    symbol: tokens.number,
    value: parseFloat(getIdentOrNumber(isNumberChar))
  })

  return {
    strpos: () => strpos,
    getTokens: () => tokens,
    getToken: () => {
      if (strpos >= input.length) return { symbol: tokens.end }

      const c = input[strpos]
      if (isLetter(c)) return getIdentifier()
      if (isDigit(c)) return getNumber()
      if (c === '*' && input[strpos + 1] === '*') {
        strpos += 2
        return { symbol: tokens.pow }
      }
      if (!mapCharToToken[c]) throw Error(`Char ${c} not allowed. Pos:${strpos}`)
      if (strpos < input.length) strpos++
      return { symbol: mapCharToToken[c] }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = tokenizer

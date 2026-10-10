class TokenizerError extends SyntaxError {
  constructor(message, input, position) {
    super(`${message} at position ${position}`)
    this.name = 'TokenizerError'
    this.input = input
    this.position = position
  }
}

const TOKENS = Object.freeze({
  ident: 'ident',
  number: 'number',
  minus: 'minus',
  plus: 'plus',
  times: 'times',
  divide: 'divide',
  pow: 'pow',
  lparen: 'lparen',
  rparen: 'rparen',
  lbracket: 'lbracket',
  rbracket: 'rbracket',
  comma: 'comma',
  end: 'end'
})

const CHAR_TOKENS = Object.freeze({
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

const NUMBER_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?/
const IDENTIFIER_PATTERN = /^\w+/

const tokenizer = (input) => {
  if (typeof input !== 'string') throw new TypeError('Tokenizer input must be a string')

  const cursor = { index: 0 }
  const state = { pos: 0 }
  const fail = (message, position) => {
    throw new TokenizerError(message, input, position)
  }

  const getIdentifier = () => {
    const start = cursor.index
    const match = input.slice(start).match(IDENTIFIER_PATTERN)
    cursor.index += match[0].length
    return { symbol: TOKENS.ident, name: match[0], strpos: cursor.index }
  }

  const getNumber = () => {
    const start = cursor.index
    const match = input.slice(start).match(NUMBER_PATTERN)
    if (!match || input[start + match[0].length] === '.') fail('Invalid number', start)

    cursor.index += match[0].length
    const value = Number(match[0])
    if (!Number.isFinite(value)) fail('Invalid number', start)
    return { symbol: TOKENS.number, value, strpos: cursor.index }
  }

  const getToken = () => {
    while (cursor.index < input.length && /\s/.test(input[cursor.index])) cursor.index++
    if (cursor.index >= input.length) return { symbol: TOKENS.end, strpos: cursor.index }

    const start = cursor.index
    const c = input[start]
    if (/\d/.test(c) || c === '.') return getNumber()
    if (/\w/.test(c)) return getIdentifier()
    if (c === '*' && input[start + 1] === '*') {
      cursor.index += 2
      return { symbol: TOKENS.pow, strpos: cursor.index }
    }
    if (!CHAR_TOKENS[c]) fail(`Unexpected character "${c}"`, start)
    cursor.index++
    return { symbol: CHAR_TOKENS[c], strpos: cursor.index }
  }

  const allTokens = []
  do {
    allTokens.push(getToken())
  } while (allTokens.at(-1).symbol !== TOKENS.end)

  cursor.index = 0
  return {
    strpos: () => cursor.index,
    getTOKENS: () => TOKENS,
    getToken,
    peek: () => allTokens[state.pos] ?? null,
    consume: () => allTokens[state.pos++] ?? null
  }
}

tokenizer.TokenizerError = TokenizerError
tokenizer.TOKENS = TOKENS

if (typeof globalThis !== 'undefined') globalThis.tokenizer = tokenizer
if (typeof module !== 'undefined' && module.exports) module.exports = tokenizer

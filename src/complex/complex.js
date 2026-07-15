const copsRef = typeof cops === 'undefined' ? require('./cops.js') : cops
const tokenizerRef = typeof tokenizer === 'undefined' ? require('./tokenizer.js') : tokenizer

const TOKENS = tokenizerRef('tokens').getTOKENS()

const splitParam = (s) => {
  const normalized = s.trim()
  const idx = normalized.indexOf('=>')
  return idx < 0
    ? { params: [], expression: normalized }
    : {
        params: normalized
          .slice(0, idx)
          .replace(/[()]/g, '')
          .split(',')
          .map((param) => param.trim())
          .filter(Boolean),
        expression: normalized.slice(idx + 2)
      }
}

const ops = {
  [TOKENS.plus]: copsRef.add,
  [TOKENS.minus]: copsRef.sub,
  [TOKENS.times]: copsRef.mul,
  [TOKENS.divide]: copsRef.div,
  [TOKENS.pow]: copsRef.pow
}

const numberNode = (val) => ({ eval: () => (typeof val === 'number' ? { re: val, im: 0 } : val) })
const unaryNode = (sign, op) => ({ eval: (args, pos) => (sign === TOKENS.minus ? copsRef.neg(op.eval(args, pos)) : op.eval(args, pos)) })
const variableNode = (name) => ({ eval: (args, pos) => (typeof args[pos[name]] === 'number' ? { re: args[pos[name]], im: 0 } : args[pos[name]]) })
const functionNode = (name, params, scope) => ({ eval: (args, pos) => scope[name](...params.map((p) => p.eval(args, pos))) })
const binaryOpNode = (op, left, right) => ({ eval: (args, pos) => ops[op](left.eval(args, pos), right.eval(args, pos)) })
const unexpectedToken = (token) => new Error(`Unexpected symbol. Pos:${token.strpos}`)
const isComplexValue = (value) => value && typeof value.re === 'number' && typeof value.im === 'number'

const parser = (s, scope, paramNames = new Set()) => {
  const { peek, consume } = tokenizerRef(s)
  const is = (kind) => peek().symbol === kind

  const parseExpression = () => {
    let node = parseTerm()
    while (is(TOKENS.plus) || is(TOKENS.minus)) node = binaryOpNode(consume().symbol, node, parseTerm())
    return node
  }

  const parseTerm = () => {
    let node = parseFactor()
    while (is(TOKENS.times) || is(TOKENS.divide) || is(TOKENS.ident)) {
      const op = is(TOKENS.times) || is(TOKENS.divide) ? consume().symbol : TOKENS.times
      node = binaryOpNode(op, node, parseFactor())
    }
    return node
  }

  const parseFactor = () => {
    let node = parseOperand()
    while (is(TOKENS.pow)) node = binaryOpNode(consume().symbol, node, parseFactor())
    return node
  }

  const parseOperand = () =>
    is(TOKENS.plus) || is(TOKENS.minus) ? unaryNode(consume().symbol, parseBase()) : parseBase()

  const parseScopeValue = (name) => {
    const value = scope[name]
    if (typeof value !== 'number' && !isComplexValue(value)) throw new Error(`Invalid value for identifier ${name}`)
    return numberNode(value)
  }

  const parseCallArguments = () => {
    const expressions = [parseExpression()]
    while (is(TOKENS.comma)) {
      consume()
      expressions.push(parseExpression())
    }
    return expressions
  }

  const parseFunctionCall = (name) => {
    if (!is(TOKENS.lparen)) throw new Error(`Opening paren expected${peek()}`)
    consume()
    const expressions = parseCallArguments()
    if (!is(TOKENS.rparen)) throw new Error(`Closing bracket not found! Pos:${peek().strpos}`)
    consume()
    return functionNode(name, expressions, scope)
  }

  const parseIdentifier = () => {
    const token = peek()
    if (paramNames.has(token.name)) return variableNode(consume().name)
    if (!Object.hasOwn(scope, token.name)) throw new Error(`Unknown identifier ${token.name}. Pos:${token.strpos}`)
    const name = consume().name
    return typeof scope[name] === 'function' ? parseFunctionCall(name) : parseScopeValue(name)
  }

  const parseParenthesized = () => {
    const token = consume()
    const node = parseExpression()
    if (!is(TOKENS.rparen)) throw new Error(`Closing bracket not found!. Pos:${token.strpos}`)
    consume()
    return node
  }

  const parseBase = () => {
    const token = peek()
    if (is(TOKENS.number)) return numberNode(consume().value)
    if (is(TOKENS.ident)) return parseIdentifier()
    if (is(TOKENS.lparen)) return parseParenthesized()
    throw new Error(`Operand expected. Pos:${token.strpos}`)
  }

  const node = parseExpression()
  if (!is(TOKENS.end)) throw unexpectedToken(peek())
  return node
}

const C$ = (re, im) => {
  if (typeof re === 'number') return { re: re || 0, im: im || 0 }
  if (typeof re === 'string') {
    const scope = im ? { ...copsRef, ...im } : copsRef
    const { expression, params } = splitParam(re)
    const positions = params.reduce((acc, name, idx) => ({ ...acc, [name]: idx }), {})
    const ast = parser(expression, scope, new Set(params))

    return params.length === 0
      ? ast.eval(scope)
      : (...args) => {
          if (args.length !== params.length) throw new Error('Anzahl der Argumente stimmt nicht mit der Anzahl der Variablen überein.')
          return ast.eval(args, positions)
        }
  }
  throw new Error(`False initialisation of C$ ${re} ${im || ''}`)
}

if (typeof module !== 'undefined' && module.exports) module.exports = C$

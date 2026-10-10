const copsRef = typeof cops === 'undefined' ? require('./cops.js') : cops
const tokenizerRef = typeof tokenizer === 'undefined' ? require('./tokenizer.js') : tokenizer

const TOKENS = tokenizerRef.TOKENS ?? tokenizerRef('').getTOKENS()

class ComplexSyntaxError extends SyntaxError {
  constructor(message, expression, token = {}) {
    super(message)
    this.name = 'ComplexSyntaxError'
    this.expression = expression
    this.position = token.strpos ?? 0
    this.token = token
  }
}

const syntaxError = (message, expression, token) => new ComplexSyntaxError(message, expression, token)

const splitParam = (s) => {
  const normalized = s.trim()
  const idx = normalized.indexOf('=>')
  if (idx < 0) return { params: [], expression: normalized, isFunction: false }

  const rawParams = normalized.slice(0, idx).trim()
  const paramsSource = rawParams.startsWith('(') && rawParams.endsWith(')') ? rawParams.slice(1, -1).trim() : rawParams
  if (/[()]/.test(paramsSource)) throw syntaxError('Invalid parameter list', normalized, { strpos: 0 })

  const params = paramsSource ? paramsSource.split(',').map((param) => param.trim()) : []
  if (params.some((param) => !/^[A-Za-z_]\w*$/.test(param))) {
    throw syntaxError('Invalid parameter name', normalized, { strpos: 0 })
  }
  if (new Set(params).size !== params.length) throw syntaxError('Duplicate parameter name', normalized, { strpos: 0 })

  const expression = normalized.slice(idx + 2).trim()
  if (!expression) throw syntaxError('Function expression must not be empty', normalized, { strpos: idx + 2 })
  return { params, expression, isFunction: true }
}

const ops = {
  [TOKENS.plus]: copsRef.add,
  [TOKENS.minus]: copsRef.sub,
  [TOKENS.times]: copsRef.mul,
  [TOKENS.divide]: copsRef.div,
  [TOKENS.pow]: copsRef.pow
}

const isComplexValue = (value) =>
  value && typeof value.re === 'number' && typeof value.im === 'number' && Number.isFinite(value.re) && Number.isFinite(value.im)
const toComplexValue = (value, name = 'value') => {
  if (typeof value === 'number' && Number.isFinite(value)) return { re: value, im: 0 }
  if (isComplexValue(value)) return value
  throw new TypeError(`${name} must be a finite number or complex value`)
}
const numberNode = (val) => ({ eval: () => toComplexValue(val) })
const unaryNode = (sign, op) => ({
  eval: (args, pos) => (sign === TOKENS.minus ? copsRef.neg(op.eval(args, pos)) : op.eval(args, pos))
})
const variableNode = (name) => ({ eval: (args, pos) => toComplexValue(args[pos[name]], `Argument ${name}`) })
const functionNode = (name, params, scope) => ({
  eval: (args, pos) => toComplexValue(scope[name](...params.map((param) => param.eval(args, pos))), `Result of ${name}`)
})
const binaryOpNode = (op, left, right) => ({ eval: (args, pos) => ops[op](left.eval(args, pos), right.eval(args, pos)) })

const parser = (s, scope, paramNames = new Set()) => {
  const { peek, consume } = tokenizerRef(s)
  const is = (kind) => peek().symbol === kind
  const position = () => peek().strpos

  const parseExpression = () => {
    let node = parseTerm()
    while (is(TOKENS.plus) || is(TOKENS.minus)) {
      node = binaryOpNode(consume().symbol, node, parseTerm())
    }
    return node
  }

  const parseTerm = () => {
    let node = parseUnary()
    while (is(TOKENS.times) || is(TOKENS.divide) || is(TOKENS.ident)) {
      const op = is(TOKENS.times) || is(TOKENS.divide) ? consume().symbol : TOKENS.times
      node = binaryOpNode(op, node, parseUnary())
    }
    return node
  }

  const parsePower = () => {
    const node = parseBase()
    return is(TOKENS.pow) ? binaryOpNode(consume().symbol, node, parseUnary()) : node
  }

  const parseUnary = () => (is(TOKENS.plus) || is(TOKENS.minus) ? unaryNode(consume().symbol, parseUnary()) : parsePower())

  const parseScopeValue = (name) => {
    const value = scope[name]
    if (!isComplexValue(value) && typeof value !== 'number') throw new TypeError(`Invalid value for identifier ${name}`)
    return numberNode(value)
  }

  const parseCallArguments = () => {
    if (is(TOKENS.rparen)) return []
    const expressions = [parseExpression()]
    while (is(TOKENS.comma)) {
      consume()
      expressions.push(parseExpression())
    }
    return expressions
  }

  const parseFunctionCall = (name) => {
    if (!is(TOKENS.lparen)) throw syntaxError(`Expected "(" after function "${name}" at position ${position()}`, s, peek())
    consume()
    const expressions = parseCallArguments()
    if (!is(TOKENS.rparen)) throw syntaxError(`Expected ")" to close function call at position ${position()}`, s, peek())
    consume()
    return functionNode(name, expressions, scope)
  }

  const parseIdentifier = () => {
    const token = peek()
    if (paramNames.has(token.name)) return variableNode(consume().name)
    if (!Object.hasOwn(scope, token.name)) throw syntaxError(`Unknown identifier ${token.name}. Pos:${token.strpos}`, s, token)
    const name = consume().name
    return typeof scope[name] === 'function' ? parseFunctionCall(name) : parseScopeValue(name)
  }

  const parseParenthesized = () => {
    consume()
    const node = parseExpression()
    if (!is(TOKENS.rparen)) throw syntaxError(`Expected ")" to close expression at position ${position()}`, s, peek())
    consume()
    return node
  }

  const parseBase = () => {
    const token = peek()
    if (is(TOKENS.number)) return numberNode(consume().value)
    if (is(TOKENS.ident)) return parseIdentifier()
    if (is(TOKENS.lparen)) return parseParenthesized()
    throw syntaxError(`Expected an operand at position ${token.strpos}`, s, token)
  }

  const node = parseExpression()
  if (!is(TOKENS.end)) throw syntaxError(`Unexpected token at position ${position()}`, s, peek())
  return node
}

const createScope = (scope) => {
  if (scope === undefined) return copsRef
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) throw new TypeError('Scope must be an object')
  return { ...copsRef, ...scope }
}

const createComplex = (re, im = 0) => {
  if (!Number.isFinite(re) || !Number.isFinite(im)) throw new TypeError('Complex parts must be finite numbers')
  return { re: re || 0, im: im || 0 }
}

const evaluateExpression = (expression, scope) => parser(expression, scope).eval([], {})

const compileExpression = (expression, params, scope) => {
  const positions = Object.fromEntries(params.map((name, index) => [name, index]))
  const ast = parser(expression, scope, new Set(params))

  return (...args) => {
    if (args.length !== params.length) throw new RangeError(`Expected ${params.length} arguments, received ${args.length}`)
    return ast.eval(args, positions)
  }
}

const parseExpressionInput = (source, customScope) => {
  const scope = createScope(customScope)
  const { expression, params, isFunction } = splitParam(source)
  return isFunction ? compileExpression(expression, params, scope) : evaluateExpression(expression, scope)
}

const C$ = (value, secondArgument) => {
  if (typeof value === 'number') return createComplex(value, secondArgument === undefined ? 0 : secondArgument)
  if (typeof value === 'string') return parseExpressionInput(value, secondArgument)
  throw new TypeError('C$ expects a finite number or an expression string')
}

C$.ComplexSyntaxError = ComplexSyntaxError

if (typeof module !== 'undefined' && module.exports) module.exports = C$

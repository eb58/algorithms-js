if (typeof cops === 'undefined') cops = require('./cops.js')
if (typeof tokenizer === 'undefined') tokenizer = require('./tokenizer.js')

const TOKENS = tokenizer('tokens').getTOKENS()

// Globaler Speicher für benannte Funktionen und Konstanten
let globalScope = { ...cops }

const ops = {
  [TOKENS.plus]: cops.add,
  [TOKENS.minus]: cops.sub,
  [TOKENS.times]: cops.mul,
  [TOKENS.divide]: cops.div,
  [TOKENS.pow]: cops.pow
}

const numberNode = (val) => ({ eval: () => (typeof val === 'number' ? { re: val, im: 0 } : val) })
const unaryNode = (sign, op) => ({ eval: (args, pos) => (sign === TOKENS.minus ? cops.neg(op.eval(args, pos)) : op.eval(args, pos)) })
const variableNode = (name) => ({ eval: (args, pos) => (typeof args[pos[name]] === 'number' ? { re: args[pos[name]], im: 0 } : args[pos[name]]) })
const functionNode = (name, params) => ({ eval: (args, pos) => globalScope[name](...params.reduce((acc, p) => [...acc, p.eval(args, pos)], [])) })
const binaryOpNode = (op, left, right) => ({ eval: (args, pos) => ops[op](left.eval(args, pos), right.eval(args, pos)) })

const parser = (s) => {
  const { peek, consume } = tokenizer(s)

  const parseExpression = () => {
    let node = parseTerm()
    while (peek().symbol === TOKENS.plus || peek().symbol === TOKENS.minus) node = binaryOpNode(consume().symbol, node, parseTerm())
    return node
  }

  const parseTerm = () => {
    let node = parseFactor()
    while (peek().symbol === TOKENS.times || peek().symbol === TOKENS.divide) node = binaryOpNode(consume().symbol, node, parseFactor())
    return node
  }

  const parseFactor = () => {
    let node = parseOperand()
    while (peek().symbol === TOKENS.pow) node = binaryOpNode(consume().symbol, node, parseFactor())
    return node
  }

  const parseOperand = () =>
    peek().symbol === TOKENS.plus || peek().symbol === TOKENS.minus ? unaryNode(consume().symbol, parseBase()) : parseBase()

  const parseBase = () => {
    const token = peek()
    if (token.symbol === TOKENS.number) return numberNode(consume().value)
    if (token.symbol === TOKENS.ident) {
      if (!(token.name in globalScope)) return variableNode(consume().name)
      if (typeof globalScope[token.name] !== 'function') return numberNode(globalScope[consume().name])
      else {
        const funcName = consume().name
        if (consume().symbol !== TOKENS.lparen) throw new Error(`Opening paren expected` + peek())
        const expressions = [parseExpression()]
        while (peek().symbol === TOKENS.comma) {
          consume()
          expressions.push(parseExpression())
        }
        if (peek().symbol !== TOKENS.rparen) throw new Error(`Closing bracket not found! Pos:${peek().strpos}`)
        consume()
        return functionNode(funcName, expressions)
      }
    }
    if (token.symbol === TOKENS.lparen) {
      consume()
      const node = parseExpression()
      if (peek().symbol !== TOKENS.rparen) throw new Error(`Closing bracket not found!. Pos:${token.strpos}`)
      consume()
      return node
    }
    throw new Error(`Operand expected. Pos:${token.strpos}`)
  }
  return parseExpression()
}

splitParam = (s) => {
  const idx = s.indexOf('=>')
  return {
    params:
      idx < 0
        ? []
        : s
            .substring(0, idx)
            .replace(/[\s()]/g, '')
            .split(','),
    expression: idx < 0 ? s : s.substring(idx + 2)
  }
}
const C$ = (re, im) => {
  if (typeof re === 'number') return { re: re || 0, im: im || 0 } // C$(1, 1)
  if (typeof re === 'string') {
    globalScope = { ...globalScope, ...im }

    const { expression, params } = splitParam(re)
    const positions = params.reduce((acc, name, idx) => ({ ...acc, [name]: idx }), {})
    const ast = parser(expression)

    return params.length === 0
      ? ast.eval(im)
      : (...args) => {
          if (args.length !== params.length) throw new Error('Anzahl der Argumente stimmt nicht mit der Anzahl der Variablen überein.')
          return ast.eval(args, positions)
        }
  }
  throw Error(`False initialisation of C$ ${re} ${im || ''}`)
}

if (typeof module !== 'undefined' && module.exports) module.exports = C$

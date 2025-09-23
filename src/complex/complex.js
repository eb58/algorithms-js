if (typeof cops === 'undefined') cops = require('./cops.js')
if (typeof tokenizer === 'undefined') tokenizer = require('./tokenizer.js')

const TOKENS = tokenizer('tokens').getTOKENS()

// Globaler Speicher für benannte Funktionen und Konstanten
let globalScope = {
  sqr: (z) => cops.mul(z, z),
  pow: (z, n) => cops.pow(z, n),
  i: { re: 0, im: 1 },
  pi: { re: Math.PI, im: 0 },
  e: { re: Math.E, im: 0 }
}

const ops = {
  [TOKENS.plus]: cops.add,
  [TOKENS.minus]: cops.sub,
  [TOKENS.times]: cops.mul,
  [TOKENS.divide]: cops.div,
  [TOKENS.pow]: cops.pow
}

const numberNode = (val) => ({ eval: () => (typeof val === 'number' ? { re: val, im: 0 } : val) })
const unaryNode = (sign, op) => ({ eval: (vars) => (sign === TOKENS.minus ? cops.neg(op.eval(vars)) : op.eval(vars)) })
const variableNode = (name) => ({ eval: (vars) => (typeof vars[name] === 'number' ? { re: vars[name], im: 0 } : vars[name]) })
const functionNode = (name, params) => ({ eval: (vars) => globalScope[name](...params.reduce((acc, param) => [...acc, param.eval(vars)], [])) })
const binaryOpNode = (op, left, right) => ({ eval: (vars) => ops[op](left.eval(vars), right.eval(vars)) })

const parser = (s) => {
  const freeParams = new Set()
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
      if (!(token.name in globalScope)) {
        freeParams.add(token.name)
        return variableNode(consume().name)
      }
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
  const getParameters = () => Array.from(freeParams).filter((x) => !(x in globalScope))

  return {
    parseExpression,
    getParameters
  }
}

const C$ = (param1, param2) => {
  if (typeof param1 === 'number') return { re: param1 || 0, im: param2 || 0 } // C$(1, 1)
  if (typeof param1 === 'object' && Object.keys(param1).every((k) => k === 're' || k === 'im')) return { re: 0, im: 0, ...param1 } // C$({ re: 1, im: 1 })
  if (typeof param1 === 'string') {  // C$("3+i") ->
    globalScope = { ...globalScope, ...param2 }
    const p = parser(param1)
    const ast = p.parseExpression()
    const vars = p.getParameters()

    return vars.length === 0
      ? ast.eval(param2)
      : (...args) => {
          if (args.length !== vars.length)
            throw new Error('Anzahl der Argumente stimmt nicht mit der Anzahl der Variablen überein.' + args + ' ### ' + vars)
          return ast.eval({ ...param2, ...vars.reduce((acc, name, idx) => ({ ...acc, [name]: args[idx] }), {}) })
        }
  }
  throw Error(`False initialisation of C$ ${param1} ${param2 || ''}`)
}

if (typeof module !== 'undefined' && module.exports) module.exports = C$

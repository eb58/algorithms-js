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

class UnaryNode {
  constructor(sign, operand) {
    this.operand = operand
    this.sign = sign
  }
  evaluate = (vars) => (this.sign === TOKENS.plus ? this.operand.evaluate(vars) : cops.neg(this.operand.evaluate(vars)))
}

class NumberNode {
  constructor(val) {
    this.value = typeof val === 'number' ? { re: val, im: 0 } : val
  }
  evaluate = () => this.value
}

class VariableNode {
  constructor(name) {
    this.name = name
  }
  evaluate = (vars) => (typeof vars[this.name] === 'number' ? { re: vars[this.name], im: 0 } : vars[this.name])
}

class FunctionCallNode {
  constructor(funcName, params) {
    if (typeof globalScope[funcName] !== 'function') throw new Error(`Function '${funcName}' is not defined`)
    this.funcName = funcName
    this.params = params
  }
  evaluate = (vars) => globalScope[this.funcName](...this.params.reduce((acc, param) => [...acc, param.evaluate(vars)], []))
}

class BinaryOpNode {
  ops = {
    [TOKENS.plus]: cops.add,
    [TOKENS.minus]: cops.sub,
    [TOKENS.times]: cops.mul,
    [TOKENS.divide]: cops.div,
    [TOKENS.pow]: cops.pow
  }
  constructor(op, left, right) {
    if (!this.ops[op]) throw new Error(`Unbekannter Operator: ${op}`)
    this.operator = op
    this.left = left
    this.right = right
  }
  evaluate = (vars) => this.ops[this.operator](this.left.evaluate(vars), this.right.evaluate(vars))
}

class Parser {
  freeParams = new Set()
  constructor(s) {
    this.tokenizer = tokenizer(s)
    this.peek = this.tokenizer.peek
    this.consume = this.tokenizer.consume
  }

  parseExpression = () => {
    let node = this.parseTerm()
    while (this.peek()?.symbol === TOKENS.plus || this.peek()?.symbol === TOKENS.minus)
      node = new BinaryOpNode(this.consume().symbol, node, this.parseTerm())
    return node
  }

  parseTerm = () => {
    let node = this.parseFactor()
    while (this.peek()?.symbol === TOKENS.times || this.peek()?.symbol === TOKENS.divide)
      node = new BinaryOpNode(this.consume().symbol, node, this.parseFactor())

    return node
  }

  parseFactor = () => {
    let node = this.parseOperand()
    while (this.peek()?.symbol === TOKENS.pow) node = new BinaryOpNode(this.consume().symbol, node, this.parseFactor())
    return node
  }

  parseOperand = () =>
    this.peek().symbol === TOKENS.plus || this.peek().symbol === TOKENS.minus
      ? new UnaryNode(this.tokenizer.consume().symbol, this.parseBase())
      : this.parseBase()

  parseBase = () => {
    const t = this.peek()
    if (!t) throw new Error('Unerwartetes Ende des Ausdrucks')
    if (t.symbol === TOKENS.number) return new NumberNode(this.consume().value)
    if (t.symbol === TOKENS.ident) {
      if (!(t.name in globalScope)) {
        this.freeParams.add(t.name)
        return new VariableNode(this.consume().name)
      }
      if (typeof globalScope[t.name] !== 'function') return new NumberNode(globalScope[this.consume().name])
      else {
        const funcName = this.consume().name
        if (this.consume().symbol !== TOKENS.lparen) throw new Error(`Opening paren expected` + this.peek())
        const expressions = [this.parseExpression()]
        while (this.peek()?.symbol === TOKENS.comma) {
          this.consume()
          expressions.push(this.parseExpression())
        }
        if (this.peek().symbol !== TOKENS.rparen) throw new Error(`Closing bracket not found! Pos:${this.peek().strpos}`)
        this.consume()
        return new FunctionCallNode(funcName, expressions)
      }
    }
    if (t.symbol === TOKENS.lparen) {
      this.consume()
      const node = this.parseExpression()
      if (this.peek()?.symbol !== TOKENS.rparen) throw Error(`Closing bracket not found!. Pos:${t.strpos}`)
      this.consume()
      return node
    }
    throw new Error(`Operand expected. Pos:${t.strpos}`)
  }
  getParameters = () => Array.from(this.freeParams)
}

const C$ = (param1, param2) => {
  if (typeof param1 === 'number') return { re: param1 || 0, im: param2 || 0 }
  if (typeof param1 === 'object' && Object.keys(param1).every((k) => k === 're' || k === 'im')) return { re: 0, im: 0, ...param1 }
  if (typeof param1 === 'string') {
    globalScope = { ...globalScope, ...param2 }
    const parser = new Parser(param1)
    const ast = parser.parseExpression()
    const vars = parser.getParameters().filter((x) => !(x in globalScope))

    return vars.length === 0
      ? ast.evaluate(param2)
      : (...args) => {
          if (args.length !== vars.length)
            throw new Error('Anzahl der Argumente stimmt nicht mit der Anzahl der Variablen überein.' + args + ' ### ' + vars)
          return ast.evaluate({ ...param2, ...vars.reduce((acc, name, idx) => ({ ...acc, [name]: args[idx] }), {}) })
        }
  }
  throw Error(`False initialisation of C$ ${param1} ${param2 || ''}`)
}

if (typeof module !== 'undefined' && module.exports) module.exports = C$

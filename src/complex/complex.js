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
  evaluate = (vars) => {
    if (!(this.name in vars)) throw new Error(`Variable '${this.name}' ist nicht definiert`)
    const val = vars[this.name]
    return typeof val === 'number' ? { re: val, im: 0 } : val
  }
}

class FunctionCallNode {
  constructor(funcName, params) {
    this.funcName = funcName
    this.params = params
  }
  evaluate = (vars) => {
    if (typeof globalScope[this.funcName] !== 'function') throw new Error(`Function '${this.funcName}' is not defined`)
    const args = this.params.reduce((acc, param) => [...acc, param.evaluate(vars)], [])
    return globalScope[this.funcName](...args)
  }
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
    this.operator = op
    this.left = left
    this.right = right
  }
  evaluate = (vars) => {
    if (!this.ops[this.operator]) throw new Error(`Unbekannter Operator: ${this.operator}`)
    return this.ops[this.operator](this.left.evaluate(vars), this.right.evaluate(vars))
  }
}

class Parser {
  constructor(s) {
    this.tokenizer = tokenizer(s)
    this.peek = this.tokenizer.peek
    this.consume = this.tokenizer.consume
  }

  parseExpression = () => {
    let node = this.parseTerm()
    while (this.peek()?.symbol === TOKENS.plus || this.peek()?.symbol === TOKENS.minus) {
      node = new BinaryOpNode(this.consume().symbol, node, this.parseTerm())
    }
    return node
  }

  parseTerm = () => {
    let node = this.parseFactor()
    while (this.peek()?.symbol === TOKENS.times || this.peek()?.symbol === TOKENS.divide) {
      const op = this.consume().symbol
      const right = this.parseFactor()
      node = new BinaryOpNode(op, node, right)
    }
    return node
  }

  parseFactor = () => {
    let node = this.parseOperand()
    while (this.peek()?.symbol === TOKENS.pow) {
      const op = this.consume().symbol
      const right = this.parseFactor()
      node = new BinaryOpNode(op, node, right)
    }
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
      if (!(t.name in globalScope)) return new VariableNode(this.consume().name)
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
}

const findParameters = (node) => {
  const variables = new Set()
  const find = (node) => {
    if (node instanceof VariableNode) variables.add(node.name)
    else if (node instanceof UnaryNode) find(node.operand)
    else if (node instanceof FunctionCallNode) node.params.forEach((param) => find(param))
    else if (node instanceof BinaryOpNode) [node.left, node.right].forEach((param) => find(param))
  }
  find(node)
  return Array.from(variables)
}

const Complex = (param1, param2) => {
  if (typeof param1 === 'number') return { re: param1 || 0, im: param2 || 0 }
  if (typeof param1 === 'object' && Object.keys(param1).every((k) => k === 're' || k === 'im')) return { re: 0, im: 0, ...param1 }
  if (typeof param1 === 'string') {
    globalScope = { ...globalScope, ...param2 }
    const parser = new Parser(param1)
    const ast = parser.parseExpression()
    const vars = findParameters(ast).filter((x) => !(x in globalScope))

    if (vars.length === 0) return ast.evaluate(param2)
    return (...args) => {
      if (args.length !== vars.length)
        throw new Error('Anzahl der Argumente stimmt nicht mit der Anzahl der Variablen überein.' + args + ' ### ' + vars)
      return ast.evaluate({ ...param2, ...vars.reduce((acc, name, idx) => ({ ...acc, [name]: args[idx] }), {}) })
    }
  }
  throw Error(`False initialisation of C$ ${param1} ${param2 || ''}`)
}

if (typeof module !== 'undefined' && module.exports) module.exports = Complex

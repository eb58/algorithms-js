if (typeof ComplexNumber === 'undefined') ComplexNumber = require('./cops.js').ComplexNumber
if (typeof cops === 'undefined') cops = require('./cops.js').cops
if (typeof tokenizer === 'undefined') tokenizer = require('./tokenizer.js')

const TOKENS = tokenizer('tokens').getTOKENS()

// Globaler Speicher für benannte Funktionen und Konstanten
let globalScope = {
  sqr: (z) => cops.mul(z, z),
  pow: (z, n) => cops.pow(z, n),
  i: new ComplexNumber({ re: 0, im: 1 }),
  pi: new ComplexNumber({ re: Math.PI }),
  e: new ComplexNumber({ re: Math.E })
}

class NumberNode {
  constructor(value) {
    this.value = value
  }
  evaluate = () => (typeof this.value === 'number' ? new ComplexNumber({ re: this.value, im: 0 }) : this.value)
}

class VariableNode {
  constructor(name) {
    this.name = name
  }
  evaluate = (vars) => {
    if (!(this.name in vars)) throw new Error(`Variable '${this.name}' ist nicht definiert`)
    const val = vars[this.name]
    return typeof val === 'number' ? new ComplexNumber({ re: val }) : val
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
  constructor(left, operator, right) {
    this.left = left
    this.operator = operator
    this.right = right
  }
  evaluate = (vars) => {
    const left = this.left.evaluate(vars)
    const right = this.right.evaluate(vars)
    switch (this.operator) {
      case TOKENS.plus:
        return left.add(right)
      case TOKENS.minus:
        return left.sub(right)
      case TOKENS.times:
        return left.mul(right)
      case TOKENS.divide:
        return left.div(right)
      case TOKENS.pow:
        return left.pow(right)
      default:
        throw new Error(`Unbekannter Operator: ${this.operator}`)
    }
  }
}

class UnaryMinusNode {
  constructor(operand, sign) {
    this.operand = operand
    this.sign = sign
  }
  evaluate = (vars) => (this.sign === TOKENS.plus ? this.operand.evaluate(vars) : this.operand.evaluate(vars).neg())
}

class Parser {
  // Parser mit Shunting Yard Algorithmus
  constructor(s) {
    this.tokenizer = tokenizer(s)
    this.peek = this.tokenizer.peek
    this.consume = this.tokenizer.consume
  }

  parseExpression = () => {
    let node = this.parseTerm()
    while (this.peek()?.symbol === TOKENS.plus || this.peek()?.symbol === TOKENS.minus) {
      const op = this.consume().symbol
      const right = this.parseTerm()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parseTerm = () => {
    let node = this.parseFactor()
    while (this.peek()?.symbol === TOKENS.times || this.peek()?.symbol === TOKENS.divide) {
      const op = this.consume().symbol
      const right = this.parseFactor()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parseFactor = () => {
    let node = this.parsePower()
    while (this.peek()?.symbol === TOKENS.pow) {
      const op = this.consume().symbol
      const right = this.parseFactor()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parsePower = () => {
    const symbol = this.peek()?.symbol
    if (symbol === TOKENS.plus || symbol === TOKENS.minus) {
      this.tokenizer.consume()
      return new UnaryMinusNode(this.parseBase(), symbol)
    }
    return this.parseBase()
  }

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
        if (this.consume().symbol !== TOKENS.rparen) throw new Error(`Closing paren expected`)
        return new FunctionCallNode(funcName, expressions)
      }
    }
    if (t.symbol === TOKENS.lparen) {
      this.consume()
      const node = this.parseExpression()
      if (this.peek()?.symbol !== TOKENS.rparen) throw new Error('Fehlende schließende Klammer')
      this.consume()
      return node
    }
    throw new Error(`Unerwartetes Token: ${JSON.stringify(t)}`)
  }
}

const findParameters = (node, variables = new Set()) => {
  if (node instanceof VariableNode) variables.add(node.name)
  else if (node instanceof UnaryMinusNode) findParameters(node.operand, variables)
  else if (node instanceof FunctionCallNode) node.params.forEach((param) => findParameters(param, variables))
  else if (node instanceof BinaryOpNode) {
    findParameters(node.left, variables)
    findParameters(node.right, variables)
  }
  return variables
}

const Complex = (param1, param2) => {
  if (typeof param1 === 'number') return new ComplexNumber({ re: param1 || 0, im: param2 || 0 })
  if (typeof param1 === 'object' && Object.keys(param1).every((k) => k === 're' || k === 'im')) return new ComplexNumber(param1)
  if (typeof param1 === 'string') {
    globalScope = { ...globalScope, ...param2 }
    const parser = new Parser(param1)
    const ast = parser.parseExpression()
    const vars = Array.from(findParameters(ast)).filter((x) => !(x in globalScope))

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

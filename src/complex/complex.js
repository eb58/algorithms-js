if (typeof ComplexNumber === 'undefined') ComplexNumber = require('./cops.js').ComplexNumber

let globalScope = {
  sqr: (z) => z.mul(z),
  pow: (z, n) => z.pow(n),
  i: new ComplexNumber(0, 1)
} // Globaler Speicher für benannte Funktionen und Konstanten

const tokenize = (expr) => {
  // Einfacher Tokenizer
  expr = expr.replace(/\s+/g, '')
  const tokens = []
  let i = 0

  const constants = {
    pi: Math.PI,
    e: Math.E,
    ln2: Math.LN2,
    sqrt2: Math.SQRT2
  }

  while (i < expr.length) {
    const char = expr[i]

    if ((char >= '0' && char <= '9') || char === '.') {
      let numStr = ''
      while (i < expr.length && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
        numStr += expr[i]
        i++
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) })
      continue
    }

    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '^' || char === '(' || char === ')') {
      const lastToken = tokens[tokens.length - 1]
      if ((char === '-' || char === '+') && (!lastToken || lastToken.type === 'OPERATOR' || lastToken.value === '(')) {
        tokens.push({ type: 'UNARY_OPERATOR', value: char })
      } else {
        tokens.push({ type: 'OPERATOR', value: char })
      }
      i++
      continue
    }

    if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
      let name = ''
      while (
        i < expr.length &&
        ((expr[i] >= 'a' && expr[i] <= 'z') || (expr[i] >= 'A' && expr[i] <= 'Z') || (expr[i] >= '0' && expr[i] <= '9') || expr[i] === '_')
      ) {
        name += expr[i]
        i++
      }

      if (i < expr.length && expr[i] === '(') {
        let parenCount = 1
        i++
        const argStart = i
        let argEnd = -1

        while (i < expr.length) {
          if (expr[i] === '(') parenCount++
          else if (expr[i] === ')') parenCount--

          if (parenCount === 0) {
            argEnd = i
            break
          }
          i++
        }

        if (argEnd === -1) throw new Error(`Fehlende schließende Klammer für Funktion ${name}`)
        tokens.push({ type: 'FUNCTION_CALL', funcName: name, argument: expr.substring(argStart, argEnd) })
        i++
      } else if (name in constants) {
        tokens.push({ type: 'CONSTANT', value: constants[name] })
      } else {
        tokens.push({ type: 'VARIABLE', value: name })
      }
      continue
    }

    i++
  }

  return tokens
}

// Vereinfachte AST-Node Klassen
class NumberNode {
  constructor(value) {
    this.value = value
  }
  evaluate = () => new ComplexNumber({ re: this.value })
}

class ConstantNode {
  constructor(value) {
    this.value = value
  }
  evaluate = () => new ComplexNumber({ re: this.value })
}

class VariableNode {
  constructor(name) {
    this.name = name
  }
  evaluate = (vars) => {
    if (this.name === 'i') return new ComplexNumber({ re: 0, im: 1 })
    if (!(this.name in vars)) throw new Error(`Variable '${this.name}' ist nicht definiert`)

    const val = vars[this.name]
    if (val instanceof ComplexNumber) return val
    if (typeof val === 'number') return new ComplexNumber({ re: val, im: 0 })
    throw new Error('Ungültiger Variablenwert ' + val)
  }
}

class FunctionCallNode {
  constructor(funcName, argNode) {
    this.funcName = funcName
    this.argNode = argNode
  }
  evaluate = (vars) => {
    if (typeof globalScope[this.funcName] !== 'function') throw new Error(`Funktion '${this.funcName}' ist nicht definiert`)
    const argValue = this.argNode.evaluate(vars)
    return globalScope[this.funcName](argValue)
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
      case '+':
        return left.add(right)
      case '-':
        return left.sub(right)
      case '*':
        return left.mul(right)
      case '/':
        return left.div(right)
      case '^':
        return left.pow(right)
      default:
        throw new Error(`Unbekannter Operator: ${this.operator}`)
    }
  }
}

class UnaryMinusNode {
  constructor(operand) {
    this.operand = operand
  }
  evaluate = (vars) => this.operand.evaluate(vars).neg()
}

class UnaryPlusNode {
  constructor(operand) {
    this.operand = operand
  }
  evaluate = (vars) => this.operand.evaluate(vars)
}

class Parser {
  // Parser mit Shunting Yard Algorithmus
  constructor(tokens) {
    this.tokens = tokens
    this.pos = 0
  }

  peek = () => (this.pos < this.tokens.length ? this.tokens[this.pos] : null)
  consume = () => (this.pos < this.tokens.length ? this.tokens[this.pos++] : null)

  parseExpression = () => {
    let node = this.parseTerm()
    while (this.peek()?.value === '+' || this.peek()?.value === '-') {
      const op = this.consume().value
      const right = this.parseTerm()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parseTerm = () => {
    let node = this.parseFactor()
    while (this.peek()?.value === '*' || this.peek()?.value === '/') {
      const op = this.consume().value
      const right = this.parseFactor()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parseFactor = () => {
    let node = this.parsePower()
    while (this.peek()?.value === '^') {
      const op = this.consume().value
      const right = this.parseFactor()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parsePower = () => {
    const token = this.peek()
    if (token?.type === 'UNARY_OPERATOR') {
      this.consume()
      if (token.value === '-') return new UnaryMinusNode(this.parseBase())
      if (token.value === '+') return new UnaryPlusNode(this.parseBase())
    }
    return this.parseBase()
  }

  parseBase = () => {
    const token = this.peek()

    if (!token) throw new Error('Unerwartetes Ende des Ausdrucks')
    if (token.type === 'NUMBER') return new NumberNode(this.consume().value)
    if (token.type === 'CONSTANT') return new ConstantNode(this.consume().value)
    if (token.type === 'VARIABLE') return new VariableNode(this.consume().value)
    if (token.type === 'FUNCTION_CALL') {
      this.consume()
      const args = token.argument.split(',').map((a) => {
        const argParser = new Parser(tokenize(a))
        const aa = argParser.parseExpression()
        return aa
      })
      return new FunctionCallNode(token.funcName, ...args)
    }
    if (token.value === '(') {
      this.consume()
      const node = this.parseExpression()
      if (!this.peek() || this.peek().value !== ')') throw new Error('Fehlende schließende Klammer')
      this.consume()
      return node
    }
    throw new Error(`Unerwartetes Token: ${JSON.stringify(token)}`)
  }
}

const findParameters = (node, variables = new Set()) => {
  if (node instanceof VariableNode && node.name !== 'i') variables.add(node.name)
  else if (node instanceof UnaryMinusNode) findParameters(node.operand, variables)
  else if (node instanceof UnaryPlusNode) findParameters(node.operand, variables)
  else if (node instanceof FunctionCallNode) findParameters(node.argNode, variables)
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
    const parser = new Parser(tokenize(param1))
    const ast = parser.parseExpression()
    globalScope = { ...globalScope, ...param2 }
    const vars = Array.from(findParameters(ast)).filter((x) => !(x in (param2 || {})))

    if (vars.length === 0) return ast.evaluate(param2)
    return (...args) => {
      if (args.length !== vars.length)
        throw new Error('Anzahl der Argumente stimmt nicht mit der Anzahl der Variablen überein.' + args + '###' + vars)
      return ast.evaluate({ ...param2, ...vars.reduce((acc, name, idx) => ({ ...acc, [name]: args[idx] }), {}) })
    }
  }
  throw Error(`False initialisation of C$ ${param1} ${param2 || ''}`)
}

if (typeof module !== 'undefined' && module.exports) module.exports = Complex

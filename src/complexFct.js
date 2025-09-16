const feedx = (x, f) => f(x)

class ComplexNumber {
  constructor(re, im = 0) {
    this.re = re
    this.im = im
  }
  neg() {
    return new ComplexNumber(-this.re, -this.im)
  }
  add(z) {
    return feedx(typeof z === 'number' ? new ComplexNumber(z) : z, (z) => new ComplexNumber(this.re + z.re, this.im + z.im))
  }
  sub(z) {
    return feedx(typeof z === 'number' ? new ComplexNumber(z) : z, (z) => new ComplexNumber(this.re - z.re, this.im - z.im))
  }
  mul(z) {
    return feedx(
      typeof z === 'number' ? new ComplexNumber(z) : z,
      (z) => new ComplexNumber(this.re * z.re - this.im * z.im, this.re * z.im + this.im * z.re)
    )
  }
  div(z) {
    return feedx(typeof z === 'number' ? new ComplexNumber(z) : z, (z) => {
      const denominator = z.re * z.re + z.im * z.im
      if (denominator === 0) throw new Error('Division durch Null')
      const re = (this.re * z.re + this.im * z.im) / denominator
      const im = (this.im * z.re - this.re * z.im) / denominator
      return new ComplexNumber(re, im)
    })
  }
  log() {
    const r = Math.sqrt(this.re * this.re + this.im * this.im)
    const theta = Math.atan2(this.im, this.re)
    return new ComplexNumber(Math.log(r), theta)
  }
  exp() {
    return feedx(Math.exp(this.re), (x) => new ComplexNumber(x * Math.cos(this.im), x * Math.sin(this.im)))
  }
  pow(exp) {
    if (exp === 0) return new ComplexNumber(1, 0)
    if (exp === 1) return this
    if (typeof exp === 'number') {
      const r = Math.sqrt(this.re * this.re + this.im * this.im)
      const theta = Math.atan2(this.im, this.re)
      const newR = Math.pow(r, exp)
      const newTheta = exp * theta
      return new ComplexNumber(newR * Math.cos(newTheta), newR * Math.sin(newTheta))
    }
    if (exp instanceof ComplexNumber) {
      const logThis = this.log()
      const product = exp.mul(logThis)
      return product.exp()
    }
    throw new Error('Exponent muss eine Zahl oder eine komplexe Zahl sein')
  }
  toString() {
    if (this.im === 0) return this.re.toString()
    if (this.re === 0) return `${this.im}i`
    return `${this.re}${this.im < 0 ? '' : '+'}${this.im}i`
  }
}

const namedFunctions = {} // Globaler Speicher für benannte Funktionen

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

    if ('+-*/^()'.includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char })
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
  evaluate = () => new ComplexNumber(this.value)
}

class ConstantNode {
  constructor(value) {
    this.value = value
  }
  evaluate = () => new ComplexNumber(this.value)
}

class VariableNode {
  constructor(name) {
    this.name = name
  }
  evaluate = (vars) => {
    if (this.name === 'i') return new ComplexNumber(0, 1)
    if (!(this.name in vars)) throw new Error(`Variable '${this.name}' ist nicht definiert`)

    const val = vars[this.name]
    if (val instanceof ComplexNumber) return val
    if (typeof val === 'number') return new ComplexNumber(val)
    throw new Error('Ungültiger Variablenwert')
  }
}

class FunctionCallNode {
  constructor(funcName, argNode) {
    this.funcName = funcName
    this.argNode = argNode
  }
  evaluate = (vars) => {
    if (!(this.funcName in namedFunctions)) throw new Error(`Funktion '${this.funcName}' ist nicht definiert`)

    const funcData = namedFunctions[this.funcName]
    const func = funcData.func

    // Evaluate the argument node using the correct vars context
    const argValue = this.argNode.evaluate(vars)

    // Call the function with the evaluated argument
    return func(argValue)
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

class Parser {
  // Parser mit Shunting Yard Algorithmus
  constructor(tokens) {
    this.tokens = tokens
    this.pos = 0
  }

  peek = () => (this.pos < this.tokens.length ? this.tokens[this.pos] : null)
  consume = () => (this.pos < this.tokens.length ? this.tokens[this.pos++] : null)
  parseExpression = () => {
    const token = this.peek()
    if (token?.value === '-') {
      this.consume()
      return new UnaryMinusNode(this.parseTerm())
    }
    return this.parseTerm()
  }

  parseTerm = () => {
    let node = this.parseFactor()

    while (this.peek() && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value
      const right = this.parseFactor()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parseFactor = () => {
    let node = this.parsePower()

    while (this.peek() && (this.peek().value === '*' || this.peek().value === '/')) {
      const op = this.consume().value
      const right = this.parsePower()
      node = new BinaryOpNode(node, op, right)
    }
    return node
  }

  parsePower = () => {
    let node = this.parseBase()
    if (this.peek() && this.peek().value === '^') {
      this.consume()
      const right = this.parseExpression()
      node = new BinaryOpNode(node, '^', right)
    }
    return node
  }

  parseBase = () => {
    const token = this.peek()

    if (!token) throw new Error('Unerwartetes Ende des Ausdrucks')
    if (token.type === 'NUMBER') return new NumberNode(this.consume().value)
    if (token.type === 'CONSTANT') return new ConstantNode(this.consume().value)
    if (token.type === 'VARIABLE') return new VariableNode(this.consume().value)
    if (token.type === 'FUNCTION_CALL') {
      this.consume()
      const argTokens = tokenize(token.argument)
      const argParser = new Parser(argTokens)
      return new FunctionCallNode(token.funcName, argParser.parseExpression())
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

const Complex = (expression, name) => {
  const findVariables = (node, variables = new Set()) => {
    if (node instanceof VariableNode && node.name !== 'i') variables.add(node.name)
    else if (node instanceof UnaryMinusNode) findVariables(node.operand, variables)
    else if (node instanceof FunctionCallNode) findVariables(node.argNode, variables)
    else if (node instanceof BinaryOpNode) {
      findVariables(node.left, variables)
      findVariables(node.right, variables)
    }
    return variables
  }

  const parser = new Parser(tokenize(expression))
  const ast = parser.parseExpression()
  const vars = Array.from(findVariables(ast))

  if( vars.length === 0) return ast.evaluate()

  const func = (...args) => {
    if (args.length !== vars.length) throw new Error('Anzahl der Argumente stimmt nicht mit der Anzahl der Variablen überein.')
    return ast.evaluate(vars.reduce((acc, name, idx) => ({ ...acc, [name]: args[idx] }), {}))
  }

  if (name) {
    namedFunctions[name] = { func, vars: vars }
  }
  return func
}

const complex = (re = 0, im = 0) => new ComplexNumber(re, im)
const C$= Complex

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C$, Complex, complex }
}

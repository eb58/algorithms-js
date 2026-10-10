const tokenizerRef = typeof tokenizer === 'undefined' ? require('./complex/tokenizer.js') : tokenizer;

const V$ = (() => {
  // Operands are numbers or vectors (arrays of numbers).
  const isVector = Array.isArray;

  const zip = (name, v1, v2, f) => {
    if (v1.length !== v2.length) throw new Error(`Cannot ${name} vectors of different length (${v1.length} and ${v2.length})`);
    return v1.map((x, i) => f(x, v2[i]));
  };

  // Elementwise operation: vector with vector, or number with number, but never a mix.
  const elementwise = (name, f) => (a, b) => {
    if (isVector(a) && isVector(b)) return zip(name, a, b, f);
    if (!isVector(a) && !isVector(b)) return f(a, b);
    throw new Error(`Cannot ${name} a number and a vector`);
  };

  const vops = {
    neg: (v) => (isVector(v) ? v.map((x) => -x) : -v),
    add: elementwise('add', (x, y) => x + y),
    sub: elementwise('subtract', (x, y) => x - y),
    pow: (v, exponent) => (isVector(v) ? v.map((x) => x ** exponent) : v ** exponent),
    // vector * vector: scalar product, otherwise a plain product or the scaling of a vector
    mul: (a, b) => {
      if (isVector(a) && isVector(b)) return zip('multiply', a, b, (x, y) => x * y).reduce((sum, x) => sum + x, 0);
      if (isVector(a)) return a.map((x) => x * b);
      if (isVector(b)) return b.map((x) => a * x);
      return a * b;
    }
  };

  const evalVectorExpression = (s, varsOrFcts = {}) => {
    const t = tokenizerRef(s);
    const tokens = t.getTOKENS();

    let token;
    const is = (kind) => token.symbol === kind;

    const operand = () => {
      token = t.getToken();
      if (is(tokens.minus)) return vops.neg(operand());
      if (is(tokens.plus)) return operand();
      if (is(tokens.lparen)) {
        const ret = expression();
        if (!is(tokens.rparen)) throw new Error(`Closing bracket not found!. Pos:${t.strpos()}`);
        return ret;
      }
      if (is(tokens.lbracket)) {
        const ret = [];
        token = t.getToken();
        while (is(tokens.number)) {
          ret.push(token.value);
          token = t.getToken();
          if (is(tokens.comma)) token = t.getToken();
        }
        if (!is(tokens.rbracket)) throw new Error(`rbracket not found!. Pos:${t.strpos()}`);
        return ret;
      }
      if (is(tokens.number)) return token.value;
      if (is(tokens.ident)) {
        if (!Object.hasOwn(varsOrFcts, token.name)) throw new Error(`Unknown identifier ${token.name}. Pos:${t.strpos()}`);
        const valOrFct = varsOrFcts[token.name];
        if (typeof valOrFct === 'number') return valOrFct;
        if (typeof valOrFct !== 'function') return V$(valOrFct);
        token = t.getToken();
        if (!is(tokens.lparen)) throw new Error(`Opening bracket expected. Pos:${t.strpos()}`);
        const expressions = [expression()];
        while (is(tokens.comma)) expressions.push(expression());
        if (!is(tokens.rparen)) throw new Error(`Closing bracket not found! Pos:${t.strpos()}`);
        return valOrFct(...expressions);
      }
      throw new Error(`Operand expected. Pos:${t.strpos()}`);
    };

    const term = () => {
      const val = operand();
      token = t.getToken();
      if (is(tokens.pow)) {
        token = t.getToken();
        if (!is(tokens.number)) throw new Error(`Operand expected. Pos:${t.strpos()}`);
        const rhs = token.value;
        token = t.getToken();
        return vops.pow(val, rhs);
      }
      return val;
    };

    const factor = () => {
      let val = term();
      while (is(tokens.times)) val = vops.mul(val, term());
      return val;
    };

    const expression = () => {
      let val = factor();
      while (is(tokens.plus) || is(tokens.minus)) {
        if (is(tokens.plus)) val = vops.add(val, factor());
        if (is(tokens.minus)) val = vops.sub(val, factor());
      }
      return val;
    };

    const val = expression();
    if (!is(tokens.end)) throw new Error(`Unexpected symbol. Pos:${t.strpos()}`);
    return val;
  };

  return (expr, vars) => {
    if (typeof expr === 'string') return evalVectorExpression(expr, vars); // V$("v1 + v2") ->
    if (typeof expr === 'object') return expr;
    throw new Error(`False initialisation of V$ ${expr}`);
  };
})();

if (typeof module !== 'undefined') module.exports = V$;

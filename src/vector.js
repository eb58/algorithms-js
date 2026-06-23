const tokenizerRef = typeof tokenizer === 'undefined' ? require('./complex/tokenizer.js') : tokenizer;

const V$ = (() => {
  const zip = (xs, ys, f) => xs.map((x, i) => (f ? f(x, ys[i]) : [x, ys[i]]));

  const vops = {
    neg: (v) => V$(v.map((x) => -x)),
    add: (v1, v2) => V$(zip(v1, v2, (x, y) => x + y)),
    sub: (v1, v2) => V$(zip(v1, v2, (x, y) => x - y)),
    pow: (v1, v2) => (Array.isArray(v2) ? V$(zip(v1, v2, (x, y) => x ** y)) : V$(v1.map((x) => x ** v2))),
    scalarproduct: (v1, v2) => zip(v1, v2, (x, y) => x * y).reduce((sum, x) => sum + x, 0)
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
      // ???? if (token.token === tokens.number) return C$(token.value);
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
        const valOrFct = varsOrFcts[token.name];
        if (!valOrFct) throw new Error(`Unknown identifier ${token.name}. Pos:${t.strpos()}`);
        if (typeof valOrFct !== 'function') return V$(valOrFct);
        token = t.getToken();
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
      const val = term();
      if (is(tokens.times)) return vops.scalarproduct(val, term());
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
    //** console.log('***', s, val, varsOrFcts, params || '' );
    return val;
  };

  return (expr, vars) => {
    if (typeof expr === 'string') return evalVectorExpression(expr, vars); // V$("v1 + v2") ->
    if (typeof expr === 'object') return expr;
    throw new Error(`False initialisation of V$ ${expr}`);
  };
})();

if (typeof module !== 'undefined') module.exports = V$;

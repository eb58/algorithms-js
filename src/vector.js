if (typeof tokenizer === 'undefined') tokenizer = require('./complex/tokenizer.js');

const V$ = (() => {
  const zip = (xs, ys, f) => xs.map((x, i) => (f ? f(x, ys[i]) : [x, ys[i]]));

  const vops = {
    neg: (v) => V$(v.map((x) => -x)),
    add: (v1, v2) => V$(zip(v1, v2, (x, y) => x + y)),
    sub: (v1, v2) => V$(zip(v1, v2, (x, y) => x - y)),
    scalarproduct: (v1, v2) => zip(v1, v2, (x, y) => x * y).reduce((sum, x) => sum + x, 0)
  };

  const evalVectorExpression = (s, varsOrFcts = {}) => {
    const t = tokenizer(s);
    const tokens = t.getTOKENS();

    let token;

    const operand = () => {
      token = t.getToken();
      if (token.token === tokens.minus) return vops.neg(operand());
      if (token.token === tokens.plus) return operand();
      // ???? if (token.token === tokens.number) return C$(token.value);
      if (token.token === tokens.lparen) {
        const ret = expression();
        if (token.token !== tokens.rparen) throw Error(`Closing bracket not found!. Pos:${t.strpos()}`);
        return ret;
      }
      if (token.token === tokens.lbracket) {
        const ret = [];
        token = t.getToken();
        while ((token).token === tokens.number) {
          ret.push(token.value);
          token = t.getToken();
          if( token.token === tokens.comma ) token = t.getToken();
        }
        if (token.token !== tokens.rbracket) throw Error(`rbracket not found!. Pos:${t.strpos()}`);
        return ret;
      }
      if (token.token === tokens.ident) {
        const valOrFct = varsOrFcts[token.name];
        if (!valOrFct) throw Error(`Unknown identifier ${token.name}. Pos:${t.strpos()}`);
        if (typeof valOrFct !== 'function') return V$(valOrFct);
        token = t.getToken();
        const expressions = [expression()];
        while (token.token === tokens.comma) expressions.push(expression());
        if (token.token !== tokens.rparen) throw Error(`Closing bracket not found! Pos:${t.strpos()}`);
        return valOrFct(...expressions);
      }
      throw Error(`Operand expected. Pos:${t.strpos()}`);
    };

    const term = () => {
      const val = operand();
      token = t.getToken();
      return token.token !== tokens.pow ? val : vops.pow(val, term());
    };

    const factor = () => {
      const val = term();
      if (token.token === tokens.times) return vops.scalarproduct(val, term());
      return val;
    };

    const expression = () => {
      let val = factor();
      while (token.token === tokens.plus || token.token === tokens.minus) {
        if (token.token === tokens.plus) val = vops.add(val, factor());
        if (token.token === tokens.minus) val = vops.sub(val, factor());
      }
      return val;
    };

    const val = expression();
    if (token.token !== tokens.end) throw Error(`Unexpected symbol. Pos:${t.strpos()}`);
    //** console.log('***', s, val, varsOrFcts, params || '' );
    return val;
  };

  return (expr, vars) => {
    if (typeof expr === 'string') return evalVectorExpression(expr, vars); // V$("v1 + v2") ->
    if (typeof expr === 'object') return expr;
    throw Error(`False initialisation of V$ ${expr}`);
  };
})();

if (typeof module !== 'undefined') module.exports = V$;

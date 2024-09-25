if (typeof tokenizer === 'undefined') tokenizer = require('./tokenizer.js')

const C$ = (() => {
  const feedx = (x, f) => f(x);
  const range = (n) => [...Array(n).keys()];

  const cops = {
    neg: (c) => C$(-c.r, -c.i),
    add: (c1, c2) => C$(c1.r + c2.r, c1.i + c2.i),
    sub: (c1, c2) => C$(c1.r - c2.r, c1.i - c2.i),
    mul: (c1, c2) => C$(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r),
    div: (c1, c2) => feedx(c2.r * c2.r + c2.i * c2.i, (x) => C$((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x)),
    pow: (c, n) => (n.r === 0 ? C$(1) : range(n.r - 1).reduce((res) => cops.mul(res, c), c))
  };

  const evalComplex = (s, varsOrFcts = {}) => {
    const t = tokenizer(s);
    const tokens = t.getTokens()

    varsOrFcts = {
      ...varsOrFcts,
      sqr: (z) => cops.mul(z, z),
      pow: (z, n) => cops.pow(z, n),
      i: C$(0, 1),
      e: C$(Math.E),
      pi: C$(Math.PI)
    };
    let token;

    const operand = () => {
      token = t.getToken();
      if (token.token === tokens.minus) return cops.neg(operand());
      if (token.token === tokens.plus) return operand();
      if (token.token === tokens.number) return C$(token.value);
      if (token.token === tokens.lparen) {
        const ret = expression();
        if (token.token !== tokens.rparen) throw Error(`Closing bracket not found!. Pos:${t.strpos()}`);
        return ret;
      }
      if (token.token === tokens.ident) {
        const valOrFct = varsOrFcts[token.name];
        if (!valOrFct) throw Error(`Unknown identifier ${token.name}. Pos:${t.strpos()}`);
        if (typeof valOrFct !== 'function') return C$(valOrFct);
        token = t.getToken();
        const expressions = [expression()];
        while (token.token == tokens.comma) expressions.push(expression());
        if (token.token !== tokens.rparen) throw Error(`Closing bracket not found! Pos:${t.strpos()}`);
        return valOrFct(...expressions);
      }
      throw Error(`Operand expected. Pos:${t.strpos()}`);
    };

    const term = () => {
      const val = operand();
      token = t.getToken();
      return token.token !== tokens.pow ? val : cops.pow(val, term());
    };

    const factor = () => {
      let val = term();
      while (token.token === tokens.times || token.token === tokens.divide) {
        if (token.token === tokens.times) val = cops.mul(val, term());
        if (token.token === tokens.divide) val = cops.div(val, term());
      }
      return val;
    };

    const expression = () => {
      let val = factor();
      while (token.token === tokens.plus || token.token === tokens.minus) {
        if (token.token === tokens.plus) val = cops.add(val, factor());
        if (token.token === tokens.minus) val = cops.sub(val, factor());
      }
      return val;
    };

    const val = expression();
    if (token.token != tokens.end) throw Error(`Unexpected symbol. Pos:${t.strpos()}`);
    //** console.log('***', s, val, varsOrFcts, params || '' );
    return val;
  };

  return (r, i) => {
    if (typeof r === 'number') return { r: r || 0, i: i || 0 }; // C$(1, 1)
    if (typeof r === 'object' && Object.keys(r).every((k) => k === 'r' || k === 'i')) return { r: 0, i: 0, ...r }; // C$({ r: 1, i: 1 })
    if (typeof r === 'string') return evalComplex(r, i || {}); // C$("3+i") ->
    throw Error(`False initialisation of C$ ${r} ${i || ''}`);
  };
})();

if (typeof module !== 'undefined') module.exports = C$;

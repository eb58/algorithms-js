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

  const tokenStrings = ['ident', 'number', 'minus', 'plus', 'times', 'divide', 'pow', 'lparen', 'rparen', 'comma', 'end'];
  const tokens = tokenStrings.reduce((acc, s) => ({ ...acc, [s]: s }), {});

  const lexParser = (input) => {
    let strpos = 0;

    const mapCharToToken = {
      '+': tokens.plus,
      '-': tokens.minus,
      '*': tokens.times,
      '/': tokens.divide,
      '(': tokens.lparen,
      ')': tokens.rparen,
      ',': tokens.comma
    };

    const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    const isDigit = (c) => c >= '0' && c <= '9';
    const isNumberChar = (c) => isDigit(c) || c === '.';
    const isIdentifierChar = (c) => isLetter(c) || isDigit(c);
    const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
    const getIdentOrNumber = (qualifier) => (qualifier(input[strpos]) ? input[strpos++] + getIdentOrNumber(qualifier) : '');

    const getIdentifier = () => ({
      token: tokens.ident,
      name: getIdentOrNumber(isIdentifierChar)
    });

    const getNumber = () => ({
      token: tokens.number,
      value: parseFloat(getIdentOrNumber(isNumberChar))
    });

    return {
      pos: () => strpos,
      getToken: () => {
        while (isSpace(input[strpos])) strpos++;
        if (strpos >= input.length) return { strpos, token: tokens.end };

        const c = input[strpos];
        if (isLetter(c)) return getIdentifier();
        if (isDigit(c)) return getNumber();
        if (c === '*' && input[strpos + 1] === '*') {
          strpos += 2;
          return { token: tokens.pow };
        }
        if (!mapCharToToken[c]) throw Error(`Char ${c} not allowed. Pos:${strpos}`);
        if (strpos < input.length) strpos++;
        return { token: mapCharToToken[c] };
      }
    };
  };

  const evalComplex = (s, varsOrFcts = {}) => {
    const lex = lexParser(s);
    varsOrFcts = {
      ...varsOrFcts,
      sqr: (z) => cops.mul(z, z),
      pow: (z,n) => cops.pow(z,n),
      i: C$(0, 1),
      e: C$(Math.E),
      pi: C$(Math.PI)
    };
    let token;

    const operand = () => {
      token = lex.getToken();
      if (token.token === tokens.minus) return cops.neg(operand());
      if (token.token === tokens.plus) return operand();
      if (token.token === tokens.number) return C$(token.value);
      if (token.token === tokens.lparen) {
        const ret = expression();
        if (token.token !== tokens.rparen) throw Error(`Closing bracket not found!. Pos:${lex.pos()}`);
        return ret;
      }
      if (token.token === tokens.ident) {
        const valOrFct = varsOrFcts[token.name];
        if (!valOrFct) throw Error(`Unknown identifier ${token.name}. Pos:${lex.pos()}`);
        if (typeof valOrFct !== 'function') return C$(valOrFct);
        token = lex.getToken();
        const expressions = [expression()];
        while (token.token == tokens.comma) expressions.push(expression());
        if (token.token !== tokens.rparen) throw Error(`Closing bracket not found! Pos:${lex.pos()}`);
        return valOrFct(...expressions);
      }
      throw Error(`Operand expected. Pos:${lex.pos()}`);
    };

    const term = () => {
      const val = operand();
      token = lex.getToken();
      return token.token !== tokens.pow ? val : cops.pow(val, term());
    };

    const factor = () => {
      const val = term();
      if (token.token === tokens.times) return cops.mul(val, factor());
      if (token.token === tokens.divide) return cops.div(val, factor());
      return val;
    };

    const expression = () => {
      const val = factor();
      if (token.token === tokens.plus) return cops.add(val, expression());
      if (token.token === tokens.minus) return cops.sub(val, expression());
      return val;
    };

    const val = expression();
    if (token.token != tokens.end) throw Error(`Unexpected symbol. Pos:${lex.pos()}`);
    //** console.log('***', s, val, varsOrFcts, params || '' );
    return val;
  };

  return (r, i) => {
    if (typeof r === 'number') return { r: r || 0, i: i || 0 }; // C$(1, 1)
    if (typeof r === 'object' && Object.keys(r).every((k) => k === 'r' || k === 'i')) return { r: 0, i: 0, ...r }; // C$({ r: 1, i: 1 })
    if (typeof r === 'string') return evalComplex(r, i || {}); // C$("3+i") -> returns value
    throw Error(`False initialisation of C$ ${r} ${i || ''}`);
  };
})();

if (typeof module !== 'undefined') module.exports = C$;

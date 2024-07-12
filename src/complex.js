const feedx = (x, f) => f(x);
const uniq = (xs) => Array.from(new Set(xs));

const cops = {
  id: (c) => C$(c),
  neg: (c) => C$(-c.r, -c.i),
  add: (c1, c2) => C$(c1.r + c2.r, c1.i + c2.i),
  sub: (c1, c2) => C$(c1.r - c2.r, c1.i - c2.i),
  mul: (c1, c2) => C$(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r),
  div: (c1, c2) => feedx(c2.r * c2.r + c2.i * c2.i, (x) => C$((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x))
};

const csops = {
  id: (c) => `${c}`,
  neg: (c) => `cops.neg(C$(${c}))`,
  add: (c1, c2) => `cops.add(C$(${c1}), C$(${c2}))`,
  sub: (c1, c2) => `cops.sub(C$(${c1}), C$(${c2}))`,
  mul: (c1, c2) => `cops.mul(C$(${c1}), C$(${c2}))`,
  div: (c1, c2) => `cops.div(C$(${c1}), C$(${c2}))`
};

const tokens = (() => {
  const s = ['ident', 'number', 'minus', 'plus', 'times', 'divide', 'lparen', 'rparen', 'end'];
  return s.reduce((acc, s) => ({ ...acc, [s]: s }), {});
})();

const lexParser = (input) => {
  let strpos = 0;

  const mapCharToToken = {
    '+': tokens.plus,
    '-': tokens.minus,
    '*': tokens.times,
    '/': tokens.divide,
    '(': tokens.lparen,
    ')': tokens.rparen
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
      if (!mapCharToToken[c]) throw Error(`Char ${c} not allowed. Pos:${strpos}`);
      if (strpos <= input.length) strpos++;
      return { token: mapCharToToken[c] };
    }
  };
};

const doEval = (s, varsOrFcts = {}, ops = csops) => {
  const [pi, e] = [Math.PI, Math.E];
  varsOrFcts = {
    ...varsOrFcts,
    i: ops === csops ? 'C$(0, 1)' : C$(0, 1),
    e: ops === csops ? `C$(${e})` : C$(e),
    pi: ops === csops ? `C$(${pi})` : C$(pi)
  };

  let token;
  let params = [];

  const operand = () => {
    const op = () => {
      token = lex.getToken();
      if (token.token === tokens.minus) return ops.neg(op());
      if (token.token === tokens.plus) return op();
      if (token.token === tokens.number) return ops.id(token.value);
      if (token.token === tokens.ident) {
        let varOrFct = varsOrFcts[token.name];

        if (varOrFct) {
          return typeof varOrFct === 'function' ? ((token = lex.getToken()), varOrFct(expression())) : varOrFct;
        }
        try {
          varOrFct = eval(token.name); // try to get from environment
        } catch (e) {}
        if (varOrFct) {
          return typeof varOrFct === 'function' ? ((token = lex.getToken()), varOrFct(expression())) : varOrFct;
        }

        // we use some variable in expression, but we dont know it
        // -> it must be a free variable, i.e. a parameter
        params = uniq([...params, token.name]);
        return token.name;
      }
      if (token.token === tokens.lparen) {
        const ret = expression();
        if (token.token !== tokens.rparen) {
          throw Error(`Closing bracket not found!. Pos:${lex.pos()}`);
        }
        return ret;
      }
      throw Error(`Operand expected. Pos:${lex.pos()}`);
    };

    const ret = op();
    token = lex.getToken();
    return ret;
  };

  const term = () => {
    const val = operand();
    if (token.token === tokens.times) {
      return ops.mul(val, term());
    } else if (token.token === tokens.divide) {
      return ops.div(val, term());
    }
    return val;
  };

  const expression = () => {
    const val = term();
    if (token.token === tokens.plus) {
      return ops.add(val, expression());
    } else if (token.token === tokens.minus) {
      return ops.sub(val, expression());
    }
    return val;
  };

  const lex = lexParser(s);
  let val = expression();
  if (token.token != tokens.end) throw Error(`Unexpected symbol. Pos:${lex.pos()}`);

  //** console.log('***', s, val, varsOrFcts, params || '' );
  val = ops !== csops ? val : eval(`(${params.join(',')}) => ${val}`);

  return val;
};

const evalComplex = (s, vars = {}) => doEval(s, vars, cops);
const evalComplexFunction = (s, vars = {}) => doEval(s.substring(s.indexOf('=>') + 2), vars, csops);

const C$ = (r, i) => {
  if (typeof r === 'number') return { r: r || 0, i: i || 0 }; // C$(1, 1)
  if (typeof r === 'object' && Object.keys(r).every((k) => k === 'r' || k === 'i')) return { r: 0, i: 0, ...r }; // C$({ r: 1, i: 1 })
  if (typeof r === 'string') {
    if (typeof i === 'object') return evalComplex(r, i); // C$("a+7+i", {a:C$('3+i')})
    if (r.includes('=>')) return evalComplexFunction(r); // C$("(z) => z*z") ( return function )
    return evalComplex(r); // C$("3+i") ( returns value )
  }
  throw Error(`False initialisation of C$`);
};

if (typeof module !== 'undefined') module.exports = C$;

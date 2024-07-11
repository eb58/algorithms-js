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

const tokens = ['ident', 'number', 'minus', 'plus', 'times', 'divide', 'lparen', 'rparen', 'end'].reduce(
  (acc, s) => ({ ...acc, [s]: s }),
  {}
);

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
  const CONSTS = {
    I: ops === csops ? 'C$(0, 1)' : C$(0, 1),
    E: ops === csops ? `C$(${Math.exp(1)})` : C$(Math.exp(1)),
    PI: ops === csops ? `C$(${Math.PI})` : C$(Math.PI)
  };

  let token;
  let params = [];

  const operand = () => {
    const op = () => {
      if (token.token === tokens.minus) return (token = lex.getToken()), ops.neg(op());
      if (token.token === tokens.plus) return (token = lex.getToken()), op();
      if (token.token === tokens.number) return ops.id(token.value);
      if (token.token === tokens.ident) {
        let ident = CONSTS[token.name.toUpperCase()] || varsOrFcts[token.name];

        if (ident === undefined) {
          try {
            ident = eval(token.name); // try to get from environment
          } catch (e) {}
        }
        if (ident === undefined) {
          ident = token.name;
          params = uniq([...params, token.name]);
        }
        if (typeof ident === 'function') {
          token = lex.getToken();
          return ident(expression());
        }

        if (ident === undefined) throw Error(`Unknow identifier <${token.name}>. Pos:${lex.pos()}`);
        return ident;
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

    token = lex.getToken();
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

  // ops !== csops && console.log('VAL ###', s, val, varsOrFcts );
  ops === csops && console.log('VAL ***', s, val, params, varsOrFcts);
  val = ops !== csops ? val : eval(`(${params.join(',')}) => ${val}`);
  // params.length > 0 && console.log('VAL2', val);

  return val;
};

const evalComplexWithVariables = (s, vars = {}) => doEval(s, vars, cops);
const evalComplex = (s, vars = {}) => doEval(s.substring(s.indexOf('=>') + 2), vars, csops);

const C$ = (r, i) => {
  if (typeof r === 'object' && Object.keys(r).every((k) => k === 'r' || k === 'i')) return r; // C$({ r: 1, i: 1 })
  if (typeof r === 'string' && typeof i === 'object') return evalComplexWithVariables(r, i); // C$("a+7+i", {a:C$('3+i')})
  if (typeof r === 'string' && !r.includes('=>')) return evalComplexWithVariables(r, {}); // C$("3+i") ( returns value )
  if (typeof r === 'string' && r.includes('=>')) return evalComplex(r); // C$("(z) => z*z") ( return function )
  if (typeof r === 'number') return { r: !r ? 0 : r, i: !i ? 0 : i };
  throw Error(`False initialisation of C$`);
};

if (typeof module !== 'undefined') module.exports = C$;

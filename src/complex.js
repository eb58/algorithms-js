const feedx = (x, f) => f(x);
const uniq = (xs) => Array.from(new Set(xs));

const cops = {
  id: (x) => C$(x),
  neg: (c) => C$(-c.r, -c.i),
  add: (c1, c2) => C$(c1.r + c2.r, c1.i + c2.i),
  sub: (c1, c2) => C$(c1.r - c2.r, c1.i - c2.i),
  mul: (c1, c2) => C$(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r),
  div: (c1, c2) => feedx(c2.r * c2.r + c2.i * c2.i, (x) => C$((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x)),
};

const sops = {
  id: (x) => x,
  neg: (x) => -x,
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  mul: (x, y) => x * y,
  div: (x, y) => x / y,
};

const csops = {
  id: (x) => `cops.id(C$(${x}))`,
  neg: (x) => `cops.neg(C$(${x}))`,
  add: (x, y) => `cops.add(C$(${x}), C$(${y}))`,
  sub: (x, y) => `cops.sub(C$(${x}), C$(${y}))`,
  mul: (x, y) => `cops.mul(C$(${x}), C$(${y}))`,
  div: (x, y) => `cops.div(C$(${x}), C$(${y}))`,
};

const tokens = ['ident', 'number', 'minus', 'plus', 'times', 'divide', 'lparen', 'rparen', 'end'].reduce(
  (acc, s) => ({ ...acc, [s]: s }),
  {},
);

const lexParser = (input) => {
  let strpos = 0;

  const mapCharToToken = {
    '+': tokens.plus,
    '-': tokens.minus,
    '*': tokens.times,
    '/': tokens.divide,
    '(': tokens.lparen,
    ')': tokens.rparen,
  };

  const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  const isDigit = (c) => c >= '0' && c <= '9';
  const isNumberChar = (c) => isDigit(c) || c === '.';
  const isIdentifierChar = (c) => isLetter(c) || isDigit(c);
  const isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  const getIdentOrNumber = (qualifier) => (qualifier(input[strpos]) ? input[strpos++] + getIdentOrNumber(qualifier) : '');

  const getIdentifier = () => ({
    token: tokens.ident,
    name: getIdentOrNumber(isIdentifierChar),
    strpos,
  });

  const getNumber = () => ({
    token: tokens.number,
    value: parseFloat(getIdentOrNumber(isNumberChar)),
    strpos,
  });

  return {
    getToken: () => {
      while (isSpace(input[strpos])) strpos++;
      if (strpos >= input.length) return tokens.end;

      const c = input[strpos];
      if (isLetter(c)) return getIdentifier();
      if (isDigit(c)) return getNumber();
      if (!mapCharToToken[c]) throw Error(`Char ${c} not allowed. Pos:${strpos}`);
      return {
        strpos: ++strpos,
        token: mapCharToToken[c],
      };
    },
  };
};

const doEval = (s, variables = {}, ops = sops) => {
  const CONSTS = {
    I: ops === csops ? 'C$(0, 1)' : C$(0, 1),
    PI: Math.PI,
    E: Math.exp(1),
  };

  let token;
  let params = [];

  const operand = () => {
    const op = () => {
      if (token.token === tokens.minus) {
        token = lex.getToken();
        return ops.neg(op());
      }
      if (token.token === tokens.plus) {
        token = lex.getToken();
        return ops.id(op());
      }
      if (token.token === tokens.plus) return ops.id(operand());
      if (token.token === tokens.number) return ops.id(token.value);
      if (token.token === tokens.ident) {
        let ret = CONSTS[token.name.toUpperCase()] || variables[token.name];
        if (ret === undefined && ops === csops) {
          ret = token.name;
          params = uniq([...params, token.name]);
        }
        if (typeof ret === 'function') {
          token = lex.getToken();
          return ret(expression());
        }
        if (ret === undefined) throw Error(`Unknow identifier <${token.name}>. Pos:${token.strpos}`);
        return ret;
      }
      if (token.token === tokens.lparen) {
        const ret = expression();
        if (token.token !== tokens.rparen) {
          throw Error(`Closing bracket not found!. Pos:${token.strpos}`);
        }
        return ret;
      }
      throw Error(`Operand expected.`);
    };

    token = lex.getToken();
    const ret = op();
    token = lex.getToken();
    return ret;
  };

  const term = () => {
    let val = operand();
    if (token.token === tokens.times) {
      return ops.mul(val, term());
    } else if (token.token === tokens.divide) {
      return ops.div(val, term());
    }
    return val;
  };

  const expression = () => {
    let val = term();
    if (token.token === tokens.plus) {
      return ops.add(val, expression());
    } else if (token.token === tokens.minus) {
      return ops.sub(val, expression());
    }
    return val;
  };

  const lex = lexParser(s);
  let val = expression();
  if (token != tokens.end) throw Error(`Unexpected symbol <${token.name}>. Pos:${token.strpos}`);

  if (ops === csops) {
    val = eval(params.length > 0 ? `(${params.join(',')}) => ${val}` : val);
  }

  if (val === -0) val = 0;
  if (val.i === -0) val.i = 0;
  if (val.r === -0) val.r = 0;

  return val;
};

const evalScalar = (s, variables) => doEval(s, variables, sops);
const evalComplex = (s, variables) => doEval(s, variables, cops);
const complexFunction = (s) => doEval(s, {}, csops);

const C$ = (r, i) => {
  if (typeof r === 'string' && typeof i === 'object') return evalComplex(r, i);
  if (typeof r === 'string') return complexFunction(r);
  if (typeof r === 'number') return { r, i: i || 0 };
  return r;
};

module.exports = {
  C$,
  evalScalar,
  evalComplex,
};

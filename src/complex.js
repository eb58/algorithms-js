C$ = (r, i) => ({ r, i: (i || 0) })

complex_ops = {
    id: x => C$(x),
    neg: (c) => C$(-c.r, -c.i),
    add: (c1, c2) => C$(c1.r + c2.r, c1.i + c2.i),
    sub: (c1, c2) => C$(c1.r - c2.r, c1.i - c2.i),
    mul: (c1, c2) => C$(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r),
    div: (c1, c2) => {
        const x = c2.r * c2.r + c2.i * c2.i;
        return C$((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x);
    }
}

scalar_ops = {
    id: x => x,
    neg: x => -x,
    add: (x, y) => x + y,
    sub: (x, y) => x - y,
    mul: (x, y) => x * y,
    div: (x, y) => x / y,
}

tokens = [
    "ident", "number", "minus", "plus", "times", "divide", "lparen", "rparen", "end"
].reduce((acc, s) => ({ ...acc, [s]: s }))

mapCharToToken = {
    '+': tokens.plus,
    '-': tokens.minus,
    '*': tokens.times,
    '/': tokens.divide,
    '(': tokens.lparen,
    ')': tokens.rparen,
}

const CONSTS = {
    "I": C$(0, 1),
    "PI": Math.PI,
    "E": Math.exp(1)
};

isLetter = (c) => c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c === '_'
isDigit = (c) => c >= '0' && c <= '9'
isNumberChar = (c) => isDigit(c) || c === '.'
isIdentifierChar = (c) => isLetter(c) || isDigit(c)
isSpace = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r'

lexParser = (input) => {
    let strpos = 0;

    getIdentOrNumber = (qualifier) => qualifier(input[strpos]) ? input[strpos++] + getIdentOrNumber(qualifier) : ""

    getIdentifier = () => ({
        token: tokens.ident,
        name: getIdentOrNumber(isIdentifierChar),
        strpos,
    })

    getNumber = () => ({
        token: tokens.number,
        value: parseFloat(getIdentOrNumber(isNumberChar)),
        strpos,
    })

    return {
        getToken: () => {
            while (isSpace(input[strpos])) strpos++;
            if (strpos >= input.length) return tokens.end;

            const c = input[strpos];
            if (isLetter(c))
                return getIdentifier();
            if (isDigit(c))
                return getNumber();
            if (!mapCharToToken[c])
                throw (`Char ${c} not allowed. Pos:${strpos} `)
            return {
                strpos: ++strpos,
                token: mapCharToToken[c]
            };
        }
    }
}

doEval = (s, variables, ops) => {
    variables = variables || {}
    ops = ops || scalar_ops
    let token

    operand = () => {
        token = lex.getToken();

        if (token.token === tokens.minus) {
            return ops.neg(operand());
        }
        if (token.token === tokens.number) {
            const val = ops.id(token.value);
            token = lex.getToken();
            return val;
        }
        if (token.token === tokens.ident) {
            const val = CONSTS[token.name.toUpperCase()] || variables[token.name]
            if (!val)
                throw `Unknow identifier <${token.name}>. Pos:${token.strpos}`
            token = lex.getToken();
            return val;
        }

        if (token.token === tokens.lparen) {
            const val = expression();
            if (token.token != tokens.rparen) {
                throw (`Closing bracket not found! Pos:${token.strpos} `);
            }
            token = lex.getToken();
            return val;
        }
        throw (`"Missing Operand or unknown Symbol detected" Pos:${token.strpos} `);
    }

    term = () => {
        const val = operand();
        return token.token == tokens.times
            ? ops.mul(val, term())
            : token.token == tokens.divide
                ? ops.div(val, term())
                : val;
    }

    factor = () => {
        const val = term();
        return token.token == tokens.plus
            ? ops.add(val, factor())
            : token.token == tokens.minus
                ? ops.sub(val, factor())
                : val;
    }

    expression = () => factor();

    const lex = lexParser(s);
    const val = expression();
    if (token != tokens.end)
        throw `Unexpected symbol <${token.name}>. Pos:${token.strpos}`

    if (val.i === -0) val.i = 0
    if (val.r === -0) val.r = 0

    return val;
}

evalScalar = (s, variables) => doEval(s, variables, scalar_ops)
evalComplex = (s, variables) => doEval(s, variables, complex_ops)

module && (module.exports = {
    evalScalar,
    evalComplex,
});

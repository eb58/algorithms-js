complex = (r, i) => ({ r, i: (i || 0) })

complex_ops = {
    id: x => complex(x),
    neg: (c) => complex(-c.r, -c.i),
    add: (c1, c2) => complex(c1.r + c2.r, c1.i + c2.i),
    sub: (c1, c2) => complex(c1.r - c2.r, c1.i - c2.i),
    mul: (c1, c2) => complex(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r),
    div: (c1, c2) => {
        const x = c2.r * c2.r + c2.i * c2.i;
        return complex((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x);
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
    "I": complex(0, 1),
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
            if (strpos >= input.length) return tokens.end;

            while (isSpace(input[strpos])) strpos++;
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
        let val = operand();
        while (token.token == tokens.times || token.token == tokens.divide) {
            if (token.token == tokens.times)
                val = ops.mul(val, operand());
            else if (token.token == tokens.divide)
                val = ops.div(val, operand());
        }
        return val;
    }

    factor = () => {
        let val = term();
        while (token.token == tokens.plus || token.token == tokens.minus) {
            if (token.token == tokens.plus)
                val = ops.add(val, factor())
            else if (token.token == tokens.minus)
                val = ops.sub(val, factor())
        }
        return val;
    }

    expression = () => factor();

    const lex = lexParser(s);
    const ret = expression();
    if (token != tokens.end)
        throw `Unexpected symbol <${token.name}>. Pos:${token.strpos}`

    if (ret.i === -0) ret.i = 0
    if (ret.r === -0) ret.r = 0

    return ret;
}

evalScalar = (s, variables) => doEval(s, variables, scalar_ops)
evalComplex = (s, variables) => doEval(s, variables, complex_ops)

module && (module.exports = {
    evalScalar,
    evalComplex,
});

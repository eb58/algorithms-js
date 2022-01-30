complex = (r, i) => ({ r, i: (i || 0) })
cneg = (c) => complex(-c.r, -c.i)
cadd = (c1, c2) => complex(c1.r + c2.r, c1.i + c2.i)
csub = (c1, c2) => complex(c1.r - c2.r, c1.i - c2.i)
cmul = (c1, c2) => complex(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r)
cdiv = (c1, c2) => {
    const x = c2.r * c2.r + c2.i * c2.i;
    return complex((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x);
}

complex_ops = {
    id: x => complex(x, 0),
    neg: cneg,
    add: cadd,
    sub: csub,
    mul: cmul,
    div: cdiv
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
    "ident", "number", "end", "eq", "lt", "gt",
    "minus", "plus", "times", "divide", "mod",
    "lparen", "rparen",
].reduce((acc, s) => (acc[s] = s, acc), {})

mapCharToToken = {
    '+': tokens.plus,
    '-': tokens.minus,
    '*': tokens.times,
    '/': tokens.divide,
    '%': tokens.mod,
    '(': tokens.lparen,
    ')': tokens.rparen,
    '<': tokens.lt,
    '>': tokens.gt,
}

const CONSTS = {
    "PI": Math.PI,
    "E": Math.exp(1)
};

isLetter = (c) => c.match(/[_a-z]/i)
isDigit = (c) => (c >= '0' && c <= '9')
isNumberChar = (c) => isDigit(c) || c === '.'
isIdentChar = (c) => c.match(/[_a-z]/i) || isDigit(c)
isSpace = (c) => c === ' '

lexParser = (input) => {
    let strpos = 0;

    getIdentOrNumber = (s, qualifier) => {
        let name = "";
        while (strpos < s.length && qualifier(s[strpos]))
            name += s.charAt(strpos++);
        return name
    }

    getIdentifier = () => ({
        token: tokens.ident,
        name: getIdentOrNumber(input, isIdentChar),
        strpos,
    })

    getNumber = () => ({
        token: tokens.number,
        value: parseFloat(getIdentOrNumber(input, isNumberChar)),
        strpos,
    })

    return {
        getToken: () => {
            if (strpos >= input.length) return tokens.end;

            while (isSpace(input[strpos])) strpos++;
            const c = input[strpos];
            if (isLetter(c))
                return getIdentifier();
            if (isNumberChar(c))
                return getNumber();
            if (!mapCharToToken[c]) {
                throw (`Char ${c} not allowed. Pos:${strpos} `);
            }
            strpos++;
            return {
                strpos,
                token: mapCharToToken[c]
            };
        }
    }
}

doEval = (s, variables, ops) => {
    variables = variables || {}
    ops = ops || scalar_ops

    operand = () => {
        if (token.token === tokens.minus) {
            token = lex.getToken();
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
            token = lex.getToken();
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
        while (token.token == tokens.times || token.token == tokens.divide || token.token == tokens.mod) {
            const multop = token.token;
            token = lex.getToken();
            if (multop == tokens.times)
                val = ops.mul(val, operand());
            else if (multop == tokens.divide)
                val = ops.div(val, operand());
        }
        return val;
    }

    factor = () => {
        let val = term();
        while (token.token == tokens.plus || token.token == tokens.minus) {
            const addop = token.token;
            token = lex.getToken();
            if (addop == tokens.plus)
                val = ops.add(val, factor())
            else if (addop == tokens.minus)
                val = ops.sub(val, factor())
        }
        return val;
    }

    expression = () => {
        return factor();
    }

    const lex = lexParser(s);
    token = lex.getToken();
    return expression();
}

evalScalar = (s, variables) => doEval(s, variables, scalar_ops)
evalComplex = (s, variables) => doEval(s, variables, complex_ops)

module && (module.exports = {
    lexParser,
    evalScalar,
    evalComplex,
});
C$ = (r, i) => ({ r, i: (i || 0) })
feedx = (x, f) => f(x)

complex_ops = {
    id: x => C$(x),
    neg: (c) => C$(-c.r, -c.i),
    add: (c1, c2) => C$(c1.r + c2.r, c1.i + c2.i),
    sub: (c1, c2) => C$(c1.r - c2.r, c1.i - c2.i),
    mul: (c1, c2) => C$(c1.r * c2.r - c1.i * c2.i, c1.r * c2.i + c1.i * c2.r),
    div: (c1, c2) => feedx(c2.r * c2.r + c2.i * c2.i, (x) => C$((c1.r * c2.r + c1.i * c2.i) / x, (c1.i * c2.r - c1.r * c2.i) / x))
}

scalar_ops = {
    id: x => x,
    neg: x => -x,
    add: (x, y) => x + y,
    sub: (x, y) => x - y,
    mul: (x, y) => x * y,
    div: (x, y) => x / y,
}

complex_string_ops = {
    id: x => `${x}`,
    neg: x => `-${x}`,
    add: (x, y) => `complex_ops.add(${x}, ${y})`,
    sub: (x, y) => `complex_ops.sub(${x}, ${y})`,
    mul: (x, y) => `complex_ops.mul(${x}, ${y})`,
    div: (x, y) => `complex_ops.div(${x}, ${y})`,
}

tokens = [
    "ident", "number", "minus", "plus", "times", "divide", "lparen", "rparen", "end"
].reduce((acc, s) => ({ ...acc, [s]: s }), {})

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
                throw (`Char ${c} not allowed. Pos:${strpos}`)
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
        const op = () => {
            if (token.token === tokens.minus)
                return ops.neg(operand());
            if (token.token === tokens.number)
                return ops.id(token.value);
            if (token.token === tokens.ident) {
                const ret = CONSTS[token.name.toUpperCase()] || variables[token.name]  || token.name
                if (ret === undefined)
                    throw `Unknow identifier <${token.name}>. Pos:${token.strpos}`
                return(ret)
            }
            if (token.token === tokens.lparen) {
                const ret = expression();
                if (token.token !== tokens.rparen) {
                    throw (`Closing bracket not found!. Pos:${token.strpos}`);
                }
                return ret
            }
            throw (`Operand expected.`);
        }

        token = lex.getToken();
        const ret = op();
        token = lex.getToken()
        return ret;
    }

    term = () => {
        let val = operand();
        while (token.token == tokens.times || token.token == tokens.divide) {
            if (token.token === tokens.times) {
                val = ops.mul(val, term())
            } else {
                val = ops.div(val, term())
            }
        }
        return val;
    }

    expression = () => {
        let val = term();
        while (token.token == tokens.plus || token.token == tokens.minus) {
            if (token.token === tokens.plus) {
                val = ops.add(val, term())
            } else {
                val = ops.sub(val, term())
            }
        }
        return val
    }

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


// TESTS for Debugging
isEqual = (a, b) => {
    try {
        doEval(a) !== b && console.log("ERROR", a, doEval(a))
    }
    catch (e) {
        console.log("EXCEPTION", e, a)
    }
}

// genFct = (s) => eval('(a,b,c) => ' + doEval(s, {}, complex_string_ops))
// const f = genFct("a*(b-c)")
// const v = f(C$(3), C$(5), C$(1))

// genFct = (s) => eval('(a) => ' + doEval(s, {}, complex_string_ops))
// const z = genFct("I*a")(C$(0,1))

isEqual("(1)", 1)
isEqual(("1*2*3*4"), 24)
isEqual(("1+3+5"), 9)
isEqual(("3*3+5*5"), 34)
isEqual("1", 1)
isEqual("-1", -1)
isEqual("(5+3)", 8)
isEqual("(1*3)", 3)
isEqual("1+3", 4)
isEqual(("3*3"), 9)
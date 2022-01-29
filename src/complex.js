tokens = [
    "ident", "number", "eq", "lt", "gt",
    "minus", "plus", "times", "divide", "lparen", "rparen",
    "error"
].reduce((acc, s) => (acc[s] = s, acc), {})

lexParser = (input) => {
    let strpos = 0;
    const mapCharToToken = {
        '+': tokens.plus,
        '-': tokens.minus,
        '*': tokens.times,
        '/': tokens.divide,
        '%': tokens.divide,
        '(': tokens.lparen,
        ')': tokens.rparen,
    }

    ////////////////////////////////////////////////////////////////////////////
    isLetter = (c) => c.match(/[_a-z]/i)
    isDigit = (c) => (c >= '0' && c <= '9')

    getIdentifier = () => {
        const values = {
            "PI": Math.PI,
            "E": Math.exp(1)
        };
        let name = "";
        while (strpos < input.length && isLetter(input[strpos]))
            name = name + input.charAt(strpos++);
        return {
            token: tokens.ident,
            value: values[name.toUpperCase()],
            name,
            strpos,
        }
    }

    getNumber = () => {
        let num = "";
        while (strpos < input.length && (isDigit(input[strpos]) || input[strpos] === '.'))
            num = num + input.charAt(strpos++);
        return {
            token: tokens.number,
            value: parseFloat(num),
            strpos,
        }
    }

    return {
        getToken: () => {
            if (strpos >= input.length) return;

            while (input.charAt(strpos) === ' ') strpos++;
            const c = input.charAt(strpos);
            if (isLetter(c) || c == '_')
                return getIdentifier();
            if (isDigit(c) || c == '.')
                return getNumber();
            strpos++;
            if (!mapCharToToken[c]) {
                throw (`Char ${c} not allowed. Pos:${strpos} `);
            }
            return {
                strpos,
                token: mapCharToToken[c] || tokens.error
            };
        }
    }
}

evalComplex = (s, variables) => {
    variables = variables || {}
    operand = () => {
        if (token && token.token == tokens.minus) {
            token = lex.getToken();
            return -operand();
        }
        if (token && token.token == tokens.number) {
            const val = token.value;
            token = lex.getToken();
            return val;
        }
        if (token && token.token == tokens.ident) {
            if (token.value) { // Constants PI or E
                const val = token.value;
                token = lex.getToken();
                return val;
            }
            else if (variables[token.name]) {
                const val = variables[token.name]
                token = lex.getToken();
                return val;
            }
            throw `Unknow identifier <${token.name}>. Pos:${token.strpos}`
            //short i= 0;
            //while (functable[i].f && Ident, functable[i].fname))i++;
            //if (functable[i].f) return Function(i);
        }

        if (token && token.token == tokens.lparen) {
            token = lex.getToken();
            const val = expression();
            if (token && token.token != tokens.rparen) {
                throw (`Closing bracket not found! Pos:${token.strpos} `);
            }
            token = lex.getToken();
            return val;
        }
        throw (`"Missing Operand or unknown Symbol detected" Pos:${token.strpos} `);
    }

    term = () => {
        let val = operand();
        while (token && (token.token == tokens.times || token.token == tokens.slash || token.token == tokens.mod)) {
            const multop = token.token;
            token = lex.getToken();
            if (multop == tokens.times)
                val *= operand();
            else if (multop == tokens.slash)
                val /= operand();
        }
        return val;
    }

    factor = () => {
        let val = term();
        while (token && (token.token == tokens.plus || token.token == tokens.minus)) {
            const addop = token.token;
            token = lex.getToken();
            if (addop == tokens.plus)
                val += factor();
            else if (addop == tokens.minus)
                val -= factor();
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

module.exports = {
    lexParser,
    evalComplex
};
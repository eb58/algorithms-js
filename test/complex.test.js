const { evalComplex, evalScalar } = require('../src/complex');

test('Exceptions', () => {
//     expect(() => evalScalar("p+5")).toThrow("Unknow identifier <p>. Pos:1")
    expect(() => evalScalar("(1+5")).toThrow("Closing bracket not found!")
    expect(() => evalScalar("1+")).toThrow("Operand expected.")
    expect(() => evalScalar("%1+")).toThrow("Char % not allowed. Pos:0")
    expect(() => evalScalar("1+3 sa")).toThrow("Unexpected symbol <sa>. Pos:6")

    // expect(() => evalComplex("p+5")).toThrow("Unknow identifier <p>. Pos:1")
    // expect(() => evalComplex("p*5")).toThrow("Unknow identifier <p>. Pos:1")
})



test('evalScalar', () => {

    expect(evalScalar("5")).toBe(5)
    expect(evalScalar("-55")).toBe(-55)
    expect(evalScalar(" 5 ")).toBe(5)
    expect(evalScalar("( 5 )")).toBe(5)

    expect(evalScalar("1+3")).toBe(4)
    expect(evalScalar("1+3+5")).toBe(9)
    expect(evalScalar("2*7+3")).toBe(17)
    expect(evalScalar("1+3+5")).toBe(9)
    expect(evalScalar("3*3")).toBe(9)
    expect(evalScalar("1*2*3*4")).toBe(24)
    expect(evalScalar("(1+1)*(3+3)")).toBe(12)
    expect(evalScalar("(7+4*3+13)")).toBe(32)
    expect(evalScalar("(1+1)*(3*3)")).toBe(18)
    expect(evalScalar("3*3+5*5")).toBe(34)
    expect(evalScalar("3*(3+5)*5")).toBe(120)

    expect(evalScalar("3/5")).toBe(3 / 5)
    expect(evalScalar("PI*3")).toBe(Math.PI * 3)
    expect(evalScalar("pi*3")).toBe(Math.PI * 3)
    expect(evalScalar("E*3")).toBe(Math.exp(1) * 3)

    // with variables
    const a = 3
    const b = 7
    expect(evalScalar("a", { a, b })).toBe(3)
    expect(evalScalar("-a", { a, b })).toBe(-3)
    expect(evalScalar("a+b", { a, b })).toBe(10)
    expect(evalScalar("a*b", { a, b })).toBe(21)
    expect(evalScalar("(a)+(b)", { a, b })).toBe(10)
})

test('evalComplex', () => {

    expect(evalComplex("i")).toEqual(C$(0, 1))
    expect(evalComplex("i*i")).toEqual(C$(-1))
    expect(evalComplex("i*i*i")).toEqual(C$(0, -1))
    expect(evalComplex("i*i*i*i")).toEqual(C$(1))
    expect(evalComplex("1+2*i")).toEqual(C$(1,2))
    expect(evalComplex("1+i*i")).toEqual(C$(0))
    expect(evalComplex("(1+i)*i")).toEqual(C$(-1,1))

    // with variables
    a = 3
    vars = { a: C$(3), b: C$(7) }
    expect(evalComplex("a", vars)).toEqual(C$(3))
    expect(evalComplex("-a", vars)).toEqual(C$(-3))
    expect(evalComplex("a+b", vars)).toEqual(C$(10))
    expect(evalComplex("a*b", vars)).toEqual(C$(21))
    expect(evalComplex("(a)+(b)", vars)).toEqual(C$(10))


    vars = { a: C$(2, 2), b: C$(3, 0) }
    expect(evalComplex("a", vars)).toEqual(C$(2, 2))
    expect(evalComplex("a+b", vars)).toEqual(C$(5, 2))
    expect(evalComplex("a*a", vars)).toEqual(C$(0, 8))
    expect(evalComplex("5*a", vars)).toEqual(C$(10, 10))
});

test('evalString', () => {

    //expect(evalString("1+3",{a:3})).toEqual("cmul(x, y)")
    // expect(evalString("i*i")).toEqual(C$(-1))
    // expect(evalString("i*i*i")).toEqual(C$(0, -1))
    // expect(evalString("i*i*i*i")).toEqual(C$(1))

    // // with variables
    // a = 3
    // vars = { a: C$(3), b: C$(7) }
    // expect(evalComplex("a", vars)).toEqual(C$(3))
    // expect(evalComplex("-a", vars)).toEqual(C$(-3))
    // expect(evalComplex("a+b", vars)).toEqual(C$(10))
    // expect(evalComplex("a*b", vars)).toEqual(C$(21))
    // expect(evalComplex("(a)+(b)", vars)).toEqual(C$(10))


    // vars = { a: C$(2, 2), b: C$(3, 0) }
    // expect(evalComplex("a", vars)).toEqual(C$(2, 2))
    // expect(evalComplex("a+b", vars)).toEqual(C$(5, 2))
    // expect(evalComplex("a*a", vars)).toEqual(C$(0, 8))
    // expect(evalComplex("5*a", vars)).toEqual(C$(10, 10))
});

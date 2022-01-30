const { evalComplex } = require('../src/complex');
test('evalComplex', () => {
    expect(evalComplex("5")).toBe(5)
    expect(evalComplex("-55")).toBe(-55)

    expect(evalComplex("1+3")).toBe(4)
    expect(evalComplex("3*3")).toBe(9)
    expect(evalComplex("(1+1)*(3+3)")).toBe(12)
    expect(evalComplex("(1+1)*(3*3)")).toBe(18)
    expect(evalComplex("3/5")).toBe(3/5)
    expect(evalComplex("PI*3")).toBe(Math.PI * 3)
    expect(evalComplex("pi*3")).toBe(Math.PI * 3)
    expect(evalComplex("E*3")).toBe(Math.exp(1)* 3)

    // with variables
    expect(evalComplex("a", { a: 3, b: 7 })).toBe(3)
    expect(evalComplex("-a", { a: 3, b: 7 })).toBe(-3)
    expect(evalComplex("a+b", { a: 3, b: 7 })).toBe(10)
    expect(evalComplex("a*b", { a: 3, b: 7 })).toBe(21)
    expect(evalComplex("(a)+(b)", { a: 3, b: 7 })).toBe(10)


    evalComplex("5p")
    expect(()=>evalComplex("p+5", { a: 3, b: 7 })).toThrow("Unknow identifier <p>. Pos:1")

});


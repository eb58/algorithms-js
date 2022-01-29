const { evalComplex } = require('../src/complex');
test('evalComplex', () => {

    expect(evalComplex("1+3")).toBe(4)
    expect(evalComplex("3*3")).toBe(9)
    expect(evalComplex("(1+1)*(3+3)")).toBe(12)
    expect(evalComplex("(1+1)*(3*3)")).toBe(18)
    expect(evalComplex("PI*3")).toBe(Math.PI * 3)

    // with variables
    expect(evalComplex("a+b", { a: 3, b: 7 })).toBe(10)
    expect(evalComplex("a*b", { a: 3, b: 7 })).toBe(21)
    expect(evalComplex("(a)+(b)", { a: 3, b: 7 })).toBe(10)

    expect(()=>evalComplex("p+5", { a: 3, b: 7 })).toThrow("Unknow identifier <p>. Pos:1")

});


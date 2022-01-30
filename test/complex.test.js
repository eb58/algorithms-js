const { evalComplex, evalScalar } = require('../src/complex');

test('evalScalar', () => {

    expect(evalScalar("5")).toBe(5)
    expect(evalScalar("-55")).toBe(-55)

    expect(evalScalar("1+3")).toBe(4)
    expect(evalScalar("3*3")).toBe(9)
    expect(evalScalar("(1+1)*(3+3)")).toBe(12)
    expect(evalScalar("(1+1)*(3*3)")).toBe(18)
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

    expect(() => evalScalar("p+5", { a, b })).toThrow("Unknow identifier <p>. Pos:1")
})

test('evalComplex', () => {

    // with variables
    a = 3
    vars = { a: complex(3), b: complex(7) }
    expect(evalComplex("a", vars)).toEqual(complex(3))
    expect(evalComplex("-a", vars)).toEqual(complex(-3))
    expect(evalComplex("a+b", vars)).toEqual(complex(10))
    expect(evalComplex("a*b", vars)).toEqual(complex(21))
    expect(evalComplex("(a)+(b)", vars)).toEqual(complex(10))


    vars = { a: complex(2,2), b: complex(3,0) }
    expect(evalComplex("a", vars)).toEqual(complex(2,2))
    expect(evalComplex("a+b", vars)).toEqual(complex(5,2))
    expect(evalComplex("a*a", vars)).toEqual(complex(0,8))
    expect(evalComplex("5*a", vars)).toEqual(complex(10,10))

    evalComplex("5p")
    expect(() => evalComplex("p+5", { a: 3, b: 7 })).toThrow("Unknow identifier <p>. Pos:1")

});



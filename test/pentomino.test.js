const { filledBoard, elements, cellsWithValue, translate, rotate90 } = require("../src/pentomino/pentomino");

test('pentomino basics', () => {
    expect(elements.length).toBe(12);
    expect(elements[0].join("")).toBe("a         aa         a         a                            ");
    expect(elements[1].join("")).toBe("                    b         b         b         bb        ");
    expect(elements[2].join("")).toBe("                      c         c        ccc                ");
    expect(elements[3].join("")).toBe(" dd         dd         d                                    ");
});

test('cellsWithValue', () => {
    expect(cellsWithValue(filledBoard,'a').length).toBe(5);
    expect(cellsWithValue(filledBoard,'a')).toEqual([
        {'c':0, 'r':0, val:'a'},
        {'c':0, 'r':1, val:'a'},
        {'c':1, 'r':1, val:'a'},
        {'c':1, 'r':2, val:'a'},
        {'c':1, 'r':3, val:'a'},
    ]);
})

test('translate', () => {
    expect(translate('a', -1, 1)).toBe(undefined)
    expect(translate('a', 1, -1)).toBe(undefined)
    expect(translate('a', 0, 1).join("")).toBe(" a         aa         a         a                           ")
    expect(translate('a', 0, 2).join("")).toBe("  a         aa         a         a                          ")
    expect(translate('a', 1, 1).join("")).toBe("           a         aa         a         a                 ")
    expect(translate('a', 1, 2).join("")).toBe("            a         aa         a         a                ")
});

test('rotate90', () => {
});
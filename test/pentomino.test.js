const {
    redim,
    extract,
    minmaxColIndexArr,
    minmaxColIndex,
    minmaxRowIndex,
    reshape,
    makeQuadratic,
    filledBoard,
    elements,
    cellsWithValue,
    translate,
    transpose,
    rotate90
} = require('../src/pentomino/pentomino');

test('matrix makeQuadratic', () => {
    expect(makeQuadratic([[1]], 0)).toEqual([[1]]);
    expect(makeQuadratic([[1], [3]], 0)).toEqual([[1, 0], [3, 0]]);
    expect(makeQuadratic([[1, 2], [3, 4]], 0)).toEqual([[1, 2], [3, 4]]);
    expect(makeQuadratic([[1, 2, 3], [4, 5, 6]], 0)).toEqual([[1, 2, 3], [4, 5, 6], [0, 0, 0]]);
});

test('redim matrix', () => {
    const mat = [[1, 2, 3], [4, 5, 6]]
    expect(redim(mat, 1, 1)).toEqual([[1]]);
    expect(redim(mat, 2, 1)).toEqual([[1], [4]]);
    expect(redim(mat, 2, 2)).toEqual([[1, 2], [4, 5]]);
    expect(redim(mat, 1, 4)).toEqual([[1, 2, 3, 0]]);
    expect(redim(mat, 4, 4)).toEqual([[1, 2, 3, 0], [4, 5, 6, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
});

test('extract matrix', () => {
    const mat = [[1, 7, 7, 7], [1, 6, 6, 8], [1, 3, 4, 3], [1, 1, 9, 6]]
    // expect(extract(mat, 1)).toEqual([[1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0], [1, 1, 0, 0]]);
});

test('minmaxColIndexArr', () => {
    const m = reshape(filledBoard.map(x => x === 'c' ? 'c' : ' '), 10)
    expect(minmaxColIndexArr([0, 1, 0, 0, 1, 0], 1)).toEqual({ min: 1, max: 4 });
    expect(minmaxColIndexArr([1, 1, 0, 0, 1, 0], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr([1, 1, 5, 0, 1, 7], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr(m[4], 'c')).toEqual({ min: 1, max: 3 });
});

test('minmaxColIndex', () => {
    const m = reshape(filledBoard.map(x => x === 'c' ? 'c' : ' '), 10)
    expect(minmaxColIndex(m, 'c')).toEqual({ min: 1, max: 3 });
});

test('minmaxRowIndex', () => {
    const m = reshape(filledBoard.map(x => x === 'c' ? 'c' : ' '), 10)
    expect(minmaxRowIndex(m, 'c')).toEqual({ min: 2, max: 4 });
});

test('extract', () => {
    const m = reshape(filledBoard.map(x => x === 'c' ? 'c' : ' '), 10)
    expect(extract(m, 'c')).toEqual([[" ", "c", " "], [" ", "c", " "], ["c", "c", "c"]]);
    expect(rotate90(extract(m, 'c'))).toEqual([[" ", " ", "c"], ["c", "c", "c"], [" ", " ", "c"]]);
});



test('transpose matrix', () => {
    const mat = [
        [' ', 'c', 'c'],
        [' ', ' ', 'c'],
        [' ', ' ', 'c']
    ]
    expect(transpose(mat)).toEqual([
        [' ', ' ', ' '],
        ['c', ' ', ' '],
        ['c', 'c', 'c'],
    ]);
})

test('rotate matrix', () => {
    const mat = [
        [' ', 'c', 'c', 'c', ' '],
        [' ', ' ', 'c', ' ', ' '],
        [' ', ' ', 'c', ' ', ' ']
    ]
    expect(rotate90(mat)).toEqual([
        [' ', ' ', ' ', ' ', ' '],
        ['c', ' ', ' ', ' ', ' '],
        ['c', 'c', 'c', ' ', ' '],
        ['c', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ']
    ]);

})

test('normalizeElement', () => {
    const m = reshape(filledBoard.map(x => x === 'b' ? 'b' : ' '), 10)
});

test('pentomino basics', () => {
    expect(elements.length).toBe(12);
    expect(elements[0].join('')).toBe('a         aa         a         a                            ');
    expect(elements[1].join('')).toBe('                    b         b         b         bb        ');
    expect(elements[2].join('')).toBe('                      c         c        ccc                ');
    expect(elements[3].join('')).toBe(' dd         dd         d                                    ');
});

test('cellsWithValue', () => {
    expect(cellsWithValue(filledBoard, 'a').length).toBe(5);
    expect(cellsWithValue(filledBoard, 'a')).toEqual([
        { 'c': 0, 'r': 0, val: 'a' },
        { 'c': 0, 'r': 1, val: 'a' },
        { 'c': 1, 'r': 1, val: 'a' },
        { 'c': 1, 'r': 2, val: 'a' },
        { 'c': 1, 'r': 3, val: 'a' },
    ]);
})

test('translate', () => {
    expect(translate('a', -1, 1)).toBe(undefined)
    expect(translate('a', 1, -1)).toBe(undefined)
    expect(translate('a', 0, 1).join('')).toBe(' a         aa         a         a                           ')
    expect(translate('a', 0, 2).join('')).toBe('  a         aa         a         a                          ')
    expect(translate('a', 1, 1).join('')).toBe('           a         aa         a         a                 ')
    expect(translate('a', 1, 2).join('')).toBe('            a         aa         a         a                ')
});

test('rotate90', () => {
});
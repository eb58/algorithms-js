const {
    redim,
    minmaxColIndexArr,
    minmaxColIndex,
    minmaxRowIndex,
    reshape,
    transpose,
    rotate90,
    makeQuadratic,
    extract,
    translate,
    filledBoard,
    generateTiles,
    solvePentonimo
} = require('../src/pentomino/pentomino');

test('matrix makeQuadratic', () => {
    expect(makeQuadratic([[1]], 0)).toEqual([[1]]);
    expect(makeQuadratic([[1], [3]], 0)).toEqual([[1, 0], [3, 0]]);
    expect(makeQuadratic([[1, 2], [3, 4]], 0)).toEqual([[1, 2], [3, 4]]);
    expect(makeQuadratic([[1, 2, 3], [4, 5, 6]], 0)).toEqual([[1, 2, 3], [4, 5, 6], [0, 0, 0]]);
});

test('redim matrix', () => {
    const mat = [[1, 2, 3], [4, 5, 6]]
    expect(redim([], 1, 1)).toEqual([[0]]);
    expect(redim([], 2, 2)).toEqual([[0, 0], [0, 0]]);
    expect(redim(mat, 1, 1)).toEqual([[1]]);
    expect(redim(mat, 2, 1)).toEqual([[1], [4]]);
    expect(redim(mat, 2, 2)).toEqual([[1, 2], [4, 5]]);
    expect(redim(mat, 1, 4)).toEqual([[1, 2, 3, 0]]);
    expect(redim(mat, 4, 4)).toEqual([[1, 2, 3, 0], [4, 5, 6, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
});

test('extract matrix', () => {
    const mat = [[1, 7, 7, 7], [1, 6, 6, 8], [1, 3, 4, 3], [1, 1, 9, 6]]
    expect(extract(mat, 1, 0)).toEqual([[1, 0], [1, 0], [1, 0], [1, 1]]);
});

test('minmaxColIndexArr', () => {
    const m = reshape(filledBoard.map(x => x === 't' ? 't' : ' '), 10)
    expect(minmaxColIndexArr([0, 1, 0, 0, 1, 0], 1)).toEqual({ min: 1, max: 4 });
    expect(minmaxColIndexArr([1, 1, 0, 0, 1, 0], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr([1, 1, 5, 0, 1, 7], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr(m[4], 't')).toEqual({ min: 1, max: 3 });
});

test('minmaxColIndex', () => {
    const m = reshape(filledBoard.map(x => x === 't' ? 't' : ' '), 10)
    expect(minmaxColIndex(m, 't')).toEqual({ min: 1, max: 3 });
});

test('minmaxRowIndex', () => {
    const m = reshape(filledBoard.map(x => x === 't' ? 't' : ' '), 10)
    expect(minmaxRowIndex(m, 't')).toEqual({ min: 2, max: 4 });
});

test('transpose matrix', () => {
    const mat = [[' ', 't', 't'], [' ', ' ', 't'], [' ', ' ', 't']]
    expect(transpose(mat)).toEqual([[' ', ' ', ' '], ['t', ' ', ' '], ['t', 't', 't'],]);
})

test('rotate matrix', () => {
    const mat = [[0, 1, 1, 1, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0]]
    expect(rotate90(mat)).toEqual([
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ]);
})

test('matrix translate', () => {
    const mat = [[1, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]]
    expect(translate(mat, 1, 0)).toEqual([[0, 0, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0]]);
    expect(translate(mat, 0, 1)).toEqual([[0, 1, 1, 1], [0, 0, 1, 0], [0, 0, 0, 0]]);
    expect(translate(mat, 1, 1)).toEqual([[0, 0, 0, 0], [0, 1, 1, 1], [0, 0, 1, 0]]);
    expect(translate(mat, 1, 2)).toEqual([[0, 0, 0, 0], [0, 0, 1, 1], [0, 0, 0, 1]]);
})

test('extract', () => { // symbols = ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    const extr = (c) => {
        const m = reshape(filledBoard.map(x => x === c ? c : ' '), 10)
        return extract(rotate90(extract(m, c)), c)
    }
    expect(extr('f')).toEqual([[' ', 'f', ' '], ['f', 'f', 'f'], [' ', ' ', 'f']]);
    expect(extr('i')).toEqual([['i'], ['i'], ['i'], ['i'], ['i']]);
    expect(extr('l')).toEqual([[' ', ' ', ' ', 'l'], ['l', 'l', 'l', 'l']]);
    expect(extr('n')).toEqual([[' ', 'n', 'n', 'n'], ['n', 'n', ' ', ' ']]);
    expect(extr('p')).toEqual([['p', 'p'], ['p', 'p'], ['p', ' ']]);
    expect(extr('t')).toEqual([[' ', ' ', 't'], ['t', 't', 't'], [' ', ' ', 't']]);
    expect(extr('u')).toEqual([['u', 'u'], ['u', ' '], ['u', 'u']]);
    expect(extr('v')).toEqual([['v', 'v', 'v'], [' ', ' ', 'v'], [' ', ' ', 'v']]);
    expect(extr('w')).toEqual([[' ', 'w', 'w'], ['w', 'w', ' '], ['w', ' ', ' ']]);
    expect(extr('x')).toEqual([[' ', 'x', ' '], ['x', 'x', 'x'], [' ', 'x', ' ']]);
    expect(extr('y')).toEqual([['y', ' '], ['y', ' '], ['y', 'y'], ['y', ' ']]);
    expect(extr('z')).toEqual([['z', ' ', ' '], ['z', 'z', 'z'], [' ', ' ', 'z']]);
});

test('generateTiles', () => {
    const res = Object.entries(generateTiles()).map(([key, value]) => key + ":" + value.length)
    expect(res).toEqual(['f:64', 'i:56', 'l:248', 'n:248', 'p:304', 't:128', 'u:152', 'v:128', 'w:128', 'x:32', 'y:248', 'z:128']);
})

test('solvePentonimo', () => {
    const solutions = solvePentonimo();
    expect(solutions.length).toBe(2339)
    expect(solutions.findIndex(s => s === 'llxiiiiiwwlxxxvvvwwylfxuuuvwyylffutuvzzyffnntpppzynnntttppzz')>=0).toBe(true)
    expect(solutions.findIndex(s => s === 'llxtttyyyylxxxtppuyulfxwtppuuulffwwpzvvvffnnwwzzzvnnniiiiizv')>=0).toBe(true)
    expect(solutions.findIndex(s => s === 'uuxllllvvvuxxxwwltnvuuxwwtttnvppfwzzytnnppffzyyyynpffzziiiii')>=0).toBe(true) 
})


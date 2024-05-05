const {
    filledBoards,
    minmaxColIndexArr, minmaxColIndex, minmaxRowIndex,
    reshape, makeQuadratic, transpose, rotate90, translate,
    pentonimo
} = require('../src/pentomino/pentomino');

test('matrix makeQuadratic', () => {
    expect(makeQuadratic([[1]], 0)).toEqual([[1]]);
    expect(makeQuadratic([[1], [3]], 0)).toEqual([[1, 0], [3, 0]]);
    expect(makeQuadratic([[1, 2], [3, 4]], 0)).toEqual([[1, 2], [3, 4]]);
    expect(makeQuadratic([[1, 2, 3], [4, 5, 6]], 0)).toEqual([[1, 2, 3], [4, 5, 6], [0, 0, 0]]);
});


test('minmaxColIndexArr', () => {
    expect(minmaxColIndexArr([0, 1, 0, 0, 1, 0], 1)).toEqual({ min: 1, max: 4 });
    expect(minmaxColIndexArr([1, 1, 0, 0, 1, 0], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr([1, 1, 5, 0, 1, 7], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr([0, 1, 0, 0, 1, 0], 1)).toEqual({ min: 1, max: 4 });
});

test('minmaxRowIndexArr', () => {
    expect(minmaxColIndexArr([0, 1, 0, 0, 1, 0], 1)).toEqual({ min: 1, max: 4 });
    expect(minmaxColIndexArr([1, 1, 0, 0, 1, 0], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr([1, 1, 5, 0, 1, 7], 1)).toEqual({ min: 0, max: 4 });
    expect(minmaxColIndexArr([0, 1, 0, 0, 1, 0], 1)).toEqual({ min: 1, max: 4 });
});

test('minmaxColIndex', () => {
    const m = [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 0, 1]]
    expect(minmaxColIndex(m, 1)).toEqual({ min: 2, max: 4 });
});

test('minmaxRowIndex', () => {
    const m = [[0, 0, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 1, 1, 0], [0, 0, 0, 0, 0]]
    expect(minmaxRowIndex(m, 1)).toEqual({ min: 1, max: 2 });
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

test('extract 6x10', () => { // symbols = ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    const filledBoard = filledBoards['6x10'];
    const pento = pentonimo(filledBoard)
    const extract = pento.internals.extract
    const extr = (c) => {
        const m = reshape(filledBoard.map(x => x === c ? c : ' '), pento.DIMC)
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

test('symbols', () => { // symbols = ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    const filledBoard = filledBoards['4x15'];
    const pento = pentonimo(filledBoard, 4, 15)
    expect(pento.internals.SYMBOLS).toEqual( ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']);
});

test('extract 4x15', () => { // symbols = ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    const filledBoard = filledBoards['4x15'];
    const pento = pentonimo(filledBoard, 4, 15)
    const extract = pento.internals.extract
    const extr = (c) => {
        const m = reshape(filledBoard.map(x => x === c ? c : ' '), pento.DIMC)
        return extract(rotate90(extract(m, c)), c)
    }
    expect(extr('f')).toEqual([[' ', 'f', 'f'], ['f', 'f', ' '], [' ', 'f', ' ']]);
    expect(extr('i')).toEqual([['i'], ['i'], ['i'], ['i'], ['i']]);
    expect(extr('l')).toEqual([['l', ' ', ' ', ' '], ['l', 'l', 'l', 'l']]);
    expect(extr('n')).toEqual([[' ', 'n'], ['n', 'n'], ['n', ' '], ['n', ' ']]);
    expect(extr('p')).toEqual([[' ', 'p', 'p'], ['p', 'p', 'p']]);
    expect(extr('t')).toEqual([[' ', ' ', 't'], ['t', 't', 't'], [' ', ' ', 't']]);
    expect(extr('u')).toEqual([['u', 'u'], [' ', 'u'], ['u', 'u']]);
    expect(extr('v')).toEqual([['v', 'v', 'v'], ['v', ' ', ' '], ['v', ' ', ' ']]);
    expect(extr('w')).toEqual([['w', ' ', ' '], ['w', 'w', ' '], [' ', 'w', 'w']]);
    expect(extr('x')).toEqual([[' ', 'x', ' '], ['x', 'x', 'x'], [' ', 'x', ' ']]);
    expect(extr('y')).toEqual([[' ', 'y'], [' ', 'y'], ['y', 'y'], [' ', 'y']]);
    expect(extr('z')).toEqual([[' ', 'z', 'z'], [' ', 'z', ' '], ['z', 'z', ' ']]);
});

test('generateTiles 6x10', () => {
    const pento = pentonimo(filledBoards['6x10'])
    const res = Object.entries(pento.internals.generateTiles()).map(([key, value]) => key + ":" + value.length)
    expect(res).toEqual(['f:64', 'i:56', 'l:248', 'n:248', 'p:304', 't:128', 'u:152', 'v:128', 'w:128', 'x:32', 'y:248', 'z:128']);
})

test('solve pentonimo 6 x 10', () => {
    const pento = pentonimo(filledBoards['6x10'])
    const solutions = pento.solve();
    expect(solutions.length).toBe(2339)
    expect(solutions.findIndex(s => s === 'llxiiiiiwwlxxxvvvwwylfxuuuvwyylffutuvzzyffnntpppzynnntttppzz') >= 0).toBe(true)
    expect(solutions.findIndex(s => s === 'llxtttyyyylxxxtppuyulfxwtppuuulffwwpzvvvffnnwwzzzvnnniiiiizv') >= 0).toBe(true)
    expect(solutions.findIndex(s => s === 'uuxllllvvvuxxxwwltnvuuxwwtttnvppfwzzytnnppffzyyyynpffzziiiii') >= 0).toBe(true)
})

test('solve pentonimo 4 x 15', () => {
    const pento = pentonimo(filledBoards['4x15'], 4, 15)
    const solutions = pento.solve();
    expect(solutions.length).toBe(368)
    // expect(solutions.findIndex(s => s === 'llxiiiiiwwlxxxvvvwwylfxuuuvwyylffutuvzzyffnntpppzynnntttppzz') >= 0).toBe(true)
    // expect(solutions.findIndex(s => s === 'llxtttyyyylxxxtppuyulfxwtppuuulffwwpzvvvffnnwwzzzvnnniiiiizv') >= 0).toBe(true)
    // expect(solutions.findIndex(s => s === 'uuxllllvvvuxxxwwltnvuuxwwtttnvppfwzzytnnppffzyyyynpffzziiiii') >= 0).toBe(true)
})


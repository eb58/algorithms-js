const { reshape, redim, makeQuadratic, translate, transpose, rotate90, rotateN90 } = require('../../src/ol').matrix;

test('redim', () => {
    expect(redim([], 1, 1)).toEqual([[0]]);
    expect(redim([], 2, 2)).toEqual([[0, 0], [0, 0]]);

    const mat = [[1, 2, 3], [4, 5, 6]]
    expect(redim(mat, 1, 1)).toEqual([[1]]);
    expect(redim(mat, 2, 1)).toEqual([[1], [4]]);
    expect(redim(mat, 2, 2)).toEqual([[1, 2], [4, 5]]);
    expect(redim(mat, 1, 4)).toEqual([[1, 2, 3, 0]]);
    expect(redim(mat, 4, 4)).toEqual([[1, 2, 3, 0], [4, 5, 6, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
});

test('reshape', () => {
    expect(reshape([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    expect(reshape([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    expect(reshape([1, 2, 3, 4], 4)).toEqual([[1, 2, 3, 4]]);
});

test('matrix makeQuadratic', () => {
    expect(makeQuadratic([[1]], 0)).toEqual([[1]]);
    expect(makeQuadratic([[1], [3]], 0)).toEqual([[1, 0], [3, 0]]);
    expect(makeQuadratic([[1, 2], [3, 4]], 0)).toEqual([[1, 2], [3, 4]]);
    expect(makeQuadratic([[1, 2, 3], [4, 5, 6]], 0)).toEqual([[1, 2, 3], [4, 5, 6], [0, 0, 0]]);
});

test('transpose matrix', () => {
    expect(transpose([[1,2,3]])).toEqual([[1], [2], [3]]);
    expect(transpose([[1,2,3],[4,5,6]])).toEqual([[1,4], [2,5], [3,6]]);
    expect(transpose([[0,1,1], [0,0,1], [0,0,1]])).toEqual([[0,0,0], [1,0,0], [1,1,1],]);
})

test('rotate matrix', () => {
    const mat = [[0, 1, 1, 1, 0], [0, 0, 1, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]
    expect(rotate90(mat)).toEqual([
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ]);
    expect(rotateN90(mat, 2)).toEqual(rotate90(rotate90(mat)));
    expect(rotateN90(mat, 4)).toEqual(mat);
})

test('matrix translate', () => {
    const mat = [[1, 1, 1, 0], [0, 1, 0, 0], [0, 0, 0, 0]]
    expect(translate(mat, 1, 0)).toEqual([[0, 0, 0, 0], [1, 1, 1, 0], [0, 1, 0, 0]]);
    expect(translate(mat, 0, 1)).toEqual([[0, 1, 1, 1], [0, 0, 1, 0], [0, 0, 0, 0]]);
    expect(translate(mat, 1, 1)).toEqual([[0, 0, 0, 0], [0, 1, 1, 1], [0, 0, 1, 0]]);
    expect(translate(mat, 1, 2)).toEqual([[0, 0, 0, 0], [0, 0, 1, 1], [0, 0, 0, 1]]);
})

test('redim and translate keep zeros when the default is not zero', () => {
    expect(redim([[0, 1]], 1, 3, 7)).toEqual([[0, 1, 7]]);
    expect(translate([[0, 1], [2, 3]], 0, 0, 7)).toEqual([[0, 1], [2, 3]]);
    expect(translate([[0, 1], [2, 3]], 1, 0, 7)).toEqual([[7, 7], [0, 1]]);
    expect(translate([[0, 1], [2, 3]], 0, 1, 7)).toEqual([[7, 0], [7, 2]]);
});
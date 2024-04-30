// some promitive from ol.js
const range = (n) => [...Array(n).keys()]
const isInInterval = (xs, a, b) => a <= xs && xs <= b
const minmax = (v1, v2) => ({ min: Math.min(v1.min, v2.min), max: Math.max(v1.max, v2.max) })

// array functions
const minmaxColIndexArr = (xs, v) => xs.reduce((acc, cv, n) => cv !== v ? acc : minmax(acc, { min: n, max: n }), { min: 1000, max: -1 })
const reshape = (xs, dim) => xs.reduce((acc, x, i) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, [])
// const reshape = (xs, cols) => range(cols).map(c => xs.slice(c * cols, (c + 1) * xs.length / cols))

// matrix function
const redim = (mat, nrows, ncols, defaultVal = 0) => range(nrows).map(r => range(ncols).map((c) => mat[r] && mat[r][c] || defaultVal))
const minmaxRowIndex = (mat, v) => mat.reduce((res, row, n) => !row.includes(v) ? res : minmax(res, { min: n, max: n }), { min: 1000, max: -1 })
const minmaxColIndex = (mat, v) => mat.reduce((res, row) => minmax(res, minmaxColIndexArr(row, v)), { min: 1000, max: 0 })
const makeQuadratic = (mat, defaultVal = 0) => redim(mat, Math.max(mat.length, mat[0].length), Math.max(mat.length, mat[0].length), defaultVal)
const transpose = (mat) => mat.map((r, ri) => r.map((_, ci) => mat[ci][ri]))
const extract = (mat, val, defaultVal = 0) => {
    const extracted = mat.map(r => r.map(c => c === val ? c : defaultVal))
    const mmr = minmaxRowIndex(extracted, val)
    const mmc = minmaxColIndex(extracted, val)
    const [dimr, dimc] = [mmr.max - mmr.min + 1, mmc.max - mmc.min + 1]
    return redim([], dimr, dimc, ' ').map((r, ri) => r.map((c, ci) => mat[mmr.min + ri][mmc.min + ci]))
}
const rotate90 = (mat, defaultVal = 0) => {
    const m = mat.length === mat[0].length ? [...mat] : makeQuadratic(mat, defaultVal)
    const N = m.length
    for (let r = 0; r < N / 2; r++) for (let c = r; c < N - r - 1; c++) {
        const temp = m[r][c];
        m[r][c] = m[c][N - 1 - r];
        m[c][N - 1 - r] = m[N - 1 - r][N - 1 - c];
        m[N - 1 - r][N - 1 - c] = m[N - 1 - c][r];
        m[N - 1 - c][r] = temp;
    }
    return m
}

///  PENTOMINO
const RANGE60 = range(60)

const filledBoardAsString = `
a d d e e e e f f f
a a d d e g g g f f
b a c d h g l g k k
b a c h h h l l k j
b c c c h l l k k j
b b i i i i i j j j`.trim().replaceAll(' ', '')
const filledBoard = filledBoardAsString.replaceAll('\n', '').split('')

const cellsWithValue = (board, c) => board.map((val, idx) => ({ r: Math.trunc(idx / 10), c: idx % 10, val })).filter(o => o.val === c)
const elements = 'abcdefghijkl'.split('').reduce((acc, c) => [...acc, filledBoard.map(x => x === c ? c : ' ')], [])

const translate = (val, dr, dc) => {
    const cellswithval = cellsWithValue(filledBoard, val)
    const inside = cellswithval.every((o) => isInInterval(o.r + dr, 0, 5) && isInInterval(o.c + dc, 0, 9))
    // console.log( dr, dc, inside, cellswithval)
    const y = cellswithval.map(o => ({ ...o, r: o.r + dr, c: o.c + dc }))
    const x = y.reduce((acc, cell) => (acc[cell.r * 10 + cell.c] = cell.val, acc), range(60).map(() => ' '))
    return inside ? x : undefined
}

// const rotate90 = (e) => {
//     const cellswithval = RANGE60.map(idx => ({ r: Math.trunc(idx / 10), c: idx % 10, val: e[idx] })).filter(o => o.val !== ' ')
//     const rotated = cellswithval.map(cell => ({ ...cell, r: -cell.c, c: cell.r }))
//     const inside = rotated.every((o) => isInInterval(o.r, 0, 5) && isInInterval(o.c, 0, 9))
//     return inside ? rotated : undefined
// }

'abcdefghijkl'.split('').forEach(c => {
// 'j'.split('').forEach(c => {
    const mat = reshape(filledBoard.map(ch => ch == c ? c : ' '), 10)
    let extractSym = extract(mat, c, ' ')
    // console.log(extractSym)
    const a = range(4).map((n) => range(n).reduce((res) => extract(rotate90(res, ' '),c,' '), extractSym))
    console.log(a)

    // for (let dr = -5; dr <= 5; dr++) for (let dc = -9; dc <= 9; dc++) {
    //     const tr = translate(c, dr, dc)
    //     if (tr) {
    //         // console.log('AAA', dr, dc, '\n', reshape(tr, 10).map(x => x.join('')))
    //         // if (rotate90(tr)) console.log(rotate90(tr))

    //     }
    // }
})

module.exports = {
    redim, extract,
    minmaxColIndexArr, minmaxColIndex, minmaxRowIndex,
    reshape, makeQuadratic, transpose, rotate90,
    filledBoard,
    elements,
    cellsWithValue,
    translate
}
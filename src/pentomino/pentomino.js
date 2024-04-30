const range = (n) => [...Array(n).keys()]
const max = (xs) => xs.reduce((a, x) => x > a ? x : a, xs[0])
const min = (xs) => xs.reduce((a, x) => x < a ? x : a, xs[0])

// const reshape = (xs, cols) => range(cols).map(c => xs.slice(c * cols, (c + 1) * xs.length / cols))
const reshape = (xs, dim) => xs.reduce((acc, x, i) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, [])
const isInInterval = (xs, a, b) => a <= xs && xs <= b

// matrix function
const redim = (mat, nrows, ncols, defaultVal = 0) => range(nrows).map(r => range(ncols).map((c) => mat[r] && mat[r][c] || defaultVal))
const extract = (mat, val, defaultVal = 0) => mat.map(r => r.map(c => c === val ? c : defaultVal))
const minmaxIndex = (xs, v) => xs.reduce(({ minc, maxc }, cv, idx) => ({ minc: cv !== v ? minc : min([minc, idx]), maxc: cv !== v ? maxc : max([maxc, idx]) }), { minc: 1000, maxc: 0 })
const makeQuadratic = (m, defaultVal = " ") => redim(m, Math.max(m.length, m[0].length), Math.max(m.length, m[0].length), defaultVal)

const rotate90 = (m) => {
    m = makeQuadratic(m)
    const N = m.length
    for (let r = 0; r < N / 2; r++) for (let c = r; c < N - r - 1; c++) {
        let temp = m[r][c];
        m[r][c] = m[c][N - 1 - r];
        m[c][N - 1 - r] = m[N - 1 - r][N - 1 - c];
        m[N - 1 - r][N - 1 - c] = m[N - 1 - c][r];
        m[N - 1 - c][r] = temp;
    }
    return m
}

// const rotate90 = (m) => {
//     const x = m.length === m[0].length ? [...m] : makeQuadratic(m)
//     range(x.length).forEach(r => range(x.length).forEach(c => {
//         x[c][x.length - r] = m[r][c]
//     }))
//     return x
// }

// const reduceMatrix = (mat, defaultIgnore = 0) = 

// some static data
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
    for (let dr = -5; dr <= 5; dr++) for (let dc = -9; dc <= 9; dc++) {
        const tr = translate(c, dr, dc)
        if (tr) {
            // console.log("AAA", dr, dc, "\n", reshape(tr, 10).map(x => x.join("")))
            // if (rotate90(tr)) console.log(rotate90(tr))

        }
    }

})

module.exports = {
    redim, extract, minmaxIndex, reshape, makeQuadratic, rotate90,
    filledBoard,
    elements,
    cellsWithValue,
    translate
}
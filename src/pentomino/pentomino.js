// some primitives 
const range = (n) => [...Array(n).keys()]
const isInInterval = (xs, a, b) => a <= xs && xs <= b
const minmax = (v1, v2) => ({ min: Math.min(v1.min, v2.min), max: Math.max(v1.max, v2.max) })

// array functions
const minmaxColIndexArr = (xs, v) => xs.reduce((acc, cv, n) => cv !== v ? acc : minmax(acc, { min: n, max: n }), { min: 1000, max: -1 })
const reshape = (xs, dim) => xs.reduce((acc, x, i) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, [])
// const reshape = (xs, cols) => range(cols).map(c => xs.slice(c * cols, (c + 1) * xs.length / cols))

// matrix functions
const redim = (mat, nrows, ncols, defaultVal = 0) => range(nrows).map(r => range(ncols).map((c) => mat[r] && mat[r][c] || defaultVal))
const minmaxRowIndex = (mat, v) => mat.reduce((res, row, n) => !row.includes(v) ? res : minmax(res, { min: n, max: n }), { min: 1000, max: -1 })
const minmaxColIndex = (mat, v) => mat.reduce((res, row) => minmax(res, minmaxColIndexArr(row, v)), { min: 1000, max: 0 })
const makeQuadratic = (mat, defaultVal = ' ') => redim(mat, Math.max(mat.length, mat[0].length), Math.max(mat.length, mat[0].length), defaultVal)
const makeCopy = (mat) => mat.map(r => [...r])
const transpose = (mat) => mat.map((r, ri) => r.map((_, ci) => mat[ci][ri]))
const translate = (mat, dr, dc, defaultVal = 0) => {
    const [dimr, dimc] = [mat.length, mat[0].length];
    const newMat = redim([], dimr, dimc, defaultVal);
    for (let r = 0; r < dimr - dr; r++) for (let c = 0; c < dimc - dc; c++)
        newMat[r + dr][c + dc] = mat[r][c]
    return newMat
}


const rotate90 = (mat) => {
    const m = mat.length === mat[0].length ? [...mat] : makeQuadratic(mat, ' ')
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

const extract = (mat, val, defaultVal = ' ') => {
    const extracted = mat.map(r => r.map(c => c === val ? c : defaultVal))
    const mmr = minmaxRowIndex(extracted, val)
    const mmc = minmaxColIndex(extracted, val)
    const [dimr, dimc] = [mmr.max - mmr.min + 1, mmc.max - mmc.min + 1]
    return redim([], dimr, dimc).map((r, ri) => r.map((c, ci) => extracted[mmr.min + ri][mmc.min + ci]), ' ')
}

const translateBoard = (board, dr, dc, defaultVal = ' ') =>{
    const [dimr, dimc] = [board.length, board[0].length];
    const newBoard = translate(board,dr,dc,defaultVal)
    let [cnt1, cnt2] = [0, 0]
    for (let r = 0; r < dimr; r++) for (let c = 0; c < dimc; c++) {
        cnt1 += (board[r][c] !== defaultVal)
        cnt2 += (newBoard[r][c] !== defaultVal)
    }
    return cnt1 != cnt2 ? undefined : newBoard
}

// const cellsWithValue = (board, c) => board
//     .map((val, idx) => ({ r: Math.trunc(idx / 10), c: idx % 10, val }))
//     .filter(o => o.val === c)


'a'.split('').forEach(ch => {
    const extractSym = makeQuadratic(extract(reshape(filledBoard, 10), ch), ' ')
    const elements = range(4)
        .reduce((res, n) => [...res, range(n).reduce(elem => rotate90(elem), makeCopy(extractSym))], [])
        .reduce((acc, e) => ([...acc, e, transpose(e)]), [])
        .map(x => makeQuadratic(extract(x, ch)))
    // console.log("XXX", elements)
    const uniqElementsAsString = [... new Set(elements.map(x => x.flat().join('')))]
    const uniqElements = uniqElementsAsString.map(x => reshape(x.split(''), Math.sqrt(x.length)))
    console.log("BBB", uniqElements.length, uniqElements)
    const [dimr, dimc] = [6, 10]
    uniqElements.map(elem => redim(elem, dimr, dimc, ' ')).forEach(board => {
        range(6).forEach(dr => range(10).forEach(dc => {
            const translated = translateBoard(board, dr, dc)
            if (translated) {
                console.log("FFF", dr, dc, translated.map(r => r.join("")))
            }
        }))

    })

})

module.exports = {
    redim, extract,
    minmaxColIndexArr, minmaxColIndex, minmaxRowIndex,
    reshape, makeQuadratic, transpose, rotate90, translate,
    filledBoard
}
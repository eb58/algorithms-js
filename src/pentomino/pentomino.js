const dlx_solve = require("../dlx");    // ~23 sec
// const dlxlib = require('dlxlib');       // ~65 sec         
// const { DancingLinkX } = require('@algorithm.ts/dlx') // ????

// some primitives 
const range = (n) => [...Array(n).keys()]
const minmax = (v1, v2) => ({ min: Math.min(v1.min, v2.min), max: Math.max(v1.max, v2.max) })

// array functions
const minmaxColIndexArr = (xs, v) => xs.reduce((acc, cv, n) => cv !== v ? acc : minmax(acc, { min: n, max: n }), { min: 1000, max: -1 })
const reshape = (xs, dim) => xs.reduce((acc, x, i) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, [])
// const reshape = (xs, cols) => range(cols).map(c => xs.slice(c * cols, (c + 1) * xs.length / cols))

// matrix functions
const redim = (mat, nrows, ncols, defVal = 0) => range(nrows).map(r => range(ncols).map((c) => mat[r] && mat[r][c] || defVal))
const minmaxRowIndex = (mat, v) => mat.reduce((res, row, n) => !row.includes(v) ? res : minmax(res, { min: n, max: n }), { min: 1000, max: -1 })
const minmaxColIndex = (mat, v) => mat.reduce((res, row) => minmax(res, minmaxColIndexArr(row, v)), { min: 1000, max: 0 })
const makeQuadratic = (mat, defVal = 0) => redim(mat, Math.max(mat.length, mat[0].length), Math.max(mat.length, mat[0].length), defVal)
const makeCopy = (mat) => mat.map(r => [...r])
const transpose = (mat) => mat.map((r, ri) => r.map((_, ci) => mat[ci][ri]))
const translate = (mat, dr, dc, defVal = 0) => {
    const [dimr, dimc] = [mat.length, mat[0].length];
    const newMat = redim([], dimr, dimc, defVal);
    for (let r = 0; r < dimr - dr; r++) for (let c = 0; c < dimc - dc; c++)
        newMat[r + dr][c + dc] = mat[r][c]
    return newMat
}

const rotate90 = (mat, defVal = 0) => {
    const m = mat.length === mat[0].length ? [...mat] : makeQuadratic(mat, defVal)
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
const [dimr, dimc] = [6, 10]

const filledBoardAsString = `
a d d e e e e f f f
a a d d e g g g f f
b a c d h g l g k k
b a c h h h l l k j
b c c c h l l k k j
b b i i i i i j j j`.trim().replaceAll(' ', '')
const filledBoard = filledBoardAsString.replaceAll('\n', '').split('')

const extract = (board, val, defVal = ' ') => {
    const extracted = board.map(r => r.map(c => c === val ? c : defVal))
    const mmr = minmaxRowIndex(extracted, val)
    const mmc = minmaxColIndex(extracted, val)
    const [dimr, dimc] = [mmr.max - mmr.min + 1, mmc.max - mmc.min + 1]
    return redim([], dimr, dimc, ' ').map((r, ri) => r.map((c, ci) => extracted[mmr.min + ri][mmc.min + ci]), ' ')
}

const translateBoard = (board, dr, dc, defVal = ' ') => {
    const newBoard = translate(board, dr, dc, defVal)
    let [cnt1, cnt2] = [0, 0]
    for (let r = 0; r < dimr; r++) for (let c = 0; c < dimc; c++) {
        cnt1 += (board[r][c] !== defVal)
        cnt2 += (newBoard[r][c] !== defVal)
    }
    return cnt1 != cnt2 ? undefined : newBoard
}


const computeProblem = () => {
    const problem = []
    const symbols = 'abcdefghijkl'
    symbols.split('').forEach(ch => {
        const symbolCondition = symbols.split("").map(x => ch === x ? 1 : 0);
        const extractSym = makeQuadratic(extract(reshape(filledBoard, 10), ch))
        const elements = range(4)
            .reduce((res, n) => [...res, range(n).reduce(elem => rotate90(elem, ' '), makeCopy(extractSym))], [])
            .reduce((acc, e) => ([...acc, e, transpose(e)]), [])
            .map(x => makeQuadratic(extract(x, ch), ' ').flat().join(''))
        const uniqElementsAsString = [... new Set(elements)]
        const uniqElements = uniqElementsAsString.map(x => reshape(x.split(''), Math.sqrt(x.length)))

        uniqElements.map(elem => redim(elem, dimr, dimc, ' ')).forEach(board =>
            range(6).forEach(dr => range(10).forEach(dc => {
                const translated = translateBoard(board, dr, dc)
                if (translated) {
                    const cond = translated.flat().map(x => x === ' ' ? 0 : 1)
                    problem.push([...symbolCondition, ...cond])
                }
            }))
        )
    })
    // console.log("problem length:", problem.length, problem[0].length)
    return problem
}

const problem = computeProblem();

const solutions = dlx_solve(problem, 10);
//  const solutions = dlxlib.solve(problem);
console.log(solutions)

// const DL_TOTAL_COLUMNS = 12 + 6 * 10
// const MAX_N = DL_TOTAL_COLUMNS * 2056
// const dlx = new DancingLinkX({ MAX_N })

// dlx.init(DL_TOTAL_COLUMNS)
// problem.forEach((r, idx) => dlx.addRow(idx, r))
// const answer = dlx.solve()
// console.log(answer)

module.exports = {
    redim, extract,
    minmaxColIndexArr, minmaxColIndex, minmaxRowIndex,
    reshape, makeQuadratic, transpose, rotate90, translate,
    filledBoard
}
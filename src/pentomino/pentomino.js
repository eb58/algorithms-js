const { DancingLinkX } = require('@algorithm.ts/dlx') // do not understand how this works
const dlx = require('dlx');                           // no solutions found in 5 min

const dlxlib = require('dlxlib');                     // ~65 sec         
const dlx_solve = require('../dlx');                  // ~23 sec
const dancingLinks = require('dancing-links')         // ~25 sec

// some primitives 
const range = (n) => [...Array(n).keys()]
const zip = (xs, ys, f) => xs.map((x, i) => f(x, ys[i]))
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
const rotateN90 = (matrix, n) => range(n).reduce(m => rotate90(m, ' '), matrix)

///  PENTOMINO
const filledBoardAsString = `
n w w y y y y p p p
n n w w y u u u p p
l n t w x u f u z z
l n t x x x f f z v
l t t t x f f z z v
l l i i i i i v v v`.trim().replaceAll(' ', '')
const filledBoard = filledBoardAsString.replaceAll('\n', '').split('')
const SYMBOLS = [... new Set(filledBoard)].sort() // ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
const [DIMR, DIMC] = [filledBoardAsString.split('\n').length, filledBoardAsString.split('\n')[0].length] // 6, 10

const extract = (board, val, defVal = ' ') => {
    const extracted = board.map(r => r.map(c => c === val ? c : defVal))
    const mmr = minmaxRowIndex(extracted, val)
    const mmc = minmaxColIndex(extracted, val)
    const [dimr, dimc] = [mmr.max - mmr.min + 1, mmc.max - mmc.min + 1]
    return redim([], dimr, dimc, defVal).map((r, ri) => r.map((_, ci) => extracted[mmr.min + ri][mmc.min + ci]), defVal)
}

const translateBoard = (board, dr, dc, defVal = ' ') => {
    const newBoard = translate(board, dr, dc, defVal)
    let [cnt1, cnt2] = [0, 0]
    for (let r = 0; r < DIMR; r++) for (let c = 0; c < DIMC; c++) {
        cnt1 += (board[r][c] !== defVal)
        cnt2 += (newBoard[r][c] !== defVal)
    }
    return cnt1 != cnt2 ? undefined : newBoard
}

const generateTiles = () => {
    const res = SYMBOLS.reduce((acc, c) => ({ ...acc, [c]: [] }), {})

    return SYMBOLS.reduce((acc, ch) => {
        const extractSym = makeQuadratic(extract(reshape(filledBoard, 10), ch))
        const tiles = range(4)
            .reduce((acc, n) => [...acc, rotateN90(makeCopy(extractSym), n)], [])
            .reduce((acc, tile) => ([...acc, tile, transpose(tile)]), [])
            .map(tile => makeQuadratic(extract(tile, ch), ' ').flat().join(''))
        const uniqTilesAsString = [... new Set(tiles)]
        const uniqTiles = uniqTilesAsString.map(t => reshape(t.split(''), Math.sqrt(t.length)))

        uniqTiles.map(tile => redim(tile, DIMR, DIMC, ' ')).forEach(board =>
            range(DIMR).forEach(dr => range(DIMC).forEach(dc => {
                const translated = translateBoard(board, dr, dc)
                if (translated) {
                    acc[ch] = [...acc[ch], translated]
                }
            }))
        )
        return acc
    }, res)
}

// console.log(allTiles)

const solvePentonimo = () => {
    const allTiles = generateTiles();
    const problem = Object.entries(allTiles).reduce((acc, [s, tiles]) => [...acc, ...tiles.map(tile => [
        ...SYMBOLS.map(ch => s === ch ? 1 : 0),
        ...tile.flat().map(x => x === ' ' ? 0 : 1)])],
        [])

    const mapToSymbol = Object.entries(allTiles).reduce((acc, [s, tiles]) => [...acc, ...tiles.map(() => s)], [])

    // const solutions = dlxlib.solve(problem); // ~65sec
    // const solutions = dlx_solve(problem, 2339 * 4); // ~23sec
    const solutions = dancingLinks.findAll(problem.map(row => ({ row }))).map(x => x.map(o => o.index))// ~20sec
    return solutions.map(solution =>
        reshape(solution
            .map(r => problem[r].slice(12).map(y => y === 1 ? mapToSymbol[r] : ''))
            .reduce((acc, tile) => zip(acc, tile, (a, b) => a || b || ''), range(60).map(() => '')), 10)
            .map(r => r.join(' '))
    )
}

//const sol = solvePentonimo();
//console.log(solutions.length)

// const DL_TOTAL_COLUMNS = 12 + 6 * 10
// const MAX_N = DL_TOTAL_COLUMNS * 2056
// const dlx = new DancingLinkX({ MAX_N })

// dlx.init(DL_TOTAL_COLUMNS)
// problem.forEach((r, idx) => dlx.addRow(idx, r))
// const answer = dlx.solve()
// console.log(answer)

module.exports = {
    filledBoard,
    redim, extract,
    minmaxColIndexArr, minmaxColIndex, minmaxRowIndex,
    reshape, makeQuadratic, transpose, rotate90, translate,
    generateTiles,
    solvePentonimo
}
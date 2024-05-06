const { DancingLinkX } = require('@algorithm.ts/dlx') // do not understand how this works
const dlx = require('dlx');                           // no solutions found in 5 min

const dlxlib = require('dlxlib');                     // ~30 sec         
const dlx_solve = require('../dlx');                  // ~10.5 sec
const dancingLinks = require('dancing-links')         // ~9.5 sec

const { range, zip, reshape, redim } = require('../ol').ol;                  // ~10.5 sec

// some primitives 
const minmax = (v1, v2) => ({ min: Math.min(v1.min, v2.min), max: Math.max(v1.max, v2.max) })

// array functions
const minmaxColIndexArr = (xs, v) => xs.reduce((acc, cv, n) => cv !== v ? acc : minmax(acc, { min: n, max: n }), { min: 1000, max: -1 })

// matrix functions
const makeCopy = (mat) => mat.map(r => [...r])
const makeQuadratic = (mat, defVal = 0) => redim(mat, Math.max(mat.length, mat[0].length), Math.max(mat.length, mat[0].length), defVal)
const transpose = (mat) => mat.map((r, ri) => r.map((_, ci) => mat[ci][ri]))
const translate = (mat, dr, dc, defVal = 0) => range(mat.length).map(r => range(mat[0].length).map((c) => mat[r - dr] && mat[r - dr][c - dc] || defVal))
const rotate90 = (mat) => mat[0].map((_, idx) => mat.map(r => r[r.length - idx - 1]))
const rotateN90 = (mat, n) => range(n).reduce(rotate90, mat)

const minmaxRowIndex = (mat, v) => mat.reduce((res, row, n) => !row.includes(v) ? res : minmax(res, { min: n, max: n }), { min: 1000, max: -1 })
const minmaxColIndex = (mat, v) => mat.reduce((res, row) => minmax(res, minmaxColIndexArr(row, v)), { min: 1000, max: -1 })


//  PENTOMINO 
const filledBoards = {
    "4x15": `
        l l x n n n i i i i i f v v v
        l x x x p n n w w z f f f t v
        l u x u p p w w y z z z f t v
        l u u u p p w y y y y z t t t`.trim().replaceAll(' ', '').replaceAll('\n', '').split(''),
    "6x10": `
        n w w y y y y p p p
        n n w w y u u u p p
        l n t w x u f u z z
        l n t x x x f f z v
        l t t t x f f z z v
        l l i i i i i v v v`.trim().replaceAll(' ', '').replaceAll('\n', '').split('')
}

const pentonimo = (filledBoard, DIMR = 6, DIMC = 10) => {
    const SYMBOLS = [... new Set(filledBoard)].sort() // ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    // console.log( SYMBOLS, DIMR, DIMC )

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
            const extractSym = makeQuadratic(extract(reshape(filledBoard, DIMC), ch))
            const N = ch === 'f' ? 1 : 4 // symmetrie!!
            const tiles = range(N)
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

    const solve = () => {
        const allTiles = generateTiles();
        const problem = Object.entries(allTiles).reduce((acc, [s, tiles]) => [...acc, ...tiles.map(tile => [
            ...SYMBOLS.map(ch => s === ch ? 1 : 0),
            ...tile.flat().map(x => x === ' ' ? 0 : 1)])],
            [])

        const mapToSymbol = Object.entries(allTiles).reduce((acc, [s, tiles]) => [...acc, ...tiles.map(() => s)], [])

        // const solutions = dlxlib.solve(problem); // ~30 sec
        // const solutions = dlx_solve(problem, 368 ); // ~10.5 sec
        const solutions = dancingLinks.findAll(problem.map(row => ({ row }))).map(x => x.map(o => o.index))// ~9.5 sec
        return solutions.map(solution =>
            reshape(solution
                .map(r => problem[r].slice(12).map(y => y === 1 ? mapToSymbol[r] : ''))
                .reduce((acc, tile) => zip(acc, tile, (a, b) => a || b || ''), range(60).map(() => '')), DIMC)
                .map(r => r.join('')).join('')
        )
    }

    return {
        DIMC, DIMR,
        solve,
        internals: {
            SYMBOLS,
            extract,
            translateBoard,
            generateTiles
        }
    }
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
    filledBoards,
    redim, minmaxColIndexArr, minmaxColIndex, minmaxRowIndex,
    reshape, makeQuadratic, transpose, rotate90, translate,
    pentonimo,
}
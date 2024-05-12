const { DancingLinkX } = require('@algorithm.ts/dlx'); // do not understand how this works
const dlx = require('dlx'); // no solutions found in 5 min

const dlxlib = require('dlxlib'); // ~30 sec
const dlx_solve = require('../dlx'); // ~10.5 sec
const dancingLinks = require('dancing-links'); // ~9.5 sec

const { range, zip, uniqBy } = require('../ol').ol;
const { reshape, redim, transpose, translate, rotateN90, makeQuadratic } = require('../ol').matrix;

// array functions
const minmax = (v1, v2) => ({ min: Math.min(v1.min, v2.min), max: Math.max(v1.max, v2.max) });
const minmaxColIndexArr = (xs, v) => xs.reduce((acc, cv, n) => (cv !== v ? acc : minmax(acc, { min: n, max: n })), { min: 1000, max: -1 });
const minmaxRowIndex = (m, v) => m.reduce((res, r, n) => (!r.includes(v) ? res : minmax(res, { min: n, max: n })), { min: 1000, max: -1 });
const minmaxColIndex = (m, v) => m.reduce((res, row) => minmax(res, minmaxColIndexArr(row, v)), { min: 1000, max: -1 });

//  PENTOMINO
const pentonimo = (filledBoard, DIMR = 6, DIMC = 10) => {
  const SYMBOLS = [...new Set(filledBoard)].sort(); // ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']

  const extract = (board, val, defVal = ' ') => {
    const extracted = board.map((r) => r.map((c) => (c === val ? c : defVal)));
    const mmr = minmaxRowIndex(extracted, val);
    const mmc = minmaxColIndex(extracted, val);
    const [dimr, dimc] = [mmr.max - mmr.min + 1, mmc.max - mmc.min + 1];
    return redim([], dimr, dimc, defVal).map((r, ri) => r.map((_, ci) => extracted[mmr.min + ri][mmc.min + ci]), defVal);
  };

  const translateBoard = (board, dr, dc, defVal = ' ') => {
    const count = (board) => board.flat().reduce((acc, x) => (acc += x !== defVal), 0);
    const newBoard = translate(board, dr, dc, defVal);
    return count(board) === count(newBoard) ? newBoard : undefined;
  };

  const generateAllTranslatedTiles = (tile) =>
    range(DIMR).reduce(
      (acc, dr) =>
        range(DIMC).reduce((acc, dc) => {
          const translated = translateBoard(tile, dr, dc);
          return translated ? [...acc, translated.flat()] : acc;
        }, acc),
      [],
    );

  const generateAllTiles = () => {
    const tilesTable = SYMBOLS.reduce((acc, c) => ({ ...acc, [c]: [] }), {}); // { 'f': [], 'c'.: [], ...}

    return SYMBOLS.reduce((res, ch) => {
      const extractedSym = makeQuadratic(extract(reshape(filledBoard, DIMC), ch));
      const N = ch === 'f' ? 1 : 4; // symmetrie!!
      const tiles = range(N)
        .reduce((acc, n) => [...acc, rotateN90(extractedSym, n)], [])
        .reduce((acc, tile) => [...acc, tile, transpose(tile)], [])
        .map((tile) => makeQuadratic(extract(tile, ch), ' '))
        .map((tile) => redim(tile, DIMR, DIMC, ' '))
        .reduce((acc, tile) => [...acc, ...generateAllTranslatedTiles(tile)], []);
      return { ...res, [ch]: [...uniqBy(tiles, (t) => t.join(''))] };
    }, tilesTable);
  };

  const solve = () => {
    const encodeSymbol = (s) => SYMBOLS.map((ch) => (s === ch ? 1 : 0));
    const encodeTile = (t) => t.map((x) => (x === ' ' ? 0 : 1));

    const allTiles = generateAllTiles();

    const problem = Object.entries(allTiles).reduce(
      (acc, [s, tiles]) => [...acc, ...tiles.map((tile) => [...encodeSymbol(s), ...encodeTile(tile)])],
      [],
    );

    // const solutions = dlxlib.solve(problem); // ~30 sec
    // const solutions = dlx_solve(problem, 368 ); // ~10.5 sec
    const solutions = dancingLinks.findAll(problem.map((row) => ({ row }))).map((x) => x.map((o) => o.index)); // ~9.5 sec

    // Map solutions from DLX back to boards
    const decodeSymbol = (r) => SYMBOLS[problem[r].slice(0, SYMBOLS.length).findIndex((x) => x === 1)];
    return solutions.map(
      (solution) =>
        reshape(
          solution // contains rows of problem array that realize an exact cover
            .map((r) => ({ symbol: decodeSymbol(r), board: problem[r].slice(SYMBOLS.length) }))
            .map(({ symbol, board }) => board.map((x) => (x === 1 ? symbol : '')))
            .reduce(
              (acc, tile) => zip(acc, tile, (a, b) => a || b || ''),
              range(DIMR * DIMC).map(() => ''),
            ),
        ),
      DIMC,
    );
  };

  return {
    DIMC,
    DIMR,
    solve,
    internals: {
      SYMBOLS,
      extract,
      translateBoard,
      generateAllTiles,
    },
  };
};

//const sol = solvePentonimo();
//console.log(solutions.length)

// const DL_TOTAL_COLUMNS = 12 + 6 * 10
// const MAX_N = DL_TOTAL_COLUMNS * 2056
// const dlx = new DancingLinkX({ MAX_N })

// dlx.init(DL_TOTAL_COLUMNS)
// problem.forEach((r, idx) => dlx.addRow(idx, r))
// const answer = dlx.solve()
// console.log(answer)

module.exports = pentonimo;

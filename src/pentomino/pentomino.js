//  PENTOMINO
const { matrix, ol } = require('../ol');
const { range, zip, uniqBy } = ol;
const { reshape, redim, transpose, translate, rotateN90, makeQuadratic } = matrix;

const filledBoard = [
  ['l', 'l', 'x', 'n', 'n', 'n', 'i', 'i', 'i', 'i', 'i', 'f', 'v', 'v', 'v'],
  ['l', 'x', 'x', 'x', 'p', 'n', 'n', 'w', 'w', 'z', 'f', 'f', 'f', 't', 'v'],
  ['l', 'u', 'x', 'u', 'p', 'p', 'w', 'w', 'y', 'z', 'z', 'z', 'f', 't', 'v'],
  ['l', 'u', 'u', 'u', 'p', 'p', 'w', 'y', 'y', 'y', 'y', 'z', 't', 't', 't'],
];

const pentomino = () => {
  const SYMBOLS = [...new Set(filledBoard.flat())].sort(); // ['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z']

  const extract = (board, val, defVal = ' ') => {
    const extracted = board.map((r) => r.map((c) => (c === val ? c : defVal)));
    const x = extracted.filter((r) => r.some((v) => v !== defVal));
    return transpose(x).filter((r) => r.some((v) => v !== defVal));
  };

  const translateBoard = (board, dr, dc, defVal = ' ') => {
    const count = (board) => board.flat().reduce((acc, x) => acc + (x !== defVal), 0);
    const newBoard = translate(board, dr, dc, defVal);
    return count(newBoard)===5 ? newBoard : undefined;
  };

  const generateAllTranslatedTiles = (tile) =>
    range(tile.length).reduce(
      (acc, dr) =>
        range(tile[0].length).reduce((acc, dc) => {
          const translated = translateBoard(tile, dr, dc);
          return translated ? [...acc, translated.flat()] : acc;
        }, acc),
      [],
    );

  const generateAllTiles = (dimr, dimc) => {
    const tilesTable = SYMBOLS.reduce((acc, c) => ({ ...acc, [c]: [] }), {}); // { 'f': [], 'c'.: [], ...}

    return SYMBOLS.reduce((res, ch) => {
      const extractedSym = makeQuadratic(extract(filledBoard, ch));
      const N = ch === 'f' ? 1 : 4; // symmetrie!!
      const tiles = range(N)
        .reduce((acc, n) => [...acc, rotateN90(extractedSym, n)], [])
        .reduce((acc, tile) => [...acc, tile, transpose(tile)], [])
        .map((tile) => makeQuadratic(extract(tile, ch), ' '))
        .map((tile) => redim(tile, dimr, dimc, ' '))
        .reduce((acc, tile) => [...acc, ...generateAllTranslatedTiles(tile)], []);
      return { ...res, [ch]: [...uniqBy(tiles, (t) => t.join(''))] };
    }, tilesTable);
  };

  const solve = (dimr, dimc, dlxSolve) => {
    const encodeSymbol = (s) => SYMBOLS.map((ch) => (s === ch ? 1 : 0));
    const encodeTile = (t) => t.map((x) => (x === ' ' ? 0 : 1));

    const allTiles = generateAllTiles(dimr, dimc);

    const problem = Object.entries(allTiles).reduce(
      (acc, [s, tiles]) => [...acc, ...tiles.map((tile) => [...encodeTile(tile), ...encodeSymbol(s)])],
      [],
    );
    const solutions = dlxSolve(problem);

    // Map solutions from DLX back to boards
    const decodeSymbol = (r) => SYMBOLS[problem[r].slice(60).findIndex((x) => x === 1)];
    return solutions.map(
      (solution) =>
        reshape(
          solution // contains rows of problem array that realize an exact cover
            .map((r) => ({ symbol: decodeSymbol(r), board: problem[r].slice(0, 60) }))
            .map(({ symbol, board }) => board.map((x) => (x === 1 ? symbol : '')))
            .reduce(
              (acc, tile) => zip(acc, tile, (a, b) => a || b || ''),
              range(dimr * dimc).map(() => ''),
            ),
        ),
      dimc,
    );
  };

  return {
    solve,
    internals: {
      SYMBOLS,
      generateAllTiles,
    },
  };
};

if (typeof module !== 'undefined') module.exports = pentomino;

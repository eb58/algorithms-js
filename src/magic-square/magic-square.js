const comb = require('../combinations').comb1
const perm = require('../perm').perm4
const { range, sum } = require('../ol').ol

const magicSquare = (N, idxNotForNumberOne) => {
  let res = []

  const AllAvailableNumbers = range(N * N).map((x) => x + 1)
  const MN = sum(AllAvailableNumbers) / N // MN -> Magic Number
  const AllGoodCombinations = comb(AllAvailableNumbers, N, (xs) => sum(xs) === MN).map(c => (c.perms = perm(c), c))
  const setRow = (square, row, perm) => row.forEach((x, idx) => (square[x] = perm[idx]))
  const numberOneIsNotInUpperLeft = (xs) => idxNotForNumberOne.some((x) => xs[x] === 1)

  const combineToMagicSquare = (square, availableNumbers, goodCombinations, rowsDef, i) => {
    if (numberOneIsNotInUpperLeft(square)) {
      return
    }

    if (availableNumbers.length === 0) {
      res.push(square)
      return
    }

    const rowDef = rowsDef[i]
    const predicate = rowDef.restriction ? (xs) => rowDef.restriction(xs, square, availableNumbers) : undefined
    const combsBS =
      rowDef.row.length === 4
        ? goodCombinations
        : comb(availableNumbers, rowDef.row.length, predicate)

    combsBS.forEach((combi) => {
      const newAvailableNumbers = availableNumbers.filter((x) => !combi.includes(x))
      const newGoodCombinations = goodCombinations.filter((combi) => combi.every(x => newAvailableNumbers.includes(x)))
      const perms =  perm(combi)
      perms.forEach((perm) => {
        setRow(square, rowDef.row, perm)
        combineToMagicSquare(square.slice(), newAvailableNumbers, newGoodCombinations, rowsDef, i + 1)
      })
    })
  }

  return {
    MN,
    solve: (rowsDef) => {
      const square = range(N * N).map(() => 0)
      res = []
      combineToMagicSquare(square, AllAvailableNumbers, AllGoodCombinations, rowsDef, 0)
      return res
    },
  }
}

const magic3x3Solver = () => {
  const magic3x3 = magicSquare(3, [1, 2, 3, 4, 5, 6, 7, 8])
  const MN = magic3x3.MN
  return magic3x3.solve([
    { row: [0, 4, 8] }, // diag
    { row: [1, 2], restriction: (xs, sq) => sum(xs) === MN - sq[0] },
    { row: [5], restriction: (xs, sq) => sum(xs) === MN - sq[2] - sq[8] },
    { row: [7], restriction: (xs, sq) => sum(xs) === MN - sq[1] - sq[4] },
    { row: [6], restriction: (xs, sq) => sum(xs) === MN - sq[7] - sq[8] },
    { row: [3], restriction: (xs, sq) => sum(xs) === MN - sq[0] - sq[6] },
  ])
}


const magic4x4Solver1 = () => {
  const magic4x4 = magicSquare(4, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  const MN = magic4x4.MN
  const chk = (avn, s1, s2) => s1 != s2 && avn.includes(MN - s1) && avn.includes(MN - s2)
  const check = (xs, sq, avn, x1, x2, y1, y2) => chk(avn, xs[0] + sq[x1] + sq[x2], xs[1] + sq[y1] + sq[y2]) || chk(avn, xs[1] + sq[x1] + sq[x2], xs[0] + sq[y1] + sq[y2])
  return magic4x4.solve([
    { row: [3, 6, 9, 12] }, // diag2
    { row: [0, 5, 10, 15] }, // diag1
    { row: [4, 8], restriction: (xs, sq, avn) => sq[0] + xs[0] + xs[1] + sq[12] === MN && check(xs, sq, avn, 5, 6, 9, 10) },
    { row: [1, 2], restriction: (xs, sq, avn) => sq[0] + xs[0] + xs[1] + sq[3] === MN && check(xs, sq, avn, 5, 9, 6, 10) },
    { row: [7], restriction: (xs, sq) => xs[0] + sq[4] + sq[5] + sq[6] === MN },
    { row: [11], restriction: (xs, sq) => xs[0] + sq[8] + sq[9] + sq[10] === MN },
    { row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN },
    { row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN },
  ])
}

const magic4x4Solver2 = () => {
  const magic4x4 = magicSquare(4, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  const MN = magic4x4.MN
  return magic4x4.solve([
    { row: [0, 1, 2, 3] }, // first row
    { row: [4, 5, 6, 7] }, // second row
    { row: [8, 9, 10, 11] }, // third row
    { row: [12], restriction: (xs, sq) => sq[0] + sq[4] + sq[8] + xs[0] === MN && sq[3] + sq[6] + sq[9] + xs[0] === MN },
    { row: [16], restriction: (xs, sq) => sq[3] + sq[7] + sq[11] + xs[0] === MN && sq[3] + sq[6] + sq[9] + xs[0] === MN },
    { row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN },
    { row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN },
  ])
}

module.exports = {
  magic3x3Solver,
  magic4x4Solver1,
  magic4x4Solver2,
}

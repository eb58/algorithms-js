const comb = require('../combinations').comb1
const perm = require('../perm').perm4
const { range, sum } = require('../ol').ol

const magicSquare = (N, idxNotForNumberOne) => {
  let res = []

  const AllAvailableNumbers = range(N * N).map((x) => x + 1)
  const MN = sum(AllAvailableNumbers) / N // MN -> Magic Number
  const AllGoodCombinations = comb(AllAvailableNumbers, N, (xs) => sum(xs) === MN).map((combination) => {
    combination.perms = perm(combination)
    return combination
  })
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
      rowDef.row.length === N
        ? goodCombinations
        : comb(availableNumbers, rowDef.row.length, predicate)

    combsBS.forEach((combi) => {
      const newAvailableNumbers = availableNumbers.filter((x) => !combi.includes(x))
      const newGoodCombinations = goodCombinations.filter((combi) => combi.every(x => newAvailableNumbers.includes(x)))
      const perms = combi.perms || perm(combi)
      perms.forEach((perm) => {
        setRow(square, rowDef.row, perm)
        if (!rowDef.placementRestriction || rowDef.placementRestriction(square, newAvailableNumbers)) {
          combineToMagicSquare(square.slice(), newAvailableNumbers, newGoodCombinations, rowsDef, i + 1)
        }
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
  const magic3x3 = magicSquare(3, [])
  const MN = magic3x3.MN
  return magic3x3.solve([
    { row: [0, 4, 8] }, // diag
    { row: [1, 2], restriction: (xs, sq) => sum(xs) === MN - sq[0] },
    { row: [5], restriction: (xs, sq) => sum(xs) === MN - sq[2] - sq[8] },
    { row: [7], restriction: (xs, sq) => sum(xs) === MN - sq[1] - sq[4] },
    { row: [6], restriction: (xs, sq) => sum(xs) === MN - sq[7] - sq[8] && sum(xs) === MN - sq[2] - sq[4] },
    { row: [3], restriction: (xs, sq) => sum(xs) === MN - sq[0] - sq[6] },
  ])
}

const magic4x4Solver1 = () => {
  const magic4x4 = magicSquare(4, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  const MN = magic4x4.MN
  const chk = (avn, s1, s2) => s1 != s2 && avn.includes(MN - s1) && avn.includes(MN - s2)
  const check = (xs, sq, avn, x1, x2, y1, y2) => chk(avn, xs[0] + sq[x1] + sq[x2], xs[1] + sq[y1] + sq[y2]) || chk(avn, xs[1] + sq[x1] + sq[x2], xs[0] + sq[y1] + sq[y2])
  const canCompleteRowsAndColumns = (sq, availableNumbers) => {
    const hasPairWithSum = (target) => availableNumbers.some((number) => availableNumbers.includes(target - number) && target - number !== number)
    const incompleteSums = [
      sq[0] + sq[3], sq[5] + sq[6], sq[9] + sq[10], sq[12] + sq[15],
      sq[0] + sq[12], sq[5] + sq[9], sq[6] + sq[10], sq[3] + sq[15],
    ]

    return incompleteSums.every((lineSum) => hasPairWithSum(MN - lineSum))
  }
  return magic4x4.solve([
    { row: [3, 6, 9, 12] }, // diag2
    { row: [0, 5, 10, 15], placementRestriction: canCompleteRowsAndColumns }, // diag1
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
  const canCompleteTwoRows = (sq, availableNumbers) => {
    const hasPairWithSum = (target) => availableNumbers.some((number) => availableNumbers.includes(target - number) && target - number !== number)
    const incompleteSums = [
      ...[0, 1, 2, 3].map((column) => sq[column] + sq[column + 4]),
      sq[0] + sq[5],
      sq[3] + sq[6],
    ]

    return incompleteSums.every((lineSum) => hasPairWithSum(MN - lineSum))
  }
  const canCompleteSquare = (sq, availableNumbers) => {
    const lastRow = [0, 1, 2, 3].map((column) => MN - sq[column] - sq[column + 4] - sq[column + 8])
    const hasAvailableNumbers = lastRow.every((number) => availableNumbers.includes(number))

    return hasAvailableNumbers && new Set(lastRow).size === 4 &&
      sq[3] + sq[6] + sq[9] + lastRow[0] === MN &&
      sq[0] + sq[5] + sq[10] + lastRow[3] === MN
  }
  return magic4x4.solve([
    { row: [0, 1, 2, 3] }, // first row
    { row: [4, 5, 6, 7], placementRestriction: canCompleteTwoRows }, // second row
    { row: [8, 9, 10, 11], placementRestriction: canCompleteSquare }, // third row
    { row: [12], restriction: (xs, sq) => sq[0] + sq[4] + sq[8] + xs[0] === MN && sq[3] + sq[6] + sq[9] + xs[0] === MN },
    { row: [15], restriction: (xs, sq) => sq[3] + sq[7] + sq[11] + xs[0] === MN && sq[0] + sq[5] + sq[10] + xs[0] === MN },
    { row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN },
    { row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN },
  ])
}

const magic4x4Solver3 = () => {
  const N = 4
  const MN = 34
  const numbers = range(N * N).map((number) => number + 1)
  const toMask = (values) => values.reduce((mask, value) => mask | (1 << (value - 1)), 0)
  const diagonalCombinations = comb(numbers, N, (values) => sum(values) === MN)
    .map((values) => ({ mask: toMask(values), permutations: perm(values) }))
  const secondDiagonalCombinations = diagonalCombinations.filter(({ mask }) => !(mask & 1))
  const squares = []

  secondDiagonalCombinations.forEach(({ permutations: secondDiagonals, mask: diagonal2Mask }) => {
    diagonalCombinations.forEach(({ permutations: firstDiagonals, mask: diagonal1Mask }) => {
      if (diagonal1Mask & diagonal2Mask) return

      const usedDiagonalsMask = diagonal1Mask | diagonal2Mask
      const available = numbers.filter((number) => !(usedDiagonalsMask & (1 << (number - 1))))
      const allowedFirstDiagonals = diagonal1Mask & 1
        ? firstDiagonals.filter((diagonal) => diagonal[0] === 1)
        : firstDiagonals

      secondDiagonals.forEach((diagonal2) => {
        allowedFirstDiagonals.forEach((diagonal1) => {
          const square = Array(N * N).fill(0)
          setValues(square, [3, 6, 9, 12], diagonal2)
          setValues(square, [0, 5, 10, 15], diagonal1)

          available.forEach((value4) => {
            const value8 = MN - square[0] - square[12] - value4
            if (value4 === value8 || !(usedDiagonalsMask & (1 << (value8 - 1))) && available.includes(value8)) {
              const usedFirstPairMask = usedDiagonalsMask | toMask([value4, value8])
              const possibleValues1 = usedDiagonalsMask & 1 ? available : [1]

              possibleValues1.forEach((value1) => {
                if (usedFirstPairMask & (1 << (value1 - 1))) return
                const value2 = MN - square[0] - square[3] - value1
                if (value1 === value2 || usedFirstPairMask & (1 << (value2 - 1)) || !available.includes(value2)) return

                const value7 = MN - value4 - square[5] - square[6]
                const value11 = MN - value8 - square[9] - square[10]
                const value13 = MN - value1 - square[5] - square[9]
                const value14 = MN - value2 - square[6] - square[10]
                const derived = [value7, value11, value13, value14]
                const remainingMask = ((1 << (N * N)) - 1) & ~(usedFirstPairMask | toMask([value1, value2]))

                if (derived.some((value) => value < 1 || value > N * N)) return
                if (new Set(derived).size !== 4 || toMask(derived) !== remainingMask) return

                const result = square.slice()
                setValues(result, [4, 8, 1, 2], [value4, value8, value1, value2])
                setValues(result, [7, 11, 13, 14], derived)
                squares.push(result)
              })
            }
          })
        })
      })
    })
  })

  return squares
}

const magic4x4Solver4 = () => {
  const bits = Array.from({ length: 17 }, (_, value) => value ? 1 << (value - 1) : 0)
  const pairs = Array.from({ length: 35 }, () => [])
  for (let a = 1; a <= 16; a++) {
    for (let b = 1; b <= 16; b++) {
      if (a !== b) pairs[a + b].push([a, b, bits[a] | bits[b]])
    }
  }
  const diagonals = comb(range(16).map((i) => i + 1), 4, (values) => sum(values) === 34)
    .map((values) => ({ mask: values.reduce((mask, value) => mask | bits[value], 0), permutations: perm(values) }))
  const results = []
  const pairsWithOne = pairs.map((entries) => entries.filter((pair) => pair[0] === 1))

  // The same symmetry convention as solvers 1–3: the 1 is at index 0 or 1.
  for (const oneIndex of [0, 1]) {
    for (const first of diagonals) {
      if (Boolean(first.mask & 1) !== (oneIndex === 0)) continue
      const firstPermutations = oneIndex === 0
        ? first.permutations.filter((values) => values[0] === 1)
        : first.permutations
      for (const second of diagonals) {
        if (second.mask & (first.mask | 1)) continue
        const diagonalMask = first.mask | second.mask
        const availablePairs = pairs.map((entries) => entries.filter((pair) => !(pair[2] & diagonalMask)))
        const topPairsBySum = oneIndex === 1 ? pairsWithOne : availablePairs
        for (const [a, f, k, p] of firstPermutations) {
          for (const [d, g, j, m] of second.permutations) {
            const topPairs = topPairsBySum[34 - a - d] || []
            const leftPairs = availablePairs[34 - a - m] || []
            for (const [b, c, topMask] of topPairs) {
              if (topMask & diagonalMask || (oneIndex === 1 && b !== 1)) continue
              const n = 34 - b - f - j
              const o = 34 - c - g - k
              if (n < 1 || n > 16 || o < 1 || o > 16 || n === o) continue
              const bottomMask = bits[n] | bits[o]
              const usedMask = diagonalMask | topMask
              if (bottomMask & usedMask) continue
              const remainingMask = 0xffff ^ (usedMask | bottomMask)
              for (const [e, i, leftMask] of leftPairs) {
                if ((leftMask & remainingMask) !== leftMask) continue
                const h = 34 - e - f - g
                const l = 34 - i - j - k
                if (h < 1 || h > 16 || l < 1 || l > 16 || h === l) continue
                if ((bits[h] | bits[l]) !== (remainingMask ^ leftMask)) continue
                results.push([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p])
              }
            }
          }
        }
      }
    }
  }
  return results
}

const magic4x4Solver5 = () => {
  const bits = Array.from({ length: 17 }, (_, value) => value ? 1 << (value - 1) : 0)
  const rows = comb(range(16).map((i) => i + 1), 4, (values) => sum(values) === 34)
    .map((values) => ({ mask: values.reduce((mask, value) => mask | bits[value], 0), permutations: perm(values) }))
  const results = []

  // Layout: a b c d / e f g h / i j k l / m n o p.
  // Fixing the first two rows leaves only i free:
  // j-i = a+e-d-g; k-l = d+h-a-f; i+l = 17-(e+h-f-g)/2.
  for (const first of rows) {
    if (!(first.mask & 1)) continue
    const topRows = first.permutations.filter((row) => row[0] === 1 || row[1] === 1)
    for (const second of rows) {
      if (first.mask & second.mask) continue
      const used = first.mask | second.mask
      for (const [a, b, c, d] of topRows) {
        for (const [e, f, g, h] of second.permutations) {
          const offset = e + h - f - g
          if (offset & 1) continue
          const il = 17 - offset / 2
          const ji = a + e - d - g
          const kl = d + h - a - f
          for (let i = 2; i <= 16; i++) {
            if (used & bits[i]) continue
            const j = i + ji
            if (j < 1 || j > 16 || ((used | bits[i]) & bits[j])) continue
            const l = il - i
            if (l < 1 || l > 16 || ((used | bits[i] | bits[j]) & bits[l])) continue
            const k = l + kl
            if (k < 1 || k > 16 || ((used | bits[i] | bits[j] | bits[l]) & bits[k])) continue
            const m = 34 - a - e - i
            const n = 34 - b - f - j
            const o = 34 - c - g - k
            const p = 34 - d - h - l
            if (m < 1 || m > 16 || n < 1 || n > 16 || o < 1 || o > 16 || p < 1 || p > 16) continue
            const remaining = 0xffff ^ (used | bits[i] | bits[j] | bits[k] | bits[l])
            if ((bits[m] | bits[n] | bits[o] | bits[p]) !== remaining) continue
            results.push([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p])
          }
        }
      }
    }
  }
  return results
}

const setValues = (target, indices, values) => indices.forEach((index, i) => (target[index] = values[i]))

module.exports = {
  magic3x3Solver,
  magic4x4Solver1,
  magic4x4Solver2,
  magic4x4Solver3,
  magic4x4Solver4,
  magic4x4Solver5,
}

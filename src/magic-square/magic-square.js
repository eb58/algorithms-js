const comb = require('../combinations').comb1
const perm = require('../perm').perm4
const { range, sum } = require('../ol').ol
const { xcc } = require('../xcc')

// Bitmask of a list of numbers 1..31: number x sets bit x-1.
const toBitMask = (xs) => {
  let mask = 0
  for (let i = 0; i < xs.length; i++) mask |= 1 << (xs[i] - 1)
  return mask
}

// Same result as comb(xs, k, pred), with plain loops for the small k used by the search;
// pred gets a reused buffer, matching comb's own behaviour.
const smallComb = (xs, k, pred) => {
  if (k === 1) {
    const out = []
    const buffer = [0]
    for (let x = 0; x < xs.length; x++) {
      buffer[0] = xs[x]
      if (!pred || pred(buffer)) out.push([xs[x]])
    }
    return out
  }
  if (k === 2) {
    const out = []
    const buffer = [0, 0]
    for (let x = 0; x < xs.length - 1; x++) {
      buffer[0] = xs[x]
      for (let y = x + 1; y < xs.length; y++) {
        buffer[1] = xs[y]
        if (!pred || pred(buffer)) out.push([xs[x], xs[y]])
      }
    }
    return out
  }
  return comb(xs, k, pred)
}

const magicSquare = (N, idxNotForNumberOne) => {
  let res = []

  const AllAvailableNumbers = range(N * N).map((x) => x + 1)
  const MN = sum(AllAvailableNumbers) / N // MN -> Magic Number
  const AllGoodCombinations = comb(AllAvailableNumbers, N, (xs) => sum(xs) === MN).map((combination) => {
    combination.perms = perm(combination)
    combination.mask = toBitMask(combination)
    return combination
  })
  const setRow = (square, row, values) => {
    for (let idx = 0; idx < row.length; idx++) square[row[idx]] = values[idx]
  }
  const numberOneIsNotInUpperLeft = (xs) => {
    for (let i = 0; i < idxNotForNumberOne.length; i++) if (xs[idxNotForNumberOne[i]] === 1) return true
    return false
  }

  // needsGood[i]: does any row definition from index i on still use the full-length combinations?
  let needsGood = []

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
        : smallComb(availableNumbers, rowDef.row.length, predicate)

    for (const combi of combsBS) {
      // Optional check on the unordered combination: rejects all its orderings at once.
      if (rowDef.combinationRestriction && !rowDef.combinationRestriction(combi, square)) continue
      const combiMask = combi.mask === undefined ? toBitMask(combi) : combi.mask
      const newAvailableNumbers = availableNumbers.filter((x) => !(combiMask & (1 << (x - 1))))
      // goodCombinations only ever holds combinations of still available numbers,
      // so it is enough to drop the ones that overlap the numbers just placed.
      // Once no full-length row follows, the list is never read again and filtering can stop.
      const newGoodCombinations = needsGood[i + 1] ? goodCombinations.filter((good) => !(good.mask & combiMask)) : goodCombinations
      const perms = combi.perms || perm(combi)
      for (const values of perms) {
        setRow(square, rowDef.row, values)
        if (!rowDef.placementRestriction || rowDef.placementRestriction(square, newAvailableNumbers)) {
          combineToMagicSquare(square.slice(), newAvailableNumbers, newGoodCombinations, rowsDef, i + 1)
        }
      }
    }
  }

  return {
    MN,
    solve: (rowsDef) => {
      const square = range(N * N).map(() => 0)
      res = []
      needsGood = rowsDef.map((_, idx) => rowsDef.slice(idx).some((rowDef) => rowDef.row.length === N))
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

// All 4x4 solvers return the 880 squares in normal form, one per class of the 8 rotations/reflections
// (7040 squares in total). The 1 lies in a corner, on an edge or in the center; within each of these
// orbits one position and, where a reflection fixes that position, one tie-break is chosen:
//   1 at index 0 with b < e (index 1 < index 4), or 1 at index 1, or 1 at index 5 with g < j (index 6 < index 9).
const magic4x4Solver1 = () => {
  const magic4x4 = magicSquare(4, [2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  const MN = magic4x4.MN
  const chk = (avn, s1, s2) => s1 != s2 && avn.includes(MN - s1) && avn.includes(MN - s2)
  const check = (xs, sq, avn, x1, x2, y1, y2) => chk(avn, xs[0] + sq[x1] + sq[x2], xs[1] + sq[y1] + sq[y2]) || chk(avn, xs[1] + sq[x1] + sq[x2], xs[0] + sq[y1] + sq[y2])
  const canCompleteRowsAndColumns = (sq, availableNumbers) => {
    // In every 4x4 magic square the four corners sum to MN (rows 2+3 and columns 2+3 give
    // center = corners, both diagonals give center + corners = 2*MN). Cheap, and rejects ~92%.
    if (sq[0] + sq[3] + sq[12] + sq[15] !== MN) return false
    const available = toBitMask(availableNumbers)
    const hasPairWithSum = (target) => {
      for (let idx = 0; idx < availableNumbers.length; idx++) {
        const other = target - availableNumbers[idx]
        if (other !== availableNumbers[idx] && other >= 1 && other <= 16 && available & (1 << (other - 1))) return true
      }
      return false
    }

    return hasPairWithSum(MN - sq[0] - sq[3]) && hasPairWithSum(MN - sq[5] - sq[6]) &&
      hasPairWithSum(MN - sq[9] - sq[10]) && hasPairWithSum(MN - sq[12] - sq[15]) &&
      hasPairWithSum(MN - sq[0] - sq[12]) && hasPairWithSum(MN - sq[5] - sq[9]) &&
      hasPairWithSum(MN - sq[6] - sq[10]) && hasPairWithSum(MN - sq[3] - sq[15])
  }
  // diag1 [0, 5, 10, 15] needs two numbers for the corners 0 and 15 that complete the corner sum.
  const hasCornerPair = (combi, sq) => {
    const target = MN - sq[3] - sq[12]
    for (let x = 0; x < 3; x++) for (let y = x + 1; y < 4; y++) if (combi[x] + combi[y] === target) return true
    return false
  }
  return magic4x4.solve([
    { row: [3, 6, 9, 12], combinationRestriction: (combi) => !combi.includes(1) }, // diag2, 1 only at index 0, 1 or 5
    {
      row: [0, 5, 10, 15], // diag1
      combinationRestriction: hasCornerPair,
      placementRestriction: (sq, avn) => (sq[5] !== 1 || sq[6] < sq[9]) && canCompleteRowsAndColumns(sq, avn),
    },
    { row: [4, 8], restriction: (xs, sq, avn) => sq[0] + xs[0] + xs[1] + sq[12] === MN && check(xs, sq, avn, 5, 6, 9, 10) },
    {
      row: [1, 2],
      restriction: (xs, sq, avn) => sq[0] + xs[0] + xs[1] + sq[3] === MN && check(xs, sq, avn, 5, 9, 6, 10),
      placementRestriction: (sq) => sq[0] !== 1 || sq[1] < sq[4],
    },
    { row: [7], restriction: (xs, sq) => xs[0] + sq[4] + sq[5] + sq[6] === MN },
    { row: [11], restriction: (xs, sq) => xs[0] + sq[8] + sq[9] + sq[10] === MN },
    { row: [13], restriction: (xs, sq) => xs[0] + sq[1] + sq[5] + sq[9] === MN },
    { row: [14], restriction: (xs, sq) => xs[0] + sq[2] + sq[6] + sq[10] === MN },
  ])
}

const magic4x4Solver2 = () => {
  const N = 4
  const MN = 34
  const numbers = range(N * N).map((number) => number + 1)
  const toMask = (values) => values.reduce((mask, value) => mask | (1 << (value - 1)), 0)
  // The four corners of a 4x4 magic square sum to MN, so s0+s15 must equal MN-s3-s12.
  // Group the first-diagonal orderings by s0+s15 to look the matching ones up directly.
  const byEndSum = (diagonals) => {
    const groups = Array.from({ length: 2 * N * N }, () => [])
    for (const diagonal of diagonals) groups[diagonal[0] + diagonal[N - 1]].push(diagonal)
    return groups
  }
  const diagonalCombinations = comb(numbers, N, (values) => sum(values) === MN)
    .map((values) => {
      const permutations = perm(values)
      return {
        mask: toMask(values),
        permutations,
        byEndSum: byEndSum(permutations),
        // 1 on the main diagonal only at index 0 or 5 (normal form)
        byEndSumWithOne: byEndSum(permutations.filter((diagonal) => diagonal[0] === 1 || diagonal[1] === 1)),
      }
    })
  const secondDiagonalCombinations = diagonalCombinations.filter(({ mask }) => !(mask & 1))
  const squares = []

  // Bit of a value, 0 for values outside 1..16, so range checks fold into the mask tests.
  const bit = (value) => ((value - 1) >>> 0 < N * N ? 1 << (value - 1) : 0)
  const fullMask = (1 << (N * N)) - 1

  for (const { permutations: secondDiagonals, mask: diagonal2Mask } of secondDiagonalCombinations) {
    for (const first of diagonalCombinations) {
      const diagonal1Mask = first.mask
      if (diagonal1Mask & diagonal2Mask) continue

      const usedDiagonalsMask = diagonal1Mask | diagonal2Mask
      const available = fullMask ^ usedDiagonalsMask
      const firstDiagonalsByEndSum = diagonal1Mask & 1 ? first.byEndSumWithOne : first.byEndSum

      for (let d2 = 0; d2 < secondDiagonals.length; d2++) {
        const diagonal2 = secondDiagonals[d2]
        const s3 = diagonal2[0], s6 = diagonal2[1], s9 = diagonal2[2], s12 = diagonal2[3]
        const allowedFirstDiagonals = firstDiagonalsByEndSum[MN - s3 - s12]
        for (let d1 = 0; d1 < allowedFirstDiagonals.length; d1++) {
          const diagonal1 = allowedFirstDiagonals[d1]
          const s0 = diagonal1[0], s5 = diagonal1[1], s10 = diagonal1[2], s15 = diagonal1[3]
          if (s5 === 1 && s6 > s9) continue // normal form tie-break for the 1 in the center

          for (let r4 = available; r4; r4 &= r4 - 1) {
            const value4 = 32 - Math.clz32(r4 & -r4)
            const value8 = MN - s0 - s12 - value4
            const bit8 = bit(value8)
            if (value4 === value8 || !(available & bit8)) continue

            const availableAfterPair = available ^ (1 << (value4 - 1)) ^ bit8
            // Without a 1 on the diagonals, the 1 has to go to index 1;
            // with the 1 at index 0 the normal form needs value1 < value4.
            const possibleValues1 = !(usedDiagonalsMask & 1)
              ? availableAfterPair & 1
              : s0 === 1 ? availableAfterPair & ((1 << (value4 - 1)) - 1) : availableAfterPair

            for (let r1 = possibleValues1; r1; r1 &= r1 - 1) {
              const value1 = 32 - Math.clz32(r1 & -r1)
              const value2 = MN - s0 - s3 - value1
              const bit2 = bit(value2)
              if (value1 === value2 || !(availableAfterPair & bit2)) continue

              const value7 = MN - value4 - s5 - s6
              const value11 = MN - value8 - s9 - s10
              const value13 = MN - value1 - s5 - s9
              const value14 = MN - value2 - s6 - s10
              const remainingMask = availableAfterPair ^ (1 << (value1 - 1)) ^ bit2

              // Four bits equal to the four remaining numbers: in range, distinct and unused.
              if ((bit(value7) | bit(value11) | bit(value13) | bit(value14)) !== remainingMask) continue

              squares.push([s0, value1, value2, s3, value4, s5, s6, value7, value8, s9, s10, value11, s12, value13, value14, s15])
            }
          }
        }
      }
    }
  }

  return squares
}

const magic4x4Solver3 = () => {
  const bits = Array.from({ length: 17 }, (_, value) => value ? 1 << (value - 1) : 0)
  const pairs = Array.from({ length: 35 }, () => [])
  for (let a = 1; a <= 16; a++) {
    for (let b = 1; b <= 16; b++) {
      if (a !== b) pairs[a + b].push([a, b, bits[a] | bits[b]])
    }
  }
  const diagonals = comb(range(16).map((i) => i + 1), 4, (values) => sum(values) === 34)
    .map((values) => {
      const permutations = perm(values)
      // Corners a+d+m+p sum to 34 in every 4x4 magic square, so second diagonals [d, g, j, m]
      // are grouped by d+m and only the group 34-a-p is visited.
      const byEndSum = Array.from({ length: 35 }, () => [])
      for (const diagonal of permutations) byEndSum[diagonal[0] + diagonal[3]].push(diagonal)
      return { mask: values.reduce((mask, value) => mask | bits[value], 0), permutations, byEndSum }
    })
  const results = []
  const pairsWithOne = pairs.map((entries) => entries.filter((pair) => pair[0] === 1))

  // Normal form: 1 at index 0 (a, with b < e), index 1 (b) or index 5 (f, with g < j).
  for (const oneIndex of [0, 1, 5]) {
    for (const first of diagonals) {
      // the 1 lies on the main diagonal [a, f, k, p] exactly for index 0 and 5
      if (Boolean(first.mask & 1) === (oneIndex === 1)) continue
      const firstPermutations = oneIndex === 1
        ? first.permutations
        : first.permutations.filter((values) => values[oneIndex === 0 ? 0 : 1] === 1)
      for (const second of diagonals) {
        if (second.mask & (first.mask | 1)) continue
        const diagonalMask = first.mask | second.mask
        // No per-diagonal filtering of the pair lists: the mask checks below already reject used numbers.
        const topPairsBySum = oneIndex === 1 ? pairsWithOne : pairs
        for (let fp = 0; fp < firstPermutations.length; fp++) {
          const firstDiagonal = firstPermutations[fp]
          const a = firstDiagonal[0], f = firstDiagonal[1], k = firstDiagonal[2], p = firstDiagonal[3]
          const secondPermutations = second.byEndSum[34 - a - p]
          for (let sp = 0; sp < secondPermutations.length; sp++) {
            const secondDiagonal = secondPermutations[sp]
            const d = secondDiagonal[0], g = secondDiagonal[1], j = secondDiagonal[2], m = secondDiagonal[3]
            if (oneIndex === 5 && g > j) continue
            const topPairs = topPairsBySum[34 - a - d]
            const leftPairs = pairs[34 - a - m]
            for (let tp = 0; tp < topPairs.length; tp++) {
              const topPair = topPairs[tp]
              const topMask = topPair[2]
              if (topMask & diagonalMask) continue
              const b = topPair[0], c = topPair[1]
              const n = 34 - b - f - j
              const o = 34 - c - g - k
              if (n < 1 || n > 16 || o < 1 || o > 16 || n === o) continue
              const bottomMask = bits[n] | bits[o]
              const usedMask = diagonalMask | topMask
              if (bottomMask & usedMask) continue
              const remainingMask = 0xffff ^ (usedMask | bottomMask)
              for (let lp = 0; lp < leftPairs.length; lp++) {
                const leftPair = leftPairs[lp]
                const leftMask = leftPair[2]
                if ((leftMask & remainingMask) !== leftMask) continue
                const e = leftPair[0], i = leftPair[1]
                if (oneIndex === 0 && e < b) continue
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

const magic4x4Solver4 = () => {
  const bits = Array.from({ length: 17 }, (_, value) => value ? 1 << (value - 1) : 0)
  const rows = comb(range(16).map((i) => i + 1), 4, (values) => sum(values) === 34)
    .map((values) => ({ mask: values.reduce((mask, value) => mask | bits[value], 0), permutations: perm(values) }))
  const results = []

  // Layout: a b c d / e f g h / i j k l / m n o p.
  // Fixing the first two rows leaves only i free:
  // j-i = a+e-d-g; k-l = d+h-a-f; i+l = 17-(e+h-f-g)/2.
  // Only second-row orderings with an even e+h-f-g can lead to an integer i+l.
  const evenSecondRows = rows.map(({ permutations }) => permutations.filter(([e, f, g, h]) => !((e + h - f - g) & 1)))
  // Normal form: the 1 is a or b in the top row, or f in the second row.
  const topRowsWithOne = rows.map(({ permutations }) => permutations.filter((row) => row[0] === 1 || row[1] === 1))
  const evenSecondRowsWithOneAtF = evenSecondRows.map((secondRows) => secondRows.filter((row) => row[1] === 1))

  for (let fi = 0; fi < rows.length; fi++) {
    const first = rows[fi]
    const oneInFirst = first.mask & 1
    for (let si = 0; si < rows.length; si++) {
      const second = rows[si]
      if (first.mask & second.mask) continue
      if (!oneInFirst && !(second.mask & 1)) continue
      const used = first.mask | second.mask
      const topRows = oneInFirst ? topRowsWithOne[fi] : first.permutations
      const secondRows = oneInFirst ? evenSecondRows[si] : evenSecondRowsWithOneAtF[si]
      for (let tr = 0; tr < topRows.length; tr++) {
        const top = topRows[tr]
        const a = top[0], b = top[1], c = top[2], d = top[3]
        for (let sr = 0; sr < secondRows.length; sr++) {
          const row2 = secondRows[sr]
          const e = row2[0], f = row2[1], g = row2[2], h = row2[3]
          if (a === 1 && e < b) continue // tie-break b < e
          const il = 17 - (e + h - f - g) / 2
          const ji = a + e - d - g
          const kl = d + h - a - f
          const ik = il + kl
          // Every derived cell is i + const or const - i; only i keeping all of them inside 1..16 can work:
          // j = i+ji, l = il-i, k = ik-i, m = 34-a-e-i, n = 34-b-f-ji-i, o = 34-c-g-ik+i, p = 34-d-h-il+i.
          // Within [lo, hi] no further range checks are needed. With the 1 at f, the tie-break g < j
          // raises the lower bound of j from 1 to g+1.
          const minJ = f === 1 ? g + 1 : 1
          const lo = Math.max(2, minJ - ji, il - 16, ik - 16, 18 - a - e, 18 - b - f - ji, c + g + ik - 33, d + h + il - 33)
          const hi = Math.min(16, 16 - ji, il - 1, ik - 1, 33 - a - e, 33 - b - f - ji, c + g + ik - 18, d + h + il - 18)
          for (let i = lo; i <= hi; i++) {
            if (used & bits[i]) continue
            const j = i + ji
            if ((used | bits[i]) & bits[j]) continue
            const l = il - i
            if ((used | bits[i] | bits[j]) & bits[l]) continue
            const k = ik - i
            if ((used | bits[i] | bits[j] | bits[l]) & bits[k]) continue
            const m = 34 - a - e - i
            const n = 34 - b - f - j
            const o = 34 - c - g - k
            const p = 34 - d - h - l
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

const magic4x4Solver5 = () => {
  // Same search space as solver 4 (two top rows, i free, rest derived), but without the generic
  // comb/perm helpers: rows are precomputed once into flat typed arrays, bits are iterated directly.
  const bit = (x) => ((x - 1) >>> 0 < 16 ? 1 << (x - 1) : 0)
  const orders = []
  for (let p = 0; p < 4; p++)
    for (let q = 0; q < 4; q++)
      for (let r = 0; r < 4; r++)
        if (p !== q && p !== r && q !== r) orders.push([p, q, r, 6 - p - q - r])

  // Per row combination pre-filtered orderings, flat in typed arrays. Normal form: the 1 is a or b
  // in the top row, or f in the second row. Second rows need an even e+h-f-g (integer i+l).
  //   topWithOne: 1 at index 0 or 1, topAll: every ordering (rows without the 1),
  //   second: even e+h-f-g, secondWithOneAtF: additionally f = 1.
  const rows = []
  for (let a = 1; a <= 16; a++)
    for (let b = a + 1; b <= 16; b++)
      for (let c = b + 1; c <= 16; c++) {
        const d = 34 - a - b - c
        if (d <= c || d > 16) continue
        const values = [a, b, c, d]
        const ordered = orders.map((order) => order.map((idx) => values[idx]))
        const second = ordered.filter(([e, f, g, h]) => !((e + h - f - g) & 1))
        rows.push({
          mask: bit(a) | bit(b) | bit(c) | bit(d),
          topWithOne: Int8Array.from(ordered.filter((row) => row[0] === 1 || row[1] === 1).flat()),
          topAll: Int8Array.from(ordered.flat()),
          second: Int8Array.from(second.flat()),
          secondWithOneAtF: Int8Array.from(second.filter((row) => row[1] === 1).flat()),
        })
      }

  // Window masks, index offset 128: PLUS[s] holds every i in 1..16 with i+s in 1..16,
  // MINUS[t] every i in 1..16 with t-i in 1..16.
  const PLUS = new Int32Array(256)
  const MINUS = new Int32Array(256)
  for (let x = -128; x < 128; x++)
    for (let i = 1; i <= 16; i++) {
      if (i + x >= 1 && i + x <= 16) PLUS[x + 128] |= 1 << (i - 1)
      if (x - i >= 1 && x - i <= 16) MINUS[x + 128] |= 1 << (i - 1)
    }

  const results = []
  for (const first of rows) {
    const oneInFirst = first.mask & 1
    const top = oneInFirst ? first.topWithOne : first.topAll
    for (const second of rows) {
      if (first.mask & second.mask) continue
      if (!oneInFirst && !(second.mask & 1)) continue
      const used = first.mask | second.mask
      const rest = 0xffff ^ used
      const row2 = oneInFirst ? second.second : second.secondWithOneAtF
      for (let t = 0; t < top.length; t += 4) {
        const a = top[t], b = top[t + 1], c = top[t + 2], d = top[t + 3]
        for (let s = 0; s < row2.length; s += 4) {
          const e = row2[s], f = row2[s + 1], g = row2[s + 2], h = row2[s + 3]
          if (a === 1 && e < b) continue // tie-break b < e
          const il = 17 - (e + h - f - g) / 2
          const ji = a + e - d - g
          const ik = il + d + h - a - f
          // All derived cells are i + const or const - i:
          // j = i+ji, l = il-i, k = ik-i, m = 34-a-e-i, n = 34-b-f-ji-i, o = 34-c-g-ik+i, p = 34-d-h-il+i.
          // ANDing their window masks keeps exactly the i for which all of them lie in 1..16,
          // so plain shifts suffice below and the masks only test for distinct, unused numbers.
          const candidates = rest & PLUS[ji + 128] & MINUS[il + 128] & MINUS[ik + 128] & MINUS[162 - a - e] &
            MINUS[162 - b - f - ji] & PLUS[162 - c - g - ik] & PLUS[162 - d - h - il]
          for (let r = candidates; r; r &= r - 1) {
            const i = 32 - Math.clz32(r & -r)
            const bi = 1 << (i - 1)
            const j = i + ji
            const bj = 1 << (j - 1)
            if (!(rest & bj & ~bi) || (f === 1 && j < g)) continue // tie-break g < j for the 1 at f
            const l = il - i
            const bl = 1 << (l - 1)
            if (!(rest & bl & ~(bi | bj))) continue
            const k = ik - i
            const bk = 1 << (k - 1)
            if (!(rest & bk & ~(bi | bj | bl))) continue
            const m = 34 - a - e - i
            const n = 34 - b - f - j
            const o = 34 - c - g - k
            const p = 34 - d - h - l
            if (((1 << (m - 1)) | (1 << (n - 1)) | (1 << (o - 1)) | (1 << (p - 1))) !== (rest ^ (bi | bj | bk | bl))) continue
            results.push([a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p])
          }
        }
      }
    }
  }
  return results
}

// Exact covering with colors (Knuth's Algorithm C), a completely different approach:
//   primary items:   R0..R3, C0..C3, D0, D1 (every line gets one ordered 4-tuple with sum 34)
//                    N1..N16 (every number lies in exactly one row)
//   secondary items: P0..P15, colored with the number in that cell
// Lines that cross share a cell; the colors force them to put the same number there.
// The normal form restricts where row options may put the 1 (index 0, 1 or 5); the two
// tie-breaks are checked on the solutions.
const magic4x4SolverXcc = () => {
  const tuples = []
  for (let a = 1; a <= 16; a++)
    for (let b = 1; b <= 16; b++)
      for (let c = 1; c <= 16; c++) {
        const d = 34 - a - b - c
        if (d >= 1 && d <= 16 && new Set([a, b, c, d]).size === 4) tuples.push([a, b, c, d])
      }

  const lines = [
    ...[0, 1, 2, 3].map((r) => ({ name: `R${r}`, cells: [4 * r, 4 * r + 1, 4 * r + 2, 4 * r + 3], row: r })),
    ...[0, 1, 2, 3].map((c) => ({ name: `C${c}`, cells: [c, c + 4, c + 8, c + 12] })),
    { name: 'D0', cells: [0, 5, 10, 15] },
    { name: 'D1', cells: [3, 6, 9, 12] },
  ]
  const oneAllowedAt = new Set([0, 1, 5])
  const options = []
  const optionCells = [] // per option: [cells, tuple] of row options, null otherwise
  for (const line of lines)
    for (const tuple of tuples) {
      const isRow = line.row !== undefined
      if (isRow && tuple.includes(1) && !oneAllowedAt.has(line.cells[tuple.indexOf(1)])) continue
      const cells = line.cells.map((cell, k) => `P${cell}:${tuple[k]}`)
      options.push([line.name, ...(isRow ? tuple.map((v) => `N${v}`) : []), ...cells])
      optionCells.push(isRow ? [line.cells, tuple] : null)
    }

  const results = []
  xcc({
    primary: [...lines.map((line) => line.name), ...range(16).map((i) => `N${i + 1}`)],
    secondary: range(16).map((i) => `P${i}`),
    options,
    visit: (chosen) => {
      const square = Array(16)
      for (const index of chosen) {
        if (!optionCells[index]) continue
        const [cells, tuple] = optionCells[index]
        cells.forEach((cell, k) => (square[cell] = tuple[k]))
      }
      if ((square[0] === 1 && square[1] > square[4]) || (square[5] === 1 && square[6] > square[9])) return
      results.push(square)
    },
  })
  return results
}

module.exports = {
  magic3x3Solver,
  magic4x4Solver1,
  magic4x4Solver2,
  magic4x4Solver3,
  magic4x4Solver4,
  magic4x4Solver5,
  magic4x4SolverXcc,
}

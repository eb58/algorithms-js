//  MAGISCHES SECHSECK
//  Ordnung 3, flache Zellindizes:
//         0  1  2
//       3  4  5  6
//     7  8  9 10 11
//      12 13 14 15
//        16 17 18

const sum = (xs) => xs.reduce((a, b) => a + b, 0)
const rangeClosed = (a, b) => [...Array(b - a + 1).keys()].map((x) => x + a)

const magicHexagon = (n) => {
  const N = n - 1
  const cells = rangeClosed(-N, N).flatMap((r) =>
    rangeClosed(Math.max(-N, -N - r), Math.min(N, N - r)).map((q) => ({ r, q, s: -q - r }))
  )
  const CNT = cells.length
  const MN = (CNT * (CNT + 1)) / 2 / (2 * n - 1) // MN -> Magische Zahl, 38 für n = 3

  const groupBy = (key) =>
    [...cells.reduce((acc, c, i) => acc.set(c[key], [...(acc.get(c[key]) ?? []), i]), new Map())].sort(([a], [b]) => a - b).map(([, idxs]) => idxs)
  const rows = groupBy('r')
  const lines = ['r', 'q', 's'].flatMap(groupBy) // die 3 * (2n-1) Reihen, für n = 3 also 15
  const linesOf = cells.map((_, i) => lines.filter((line) => line.includes(i)))
  const corners = cells.reduce((acc, c, i) => ([c.r, c.q, c.s].filter((x) => Math.abs(x) === N).length === 2 ? [...acc, i] : acc), [])

  // Ecke 0 kleinste Ecke bricht die 6 Rotationen, board[1] < board[n] die Spiegelung an der Achse durch Ecke 0
  const breaksSymmetry = (board, i, x) => (i > 0 && corners.includes(i) && x < board[0]) || (i === n && x < board[1])

  const solve = (withSymmetries = false) => {
    const board = cells.map(() => 0)
    const used = rangeClosed(0, CNT).map(() => false)
    const res = []

    const lineFits = (line, free) => {
      const s = sum(line.filter((i) => board[i]).map((i) => board[i]))
      const k = line.filter((i) => !board[i]).length
      if (k === 0) return s === MN
      if (k === 1) return free.includes(MN - s)
      return s + sum(free.slice(0, k)) <= MN && MN <= s + sum(free.slice(-k))
    }

    const fill = (i) => {
      if (i === CNT) return res.push(board.slice())
      const free = rangeClosed(1, CNT).filter((x) => !used[x])
      free.forEach((x) => {
        if (!withSymmetries && breaksSymmetry(board, i, x)) return
        board[i] = x
        used[x] = true
        const rest = free.filter((y) => y !== x)
        if (linesOf[i].every((line) => lineFits(line, rest))) fill(i + 1)
        board[i] = 0
        used[x] = false
      })
    }

    fill(0)
    return res
  }

  const width = String(CNT).length + 1
  const format = (board) =>
    rows.map((row) => ' '.repeat(((2 * n - 1 - row.length) * width) / 2) + row.map((i) => String(board[i]).padStart(width)).join('')).join('\n')

  return { MN, cells, rows, lines, corners, solve, format }
}

module.exports = magicHexagon

if (require.main === module) {
  const hex = magicHexagon(3)
  console.log(`Magische Zahl: ${hex.MN}, Reihen: ${hex.lines.length}`)
  hex.solve().forEach(board => console.log(hex.format(board)))
}

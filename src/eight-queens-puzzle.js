const solveEightQueens = (N) => {
  const range = (n) => [...Array(n).keys()]
  const ininterval = (x, a, b) => a <= x && x <= b
  const infield = (r, c) => ininterval(r, 0, N - 1) && ininterval(c, 0, N - 1)
  const diag = (r, c, dR, dC) => (infield(r, c) ? [r * N + c, ...diag(r + dR, c + dC, dR, dC)] : [])
  const DIAGSETS = range(N * N)
    .map((x) => ({ r: Math.floor(x / N), c: x % N }))
    .map((rc) => [...diag(rc.r, rc.c, -1, +1), ...diag(rc.r, rc.c, -1, -1)])
    .map((x) => Array.from(new Set(x)).slice(1))
  const hasCollision = (r, c, fld) => DIAGSETS[r * N + c].some((x) => fld[x] === 1)
  const setQueen = (fld, r, c, callback) => {
    fld[r * N + c] = 1
    const res = callback()
    fld[r * N + c] = 0
    return res
  }
  const solve = (fld, r, cols) =>
    r >= N
      ? [[...fld]]
      : cols.reduce(
          (acc, c) =>
            hasCollision(r, c, fld)
              ? acc
              : [
                  ...acc,
                  ...setQueen(fld, r, c, () =>
                    solve(
                      fld,
                      r + 1,
                      cols.filter((x) => x != c)
                    )
                  ),
                ],
          []
        )
  return solve(
    range(N * N).map(() => 0),
    0,
    range(N)
  )
}

module.exports = solveEightQueens

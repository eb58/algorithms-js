module.exports = solveEightQueens = (N) => {
    const range = (n) => [...Array(n).keys()];
    const ininterval = (x, a, b) => a <= x && x <= b;
    const infield = (r, c) => ininterval(r, 0, N - 1) && ininterval(c, 0, N - 1);
    const row = (x) => Math.floor(x / N);
    const col = (x) => x % N;
    const diagSet = (x) => {
        const f = (r, c, d) => { while (infield(r, c)) { res.push(r * N + c);[r, c] = [r + d[0], c + d[1]] } }
        const res = [];
        [[-1, +1], [-1, -1]].forEach(delta => f(row(x), col(x), delta))
        return res;
    }
    const DIAGSETS = range(N * N).map(diagSet);
    const hasCollision = (fld, r, c) => DIAGSETS[r * N + c].some(x => fld[x] === 1);
    const set = (fld, r, c, callback) => { fld[r * N + c] = 1; callback(); fld[r * N + c] = 0; }
    const solve = (fld, r, cols) =>
        r >= N
            ? res.push([...fld])
            : cols.forEach(c => hasCollision(fld, r, c) || set(fld, r, c, () => solve(fld, r + 1, cols.filter(x => x != c))))
    const res = [];
    solve(range(N * N).map(() => 0), 0, range(N));
    return res;
}
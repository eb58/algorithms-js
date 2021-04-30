module.exports = solveEightQueens = (N) => {
    const range = (n) => [...Array(n).keys()];
    const ininterval = (x, a, b) => a <= x && x <= b;
    const infield = (r, c) => ininterval(r, 0, N - 1) && ininterval(c, 0, N - 1);
    const diag = (x, dX, dY) => {
        const res = [];
        let [r, c] = [ Math.floor(x / N), x % N];
        while (infield(r, c)) { res.push(r * N + c);[r, c] = [r + dX, c + dY] };
        return res
    }
    const DIAGSETS = range(N * N).map(x => [...diag(x, -1, +1), ...diag(x, -1, -1)]);
    const hasCollision = (fld, r, c) => DIAGSETS[r * N + c].some(x => fld[x] === 1);
    const setQueen = (fld, r, c, callback) => { fld[r * N + c] = 1; callback(); fld[r * N + c] = 0; }
    const solve = (fld, r, cols) => r >= N
        ? res.push([...fld])
        : cols.forEach(c => hasCollision(fld, r, c) || setQueen(fld, r, c, () => solve(fld, r + 1, cols.filter(x => x != c))))
    const res = [];
    solve(range(N * N).map(() => 0), 0, range(N));
    return res;
}
const solveEightQueens = (N) => {
    const range = (n) => [...Array(n).keys()];
    const ininterval = (x, a, b) => a <= x && x <= b;
    const row = (x) => Math.floor(x / N);
    const col = (x) => x % N;
    const connectionSet = (x) => {
        const f = (r, c, d) => { while (ininterval(r, 0, N - 1) && ininterval(c, 0, N - 1)) { res.add(r * N + c);[r, c] = [r + d[0], c + d[1]] } }
        const res = new Set();
        [-1, 0, +1].flatMap(x => [-1, 0, +1].map(y => [x, y])).filter(a => a[0] !== 0 || a[1] !== 0).forEach(d => f(row(x), col(x), d))
        return Array.from(res);
    }
    const CONNECTIONSETS = range(N * N).map(connectionSet);
    const hasCollision = (fld, idx) => CONNECTIONSETS[idx].some(x => fld[x] === 1);
    const solve = (fld, row, cols) => {
        row >= N
            ? res.push([...fld])
            : cols.filter(col => !hasCollision(fld, row * N + col)).forEach(c => {
                fld[row * N + c] = 1
                solve(fld, row + 1, cols.filter(x => x != c))
                fld[row * N + c] = 0;
            })
    }
    const res = [];
    solve(range(N * N).map(() => 0), 0, range(N));
    return res;
}
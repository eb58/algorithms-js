const N = 8
const range = (n) => [...Array(n).keys()];
const ininterval = (x, a, b) => a <= x && x <= b;
const row = (x) => Math.floor(x / N);
const col = (x) => x % N;
const dump = (fld) => range(N).map(r => range(N).map((c) => fld[r * N + c] ? "1" : "0").join(' ') + "\n").join('');
const connectionSet = (x) => {
    const res = new Set();
    const f = (r, c, delta) => { while (ininterval(r, 0, N - 1) && ininterval(c, 0, N - 1)) { res.add(r * N + c);[r, c] = delta(r, c) } }
    f(row(x), col(x), (r, c) => [r + 0, c + 1])
    f(row(x), col(x), (r, c) => [r + 1, c + 0])
    f(row(x), col(x), (r, c) => [r + 0, c - 1])
    f(row(x), col(x), (r, c) => [r - 1, c + 0])
    f(row(x), col(x), (r, c) => [r + 1, c + 1])
    f(row(x), col(x), (r, c) => [r - 1, c + 1])
    f(row(x), col(x), (r, c) => [r + 1, c - 1])
    f(row(x), col(x), (r, c) => [r - 1, c - 1])
    return Array.from(res);
}
const CONNECTIONSETS = range(N * N).map(connectionSet);

const hasCollision = (fld, idx) => CONNECTIONSETS[idx].some(x => fld[x] === 1);

const solve = () => {
    const solv = (fld, row, cols) => {
        if (row >= N) {
            res.push([...fld]);
        }
        else {
            cols.filter(x => !hasCollision(fld, row * N + x)).forEach(c => {
                fld[row * N + c] = 1;
                //console.log(row, c); console.log(dump(fld));
                solv(fld, row + 1, cols.filter(x => x != c));
                fld[row * N + c] = 0;
            })
        }
    }

    const res = [];
    const fld = range(N * N).map(() => 0);
    solv(fld, 0, range(N));
    // console.log("BB", res)
    res.forEach(x => console.log(dump(x)))
    return res;
}

solve()


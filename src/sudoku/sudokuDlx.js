//const dlx = require("dlx");                    // does not work
// const dlx = require('dlxlib');                // works -> ~2500 for 10x hard ones
// const dancingLinks = require('dancing-links') // works -> ~1000 for 10x hard ones
const dlx_solve = require("../dlx");             // works -> ~800  for 10x hard ones

const solveDlx = (grid) => {
    const mat = [];
    const rinfo = [];
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c
        const n = grid[idx] - 1;
        if (n >= 0) {
            const row = new Array(324);
            row[r * 9 + c] = 1;
            row[9 * 9 + r * 9 + n] = 1;
            row[9 * 9 * 2 + c * 9 + n] = 1;
            row[9 * 9 * 3 + (Math.floor(r / 3) * 3 + Math.floor(c / 3)) * 9 + n] = 1;
            mat.push(row);
            rinfo.push({ idx, n });
        } else {
            for (let n = 0; n < 9; n++) {
                const row = new Array(324);
                row[r * 9 + c] = 1;
                row[9 * 9 + r * 9 + n] = 1;
                row[9 * 9 * 2 + c * 9 + n] = 1;
                row[9 * 9 * 3 + (Math.floor(r / 3) * 3 + Math.floor(c / 3)) * 9 + n] = 1;
                mat.push(row);
                rinfo.push({ idx, n });
            }
        }
    }

    const solutions = dlx_solve(mat, 1);
    // const solutions = dancingLinks.findOne(mat.map(row => ({ row }))).map(x => x.map(o => o.index));
    // const solutions = dlxlib.solve(mat.map(r => [...r].map(x => x || 0))); // works but slower s.o.

    // console.log( solutions )

    if (solutions.length <= 0) throw Error("No solution found")
    return solutions[0].map((n) => rinfo[n]).reduce((res, ri) => (res[ri.idx] = ri.n + 1, res), []);
}

// console.log( solveDlx('...7..62.4...9..5...9..8.7..9..8.74.....6.....25.7..3..4.6..2...6..5...4.13..9...'))
// const problem = [[0, 0, 1, 0, 1, 1, 0], [1, 0, 0, 1, 0, 0, 1], [0, 1, 1, 0, 0, 1, 0], [1, 0, 0, 1, 0, 0, 0], [0, 1, 0, 0, 0, 0, 1], [0, 0, 0, 1, 1, 0, 1],];
// console.log(dlxSolver.solve(problem));

// const constraints = [
//     { data: 'first one', row: [1, 0] },
//     { data: 'second one', row: [0, 1] },
//     { data: 'third one', row: [0, 1] }
// ]

// const matrix = [
//     [1, 0, 0, 0],
//     [0, 1, 1, 0],
//     [1, 0, 0, 1],
//     [0, 0, 1, 1],
//     [0, 1, 0, 0],
//     [0, 0, 1, 0]
// ];


// const sol = dancingLinks.findAll(constraints)
//console.log(dancingLinks.findAll(constraints))

module.exports = solveDlx

const dlx_solve = require('../src/dlx')
const { createDlx } = require('../src/dlx')

const sorted = (solutions) => solutions.map((x) => [...x].sort()).sort()

test('dlx problem1', () => {
    const problem = [
        [0, 0, 1, 0, 1, 1, 0],
        [1, 0, 0, 1, 0, 0, 1],
        [0, 1, 1, 0, 0, 1, 0],
        [1, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 1],
        [0, 0, 0, 1, 1, 0, 1],
        [0, 0, 0, 1, 1, 0, 1],
    ]
    expect(sorted(dlx_solve(problem))).toEqual([[0, 3, 4]])
})

test('dlx problem2: all solutions, also below maxsolutions', () => {
    const problem = [
        [1, 0, 0, 0],
        [0, 1, 1, 0],
        [1, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 1, 0, 0],
        [0, 0, 1, 0]
    ]
    expect(sorted(dlx_solve(problem))).toEqual([[0, 3, 4], [1, 2], [2, 4, 5]])
    expect(sorted(dlx_solve(problem, 10))).toEqual([[0, 3, 4], [1, 2], [2, 4, 5]])
    expect(dlx_solve(problem, 2)).toHaveLength(2)
    expect(dlx_solve([[1, 0], [1, 0]])).toEqual([])
})

test('dlx.js createDlx: sparse rows, count and fixed rows', () => {
    // problem2 as column indices of the 1s
    const dlx = createDlx(4, [[0], [1, 2], [0, 3], [2, 3], [1], [2]])

    expect(sorted(dlx.solve())).toEqual([[0, 3, 4], [1, 2], [2, 4, 5]])
    expect(dlx.count()).toBe(3)
    // fixing row 2 leaves the solutions that contain it; the structure is restored afterwards
    expect(sorted(dlx.solve({ fixedRows: [2] }))).toEqual([[1, 2], [2, 4, 5]])
    expect(dlx.count({ fixedRows: [2, 4] })).toBe(1)
    expect(dlx.count()).toBe(3)
})

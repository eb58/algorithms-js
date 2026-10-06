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
    [0, 0, 0, 1, 1, 0, 1]
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
  expect(sorted(dlx_solve(problem))).toEqual([
    [0, 3, 4],
    [1, 2],
    [2, 4, 5]
  ])
  expect(sorted(dlx_solve(problem, 10))).toEqual([
    [0, 3, 4],
    [1, 2],
    [2, 4, 5]
  ])
  expect(dlx_solve(problem, 2)).toHaveLength(2)
  expect(
    dlx_solve([
      [1, 0],
      [1, 0]
    ])
  ).toEqual([])
})

test('dlx.js createDlx: sparse rows, count and fixed rows', () => {
  // problem2 as column indices of the 1s
  const dlx = createDlx(4, [[0], [1, 2], [0, 3], [2, 3], [1], [2]])

  expect(sorted(dlx.solve())).toEqual([
    [0, 3, 4],
    [1, 2],
    [2, 4, 5]
  ])
  expect(dlx.count()).toBe(3)
  // fixing row 2 leaves the solutions that contain it; the structure is restored afterwards
  expect(sorted(dlx.solve({ fixedRows: [2] }))).toEqual([
    [1, 2],
    [2, 4, 5]
  ])
  expect(dlx.count({ fixedRows: [2, 4] })).toBe(1)
  expect(dlx.count()).toBe(3)
})

test('zero solution limit returns no solutions, including the empty exact cover', () => {
  expect(dlx_solve([[1]], 0)).toEqual([])
  expect(createDlx(0, []).solve({ maxsolutions: 0 })).toEqual([])
  const dlx = createDlx(1, [[0]])
  expect(dlx.solve({ maxsolutions: 0, fixedRows: [0] })).toEqual([])
  expect(dlx.solve()).toEqual([[0]])
})

test('a singleton before an empty column still yields no solutions', () => {
  const dlx = createDlx(2, [[0]])
  expect(dlx.solve()).toEqual([])
  expect(dlx.count()).toBe(0)
  expect(dlx.solve()).toEqual([])
})

test('restores every link and column size after limited and unsuccessful fixed-row searches', () => {
  const dlx = createDlx(4, [[0], [1, 2], [0, 3], [2, 3], [1], [2]])
  const original = Object.fromEntries(['L', 'R', 'U', 'D', 'S'].map((key) => [key, dlx[key].slice()]))
  const expectRestored = () => Object.entries(original).forEach(([key, values]) => expect(dlx[key]).toEqual(values))
  expect(dlx.solve({ maxsolutions: 1, fixedRows: [2] })).toHaveLength(1)
  expectRestored()
  expect(dlx.solve({ fixedRows: [0, 5] })).toEqual([])
  expectRestored()
  expect(dlx.count({ fixedRows: [0, 5] })).toBe(0)
  expectRestored()
  expect(sorted(dlx.solve())).toEqual([
    [0, 3, 4],
    [1, 2],
    [2, 4, 5]
  ])
})

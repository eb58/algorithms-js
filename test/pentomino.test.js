const pentomino = require('../src/pentomino/pentomino')
const dlx_solve = require('../src/dlx') // ~10.5 sec

test('symbols', () => {
  const pento = pentomino()
  expect(pento.internals.SYMBOLS).toEqual(['f', 'i', 'l', 'n', 'p', 't', 'u', 'v', 'w', 'x', 'y', 'z'])
})

test('generateTiles 6x10', () => {
  const pento = pentomino()
  const res = Object.entries(pento.internals.generateAllTiles(6, 10)).map(([key, value]) => key + ':' + value.length)
  expect(res).toEqual(['f:64', 'i:56', 'l:248', 'n:248', 'p:304', 't:128', 'u:152', 'v:128', 'w:128', 'x:32', 'y:248', 'z:128'])
})

test('generateTiles 3x20', () => {
  const pento = pentomino()
  const res = Object.entries(pento.internals.generateAllTiles(3, 20)).map(([key, value]) => key + ':' + value.length)
  expect(res).toEqual(['f:36', 'i:48', 'l:136', 'n:136', 'p:220', 't:72', 'u:110', 'v:72', 'w:72', 'x:18', 'y:136', 'z:72'])
})

test('solve pentomino 6x10', () => {
  const pento = pentomino()
  const dlxSolve = (problem) => dlx_solve(problem, 2339) // ~10.5 sec
  const solutions = pento.solve(6, 10, dlxSolve)
  expect(solutions.length).toBe(2339)
})

test('solve pentomino 4x15', () => {
  const pento = pentomino()
  const dlxSolve = (problem) => dlx_solve(problem, 368) // ~10.5 sec
  const solutions = pento.solve(4, 15, dlxSolve)
  expect(solutions.length).toBe(368)
})

test('solve pentomino 3x20', () => {
  const pento = pentomino()
  const dlxSolve = (problem) => dlx_solve(problem, 2) // ~10.5 sec
  const solutions = pento.solve(3, 20, dlxSolve)
  expect(solutions.length).toBe(2)
})

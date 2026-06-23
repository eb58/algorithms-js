const { towers, hanoi1, hanoi2 } = require('../src/hanoi/hanoi')

const expectFinalTower = (states, n) => {
  const last = states[states.length - 1]
  expect(last).toEqual({ l: [], c: [], r: [...Array(n).keys()].map((x) => n - x) })
}

test('towers', () => {
  expect(towers(0)).toEqual({ l: [], c: [], r: [] })
  expect(towers(3)).toEqual({ l: [3, 2, 1], c: [], r: [] })
})

test('hanoi1', () => {
  expect(hanoi1(1).length).toBe(2)
  expect(hanoi1(2).length).toBe(4)
  expect(hanoi1(3).length).toBe(8)
  expectFinalTower(hanoi1(3), 3)
})

test('hanoi2', () => {
  expect(hanoi2(1).length).toBe(2)
  expect(hanoi2(2).length).toBe(4)
  expect(hanoi2(3).length).toBe(8)
  expectFinalTower(hanoi2(3), 3)
})

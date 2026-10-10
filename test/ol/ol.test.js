const { ol, num, interval, array } = require('../../src/ol')

const {
  abs,
  add,
  inc,
  dec,
  mul,
  sqr,
  cub,
  gcd,
  fac,
  fib, // numerical functions
  repeat,
  blanks,
  indent, // string functions
  id,
  feedX,
  call,
  swap,
  clone, // technical functions
  eq,
  lt,
  lte,
  gt,
  gte,
  odd,
  even,
  isInInterval,
  isLeapYear,
  isPrime, // predicates
  gtPred,
  gtePred,
  ltPred,
  ltePred, // generate predicates
  not,
  or,
  and,
  xor,
  comb,
  every,
  some, // combine predicates
  cmpNumbers,
  cmp,
  comparer,
  comparerByKey, // compare
  randomArray,
  randomIntArray,
  randomInRange,
  randomIntInRange, // random
  range,
  rangeClosed,
  rangeFilled, // arrays
  sum,
  prod,
  max,
  min,
  randomElem,
  average,
  median,
  patch,
  without,
  withoutIndex,
  sort,
  shuffle,
  flatten,
  uniq,
  uniqBy,
  groupBy,
  zip, // arrays
  memoize,
  counter,
  timer // helpers
} = ol

test('string functions', () => {
  expect(blanks(0)).toEqual('')
  expect(blanks(3)).toEqual('   ')
  expect(indent('Das ist nur ein Test', 1)).toEqual('   Das ist nur ein Test')
  expect(indent('Das ist nur ein Test', 2)).toEqual('      Das ist nur ein Test')
  expect(indent('Das ist nur ein Test', 2, { fillChars: '##', prompt: '> ' })).toEqual('####> Das ist nur ein Test')
})

test('simple', () => {
  expect(id('a')).toEqual('a')
  expect(id(3)).toEqual(3)

  expect(sqr(3)).toEqual(9)
  expect(sqr(-4)).toEqual(16)

  expect(abs(2)).toEqual(2)
  expect(abs(-2)).toEqual(2)

  expect(cub(0)).toEqual(0)
  expect(cub(1)).toEqual(1)
  expect(cub(2)).toEqual(8)
  expect(cub(3)).toEqual(27)
})

test('clone', () => {
  const xs = [{ a: 1 }, { b: [2, 3] }]
  const ys = clone(xs)

  expect(ys).toEqual(xs)
  expect(ys).not.toBe(xs)
  expect(ys[1]).not.toBe(xs[1])
})

test('faculty', () => {
  expect(fac(0)).toEqual(1)
  expect(fac(1)).toEqual(1)
  expect(fac(2)).toEqual(2)
  expect(fac(3)).toEqual(6)
  expect(fac(4)).toEqual(24)
})

test('gcd', () => {
  expect(gcd(12, 18)).toBe(6)
  expect(gcd(18, 12)).toBe(6)
  expect(gcd(21, 7)).toBe(7)
})

test('randomInRange', () => {
  const res = {}
  for (let i = 0; i < 1000; i++) {
    const x = Math.floor(randomInRange(1, 6))
    res[x] = (res[x] || 0) + 1
    expect(x).toBeGreaterThanOrEqual(1)
    expect(x).toBeLessThanOrEqual(6)
  }
})

test('randomIntInRange', () => {
  for (let i = 0; i < 1000; i++) {
    const x = randomIntInRange(1, 6)
    expect(x).toBeGreaterThanOrEqual(1)
    expect(x).toBeLessThanOrEqual(6)
  }
})

test('randomElement', () => {
  const N = 6
  const M = 1000
  const stat = {}
  for (let i = 0; i < M; i++) {
    const x = randomElem(range(N))
    stat[x] = stat[x] ? stat[x] + 1 : 1
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThanOrEqual(5)
  }
  range(N).forEach((n) => expect(stat[n + '']).toBeGreaterThanOrEqual(M / 20))
  range(N).forEach((n) => expect(stat[n + '']).toBeLessThanOrEqual(M / 2))
})

test('fibonacci', () => {
  expect(fib(1)).toEqual(1)
  expect(fib(2)).toEqual(1)
  expect(fib(3)).toEqual(2)
  expect(fib(4)).toEqual(3)
  expect(fib(5)).toEqual(5)
  expect(fib(6)).toEqual(8)
})

test('odd & even', () => {
  expect(odd(3)).toBe(true)
  expect(odd(4)).toBe(false)
  expect(even(3)).toBe(false)
  expect(even(4)).toBe(true)
})

test('isInInterval', () => {
  expect(isInInterval(3, 3, 4)).toEqual(true)
  expect(isInInterval(3.5, 4, 6)).toEqual(false)
  expect(isInInterval(0, 0, 1)).toBe(true)
  expect(isInInterval(1, 0, 1)).toBe(true)
  expect(isInInterval(0.5, 0, 1)).toBe(true)
  expect(isInInterval(1.1, 0, 1)).toBe(false)
  expect(isInInterval(-0.1, 0, 1)).toBe(false)
})

test('isLeapYear', () => {
  expect(isLeapYear(1800)).toBe(false)
  expect(isLeapYear(1900)).toBe(false)
  expect(isLeapYear(2000)).toBe(true)
  expect(isLeapYear(2001)).toBe(false)
  expect(isLeapYear(2004)).toBe(true)
  expect(isLeapYear(2005)).toBe(false)
  expect(isLeapYear(2008)).toBe(true)
})

test('isPrime', () => {
  expect(isPrime(2)).toBe(true)
  expect(isPrime(3)).toBe(true)
  expect(isPrime(4)).toBe(false)
  expect(isPrime(10)).toBe(false)
  expect(isPrime(17)).toBe(true)
  expect(isPrime(25)).toBe(false)
})

test('combine predicates', () => {
  expect(not(isLeapYear)(1800)).toBe(true)
  expect(not(not(even))(2)).toBe(true)
  expect(or(isLeapYear, odd)(1804)).toBe(true)
  expect(or(isLeapYear, odd)(1801)).toBe(true)
  expect(and(even, odd)(1804)).toBe(false)
  expect(and(even, isLeapYear)(1804)).toBe(true)
  expect(xor(even, odd)(54)).toBe(true)
  expect(every(isLeapYear, even)(1804)).toBe(true)
  expect(every(isLeapYear, even)(1800)).toBe(false)
  expect(some(isLeapYear, even)(1804)).toBe(true)
  expect(some(isLeapYear, even)(1800)).toBe(true)
})

test('range', () => {
  expect(range(0)).toEqual([])
  expect(range(1)).toEqual([0])
  expect(range(2)).toEqual([0, 1])
  expect(range(3)).toEqual([0, 1, 2])
})

test('rangeFilled', () => {
  expect(rangeFilled(0, 'a')).toEqual([])
  expect(rangeFilled(1, 'a')).toEqual(['a'])
  expect(rangeFilled(2, 1)).toEqual([1, 1])
  expect(rangeFilled(3, 10)).toEqual([10, 10, 10])
})

test('randomArray', () => {
  const arr = randomArray(100, 1, 2)
  // console.log(arr)
  expect(arr.every((x) => isInInterval(x, 1, 2))).toBe(true)
})

test('randomIntArray', () => {
  const arr = randomIntArray(100, 1, 3)
  expect(arr.every((x) => x === 1 || x === 2 || x === 3)).toBe(true)

  const groups = array(arr).groupBy(id)
  expect(Object.keys(groups).every((x) => groups[x].length > 10)).toBe(true)
})

test('sum of arrays', () => {
  expect(sum([])).toBe(0)
  expect(sum([10])).toBe(10)
  expect(sum([10, 20, 30])).toBe(60)
  expect(sum(interval(1, 3).range())).toBe(6)
  expect(sum(interval(1, 100).range())).toBe(5050)
})

test('average of arrays', () => {
  expect(average([1])).toBe(1)
  expect(average([1, 2, 3])).toBe(2)
  expect(average(interval(1, 3).range())).toBe(2)
})

test('median of arrays', () => {
  expect(median([1])).toBe(1)
  expect(median([1, 2, 3])).toBe(2)
  expect(median([1, 2, 3, 4])).toBe(2.5)
  expect(median([1, 2, 3, 4, 40])).toBe(3)
  expect(median(interval(1, 3).range())).toBe(2)
})

test('without', () => {
  expect(without([], 2)).toEqual([])
  expect(without([3], 2)).toEqual([3])
  expect(without([1, 2, 3], 2)).toEqual([1, 3])
  expect(without([1, 2, 3, 4], 2)).toEqual([1, 3, 4])
})

test('withoutIndex', () => {
  expect(withoutIndex([], 2)).toEqual([])
  expect(withoutIndex([3], 0)).toEqual([])
  expect(withoutIndex([1, 2, 3], 2)).toEqual([1, 2])
  expect(withoutIndex([1, 2, 3, 4], 2)).toEqual([1, 2, 4])
})

test('patch', () => {
  const xs = [1, 2, 3]
  const ys = patch(xs, 1, 9)
  expect(ys).toEqual([1, 9, 3])
  expect(xs).toEqual([1, 2, 3])
})

test('shuffle & sort', () => {
  const xs = range(300)
  const ys = shuffle([...xs])
  // console.log(ys);
  expect(xs).not.toEqual(ys)
  expect(xs).toEqual(sort(ys, cmpNumbers))
})

test('groupBy', () => {
  const xs = [1, 2, 3, 4, 5, 6]
  const groups = groupBy(xs, odd)
  expect(groups).toEqual({ true: [1, 3, 5], false: [2, 4, 6] })
})

test('uniq', () => {
  expect(uniq([1, 2, 2], id)).toEqual([1, 2])
})

test('uniqBy', () => {
  expect(uniqBy([1, 2, 2], id)).toEqual([1, 2])
  expect(uniqBy([{ id: 1 }, { id: 2 }, { id: 2 }], (x) => x.id)).toEqual([{ id: 1 }, { id: 2 }])
})

test('flatten', () => {
  expect(flatten([1, 2, 3, 4, 5, 6, [1]])).toEqual([1, 2, 3, 4, 5, 6, 1])
  expect(flatten([[1, [2]], 3, 4, 5, 6, [1]])).toEqual([1, 2, 3, 4, 5, 6, 1])
  expect(uniq(sort(flatten([[1, [2]], 3, 4, 5, 6, [1]])))).toEqual([1, 2, 3, 4, 5, 6])
})

test('zip', () => {
  expect(zip([1, 2, 3], [4, 5, 6])).toEqual([
    [1, 4],
    [2, 5],
    [3, 6]
  ])
  expect(zip([1, 2, 3], [4, 5, 6], add)).toEqual([5, 7, 9])
  const men = [
    { name: 'hugo', age: 36 },
    { name: 'hans', age: 37 }
  ]
  const women = [
    { name: 'anna', age: 35 },
    { name: 'lena', age: 27 }
  ]
  const marry = (a, b) => ({ husband: a.name, wife: b.name })
  expect(zip(men, women, marry)).toEqual([
    { husband: 'hugo', wife: 'anna' },
    { husband: 'hans', wife: 'lena' }
  ])
})

test('num', () => {
  expect(num(0).sqr()).toBe(0)
  expect(num(1).sqr()).toBe(1)
  expect(num(2).sqr()).toBe(4)

  expect(num(0).cube()).toBe(0)
  expect(num(1).cube()).toBe(1)
  expect(num(2).cube()).toBe(8)

  expect(num(0).abs()).toBe(0)
  expect(num(1).abs()).toBe(1)
  expect(num(-1).abs()).toBe(1)

  expect(num(2).isInInterval(2, 3)).toBe(true)
  expect(num(2).isInInterval(2, 4)).toBe(true)
  expect(num(3).isInInterval(2, 3)).toBe(true)
  expect(num(3).isInInterval(2, 4)).toBe(true)
  expect(num(2).isInInterval(3, 4)).toBe(false)
  expect(num(3).isInInterval(1, 2)).toBe(false)
})

test('interval', () => {
  expect(interval(1, 2).range()).toEqual([1, 2])
  expect(interval(0, 10).range()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

  expect(interval(1, 10).contains(1)).toBe(true)
  expect(interval(1, 10).contains(2)).toBe(true)
  expect(interval(1, 10).contains(0.5)).toBe(false)
  expect(interval(1, 10).contains(10.5)).toBe(false)

  expect(interval(1, 2).intersects(0.5, 1.5)).toBe(true)
  expect(interval(1, 2).intersects(1.5, 2, 5)).toBe(true)
  expect(interval(1, 2).intersects(0.5, 0.7)).toBe(false)
  expect(interval(1, 2).intersects(2.1, 2, 5)).toBe(false)

  expect(interval(1, 10).inc(1)).toBe(2)
  expect(interval(1, 10).inc(9)).toBe(10)
  expect(interval(1, 10).inc(10)).toBe(10)

  expect(interval(0, 10).dec(10)).toBe(9)
  expect(interval(0, 10).dec(9)).toBe(8)
  expect(interval(0, 10).dec(1)).toBe(0)
  expect(interval(0, 10).dec(0)).toBe(0)
})

test('array wrapper', () => {
  expect(array([1, 2, 3]).sum()).toBe(6)

  expect(array(['a', 'a', 'b', 'b']).uniq()).toEqual(['a', 'b'])
  expect(array([1, 2, 3, 3]).uniq()).toEqual([1, 2, 3])

  expect(array([]).unite([])).toEqual([])
  expect(array(['a', 'b']).unite([1])).toEqual(['a', 'b', 1])
  expect(array(['a', 'b']).unite(['b', 'c', 'd'])).toEqual(['a', 'b', 'c', 'd'])

  expect(array([]).intersect([])).toEqual([])
  expect(array([1, 2, 3]).intersect([3, 4, 5])).toEqual([3])

  expect(array([]).without(3)).toEqual([])
  expect(array([3]).without(3)).toEqual([])
  expect(array([1]).without(3)).toEqual([1])
  expect(array([1, 2, 3]).withoutIndex(1)).toEqual([1, 3])
  expect(array([1]).max()).toEqual(1)

  expect(array([]).max()).toEqual(undefined)
  expect(array([1]).max()).toEqual(1)
  expect(array([1, 2]).max()).toEqual(2)
  expect(array([]).min()).toEqual(undefined)
  expect(array([1]).min()).toEqual(1)
  expect(array([1, 2]).min()).toEqual(1)
})

test('memoize', () => {
  let calls = 0
  const fn = memoize((x) => {
    calls += 1
    return x * 2
  })

  expect(fn(3)).toBe(6)
  expect(fn(3)).toBe(6)
  expect(fn(4)).toBe(8)
  expect(calls).toBe(2)
})

test('counter foreach', () => {
  let res = 0
  counter(10).foreach((i) => (res += i))
  expect(res).toBe(55)
})

test('counter reduce', () => {
  const res = counter(5).reduce((acc, i) => acc + i, 0)
  expect(res).toBe(15)
})

test('median of arrays with even length and numbers', () => {
  expect(median([1, 2])).toBe(1.5)
  expect(median([1, 2, 3, 4, 5, 6])).toBe(3.5)
  expect(median([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(5.5)
  expect(median([10, 1, 2])).toBe(2) // numeric order, not alphabetic
  expect(median([1, 2, 10])).toBe(2)
})

test('log calls the function, prints and returns the result', () => {
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
  try {
    expect(ol.log(() => 6 * 7)).toBe(42)
    expect(spy).toHaveBeenCalledWith('res:', 42, 'time:', expect.any(String))
  } finally {
    spy.mockRestore()
  }
})

test('array filters greaterThan / lesserThan', () => {
  expect(array([1, 5, 9]).greaterThan(3)).toEqual([5, 9])
  expect(array([1, 5, 9]).greaterThan(9)).toEqual([])
  expect(array([1, 5, 9]).lesserThan(6)).toEqual([1, 5])
  expect(array([1, 5, 9]).lesserThan(1)).toEqual([])
})

test('array isSubsetOf', () => {
  expect(array([]).isSubsetOf([1])).toBe(true)
  expect(array([1]).isSubsetOf([1, 2])).toBe(true)
  expect(array([1, 2]).isSubsetOf([1, 2])).toBe(true)
  expect(array([1, 2]).isSubsetOf([1])).toBe(false)
  expect(array([3]).isSubsetOf([1, 2])).toBe(false)
})

test('isPrime for numbers below 2', () => {
  expect(ol.isPrime(1)).toBe(false)
  expect(ol.isPrime(0)).toBe(false)
  expect(ol.isPrime(-7)).toBe(false)
  expect(ol.isPrime(2)).toBe(true)
  expect(ol.isPrime(9)).toBe(false) // square of a prime
  expect(ol.isPrime(49)).toBe(false)
  expect(ol.isPrime(97)).toBe(true)
})

test('gcd with zero and negative numbers', () => {
  expect(ol.gcd(5, 0)).toBe(5)
  expect(ol.gcd(0, 5)).toBe(5)
  expect(ol.gcd(0, 0)).toBe(0)
  expect(ol.gcd(-12, 18)).toBe(6)
  expect(ol.gcd(12, -18)).toBe(6)
})

test('average of an empty array is NaN', () => {
  expect(ol.average([])).toBeNaN()
  expect(ol.average([2, 4])).toBe(3)
})

test('sort sorts numbers numerically by default', () => {
  expect(ol.sort([10, 9, 1])).toEqual([1, 9, 10])
  expect(ol.sort(['b', 'c', 'a'])).toEqual(['a', 'b', 'c'])
  expect(ol.sort([1, 2, 3], (a, b) => b - a)).toEqual([3, 2, 1])
  const xs = [3, 1, 2]
  ol.sort(xs)
  expect(xs).toEqual([3, 1, 2]) // input stays untouched
})

test('shuffle returns a permutation and keeps its input', () => {
  const xs = ol.range(50)
  const ys = ol.shuffle(xs)
  expect(xs).toEqual(ol.range(50))
  expect(ys).not.toBe(xs)
  expect([...ys].sort((a, b) => a - b)).toEqual(xs)
  expect(ol.shuffle([])).toEqual([])
  expect(ol.shuffle([1])).toEqual([1])
})

test('shuffle reaches every permutation', () => {
  const seen = new Set()
  for (let i = 0; i < 500; i++) seen.add(ol.shuffle([1, 2, 3]).join())
  expect(seen.size).toBe(6)
})

test('uniqBy keeps the first of each kind in input order', () => {
  const xs = [{ k: 3, v: 'a' }, { k: 1, v: 'b' }, { k: 3, v: 'c' }, { k: 2, v: 'd' }]
  expect(ol.uniqBy(xs, (o) => o.k)).toEqual([{ k: 3, v: 'a' }, { k: 1, v: 'b' }, { k: 2, v: 'd' }])
  expect(ol.uniqBy([], id)).toEqual([])
})

test('memoize keeps its entries', () => {
  const clock = { now: 1_000 }
  const spy = jest.spyOn(Date, 'now').mockImplementation(() => clock.now)
  try {
    let calls = 0
    const fn = ol.memoize((x) => (calls++, x * 2))
    expect(fn(3)).toBe(6)
    clock.now += 60_000 // a minute later
    expect(fn(3)).toBe(6)
    expect(calls).toBe(1)
  } finally {
    spy.mockRestore()
  }
})

test('memoizeX with several arguments', () => {
  let calls = 0
  const add2 = ol.memoizeX((a, b) => (calls++, a + b))
  expect(add2(1, 2)).toBe(3)
  expect(add2(1, 5)).toBe(6) // same first argument, other result
  expect(add2(1, 2)).toBe(3)
  expect(calls).toBe(2)
})

test('memoizeX distinguishes 1 and "1", and works with keys like "constructor"', () => {
  const f = ol.memoizeX((x) => typeof x)
  expect(f(1)).toBe('number')
  expect(f('1')).toBe('string')
  expect(f('constructor')).toBe('string')
  expect(f('constructor')).toBe('string')
})

test('memoizeX insertCondition and own hash', () => {
  let calls = 0
  const f = ol.memoizeX((x) => (calls++, x), (x) => x > 0, (x) => Math.abs(x))
  f(-1); f(-1)
  expect(calls).toBe(2) // not stored
  f(2); f(2)
  expect(calls).toBe(3)
})
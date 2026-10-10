const { ol, bitset, array } = require('./ol')
const { range } = ol

// comb1 - fastest solution
const comb1 = (xs, k, pred) => {
  if (k === 0) return [[]]
  if (k > xs.length) return []
  const result = []
  const res = []

  const run = (level, start) => {
    const len = xs.length - k + level + 1
    for (let i = start; i < len; i++) {
      res[level] = xs[i]
      if (level < k - 1) {
        run(level + 1, i + 1)
      } else if (!pred || pred(res)) {
        result.push(res.slice())
      }
    }
  }
  run(0, 0)
  return result
}

// comb1a - similar to comb1
const comb1a = (xs, k) => {
  const result = []
  const combX = (sofar, rest, k) =>
    k === 0 ? result.push(sofar) : range(rest.length).forEach((i) => combX([...sofar, rest[i]], rest.slice(i + 1), k - 1))
  combX([], xs, k)
  return result
}

// comb2 - Most elegant solution
const comb2 = (xs, k) =>
  !k ? [[]] : range(xs.length - k + 1).reduce((a, i) => [...a, ...comb2(xs.slice(i + 1), k - 1).map((ys) => [xs[i], ...ys])], [])

{
  // combinations for Set
  const slice = (S, n) => new Set([...S].slice(n))
  const at = (S, i) => [...S][i]
  const combS = (S, k) =>
    !k
      ? [[]]
      : range(S.size - k + 1).reduce((a, i) => {
        return [...a, ...combS(slice(S, i + 1), k - 1).map((T) => new Set([...T, at(S, i)]))]
      }, [])
}

const combBS = (S, k) =>
  !k
    ? [[]]
    : range(bitset.size(S) - k + 1).reduce((a, i) => {
      return [...a, ...combBS(bitset.slice(S, i + 1), k - 1).map((T) => bitset.add(T, bitset.at(S, i)))]
    }, [])

// comb3 --- too slow  but quite interesting!!!
const comb3a = (xs, k) =>
  k === 1
    ? xs.map((x) => [x])
    : comb3a(xs, k - 1).reduce(
      (a, ys) => [
        ...a,
        ...array(xs)
          .largerThan(array(ys).max())
          .map((x) => [...ys, x]),
      ],
      []
    )

// comb4 - caches index combinations per (n, k) and maps them onto xs
const comb4 = (() => {
  const cache = new Map()
  const comb4 = (xs, k) => {
    if (k < 0 || k > xs.length) return []
    const key = `${xs.length},${k}`
    if (!cache.has(key)) cache.set(key, comb1(range(xs.length), k))
    return cache.get(key).map((ys) => ys.map((y) => xs[y]))
  }
  return comb4
})()

module.exports = {
  comb1,
  comb1a,
  comb2,
  comb4,
}

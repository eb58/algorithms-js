// numerical functions
const abs = (x) => (x >= 0 ? x : -x)
const add = (a, b) => a + b
const inc = (x) => x + 1
const dec = (x) => x - 1
const mul = (a, b) => a * b
const sqr = (x) => x ** 2
const cube = (x) => x ** 3

const gcd = (a, b) => (a % b === 0 ? b : gcd(b, a % b))
const fac = (x) => prod(range(x).map(inc))
const fib = (x) => (x <= 2 ? 1 : fib(x - 1) + fib(x - 2))

// technical functions
const id = (x) => x
const feedX = (x, f) => f(x)
const call = (f, ...args) => f(...args)
const swap = (x, y) => [y, x]

// predicates
const eq = (x, y) => x === y
const lt = (x, y) => x < y
const lte = (x, y) => x <= y
const gt = (x, y) => x > y
const gte = (x, y) => x >= y
const odd = (x) => x % 2 !== 0
const even = (x) => x % 2 === 0
const isInInterval = (x, a, b) => a <= x && x <= b
const isLeapYear = (x) => (x % 4 === 0 && x % 100 !== 0) || x % 400 === 0

// generate predicates
// usage: [1,2,3,4,5].filter(gtPred(3)) // -> [4,5]
const gtPred = (x) => (y) => y > x
const gtePred = (x) => (y) => y >= x
const ltPred = (x) => (y) => y < x
const ltePred = (x) => (y) => y <= x

// combine predicates
// const { not, and, or, gtPred } = ol;
// [1,2,3,4,5].filter(not(gtPred(3))) # -> [1,2,3]
// [1,2,3,4,5].filter(and(gtPred(3),ltPred(5))) # -> [4]
const not = (f) => (x) => !f(x)
const and = (f, g) => (x) => f(x) && g(x)
const or = (f, g) => (x) => f(x) || g(x)
const xor = (f, g) => (x) => !!(f(x) ^ g(x))
const every = (...fs) => (x) => fs.every((f) => f(x))
const some = (...fs) => (x) => fs.some((f) => f(x))
const comb = (f, g) => (x) => f(g(x))

// compare
const cmp = (x, y) => (x === y ? 0 : x < y ? -1 : +1)
const cmpNumbers = (x, y) => x - y
const comparer = (proj) => (x, y) => cmp(proj(x), proj(y))
const comparerByKey = (key) => comparer((o) => o[key])

// arrays
//
// range(3)            // [0,1,2]
// range(5).map(inc)   // [1,2,3,4,5]
// range(5).map(()=>0) // [0,0,0,0,0]
const range = (n) => [...Array(n).keys()]

// reshape( [1,2,3,4], 2 ) ->  [[1,2],[3,4]]
const reshape = (xs, dim) => xs.reduce((acc, x, i) => (i % dim ? acc[acc.length - 1].push(x) : acc.push([x])) && acc, [])


// rangeFilled(3, 0)   // [0, 0, 0]
const rangeFilled = (n, val) => range(n).map(() => val)

const randomInRange = (min, max) => Math.random() * (max - min) + min
const randomIntInRange = (min, max) => Math.floor(randomInRange(min, max + 1))
const randomArray = (n, min, max) => range(n).map(() => randomInRange(min, max))
const randomIntArray = (n, min, max) => range(n).map(() => randomIntInRange(min, max))
const sum = (xs) => xs.reduce(add, 0)
const prod = (xs) => xs.reduce(mul, 1)
const patch = (xs, idx, val ) => xs.with(idx,val)
const without = (xs, x) => xs.filter((y) => x !== y)
const withoutIndex = (xs, idx) => xs.filter((_, i) => i !== idx)
const sort = (xs, cmp) => (xs.sort(cmp), xs)
const shuffle = (xs) => (xs.forEach((x, i) => { const j = Math.floor(Math.random() * xs.length); xs[i] = xs[j]; xs[j] = x }), xs)
const flatten = (xs) => xs.reduce((acc, o) => acc.concat(Array.isArray(o) ? flatten(o) : o), [])
const add2obj = (o, k, v) => ((o[k] = [...(o[k] || []), v]), o)
const groupBy = (xs, proj) => xs.reduce((a, v) => add2obj(a, proj(v), v), {})

// zip examples
// zip([1,2,3], [4,5,6])  // -> [[1,4],[2,5],[3,6]]
// zip([1,2,3], [4,5,6], add ) // -> [5,7,9]
//    men   = [{name:'hugo', age:36 }, {name:'hans', age:37 }]
//    women = [{name:'anna', age:35 }, {name:'lena', age:27 }]
// zip(men, women, (a,b) => ({ 'husband': a, 'wife': b }) ) // -> [{"husband":"hugo","wife":"anna"}, {"husband":"hans","wife":"lena"}]
const zip = (xs, ys, f = id) => xs.map((x, i) => (f ? f(x, ys[i]) : [x, ys[i]]))

const uniq = (xs) => Array.from(new Set(xs))
const uniqBy = (xs, proj) => Object.values(xs.reduce((a, v) => ({ ...a, [proj(v)]: v }), {}))

const clone = (o) => JSON.parse(JSON.stringify(o))

// persons     = [ {name:"Max", age: 59}, {name:"Hans", age: 19}, {name:"Johannes", age: 29}]
// oldest      = max(persons,p=> p.age) # -> {name:"Max", age: 59}
// youngest    = min(persons,p=> p.age) # -> {name:"Hans", age: 19}
// longestName = max(persons,p => p.name.length) # -> {name:"Max", age: 59}
const max = (xs, proj) => xs.reduce((a, x) => ((proj || id)(x) > (proj || id)(a) ? x : a), xs[0])
const min = (xs, proj) => xs.reduce((a, x) => ((proj || id)(x) < (proj || id)(a) ? x : a), xs[0])

const interval = (a, b) => ({
  range: () => [...Array(b - a + 1).keys()].map((x) => x + a),
  contains: (x) => a <= x && x <= b,
  intersects: (x, y) => !(y < a || x > b),

  // inc/dec x, but stay in interval
  inc: (x) => (x >= b ? b : x + 1),
  dec: (x) => (x <= a ? a : x - 1),

  random: () => randomInRange(a, b),
  randomInt: () => randomIntInRange(a, b),
})

// Wrappers
const num = (x) => ({
  abs: () => abs(x),
  sqr: () => sqr(x),
  cube: () => cube(x),
  isInInterval: (a, b) => isInInterval(x, a, b),
})

const array = (xs) => ({
  sum: () => sum(xs),
  without: (x) => without(xs, x),
  withoutIndex: (idx) => withoutIndex(idx),
  initial: () => xs.slice(0, -1),
  head: () => [xs[0]],
  tail: () => xs.slice(1),
  rest: () => xs.slice(1),
  first: () => xs[0],
  last: () => xs[xs.length - 1],
  max: () => max(xs),
  min: () => min(xs),
  groupBy: (proj) => groupBy(xs, proj),
  uniq: () => uniq(xs),
  unite: (ys) => uniq([...xs, ...ys]),
  uniqBy: (proj) => uniqBy(xs, proj),
  xor: (ys) => [...xs, ...ys].filter((x) => !(xs.includes(x) && ys.includes(x))),
  intersect: (ys) => xs.filter((x) => ys.includes(x)),
  subtract: (ys) => xs.filter((x) => !ys.includes(x)),
  subsetOf: (ys) => ys.every((x) => xs.includes(x)),
  tap: (f) => (f(xs), xs),
  largerThan: (a) => xs.filter((x) => x > a),
  smallerThan: (a) => xs.filter((x) => x < a),
  shuffle: () => shuffle(xs),
  flatten: () => flatten(xs)
})

// vector functions
const vadd = (v1, v2) => zip(v1, v2, add)
const vsqrdist = (v1, v2) => zip(v1, v2, (x, y) => (x - y) ** 2)
const vdist = (v1, v2) => Math.sqrt(vsqrdist(v1, v2))



const bitset = {
  MAX: 32,
  fromArray: (xs) => xs.reduce((acc, x) => acc | (1 << x), 0),
  toArray: (bs) => {
    const res = []
    let i = 0
    while (bs) {
      if (bs & 1) res.push(i)
      i++;
      bs >>= 1
    }
    return res
  },
  size: (bs) => {
    let count = 0
    while (bs) bs & 1 ? count++ : 0, (bs >>= 1)
    return count
  },

  add: (bs, v) => bs | (1 << v),
  rm: (bs, v) => bs & ~(1 << v),
  set: (bs, n, v) => bs | ((v ? 1 : 0) << n),
  isEmpty: (bs) => bs === 0,
  sum: (bs) => bitset.toArray(bs).reduce(add, 0),
  union: (bs1, bs2) => bs1 | bs2,
  intersection: (bs1, bs2) => bs1 & bs2,
  diff: (bs1, bs2) => bs1 & ~bs2,
  xor: (bs1, bs2) => bs1 ^ bs2,
  isSubset: (bs1, bs2) => (bs1 & ~bs2) === 0,
  has: (bs, v) => !!(bs & (1 << v)),
  includes: (bs, v) => !!(bs & (1 << v)),
  contains: (bs, n) => !!(bs & (1 << n)),
  slice: (bs, n) => {
    let res = 0
    let i = 0
    let cnt = 0
    while (i <= bitset.MAX && cnt < n) {
      if (bs & (1 << i)) cnt++
      i++
    }
    for (let j = i; j < bitset.MAX; j++) {
      res |= bs & (1 << j)
    }
    return res
  },
  at: (bs, n) => {
    let i = (cnt = 0)
    while (i <= bitset.MAX && cnt <= n) {
      if (bs & (1 << i)) cnt++
      i++
    }
    if (i === 0 || i > bitset.MAX) throw 'Wrong index ' + n
    return i - 1
  },
}

const ol = {
  id,
  abs,
  sqr,
  cube,
  fac,
  fib,
  gcd,
  add,
  sum,
  inc,
  dec,
  without,
  withoutIndex,
  range,
  reshape,
  rangeFilled,
  randomArray,
  randomIntArray,
  randomInRange,
  randomIntInRange,
  feedX,
  call,
  eq,
  lt,
  lte,
  gt,
  gte,
  odd,
  even,
  isInInterval,
  isLeapYear,
  not,
  or,
  and,
  xor,
  comb,
  every,
  some,
  gtPred,
  gtePred,
  ltPred,
  ltePred,
  add2obj,
  groupBy,
  cmp,
  comparer,
  comparerByKey,
  cmpNumbers,
  sort,
  uniq,
  uniqBy,
  flatten,
  shuffle,
  vadd
}

module.exports = {
  ol,
  num,
  interval,
  array,
  bitset,
}


// ***********************************************************
// Some other stuff - mostly so called bracket functions
// ***********************************************************

// usage: log(() => callSomeComplicatedFunction(2, 4, 6))
// log(() => sin(2))
log = (f) => {
  const start = new Date().getTime()
  const res = f()
  const end = new Date().getTime()
  console.log('res:', res, 'time:', end - start)
  return res
}

tryAction = (action, finalAction) => {
  try {
    action()
  } catch (e) {
    console.log('tryAction', e)
    throw 'tryAction' + e
  } finally {
    finalAction && finalAction()
  }
}

onCCAction = (doc, title, action) => {
  const ccs = toArray(doc.selectContentControlsByTitle(title))
  if (ccs.length === 0) {
    tryAction(action)
  } else
    ccs.forEach((cc) => {
      const keepState = [cc.lockContentControl, cc.lockContent]
      cc.lockContent = cc.lockContentControl = false
      tryAction(
        () => action(cc),
        () => ([cc.lockContent, cc.lockContentControl] = keepState)
      )
    })
}

withOutScreenUpdating = (app, action) => {
  const keep = app.screenUpdating
  app.screenUpdating = false
  tryAction(action, () => {
    app.screenUpdating = keep
  })
}

// experimentell not working!!!
logtor = (f) => {
  let lev = 0
  const range = (n) => [...Array(n).keys()]
  const blanks = range(100)
    .map(() => ' ')
    .join('')
  const indent = (lev) => blanks.substring(0, lev * 3)

  return function () {
    const start = new Date().getTime()
    console.log(indent(lev++), '>', f.name, 'args=', [].slice.call(arguments, 0).toString())
    const ret = f.apply(this, [].slice.call(arguments, 0))
    const end = new Date().getTime()
    console.log(indent(--lev), '<', f.name, 'ret=', ret, 'time', end - start)
    return ret
  }
}

logtor = (f) => {
  let lev = 0
  const range = (n) => [...Array(n).keys()]
  const blanks = range(100)
    .map(() => ' ')
    .join('')
  const indent = (lev) => blanks.substring(0, lev * 3)

  return function nf() {
    debugger
    const start = new Date().getTime()
    console.log(indent(lev++), '>', f.name, 'args=', [].slice.call(arguments, 0).toString())
    const args = [].slice.call(arguments, 0)
    const ret = f(args)

    const end = new Date().getTime()
    console.log(indent(--lev), '<', f.name, 'ret=', ret, 'time', end - start)
    return ret
  }
}

// experimentell end !!!

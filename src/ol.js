const bitset = {
  MAX: 32,
  fromArray: (xs) => xs.reduce((acc, x) => acc | (1 << x), 0),
  toArray: (bs) => {
    const res = []
    let i = 0
    while (bs) {
      if (bs & 1) res.push(i)
      i++
      bs >>= 1
    }
    return res
  },
  add: (bs, v) => bs | (1 << v),
  rm: (bs, v) => bs & ~(1 << v),
  set: (bs, n, v) => bs | ((v ? 1 : 0) << n),
  isEmpty: (bs) => bs === 0,
  size: (bs) => {
    let count = 0
    while (bs) bs & 1 ? count++ : 0, (bs >>= 1)
    return count
  },
  sum: (bs) => array(bitset.toArray(bs).sum()),
  union: (bs1, bs2) => bs1 | bs2,
  intersection: (bs1, bs2) => bs1 & bs2,
  diff: (bs1, bs2) => bs1 & ~bs2,
  xor: (bs1, bs2) => bs1 ^ bs2,
  isSubset: (bs1, bs2) => (bs1 & ~bs2) === 0,
  has: (bs, v) => !!(bs & (1 << v)),
  includes: (bs, v) => !!(bs & (1 << v)),
  contains: (bs, n) => !!(bs & (1 << n)),
  slice: (S, n) => {
    let res = 0
    let i = 0
    let cnt = 0
    while (i <= bitset.MAX && cnt < n) {
      if (S & (1 << i)) cnt++
      i++
    }
    for (let j = i; j < bitset.MAX; j++) {
      res |= S & (1 << j)
    }
    return res
  },
  at: (S, n) => {
    let i = (cnt = 0)
    while (i <= bitset.MAX && cnt <= n) {
      if (S & (1 << i)) cnt++
      i++
    }
    if (i === 0 || i > bitset.MAX) throw 'Wrong index ' + n
    return i - 1
  },
}

const ol = {
  id: (x) => x,
  abs: (x) => (x >= 0 ? x : -x),
  sqr: (x) => x ** 2,
  cube: (x) => x ** 3,
  fac: (x) => ol.range(x).reduce((acc, n) => acc * (n + 1), 1),
  fib: (x) => (x <= 2 ? 1 : ol.fib(x - 1) + ol.fib(x - 2)),
  gcd: (a, b) => (a % b === 0 ? b : gcd(b, a % b)),
  add: (a, b) => a + b,
  sum: (a, b) => a + b,
  inc: (x) => x + 1,
  dec: (x) => x - 1,

  randomInRange: (min, max) => Math.random() * (max - min) + min,
  randomIntInRange: (min, max) => Math.floor(ol.randomInRange(min, max + 1)),

  feedx: (x, f) => f(x),
  call: (f, ...args) => f(...args),

  // predicates
  eq: (x, y) => x === y,
  lt: (x, y) => x < y,
  gt: (x, y) => x > y,
  odd: (x) => x % 2 !== 0,
  even: (x) => x % 2 === 0,
  ininterval: (x, a, b) => a <= x && x <= b,
  leapyear: (x) => (x % 4 === 0 && x % 100 !== 0) || x % 400 === 0,

  // generate predicates
  // usage: [1,2,3,4,5].filter(gtPred(3)) // -> [4,5]
  gtPred: (x) => (y) => y > x,
  ltPred: (x) => (y) => y < x,

  // combine predicates
  // const { not, and, or, gtPred } = ol;
  // [1,2,3,4,5].filter(not(gtPred(3))) # -> [1,2,3]
  // [1,2,3,4,5].filter(and(gtPred(3),ltPred(5))) # -> [4]
  not: (f) => (x) => !f(x),
  and: (f, g) => (x) => f(x) && g(x),
  or: (f, g) => (x) => f(x) || g(x),
  xor: (f, g) => (x) => !!(f(x) ^ g(x)),
  comb: (f, g) => (x) => f(g(x)),
  every:
    (...fs) =>
    (x) =>
      fs.every((f) => f(x)),
  some:
    (...fs) =>
    (x) =>
      fs.some((f) => f(x)),

  // compare
  cmp: (x, y) => (x === y ? 0 : x < y ? -1 : +1),
  cmpNumbers: (x, y) => x - y,
  comparer: (proj) => (x, y) => cmp(proj(x), proj(y)),
  comparerByKey: (key) => comparer((o) => o[key]),

  //***************************************************** */
  // arrays
  //***************************************************** */

  // range(3)              // [0,1,2]
  // range(5).map(ol.inc)  // [1,2,3,4,5]
  // range(5).map(()=>0)   // [0,0,0,0,0]
  range: (n) => [...Array(n).keys()],

  rangeFilled: (n, val) => ol.range(n).map(() => val),
  randomArray: (n, min, max) => ol.range(n).map(() => ol.randomInRange(min, max)),
  randomIntArray: (n, min, max) => ol.range(n).map(() => ol.randomIntInRange(min, max)),
  sum: (xs) => xs.reduce((acc, x) => acc + x, 0),
  without: (xs, x) => xs.filter((y) => x !== y),
  withoutIndex: (xs, idx) => xs.filter((_, i) => i !== idx),
  sort: (xs, cmp) => (xs.sort(cmp), xs),

  // examples
  // zipped  = zip([1,2,3], [4,5,6])  // -> [[1,4],[2,5],[3,6]]
  // sums    = zip([1,2,3], [4,5,6], (a,b)=>a+b) // -> [5,7,9]
  // men   = [{name:'hugo', age:36 }, {name:'hans', age:37 }]
  // women = [{name:'anna', age:35 }, {name:'lena', age:27 }]
  // married = zip(men, women, (a,b) => ({ 'husband': a, 'wife': b }) )
  zip: (xs, ys, f) => xs.map((x, i) => (f ? f(xs[i], ys[i]) : [xs[i], ys[i]])),

  // uniq dont work on referenztypes
  // can we fix this easyly?
  uniq: (xs) => Array.from(new Set(xs)),

  clone: (o) => JSON.parse(JSON.stringify(o)),
  max: (xs, proj) =>
    proj ? xs.reduce((a, x) => (proj(x) > proj(a) ? x : a), xs[0]) : xs.reduce((a, x) => (x > a ? x : a), xs[0]),
  min: (xs, proj) =>
    proj ? xs.reduce((a, x) => (proj(x) < proj(a) ? x : a), xs[0]) : xs.reduce((a, x) => (x < a ? x : a), xs[0]),
  // persons     = [ {name:"Max", age: 59}, {name:"Hans", age: 19}, {name:"Johannes", age: 29}]
  // oldest      = max(persons,p=> p.age) # -> {name:"Max", age: 59}
  // youngest    = min(persons,p=> p.age) # -> {name:"Hans", age: 19}
  // longestName = max(persons,p => p.name.length) # -> {name:"Max", age: 59}
  add2obj: (o, k, v) => (o[k] ? o[k].push(v) : (o[k] = [v]), o),
  groupBy: (xs, proj, transform) => xs.reduce((a, v) => ol.add2obj(a, proj(v), transform ? transform(v) : v), {}),
}

const interval = (a, b) => ({
  range: () => [...Array(b - a + 1).keys()].map((x) => x + a),
  contains: (x) => a <= x && x <= b,
  intersects: (x, y) => !(y < a || x > b),

  // inc/dec x, but stay in interval
  inc: (x) => (x >= b ? b : x + 1),
  dec: (x) => (x <= a ? a : x - 1),

  random: () => ol.randomInRange(a, b),
  randomInt: () => ol.randomIntInRange(a, b),
})

// Wrappers
const num = (x) => ({
  abs: () => ol.abs(x),
  sqr: () => ol.sqr(x),
  cube: () => ol.cube(x),
  ininterval: (a, b) => ol.ininterval(x, a, b),
})

const array = (xs) => ({
  sum: () => ol.sum(xs),
  without: (x) => ol.without(xs, x),
  withoutIndex: (idx) => ol.withoutIndex(idx),
  initial: () => xs.slice(0, -1),
  head: () => [xs[0]],
  tail: () => xs.slice(1),
  rest: () => xs.slice(1),
  first: () => xs[0],
  last: () => xs[xs.length - 1],
  max: () => ol.max(xs),
  min: () => ol.min(xs),
  groupBy: (proj, transform) => ol.groupBy(xs, proj, transform),
  uniq: () => ol.uniq(xs),
  unite: (ys) => ol.uniq([...xs, ...ys]),
  xor: (ys) => [...xs, ...ys].filter((x) => !(xs.includes(x) && ys.includes(x))),
  intersect: (ys) => xs.filter((x) => ys.includes(x)),
  subtract: (ys) => xs.filter((x) => !ys.includes(x)),
  subsetOf: (ys) => ys.every((x) => xs.includes(x)),
  tap: (f) => (f(xs), xs),
  largerThan: (a) => xs.filter((x) => x > a),
  smallerThan: (a) => xs.filter((x) => x < a),
  shuffle: (a) => range(a.length).map,
})

shuffle = (a) => {
  let count = a.length
  while (count) {
    const randomnumber = (Math.random() * count--) | 0
    const temp = a[count]
    a[count] = a[randomnumber]
    a[randomnumber] = temp
  }
}

// ***********************************************************
// Some other stuff - mostly so caled bracket functions
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

// experimentell !!!

module.exports = {
  ol,
  num,
  interval,
  array,
  bitset,
}

// swap
swap = (x, y) => [y, x]
// let [x,y] = [11,12]
// [x,y] = swap (x,y)
flatten = (xs) => xs.reduce((acc, o) => acc.concat(Array.isArray(o) ? flatten(o) : o), [])

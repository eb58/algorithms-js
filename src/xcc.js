// Exact covering with colors (XCC), Knuth's Algorithm C (TAOCP 7.2.2.1), with dancing links.
//
// Primary items must be covered exactly once. Secondary items may be covered at most once,
// or by any number of options that all give it the same color: "cell:7" in two options
// is compatible, "cell:7" and "cell:8" are not. A secondary item without a color behaves
// like an ordinary at-most-once item.
//
// The links live in flat typed arrays, as in Knuth's description:
//   items 1..N   (primary first): LLINK/RLINK form the list of active primary items, header 0
//   nodes 1..N   are the item headers (TOP holds the length LEN), then option nodes follow,
//                separated by spacers (TOP <= 0, ULINK = first node of the previous option,
//                DLINK = last node of the next option).
//
// The link operations are module-level functions on module-level arrays rather than closures
// inside xcc(): fresh closures per call would make V8 throw away the optimized search on every
// call. As a consequence xcc() must not be called again from inside visit.
let TOP, ULINK, DLINK, COLOR, OPTION, LLINK, RLINK
let chosen, count, stop, visitSolution

const hide = (p) => {
  for (let q = p + 1; q !== p; ) {
    const x = TOP[q]
    if (x <= 0) q = ULINK[q]
    else {
      if (COLOR[q] >= 0) {
        const u = ULINK[q], d = DLINK[q]
        DLINK[u] = d
        ULINK[d] = u
        TOP[x]--
      }
      q++
    }
  }
}

const unhide = (p) => {
  for (let q = p - 1; q !== p; ) {
    const x = TOP[q]
    if (x <= 0) q = DLINK[q]
    else {
      if (COLOR[q] >= 0) {
        const u = ULINK[q], d = DLINK[q]
        DLINK[u] = q
        ULINK[d] = q
        TOP[x]++
      }
      q--
    }
  }
}

const cover = (i) => {
  for (let p = DLINK[i]; p !== i; p = DLINK[p]) hide(p)
  const l = LLINK[i], r = RLINK[i]
  RLINK[l] = r
  LLINK[r] = l
}

const uncover = (i) => {
  const l = LLINK[i], r = RLINK[i]
  RLINK[l] = i
  LLINK[r] = i
  for (let p = ULINK[i]; p !== i; p = ULINK[p]) unhide(p)
}

// Secondary item with a color: keep only the options that agree on this color.
const purify = (p) => {
  const c = COLOR[p], i = TOP[p]
  for (let q = DLINK[i]; q !== i; q = DLINK[q]) {
    if (COLOR[q] === c) COLOR[q] = -1
    else hide(q)
  }
}

const unpurify = (p) => {
  const c = COLOR[p], i = TOP[p]
  for (let q = ULINK[i]; q !== i; q = ULINK[q]) {
    if (COLOR[q] < 0) COLOR[q] = c
    else unhide(q)
  }
}

const commit = (p, j) => {
  if (COLOR[p] === 0) cover(j)
  else if (COLOR[p] > 0) purify(p)
}

const uncommit = (p, j) => {
  if (COLOR[p] === 0) uncover(j)
  else if (COLOR[p] > 0) unpurify(p)
}

const search = () => {
  if (RLINK[0] === 0) {
    count++
    if (visitSolution && visitSolution(chosen.map((node) => OPTION[node]))) stop = true
    return
  }
  // primary item with the fewest remaining options
  let i = RLINK[0]
  for (let j = RLINK[i]; j !== 0; j = RLINK[j]) if (TOP[j] < TOP[i]) i = j
  if (TOP[i] === 0) return
  cover(i)
  for (let x = DLINK[i]; x !== i && !stop; x = DLINK[x]) {
    for (let p = x + 1; p !== x; ) {
      const j = TOP[p]
      if (j <= 0) p = ULINK[p]
      else {
        commit(p, j)
        p++
      }
    }
    chosen.push(x)
    search()
    chosen.pop()
    for (let p = x - 1; p !== x; ) {
      const j = TOP[p]
      if (j <= 0) p = DLINK[p]
      else {
        uncommit(p, j)
        p--
      }
    }
  }
  uncover(i)
}

/**
 * @param {object} problem
 * @param {string[]} problem.primary primary item names
 * @param {string[]} [problem.secondary] secondary item names
 * @param {string[][]} problem.options each option lists item names, secondary ones optionally as "name:color"
 * @param {(optionIndices: number[]) => boolean | void} [problem.visit]
 *   called with the indices of the chosen options for every solution; return true to stop
 * @returns {number} number of solutions visited
 */
const xcc = ({ primary, secondary = [], options, visit }) => {
  const names = [...primary, ...secondary]
  const N = names.length
  const N1 = primary.length
  const itemIndex = new Map(names.map((name, i) => [name, i + 1]))
  const colorIndex = new Map()

  const nodeCount = N + 1 + options.reduce((total, option) => total + option.length + 1, 0) + 1
  TOP = new Int32Array(nodeCount)
  ULINK = new Int32Array(nodeCount)
  DLINK = new Int32Array(nodeCount)
  COLOR = new Int32Array(nodeCount)
  OPTION = new Int32Array(nodeCount) // option index of a node
  LLINK = new Int32Array(N + 2)
  RLINK = new Int32Array(N + 2)
  chosen = []
  count = 0
  stop = false
  visitSolution = visit

  // item list: primary items 1..N1 around header 0, secondary items N1+1..N around header N+1
  for (let i = 0; i <= N1; i++) {
    LLINK[i] = i === 0 ? N1 : i - 1
    RLINK[i] = i === N1 ? 0 : i + 1
  }
  for (let i = N1 + 1; i <= N + 1; i++) {
    LLINK[i] = i === N1 + 1 ? N + 1 : i - 1
    RLINK[i] = i === N + 1 ? N1 + 1 : i + 1
  }
  for (let i = 1; i <= N; i++) ULINK[i] = DLINK[i] = i

  // options
  let p = N + 1 // first spacer
  let spacer = p
  options.forEach((option, optionIndex) => {
    const first = p + 1
    for (const entry of option) {
      const [name, color] = entry.split(':')
      const item = itemIndex.get(name)
      if (item === undefined) throw new Error(`unknown item ${name}`)
      if (color !== undefined && item <= N1) throw new Error(`primary item ${name} cannot have a color`)
      p++
      TOP[p] = item
      OPTION[p] = optionIndex
      if (color !== undefined) {
        if (!colorIndex.has(color)) colorIndex.set(color, colorIndex.size + 1)
        COLOR[p] = colorIndex.get(color)
      }
      TOP[item]++ // LEN
      ULINK[p] = ULINK[item]
      DLINK[p] = item
      DLINK[ULINK[item]] = p
      ULINK[item] = p
    }
    DLINK[spacer] = p // last node of this option
    p++
    TOP[p] = -(optionIndex + 1)
    ULINK[p] = first // first node of this option
    spacer = p
  })
  DLINK[spacer] = 0

  search()
  return count
}

module.exports = { xcc }

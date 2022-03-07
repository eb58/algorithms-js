const merge = (l, r, cmp) => {
  const res = []
  while (true) {
    if (l.length === 0) return [...res, ...r]
    if (r.length === 0) return [...res, ...l]
    res.push((cmp(l[0], r[0]) < 0 ? l : r).shift())
  }
  return res
}

const mergesort = (arr, cmp) => {
  if (arr.length <= 1) return arr
  const l = arr.slice(0, arr.length / 2)
  const r = arr.slice(arr.length / 2)
  return merge(mergesort(l, cmp), mergesort(r, cmp), cmp)
}

module.exports = mergesort

const { groupBy, feedX } = require('../ol/ol').ol;

Array.prototype.rndElem = function () {
  return this[Math.floor(Math.random() * this.length)];
};

const qsort = (a) => (a.length <= 1 ? a : [...qsort(a.filter((n) => n < a[0])), ...a.filter((n) => n === a[0]), ...qsort(a.filter((n) => n > a[0]))]);

const qsort1 = (arr, cmp) => {
  if (arr.length <= 1) return arr;
  const piv = arr.rndElem();
  const eq = arr.filter((n) => cmp(n, piv) === 0);
  const lt = qsort1(
    arr.filter((n) => cmp(n, piv) < 0),
    cmp
  );
  const gt = qsort1(
    arr.filter((n) => cmp(n, piv) > 0),
    cmp
  );
  return [...lt, ...eq, ...gt];
};

const qsort2 = (arr, cmp) => {
  const partition = (arr, piv, cmp) => arr.reduce((res, n) => (res[cmp(n, piv) + 1].push(n), res), [[], [], []]);
  const p = partition(arr, arr.rndElem(), cmp);
  return arr.length <= 1 ? arr : [...qsort2(p[0], cmp), ...p[1], ...qsort2(p[2], cmp)];
};

const qsort3 = (a, cmp) =>
  feedX(a.rndElem(), (piv) =>
    feedX(
      groupBy(a, (n) => cmp(n, piv) + 1),
      (p) => (a.length <= 1 ? a : [...qsort3(p[0] || [], cmp), ...(p[1] || []), ...qsort3(p[2] || [], cmp)])
    )
  );

module.exports = [qsort1, qsort2, qsort3];

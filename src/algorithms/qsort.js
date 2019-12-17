const _ = require("underscore");

Array.prototype.rndElem = function () {
    return this[Math.floor(Math.random() * this.length)];
};


const qsort1 = (arr, cmp) => {
    if (arr.length <= 1)
        return arr;
    const piv = arr.rndElem();
    const eq = arr.filter(n => cmp(n, piv) === 0);
    const lt = qsort1(arr.filter(n => cmp(n, piv) < 0), cmp);
    const gt = qsort1(arr.filter(n => cmp(n, piv) > 0), cmp);
    return [...lt, ...eq, ...gt];
};

const qsort2 = (arr, cmp) =>
    arr.length <= 1
            ? arr
            : [
                ...qsort2(arr.filter(n => cmp(n, arr[0]) < 0), cmp),
                ...arr.filter(n => cmp(n, arr[0]) === 0),
                ...qsort2(arr.filter(n => cmp(n, arr[0]) > 0), cmp)
            ];


const qsort3 = (arr, cmp) => {
    const partition = (arr, piv, cmp) => arr.reduce((res, n) => (res[cmp(n, piv) + 1].push(n), res), [[], [], []]);
    const p = partition(arr, arr.rndElem(), cmp);
    return arr.length <= 1 ? arr : [...qsort3(p[0], cmp), ...p[1], ...qsort3(p[2], cmp)];
};

const qsort4 = (arr, cmp) => {
    const p = _.groupBy(arr, n => cmp(n, arr.rndElem()) + 1);
    return arr.length <= 1 ? arr : [...qsort4(p[0] || [], cmp), ...(p[1] || []), ...qsort4(p[2] || [], cmp)];
};

module.exports = [qsort1, qsort2, qsort3];
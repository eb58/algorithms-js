Array.prototype.without = function (n) {
  return this.filter((x, i) => i !== n);
};

permWithFilter = f => {
  const perm = x =>
    x.length < 2 
    ? [x] 
    : x.reduce((a, n, i) => [...a, ...perm(x.without(i)).map(y => [...y, x[i]]).filter(f)], []);
  return perm;
};

module.exports = permWithFilter;

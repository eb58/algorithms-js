const _ = require("underscore");

Array.prototype.without = function (n){
  return this.filter((x, i) => i !== n);
};

perm1 = x => {
  const res = [];
  const p = (head, tail) => tail.length ? tail.map((n, i) => p([n, ...head], tail.without(i))) : res.push(head);
  p([], x);
  return res;
};

perm2 = x => x.length < 2 ? [x] : x.reduce((a, n, i) => [...a, ...perm2(x.without(i)).map(y => [x[i], ...y])], []);
perm3 = x => x.length < 2 ? [x] : perm3(x.slice(1)).reduce((a, y) => x.reduce((b, u, i) => (b.push([...y.slice(0, i), x[0], ...y.slice(i)]), b), a), []);

module.exports = [perm1, perm2, perm3];

const fac = n => n <= 1 ? 1 : n * fac(n - 1);

module.exports = fac;
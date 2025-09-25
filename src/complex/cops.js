const feedx = (x, f) => f(x)
const adj = (c) => ({ re: c.re === -0 ? 0 : c.re, im: c.im === -0 ? 0 : c.im })
let cops = {
  neg: (c) => adj({ re: -c.re, im: -c.im }),
  add: (c1, c2) => adj({ re: c1.re + c2.re, im: c1.im + c2.im }),
  sub: (c1, c2) => adj({ re: c1.re - c2.re, im: c1.im - c2.im }),
  mul: (c1, c2) => adj({ re: c1.re * c2.re - c1.im * c2.im, im: c1.re * c2.im + c1.im * c2.re }),
  sqr: (c) => adj({ re: c.re ** 2 - c.im ** 2, im: 2 * c.re * c.im }),
  cub: (c) => adj({ re: c.re ** 3 - 3 * c.re * c.im ** 2, im: 3 * c.re ** 2 * c.im - c.im ** 3 }),
  div: (c1, c2) => feedx(c2.re ** 2 + c2.im ** 2, (x) => adj({ re: (c1.re * c2.re + c1.im * c2.im) / x, im: (c1.im * c2.re - c1.re * c2.im) / x })),
  len: (c) => Math.sqrt(c.re ** 2 + c.im ** 2),
  log: (c) => ({ re: Math.log(cops.len(c)), im: Math.atan2(c.im, c.re) }),
  exp: (c) => adj({ re: Math.exp(c.re) * Math.cos(c.im), im: Math.exp(c.re) * Math.sin(c.im) }),
  sin: (c) => adj({ re: Math.sin(c.re) * Math.cosh(c.im), im: Math.cos(c.re) * Math.sinh(c.im) }),
  cos: (c) => adj({ re: Math.cos(c.re) * Math.cosh(c.im), im: -Math.sin(c.re) * Math.sinh(c.im) }),
  pow: (c, exp) => cops.exp(cops.mul(exp, cops.log(c))),
  toString: (c) => {
    if (c.im === 0) return c.re.toString()
    const ii = c.im === 1 ? 'i' : `${c.im}i`
    return c.re === 0 ? ii : `${c.re}${c.im < 0 ? '' : '+'}${ii}`
  },
  equals: (c1, c2) => Math.abs(c1.re - c2.re) < 1e-14 && Math.abs(c1.im - c2.im) < 1e-14
}

if (typeof module !== 'undefined' && module.exports) module.exports = cops

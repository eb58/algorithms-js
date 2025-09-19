const feedx = (x, f) => f(x)
const adj = (c) => ({ re: c.re === -0 ? 0 : c.re, im: c.im === -0 ? 0 : c.im })
let cops = {
  neg: (c) => adj({ re: -c.re, im: -c.im }),
  add: (c1, c2) => adj({ re: c1.re + c2.re, im: c1.im + c2.im }),
  sub: (c1, c2) => adj({ re: c1.re - c2.re, im: c1.im - c2.im }),
  mul: (c1, c2) => adj({ re: c1.re * c2.re - c1.im * c2.im, im: c1.re * c2.im + c1.im * c2.re }),
  div: (c1, c2) => feedx(c2.re ** 2 + c2.im ** 2, (x) => adj({ re: (c1.re * c2.re + c1.im * c2.im) / x, im: (c1.im * c2.re - c1.re * c2.im) / x })),
  len: (c) => Math.sqrt(c.re ** 2 + c.im ** 2),
  log: (c) => ({ re: Math.log(cops.len(c)), im: Math.atan2(c.im, c.re) }),
  exp: (c) => feedx(Math.exp(c.re), (exp) => adj({ re: exp * Math.cos(c.im), im: exp * Math.sin(c.im) })),
  pow: (c, exp) => {
    if (exp === 0) return { re: 1, im: 0 }
    if (exp === 1) return c
    if (exp === 2) return cops.mul(c, c)
    if (exp === 3) return cops.mul(cops.mul(c, c), c)
    if (typeof exp === 'number') return cops.pow(c, { re: exp, im: 0 })
    if (typeof exp === 'object')
      return exp.im === 0 && (exp.re === 0 || exp.re === 1 || exp.re === 2 || exp.re === 3)
        ? cops.pow(c, exp.re)
        : cops.exp(cops.mul(exp, cops.log(c)))
    throw new Error('Exponent must be number or complex number')
  },
  toString: (c) => {
    if (c.im === 0) return c.re.toString()
    const ii = c.im === 1 ? 'i' : `${c.im}i`
    return c.re === 0 ? ii : `${c.re}${c.im < 0 ? '' : '+'}${ii}`
  }
}

class ComplexNumber {
  constructor(z) {
    this.re = z.re || 0
    this.im = z.im || 0
  }
  neg() {
    return new ComplexNumber(cops.neg(this))
  }
  add(z) {
    return new ComplexNumber(cops.add(this, z))
  }
  sub(z) {
    return new ComplexNumber(cops.sub(this, z))
  }
  mul(z) {
    return new ComplexNumber(cops.mul(this, z))
  }
  div(z) {
    return new ComplexNumber(cops.div(this, z))
  }
  pow(exp) {
    return new ComplexNumber(cops.pow(this, exp))
  }
  toString() {
    return cops.toString(this)
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { cops, ComplexNumber }

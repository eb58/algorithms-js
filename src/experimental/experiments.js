const decorateFunction =
  (f, decorator) =>
  (...args) => {
    if (decorator.before && decorator.before()) {
      const res = f(args)
      decorator.after && decorator.after()
      return res
    }
  }

const counter = (cnt = 0) => ({ before: () => cnt++, cnt: () => cnt })

let fib = (x) => (x <= 2 ? 1 : fib(x - 1) + fib(x - 2))

const c = counter()
fib = decorateFunction(fib, c)
fib(10)
console.log(c.cnt())

const d = counter()
fib = decorateFunction(fib, d)
fib(5)
console.log(d.cnt())

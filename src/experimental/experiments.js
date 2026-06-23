const decorateFunction =
  (f, decorator) =>
  (...args) => {
    if (decorator.before && decorator.before()) {
      const res = f(...args)
      decorator.after && decorator.after()
      return res
    }
  }

const counter = (cnt = 0) => ({ before: () => cnt++, cnt: () => cnt })

const fib = (x) => (x <= 2 ? 1 : fib(x - 1) + fib(x - 2))

const runDemo = () => {
  const c = counter()
  const decoratedFib = decorateFunction(fib, c)
  decoratedFib(10)

  const d = counter()
  const decoratedFib2 = decorateFunction(decoratedFib, d)
  decoratedFib2(5)
}

if (typeof module !== 'undefined' && module.exports) module.exports = { decorateFunction, counter, fib, runDemo }

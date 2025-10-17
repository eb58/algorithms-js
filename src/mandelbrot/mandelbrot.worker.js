const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const range = (n) => [...Array(n).keys()]
const rand255 = () => Math.floor(Math.random() * 255)

const NCOLORS = 100
const COLORS = range(NCOLORS).map(() => [rand255(), rand255(), rand255(), 255])

const cadd = (c1, c2) => ({ r: c1.r + c2.r, i: c1.i + c2.i })
const csqr = (c) => ({ r: c.r * c.r - c.i * c.i, i: 2 * c.r * c.i })

const mandelbrot = (c, MAX_ITERATIONS = 200) => {
  let [z, n] = [c, 0]
  while (++n < MAX_ITERATIONS && z.r * z.r + z.i * z.i <= 4) z = cadd(csqr(z), c) // f(z) = z^2 + c
  return n >= MAX_ITERATIONS ? [255, 255, 255, 255] : COLORS[n % NCOLORS]
}

const computeImage = (topLeft, bottomRight, width, height) => {
  const [dx, dy] = [(bottomRight.r - topLeft.r) / width, (bottomRight.i - topLeft.i) / height]
  return range(width).map((x) => range(height).map((y) => mandelbrot({ r: topLeft.r + x * dx, i: topLeft.i + y * dy })))
}

onmessage = (e) => {
  const t = timer()
  const { topLeft, bottomRight, width, height } = e.data
  const data = computeImage(topLeft, bottomRight, width, height)
  console.log('WORKER', topLeft, bottomRight, t.elapsedTime())
  postMessage(data)
}

const range = (n) => [...Array(n).keys()]
const timer = (start = performance.now()) => ({ elapsedTime: () => ((performance.now() - start) / 1000).toFixed(3) })
const WHITE = Uint8ClampedArray.from([255, 255, 255, 255])
const BLACK = Uint8ClampedArray.from([0, 0, 0, 255])

const getColorSimple = (n, maxIterations, COLORS) => (n >= maxIterations ? WHITE : COLORS[n % COLORS.length])
const getColor = (n, maxIterations) => {
  if (n >= maxIterations) return BLACK

  const ratio = n / maxIterations
  const hue = ratio * 360
  const saturation = 100
  const lightness = ratio < 0.5 ? 100 * ratio : 50

  const h = hue / 60
  const c = ((1 - Math.abs((2 * lightness) / 100 - 1)) * saturation) / 100
  const x = c * (1 - Math.abs((h % 2) - 1))
  const m = lightness / 100 - c / 2

  let r, g, b
  if (h < 1) {
    r = c
    g = x
    b = 0
  } else if (h < 2) {
    r = x
    g = c
    b = 0
  } else if (h < 3) {
    r = 0
    g = c
    b = x
  } else if (h < 4) {
    r = 0
    g = x
    b = c
  } else if (h < 5) {
    r = x
    g = 0
    b = c
  } else {
    r = c
    g = 0
    b = x
  }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255), 255]
}

let getCol = getColor

const mandelbrot = (cx, cy, maxIterations = 100) => {
  let [x, y, n] = [cx, cy, 0]
  if ((x + 0.25) * (x + 0.25) + y * y < 0.25) return maxIterations
  if ((x +1) * (x + 1) + y * y < 0.05) return maxIterations
  while (n++ < maxIterations && x * x + y * y <= 4) {
    const xTemp = x * x - y * y + cx
    y = 2 * x * y + cy
    x = xTemp
  }
  return n
}

onmessage = (msg) => {
  const t = timer()
  const data = msg.data
  const width = data.width
  const height = data.height
  const view = data.view
  const viewHeight = view.width * (height / width)

  getCol = view.colorScheme === 1 ? getColorSimple : getColor

  const chunkImageData = new Uint8ClampedArray((data.endRow - data.startRow) * width * 4)

  for (let r = data.startRow, rr = 0; r < data.endRow; r++, rr++) {
    const y = view.centerY + ((r - height / 2) * viewHeight) / height
    for (let c = 0; c < width; c++) {
      const x = view.centerX + ((c - width / 2) * view.width) / width
      const col = getCol(mandelbrot(x, y, view.maxIterations), view.maxIterations, data.COLORS)
      chunkImageData.set(col, (rr * width + c) * 4)
    }
  }
  console.log('WORKER', data.n, t.elapsedTime())
  postMessage({ ...data, chunkImageData })
}

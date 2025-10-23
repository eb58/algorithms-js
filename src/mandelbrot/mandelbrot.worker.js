const timer = (start = performance.now()) => ({ elapsedTime: () => (performance.now() - start) / 1000 })

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

onmessage = (e) => {
  const t = timer()
  const data = e.data
  const width = data.width
  const height = data.height
  const endRow = data.endRow
  const view = data.view
  const viewHeight = view.width * (height / width)

  const sm = new Int16Array((endRow - data.row) * width)

  for (let r = data.row, rr = 0; r < endRow; r++, rr++) {
    const y = view.centerY + ((r - height / 2) * viewHeight) / height
    for (let c = 0; c < width; c++) {
      const x = view.centerX + ((c - width / 2) * view.width) / width
      sm[rr * width + c] = mandelbrot(x, y, view.maxIterations)
    }
  }
  // console.log('WORKER', currentRow, t.elapsedTime().toFixed(3))
  postMessage({
    row: data.row,
    sm,
    elapsedTime: t.elapsedTime()
  })
}

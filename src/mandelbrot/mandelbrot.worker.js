const timer = (start = performance.now()) => ({ elapsedTime: () => (performance.now() - start) / 1000 })

const mandelbrot = (cx, cy, maxIterations = 100) => {
  let [x, y, n] = [cx, cy, 0]
  while (n++ < maxIterations && x * x + y * y <= 4) {
    const xTemp = x * x - y * y + cx
    y = 2 * x * y + cy
    x = xTemp
  }
  return n
}

onmessage = (e) => {
  const t = timer()
  const currentRow = e.data.currentRow
  const endRow = e.data.endRow
  const viewHeight = e.data.viewHeight
  const view = e.data.view
  const height = e.data.height
  const width = e.data.width
  const sm = new Int16Array(e.data.chunkSize * width)

  for (let r = currentRow, rr = 0; r < endRow; r++, rr++) {
    const x = view.centerX + ((r - width / 2) * view.width) / width
    for (let c = 0; c < width; c++) {
      const y = view.centerY + ((c - height / 2) * viewHeight) / height
      sm[rr * width + c] = mandelbrot(x, y, view.maxIterations)
    }
  }
  // console.log('WORKER', currentRow, t.elapsedTime().toFixed(3))
  postMessage({
    type: 'complete',
    chunk: currentRow,
    result: sm,
    elapsedTime: t.elapsedTime()
  })
}

const SIZE = [3, 4, 5]
const CELL_COUNT = SIZE.reduce((product, value) => product * value, 1)

// The coordinates are reconstructed from the relative definitions published
// with Ewald Rieger's original c't-puzzle solver (Forth Magazin 4/2004).
const PIECES = [
  [
    [0, 0, 0],
    [-1, 0, 0],
    [-1, 1, 0],
    [-1, 2, 0],
    [0, 2, 0]
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 2, 0],
    [2, 2, 0]
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 2, 0],
    [1, 3, 0]
  ],
  [
    [0, 0, 0],
    [0, 1, 0],
    [0, 2, 0],
    [0, 3, 0],
    [-1, 2, 0]
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 1, 1],
    [0, 0, 1]
  ],
  [
    [0, 0, 0],
    [0, 1, 0],
    [0, 2, 0],
    [1, 2, 0],
    [-1, 2, 0]
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 2, 0],
    [0, 1, 0]
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [2, 1, 0],
    [2, 2, 0]
  ],
  [
    [0, 0, 0],
    [0, 0, 1],
    [1, 0, 0],
    [1, -1, 0]
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [1, 2, 0],
    [2, 1, 0]
  ],
  [
    [0, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [-1, 1, 0],
    [0, 2, 0]
  ],
  [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 2, 0],
    [0, 3, 0],
    [1, 2, 0]
  ]
]

const key = (points) =>
  points
    .map((point) => point.join(','))
    .sort()
    .join(';')

const normalize = (points) => {
  const minima = [0, 1, 2].map((axis) => Math.min(...points.map((point) => point[axis])))
  return points.map((point) => point.map((value, axis) => value - minima[axis]))
}

const determinant = (matrix) =>
  matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
  matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
  matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])

const permutations = (values) =>
  values.length === 1
    ? [values]
    : values.flatMap((value) => permutations(values.filter((candidate) => candidate !== value)).map((rest) => [value, ...rest]))

const ROTATIONS = permutations([0, 1, 2]).flatMap((axes) =>
  [-1, 1].flatMap((sx) =>
    [-1, 1].flatMap((sy) =>
      [-1, 1]
        .map((sz) => {
          const signs = [sx, sy, sz]
          return signs.map((sign, row) => [0, 1, 2].map((axis) => (axes[row] === axis ? sign : 0)))
        })
        .filter((matrix) => determinant(matrix) === 1)
    )
  )
)

const rotate = (points, matrix) =>
  normalize(points.map((point) => matrix.map((row) => row.reduce((sum, value, axis) => sum + value * point[axis], 0))))

const orientations = (piece) => [
  ...new Map(
    ROTATIONS.map((matrix) => {
      const points = rotate(piece, matrix)
      return [key(points), points]
    })
  ).values()
]

const cellIndex = (x, y, z) => x + SIZE[0] * (y + SIZE[1] * z)
const cellCoordinates = (cell) => [cell % SIZE[0], Math.floor(cell / SIZE[0]) % SIZE[1], Math.floor(cell / (SIZE[0] * SIZE[1]))]
const placementKey = (cells) => [...cells].sort((a, b) => a - b).join(',')
const BOX_ROTATIONS = [
  ([x, y, z]) => [x, y, z],
  ([x, y, z]) => [SIZE[0] - 1 - x, SIZE[1] - 1 - y, z],
  ([x, y, z]) => [SIZE[0] - 1 - x, y, SIZE[2] - 1 - z],
  ([x, y, z]) => [x, SIZE[1] - 1 - y, SIZE[2] - 1 - z]
]
const rotatedPlacementKey = (cells, rotation) => placementKey(cells.map((cell) => cellIndex(...rotation(cellCoordinates(cell)))))

const isCanonicalT12Placement = ({ cells }) => {
  const variants = BOX_ROTATIONS.map((rotation) => rotatedPlacementKey(cells, rotation))
  return placementKey(cells) === [...variants].sort()[0]
}

const createPlacements = ({ canonicalT12 = true } = {}) => {
  const perPiece = PIECES.map((piece, pieceIndex) =>
    orientations(piece).flatMap((shape) => {
      const extent = [0, 1, 2].map((axis) => Math.max(...shape.map((point) => point[axis])) + 1)
      const placements = []
      for (const z of Array.from({ length: SIZE[2] - extent[2] + 1 }, (_, index) => index))
        for (const y of Array.from({ length: SIZE[1] - extent[1] + 1 }, (_, index) => index))
          for (const x of Array.from({ length: SIZE[0] - extent[0] + 1 }, (_, index) => index)) {
            const cells = shape.map((point) => cellIndex(x + point[0], y + point[1], z + point[2]))
            const placement = {
              cells,
              piece: pieceIndex
            }
            placements.push(placement)
          }
      return placements
    })
  )
  if (canonicalT12) perPiece[PIECES.length - 1] = perPiece[PIECES.length - 1].filter(isCanonicalT12Placement)
  const byCell = Array.from({ length: CELL_COUNT }, () => [])
  perPiece.flat().forEach((placement) => placement.cells.forEach((cell) => byCell[cell].push(placement)))
  return { byCell, perPiece }
}

const createStartPairs = () => {
  const { perPiece } = createPlacements({ canonicalT12: false })
  const crossPiece = 10
  const symmetryKey = (cells) =>
    [...cells]
      .sort((a, b) => a - b)
      .map((cell) => String(cell).padStart(2, '0'))
      .join('')
  const rotatedSymmetryKey = (cells, rotation) => symmetryKey(cells.map((cell) => cellIndex(...rotation(cellCoordinates(cell)))))
  return perPiece[crossPiece]
    .filter(({ cells }) => {
      const keys = BOX_ROTATIONS.map((rotation) => rotatedSymmetryKey(cells, rotation))
      return keys[0] === [...keys].sort()[0]
    })
    .flatMap((cross) => {
      const crossKey = symmetryKey(cross.cells)
      const stabilizers = BOX_ROTATIONS.filter((rotation) => rotatedSymmetryKey(cross.cells, rotation) === crossKey)
      const crossCells = new Set(cross.cells)
      return perPiece[11]
        .filter((t12) => t12.cells.every((cell) => !crossCells.has(cell)))
        .filter((t12) => {
          const keys = stabilizers.map((rotation) => rotatedSymmetryKey(t12.cells, rotation))
          return keys[0] === [...keys].sort()[0]
        })
        .map((t12) => ({ cross, t12 }))
    })
}

const createSolver = () => {
  const { perPiece } = createPlacements({ canonicalT12: false })
  const starts = createStartPairs()
  const columnCount = CELL_COUNT + PIECES.length
  const left = Array.from({ length: columnCount + 1 }, (_, index) => index - 1)
  const right = Array.from({ length: columnCount + 1 }, (_, index) => index + 1)
  const up = Array.from({ length: columnCount + 1 }, (_, index) => index)
  const down = [...up]
  const column = [...up]
  const size = Array(columnCount + 1).fill(0)
  const crossRows = new Map()
  const t12Rows = new Map()
  left[0] = columnCount
  right[columnCount] = 0

  perPiece.forEach((placements, piece) =>
    placements.forEach(({ cells }) => {
      const row = [...cells, CELL_COUNT + piece].map((columnIndex) => {
        const header = columnIndex + 1
        const node = column.length
        column.push(header)
        up[node] = up[header]
        down[node] = header
        down[up[header]] = node
        up[header] = node
        size[header]++
        return node
      })
      if (piece === 10) crossRows.set(placementKey(cells), row[0])
      if (piece === 11) t12Rows.set(placementKey(cells), row[0])
      row.forEach((node, index) => {
        left[node] = row[(index + row.length - 1) % row.length]
        right[node] = row[(index + 1) % row.length]
      })
    })
  )

  const L = Int32Array.from(left)
  const R = Int32Array.from(right)
  const U = Int32Array.from(up)
  const D = Int32Array.from(down)
  const C = Int32Array.from(column)
  const S = Int32Array.from(size)

  const cover = (header) => {
    R[L[header]] = R[header]
    L[R[header]] = L[header]
    for (let row = D[header]; row !== header; row = D[row])
      for (let node = R[row]; node !== row; node = R[node]) {
        D[U[node]] = D[node]
        U[D[node]] = U[node]
        S[C[node]]--
      }
  }

  const uncover = (header) => {
    for (let row = U[header]; row !== header; row = U[row])
      for (let node = L[row]; node !== row; node = L[node]) {
        S[C[node]]++
        D[U[node]] = node
        U[D[node]] = node
      }
    R[L[header]] = header
    L[R[header]] = header
  }

  const select = (row) => {
    cover(C[row])
    for (let node = R[row]; node !== row; node = R[node]) cover(C[node])
  }

  const unselect = (row) => {
    for (let node = L[row]; node !== row; node = L[node]) uncover(C[node])
    uncover(C[row])
  }

  const search = () => {
    if (R[0] === 0) return 1
    let chosen = R[0]
    for (let header = R[chosen]; header !== 0; header = R[header]) if (S[header] < S[chosen]) chosen = header
    if (!S[chosen]) return 0

    cover(chosen)
    let count = 0
    for (let row = D[chosen]; row !== chosen; row = D[row]) {
      for (let node = R[row]; node !== row; node = R[node]) cover(C[node])
      count += search()
      for (let node = L[row]; node !== row; node = L[node]) uncover(C[node])
    }
    uncover(chosen)
    return count
  }

  return (index) => {
    const start = starts[index]
    if (!start) throw new RangeError(`Unknown start placement: ${index}`)
    const cross = crossRows.get(placementKey(start.cross.cells))
    const t12 = t12Rows.get(placementKey(start.t12.cells))
    select(cross)
    select(t12)
    const count = search()
    unselect(t12)
    unselect(cross)
    return count
  }
}

const solve = (startIndices) => {
  const solveOne = createSolver()
  const indices = startIndices || createStartPairs().map((_, index) => index)
  return indices.reduce((count, index) => count + solveOne(index), 0)
}

const solveParallel = async (workerCount) => {
  const { Worker } = require('node:worker_threads')
  const startCount = createStartPairs().length
  // Workers claim one canonical cross/T12 pair at a time.
  const counter = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
  const run = () =>
    new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: { algorithm: 'dlx', counter, startCount } })
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.once('exit', (code) => code && reject(new Error(`Worker stopped with exit code ${code}`)))
    })
  return (await Promise.all(Array.from({ length: Math.min(workerCount, startCount) }, run))).reduce((sum, count) => sum + count, 0)
}

const main = async () => {
  const { availableParallelism } = require('node:os')
  const started = performance.now()
  const requested = Number(process.env.CT_PUZZLE_WORKERS)
  const workerCount = requested > 0 ? requested : availableParallelism()
  console.log(`Searching with ${workerCount} workers ...`)
  const solutions = await solveParallel(workerCount)
  console.log(`${solutions} solutions`)
  console.log(`${((performance.now() - started) / 1000).toFixed(3)} s`)
}

const { isMainThread, parentPort, workerData } = require('node:worker_threads')
if (!isMainThread && workerData?.algorithm === 'dlx') {
  const counter = new Int32Array(workerData.counter)
  const solveOne = createSolver()
  let count = 0
  for (;;) {
    const index = Atomics.add(counter, 0, 1)
    if (index >= workerData.startCount) break
    count += solveOne(index)
  }
  parentPort.postMessage(count)
} else if (require.main === module)
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })

module.exports = { CELL_COUNT, PIECES, ROTATIONS, createPlacements, createStartPairs, orientations, solve, solveParallel }

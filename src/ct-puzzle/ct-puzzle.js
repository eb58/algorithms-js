const SIZE = [3, 4, 5]
const CELL_COUNT = SIZE.reduce((product, value) => product * value, 1)
const WORD_BITS = 30
const FULL_WORD = (1 << WORD_BITS) - 1
const CELL_BITS = Array.from({ length: CELL_COUNT }, (_, cell) => (cell < WORD_BITS ? [1 << cell, 0] : [0, 1 << (cell - WORD_BITS)]))
const NEIGHBORS = Array.from({ length: CELL_COUNT }, (_, cell) => {
  const x = cell % SIZE[0]
  const y = Math.floor(cell / SIZE[0]) % SIZE[1]
  const z = Math.floor(cell / (SIZE[0] * SIZE[1]))
  return [
    x > 0 ? cell - 1 : -1,
    x < SIZE[0] - 1 ? cell + 1 : -1,
    y > 0 ? cell - SIZE[0] : -1,
    y < SIZE[1] - 1 ? cell + SIZE[0] : -1,
    z > 0 ? cell - SIZE[0] * SIZE[1] : -1,
    z < SIZE[2] - 1 ? cell + SIZE[0] * SIZE[1] : -1
  ].filter((neighbor) => neighbor >= 0)
})

const createRegionCheck = () => {
  const seen = new Uint32Array(CELL_COUNT)
  const queue = new Uint8Array(CELL_COUNT)
  let stamp = 0
  return (low, high, used) => {
    stamp++
    const fourAvailable = !(used & (1 << 8))
    const sixAvailable = !(used & (1 << 11))
    let fourRegions = 0
    let sixRegions = 0
    for (let cell = 0; cell < CELL_COUNT; cell++) {
      const [cellLow, cellHigh] = CELL_BITS[cell]
      if (seen[cell] === stamp || low & cellLow || high & cellHigh) continue
      let head = 0
      let tail = 1
      queue[0] = cell
      seen[cell] = stamp
      while (head < tail) {
        const neighbors = NEIGHBORS[queue[head++]]
        for (let index = 0; index < neighbors.length; index++) {
          const neighbor = neighbors[index]
          const [neighborLow, neighborHigh] = CELL_BITS[neighbor]
          if (seen[neighbor] === stamp || low & neighborLow || high & neighborHigh) continue
          seen[neighbor] = stamp
          queue[tail++] = neighbor
        }
      }
      // Every disconnected cavity needs whole pieces: ordinary pieces have 5 cubes,
      // while T9 has 4 and T12 has 6. At most one cavity can use each special piece.
      const remainder = tail % 5
      if (remainder === 4 && fourAvailable) fourRegions++
      else if (remainder === 1 && sixAvailable) sixRegions++
      else if (remainder !== 0) return false
      if (fourRegions > 1 || sixRegions > 1) return false
    }
    return true
  }
}

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
              piece: pieceIndex,
              pieceBit: 1 << pieceIndex
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

const createSolver = ({ holeCheck = false } = {}) => {
  const hasValidRegions = createRegionCheck()
  const { perPiece } = createPlacements({ canonicalT12: false })
  const starts = createStartPairs()
  const columnCount = CELL_COUNT + PIECES.length
  const left = Array.from({ length: columnCount + 1 }, (_, index) => index - 1)
  const right = Array.from({ length: columnCount + 1 }, (_, index) => index + 1)
  const up = Array.from({ length: columnCount + 1 }, (_, index) => index)
  const down = [...up]
  const column = [...up]
  const size = Array(columnCount + 1).fill(0)
  const rowLow = []
  const rowHigh = []
  const rowPiece = []
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
      const low = cells.reduce((mask, cell) => (cell < WORD_BITS ? mask | (1 << cell) : mask), 0)
      const high = cells.reduce((mask, cell) => (cell >= WORD_BITS ? mask | (1 << (cell - WORD_BITS)) : mask), 0)
      row.forEach((node) => {
        rowLow[node] = low
        rowHigh[node] = high
        rowPiece[node] = 1 << piece
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
  const LOW = Int32Array.from(rowLow)
  const HIGH = Int32Array.from(rowHigh)
  const PIECE = Int32Array.from(rowPiece)

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

  const searchWithRegions = (low, high, used, depth) => {
    if (R[0] === 0) return 1
    if (depth >= 7 && !hasValidRegions(low, high, used)) return 0
    let chosen = R[0]
    for (let header = R[chosen]; header !== 0; header = R[header]) if (S[header] < S[chosen]) chosen = header
    if (!S[chosen]) return 0

    cover(chosen)
    let count = 0
    for (let row = D[chosen]; row !== chosen; row = D[row]) {
      for (let node = R[row]; node !== row; node = R[node]) cover(C[node])
      count += searchWithRegions(low | LOW[row], high | HIGH[row], used | PIECE[row], depth + 1)
      for (let node = L[row]; node !== row; node = L[node]) uncover(C[node])
    }
    uncover(chosen)
    return count
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
    const count = holeCheck ? searchWithRegions(LOW[cross] | LOW[t12], HIGH[cross] | HIGH[t12], PIECE[cross] | PIECE[t12], 2) : search()
    unselect(t12)
    unselect(cross)
    return count
  }
}

const solve = (startIndices, options) => {
  const solveOne = createSolver(options)
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

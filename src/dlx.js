// Dancing links: Knuth's Algorithm X for exact cover, on flat typed arrays.
//
// Node 0 is the root, nodes 1..columnCount are the column headers, then the row nodes follow.
//   L, R  left/right links (header list, and the nodes of a row in a ring)
//   U, D  up/down links (the nodes of a column in a ring with its header)
//   C     column header of a node, ROW the row index of a node, S the size of a column
//
// The operations are methods rather than closures created per instance: V8 optimizes them
// once and keeps that code for every instance (fresh closures would be deoptimized again).
class Dlx {
  /**
   * @param {number} columnCount
   * @param {number[][]} rows sparse rows: the column indices (0-based) of the 1s in each row
   */
  constructor(columnCount, rows) {
    const nodeCount = columnCount + 1 + rows.reduce((total, row) => total + row.length, 0)
    const L = (this.L = new Int32Array(nodeCount))
    const R = (this.R = new Int32Array(nodeCount))
    const U = (this.U = new Int32Array(nodeCount))
    const D = (this.D = new Int32Array(nodeCount))
    const C = (this.C = new Int32Array(nodeCount))
    const ROW = (this.ROW = new Int32Array(nodeCount))
    const S = (this.S = new Int32Array(columnCount + 1))
    this.firstNode = new Int32Array(rows.length) // first node of every row, -1 for an empty row

    for (let c = 0; c <= columnCount; c++) {
      L[c] = c === 0 ? columnCount : c - 1
      R[c] = c === columnCount ? 0 : c + 1
      U[c] = D[c] = C[c] = c
    }
    let node = columnCount
    rows.forEach((columns, row) => {
      let first = -1
      for (const column of columns) {
        const header = column + 1
        node++
        C[node] = header
        ROW[node] = row
        U[node] = U[header]
        D[node] = header
        D[U[header]] = node
        U[header] = node
        S[header]++
        if (first < 0) {
          L[node] = R[node] = first = node
        } else {
          L[node] = L[first]
          R[node] = first
          R[L[first]] = node
          L[first] = node
        }
      }
      this.firstNode[row] = first
    })
  }

  cover(header) {
    const { L, R, U, D, C, S } = this
    R[L[header]] = R[header]
    L[R[header]] = L[header]
    for (let row = D[header]; row !== header; row = D[row])
      for (let node = R[row]; node !== row; node = R[node]) {
        D[U[node]] = D[node]
        U[D[node]] = U[node]
        S[C[node]]--
      }
  }

  uncover(header) {
    const { L, R, U, D, C, S } = this
    for (let row = U[header]; row !== header; row = U[row])
      for (let node = L[row]; node !== row; node = L[node]) {
        S[C[node]]++
        D[U[node]] = node
        U[D[node]] = node
      }
    R[L[header]] = header
    L[R[header]] = header
  }

  // Column with the fewest rows, 0 if all columns are covered, -1 if one of them has no row left.
  chooseColumn() {
    const { R, S } = this
    if (R[0] === 0) return 0
    let chosen = R[0]
    for (let header = R[chosen]; header !== 0; header = R[header]) if (S[header] < S[chosen]) chosen = header
    return S[chosen] ? chosen : -1
  }

  // Selects / deselects the rows given in advance; they must not overlap.
  select(rows) {
    for (const row of rows) {
      const first = this.firstNode[row]
      this.cover(this.C[first])
      for (let node = this.R[first]; node !== first; node = this.R[node]) this.cover(this.C[node])
    }
  }

  unselect(rows) {
    for (let index = rows.length - 1; index >= 0; index--) {
      const first = this.firstNode[rows[index]]
      for (let node = this.L[first]; node !== first; node = this.L[node]) this.uncover(this.C[node])
      this.uncover(this.C[first])
    }
  }

  countFrom() {
    const chosen = this.chooseColumn()
    if (chosen <= 0) return chosen === 0 ? 1 : 0
    const { L, R, D, C } = this
    this.cover(chosen)
    let count = 0
    for (let row = D[chosen]; row !== chosen; row = D[row]) {
      for (let node = R[row]; node !== row; node = R[node]) this.cover(C[node])
      count += this.countFrom()
      for (let node = L[row]; node !== row; node = L[node]) this.uncover(C[node])
    }
    this.uncover(chosen)
    return count
  }

  // Returns true once maxsolutions solutions are collected.
  solveFrom(partial, solutions, maxsolutions) {
    const chosen = this.chooseColumn()
    if (chosen === 0) {
      solutions.push([...partial])
      return solutions.length >= maxsolutions
    }
    if (chosen < 0) return false
    const { L, R, D, C, ROW } = this
    this.cover(chosen)
    let stop = false
    for (let row = D[chosen]; row !== chosen && !stop; row = D[row]) {
      partial.push(ROW[row])
      for (let node = R[row]; node !== row; node = R[node]) this.cover(C[node])
      stop = this.solveFrom(partial, solutions, maxsolutions)
      for (let node = L[row]; node !== row; node = L[node]) this.uncover(C[node])
      partial.pop()
    }
    this.uncover(chosen)
    return stop
  }

  /**
   * All solutions as lists of row indices (fixed rows first), at most maxsolutions of them.
   * Rows in fixedRows are selected in advance; the structure is restored afterwards.
   */
  solve({ maxsolutions = Infinity, fixedRows = [] } = {}) {
    const solutions = []
    this.select(fixedRows)
    this.solveFrom([...fixedRows], solutions, maxsolutions)
    this.unselect(fixedRows)
    return solutions
  }

  /** Number of solutions, without storing them. */
  count({ fixedRows = [] } = {}) {
    this.select(fixedRows)
    const count = this.countFrom()
    this.unselect(fixedRows)
    return count
  }
}

const createDlx = (columnCount, rows) => new Dlx(columnCount, rows)

// Dense 0/1 matrix version: returns all solutions (row index lists), at most maxsolutions of them.
const dlx_solve = (matrix, maxsolutions = Infinity) => {
  const columnCount = matrix.length > 0 ? matrix[0].length : 0
  const rows = matrix.map((values) => values.flatMap((value, column) => (value ? [column] : [])))
  return createDlx(columnCount, rows).solve({ maxsolutions })
}

if (typeof module !== 'undefined') {
  module.exports = dlx_solve
  module.exports.createDlx = createDlx
}

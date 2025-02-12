const range = (n) => [...Array(n).keys()]

const dlx_cover = (c) => {
  c.right.left = c.left
  c.left.right = c.right
  for (let i = c.down; i !== c; i = i.down)
    for (let j = i.right; j !== i; j = j.right) {
      j.down.up = j.up
      j.up.down = j.down
      j.column.size--
    }
}

const dlx_uncover = (c) => {
  for (let i = c.up; i !== c; i = i.up)
    for (let j = i.left; j !== i; j = j.left) {
      j.column.size++
      j.down.up = j
      j.up.down = j
    }
  c.right.left = c
  c.left.right = c
}

const colWithMinSize = (head) => {
  let minSize = 99999
  let c
  for (let j = head.right; j !== head; j = j.right) {
    if (j.size < minSize) {
      if (j.size === 0) return null
      if (j.size === 1) return j
      minSize = j.size
      c = j
    }
  }
  return c
}

const dlx_search = (head, solution, k, solutions, maxsolutions) => {
  if (head.right === head) {
    solutions.push([...solution])
    return solutions.length >= maxsolutions ? solutions : null
  }
  const c = colWithMinSize(head)
  if (!c) return
  dlx_cover(c)
  for (let r = c.down; r !== c; r = r.down) {
    solution[k] = r.row
    for (let j = r.right; j !== r; j = j.right) dlx_cover(j.column)
    const s = dlx_search(head, solution, k + 1, solutions, maxsolutions)
    if (s != null) return s
    for (let j = r.left; j !== r; j = j.left) dlx_uncover(j.column)
  }
  dlx_uncover(c)
}

const genSparseMatrix = (matrix) => {
  const RNGCOLS = range(matrix[0].length)
  const columns = RNGCOLS.map(() => ({ size: 0 }))
  columns.forEach((n, i) => (((n.up = n.down = n), (n.left = columns[i - 1])), (n.right = columns[i + 1])))

  for (let row = 0; row < matrix.length; row++) {
    let last = null
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        const node = {}
        node.row = row
        node.column = columns[col]
        node.up = columns[col].up
        node.down = columns[col]
        if (last) {
          node.left = last
          node.right = last.right
          last.right.left = node
          last.right = node
        } else {
          node.left = node
          node.right = node
        }
        columns[col].up.down = node
        columns[col].up = node
        columns[col].size++
        last = node
      }
    }
  }
  const head = {
    right: columns[0],
    left: columns[columns.length - 1]
  }
  columns[0].left = columns[columns.length - 1].right = head
  return head
}

const dlx_solve = (matrix, maxsolutions) => dlx_search(genSparseMatrix(matrix), [], 0, [], maxsolutions)

if (typeof module !== 'undefined') module.exports = dlx_solve

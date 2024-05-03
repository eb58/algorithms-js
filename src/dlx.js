const dlx_cover = (c) => {
    c.right.left = c.left;
    c.left.right = c.right;
    for (let i = c.down; i != c; i = i.down) for (let j = i.right; j != i; j = j.right) {
        j.down.up = j.up;
        j.up.down = j.down;
        j.column.size--;
    }
}

const dlx_uncover = (c) => {
    for (let i = c.up; i != c; i = i.up) for (let j = i.left; j != i; j = j.left) {
        j.column.size++;
        j.down.up = j;
        j.up.down = j;
    }
    c.right.left = c;
    c.left.right = c;
}

const dlx_search = (head, solution, k, solutions, maxsolutions) => {
    if (head.right == head) {
        solutions.push([...solution]);
        return solutions.length >= maxsolutions ? solutions : null;
    }
    let c = null;
    let s = 99999;
    for (let j = head.right; j != head; j = j.right) {
        if (j.size == 0) return null;
        if (j.size < s) {
            s = j.size;
            c = j;
        }
    }
    dlx_cover(c);
    for (let r = c.down; r != c; r = r.down) {
        solution[k] = r.row;
        for (let j = r.right; j != r; j = j.right) dlx_cover(j.column);
        const s = dlx_search(head, solution, k + 1, solutions, maxsolutions);
        if (s != null) return s;
        for (let j = r.left; j != r; j = j.left) dlx_uncover(j.column);
    }
    dlx_uncover(c);
}

const dlx_solve = (matrix, maxsolutions) => {
    const columns = new Array(matrix[0].length);
    for (let i = 0; i < columns.length; i++) columns[i] = {};
    for (let i = 0; i < columns.length; i++) {
        columns[i].index = i;
        columns[i].up = columns[i].down = columns[i];
        if (i - 1 >= 0) columns[i].left = columns[i - 1];
        if (i + 1 < columns.length) columns[i].right = columns[i + 1];
        columns[i].size = 0;
    }
    for (let i = 0; i < matrix.length; i++) {
        let last = null;
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j]) {
                const node = {};
                node.row = i;
                node.column = columns[j];
                node.up = columns[j].up;
                node.down = columns[j];
                if (last) {
                    node.left = last;
                    node.right = last.right;
                    last.right.left = node;
                    last.right = node;
                } else {
                    node.left = node;
                    node.right = node;
                }
                columns[j].up.down = node;
                columns[j].up = node;
                columns[j].size++;
                last = node;
            }
        }
    }
    const head = {
        right: columns[0],
        left: columns[columns.length - 1]
    };
    columns[0].left = head;
    columns[columns.length - 1].right = head;
    return dlx_search(head, [], 0, [], maxsolutions);
}

module.exports = dlx_solve

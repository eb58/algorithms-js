function sd_genmat() {
	const C = [], R = []
	for (let i = 0; i < 9; ++i)	for (let j = 0; j < 9; ++j) for (let k = 0; k < 9; ++k)
		C.push([9 * i + j, (Math.floor(i / 3) * 3 + Math.floor(j / 3)) * 9 + k + 81, 9 * i + k + 81 * 2, 9 * j + k + 81 * 3])
	for (let c = 0; c < 324; ++c) R[c] = []
	for (let r = 0; r < 729; ++r) for (let c = 0; c < 4; ++c) R[C[r][c]].push(r)
	// console.log( R, C)
	return { R, C };
}

function sd_update(R, C, sr, sc, r, val) {
	let min = 9999, min_c = 0;
	for (let c2 = 0; c2 < 4; ++c2) sc[C[r][c2]] += val << 7; // 7 ????? 
	for (let c2 = 0; c2 < 4; ++c2) for (let r2 = 0; r2 < 9; ++r2) {
		const rr = R[C[r][c2]][r2]
		if (val > 0) { // set cell 
			if (sr[rr]++) continue;
			for (let cc2 = 0; cc2 < 4; ++cc2) {
				const c = C[rr][cc2];
				if (--sc[c] < min) min = sc[c], min_c = c;
			}
		} else { // unset cell
			if (--sr[rr]) continue;
			for (let cc2 = 0; cc2 < 4; ++cc2) ++sc[C[rr][cc2]];
		}
	}
	return min << 16 | min_c; // return the col that has been modified and with the minimal available choices // 16 ????
}

function sd_solve(R, C, arr) {
	let min, hints = 0;
	let sr = [], sc = [], cr = [], cc = [], solution = [], solutions = [];
	for (let r = 0; r < 729; ++r) sr[r] = 0;
	for (let c = 0; c < 324; ++c) sc[c] = 9;
	for (let i = 0; i < 81; ++i) {
		let a = arr[i] - 1;
		if (a >= 0) sd_update(R, C, sr, sc, i * 9 + a, 1);
		if (a >= 0) ++hints;
		cr[i] = cc[i] = -1, solution[i] = arr[i];
	}
	for (let i = 0, dir = 1, cand = 10 << 16 | 0; ;) { // 16 ?????
		while (i >= 0 && i < 81 - hints) {
			if (dir == 1) {
				min = cand >> 16, cc[i] = cand & 0xffff
				if (min > 1) {
					for (let c = 0; c < 324; ++c) if (sc[c] < min) {
						min = sc[c], cc[i] = c;
						if (min <= 1) break;
					}
				}
				if (min == 0 || min == 10) cr[i--] = dir = -1;
			}
			const c = cc[i];
			if (dir == -1 && cr[i] >= 0) sd_update(R, C, sr, sc, R[c][cr[i]], -1);
			let r2;
			for (r2 = cr[i] + 1; r2 < 9; ++r2)
				if (sr[R[c][r2]] == 0) break;
			if (r2 < 9) {
				cand = sd_update(R, C, sr, sc, R[c][r2], 1);
				cr[i++] = r2; dir = 1;
			} else cr[i--] = dir = -1;
		}
		if (i < 0) break;
		for (let j = 0; j < i; ++j) {
			const r = R[cc[j]][cr[j]];
			solution[Math.floor(r / 9)] = r % 9 + 1;
		}
		solutions.push(solution)
		--i; dir = -1;
	}
	return solutions[0];
}

const { C, R } = sd_genmat()
const solveKudoku = (arr) => sd_solve(R, C, arr)

// const conv2Arr = s => s.split('').map(x => x === '.' ? 0 : Number(x));
// console.log(solveKudoku(conv2Arr('...7..62.4...9..5...9..8.7..9..8.74.....6.....25.7..3..4.6..2...6..5...4.13..9...')))

module.exports = solveKudoku 

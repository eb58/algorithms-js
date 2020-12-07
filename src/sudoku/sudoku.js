const { bitset } = require("../ol");
const { ol } = require("../ol");
const { array } = require("../ol");

const feedX = (x, f) => f(x);
const range = (n) => [...Array(n).keys()];
const row = (x) => x % 9;
const col = (x) => Math.floor(x / 9);
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3);
const generateEmptyArrays = () => range(9).map(() => []); // [ [], [], [], [], [], [], [], [], [] ]
const RANGE81 = range(9 * 9);
const RANGE9 = range(9);
const RANGE1_9 = RANGE9.map(x => x + 1);
const COORDR = RANGE81.map(n => row(n));
const COORDC = RANGE81.map(n => col(n));
const COORDB = RANGE81.map(n => block(n));
const CELLSINROW = RANGE81.reduce((acc, n) => (acc[COORDR[n]].push(n), acc), generateEmptyArrays());
const CELLSINCOL = RANGE81.reduce((acc, n) => (acc[COORDC[n]].push(n), acc), generateEmptyArrays());
const CELLSINBLK = RANGE81.reduce((acc, n) => (acc[COORDB[n]].push(n), acc), generateEmptyArrays());

const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y);
const connectionSet = (x) => RANGE81.reduce((acc, y) => inSameConnectionSet(x, y) ? [...acc, y] : acc, []);
const isCandidate = (fld, idx, val) => !CONNECTIONSETS[idx].some(y => fld[y] === val)
const candidates = (fld, idx) => RANGE1_9.filter(val => isCandidate(fld, idx, val));
const set = (fld, idx, val) => { const cpy = [...fld]; cpy[idx] = val; return cpy; }
const CONNECTIONSETS = RANGE81.map(connectionSet);

const solve1 = (fld) => {
    const solv = (fld) => feedX(
        fld.findIndex(x => x === 0),
        (idx) => idx < 0 ? (res = [...fld]) : candidates(fld, idx).forEach(val => {
            fld[idx] = val;
            solv(fld);
            fld[idx] = 0;
        })
    )
    let res;
    solv(fld);
    return res;
}

const solve2 = (fld) => {

    const findIndexOfBestCandidates = (candsForAll) => {
        return candsForAll.reduce((bestIdx, c, idx) => {
            return (c && (bestIdx === -1 || c.length < candsForAll[bestIdx].length)) ? idx : bestIdx
        }, -1)
    }

    const findBestCandidates = (candsForAll) => {
        const idx = findIndexOfBestCandidates(candsForAll);
        return idx < 0 ? null : { idx, values: candsForAll[idx] }
    }

    const solv = (fld) => {
        if (fld.findIndex(x => x === 0) < 0) {
            res = [...fld]
        }
        else {
            const candsForAll = RANGE81.map(idx => fld[idx] === 0 ? candidates(fld, idx) : null)
            const bestCands = findBestCandidates(candsForAll);
            bestCands && bestCands.values.forEach(val => {
                solv(set(fld, bestCands.idx, val));
            })
        }
    }
    let res;
    //const cands = range81.map(idx => fld[idx] === 0 ? candidates(fld, idx) : []).map(c => bitset.fromArray(c))
    solv(fld);
    return res;
}
const solve3 = (() => {

    const setVal = (model, idx, val) => {
        model.usedInRow[COORDR[idx]] |= 1 << val;
        model.usedInCol[COORDC[idx]] |= 1 << val;
        model.usedInBlk[COORDB[idx]] |= 1 << val;
        model.cnt += val === 0 ? 0 : 1;
        model.fld[idx] = val;
    }

    const unsetVal = (model, idx) => {
        const val = model.fld[idx];
        model.usedInRow[COORDR[idx]] &= ~(1 << val);
        model.usedInCol[COORDC[idx]] &= ~(1 << val);
        model.usedInBlk[COORDB[idx]] &= ~(1 << val);
        model.cnt--;
        model.fld[idx] = 0;
    }

    const countBits = bs => {
        let cnt = 0;
        for (let v = 1; v <= 9; v++) bs & (1 << v) ? cnt++ : 0;
        return cnt;
    }

    const getCandidates = (model, idx) => {
        const candidatesAsBitset = ~(model.usedInRow[COORDR[idx]] | model.usedInCol[COORDC[idx]] | model.usedInBlk[COORDB[idx]]);
        return { cnt: countBits(candidatesAsBitset), vals: candidatesAsBitset };
    }

    const getBestCandidates = (model) => {
        let bestCandidates = null;
        model.cand = [];
        model.fld.forEach((x, idx) => {
            if (x === 0) {
                const cand = getCandidates(model, idx);
                if (!bestCandidates || cand.cnt < bestCandidates.cand.cnt) {
                    bestCandidates = { idx, cand };
                }
                model.cand[idx] = cand;
            }
        });
        return bestCandidates;
    }

    const findHN = (m, CELLS) => {
        for (let v = 1; v <= 9; v++) {
            const mask = 1 << v;
            for (let n = 0; n < 9; n++) { // all blocks ( or  cols or rows )
                const cells = CELLS[n];
                let cnt = 0, idx = -1;
                for (let i = 0; i < cells.length; i++) { // all fields of fieldset
                    const x = m.cand[cells[i]];
                    if (x && (x.vals & mask)) {
                        if (++cnt > 1)
                            break;
                        idx = cells[i];
                    }
                }
                if (cnt === 1) {
                    //console.log(">>> Naked Single: ", v, " Cell:", fld, flds);
                    //dump(m);
                    return { idx, cand: { cnt: 1, vals: mask } };
                }
            }
        }
        return null;
    }

    const findHiddenNaked = (m) => findHN(m, CELLSINBLK) || findHN(m, CELLSINROW) || findHN(m, CELLSINCOL);

    const solve = (fld) => {

        const model = {
            cnt: 0,
            fld,
            cand: [],
            usedInRow: [], usedInCol: [], usedInBlk: []
        };

        fld.forEach((val, idx) => setVal(model, idx, val));

        let res = null;
        const fill = m => {

            if (m.cnt === 81) {
                return res = [...m.fld];
            }

            let c = getBestCandidates(m);
            if (!c)
                return;
            if (c.cand.cnt > 1) {
                c = findHiddenNaked(m) || c;
                // if( c.cand.cnt > 1 ) findPairs(m);
            }
            for (let i = 1; i <= 9; i++) {
                if (c.cand.vals & (1 << i)) {
                    setVal(m, c.idx, i);
                    fill(m);
                    if (!res)
                        unsetVal(m, c.idx);
                }
            }
        };
        fill(model);
        return res;
    }
    return solve
})();

module.exports = { solve1, solve2, solve3 };
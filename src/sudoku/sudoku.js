const { bitset } = require("../ol");
const { ol } = require("../ol");
const { array } = require("../ol");

const feedX = (x, f) => f(x);
const range = (n) => [...Array(n).keys()];
const row = (x) => x % 9;
const col = (x) => Math.floor(x / 9);
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3);
const range81 = range(9 * 9);
const range9 = range(9);
const range1_9 = range9.map(x => x + 1);
const inSameConnectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y);
const connectionSet = (x) => range81.reduce((acc, y) => inSameConnectionSet(x, y) ? [...acc, y] : acc, []);
const isCandidate = (fld, idx, val) => !connectionSets[idx].some(y => fld[y] === val)
const candidates = (fld, idx) => range1_9.filter(val => isCandidate(fld, idx, val));
const set = (fld, idx, val) => { const cpy = [...fld]; cpy[idx] = val; return cpy; }
const connectionSets = range81.map(connectionSet);

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

    const findIndexOfBestCandidates = (cands) =>
        cands.reduce((bestIdx, c, idx) => (c && (bestIdx === -1 || c.length < cands[bestIdx].length)) ? idx : bestIdx, -1)

    const solv = (fld) => {
        const idx = fld.findIndex(x => x === 0);

        if (idx < 0) {
            res = [...fld]
        }
        else {
            const cands = range81.map(idx => fld[idx] === 0 ? candidates(fld, idx) : null)
            const bestIdx = findIndexOfBestCandidates(cands);
            bestIdx >= 0 && cands[bestIdx].forEach(val => {
                fld[bestIdx] = val;
                solv(fld);
                fld[bestIdx] = 0;
            })
        }
    }
    let res;
    //const cands = range81.map(idx => fld[idx] === 0 ? candidates(fld, idx) : []).map(c => bitset.fromArray(c))
    solv(fld);
    return res;
}
const solve3 = (() => {
    const ALL = range(81);
    const COORD = ALL.map(n => ({ r: row(n), c: col(n), b: block(n) }));
    const generateEmptyArrays = () => range(9).map(() => []); // [ [], [], [], [], [], [], [], [], [] ]
    const FLDSINROW = ALL.reduce((acc, n) => (acc[COORD[n].r].push(n), acc), generateEmptyArrays());
    const FLDSINCOL = ALL.reduce((acc, n) => (acc[COORD[n].c].push(n), acc), generateEmptyArrays());
    const FLDSINBLK = ALL.reduce((acc, n) => (acc[COORD[n].c].push(n), acc), generateEmptyArrays());

    const setUsedFlags = (model, idx, val, flag) => {
        const o = COORD[idx];
        if (flag) {
            model.usedInRow[o.r] |= 1 << val;
            model.usedInCol[o.c] |= 1 << val;
            model.usedInBlk[o.b] |= 1 << val;
        } else {
            model.usedInRow[o.r] &= ~(1 << val);
            model.usedInCol[o.c] &= ~(1 << val);
            model.usedInBlk[o.b] &= ~(1 << val);
        }
    }

    const setVal = (model, idx, val) => {
        setUsedFlags(model, idx, val, true);
        model.cnt++;
        model.fld[idx] = val;
    }

    const unsetVal = (model, idx) => {
        setUsedFlags(model, idx, model.fld[idx], false);
        model.cnt--;
        model.fld[idx] = 0;
    }

    const countBits = bs => {
        let cnt = 0;
        for (let v = 1; v <= 9; v++) bs & (1 << v) ? cnt++ : 0;
        return cnt;
    }

    const getCandidates = (model, idx) => {  // Candidates for m[idx]
        const o = COORD[idx];
        const candidatesAsBitset = ~(model.usedInRow[o.r] | model.usedInCol[o.c] | model.usedInBlk[o.b]);
        return { cnt: countBits(candidatesAsBitset), vals: candidatesAsBitset };
    }

    const getBestCandidates = (model) => { // returns entry with shortest list of candidates  
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

    const findHN = (m, FLDS) => {
        for (let v = 1; v <= 9; v++) { // all possible values of fld = 1,2,3,...,9
            const mask = 1 << v;
            for (let n = 0; n < 9; n++) { // all blocks ( or  cols or rows )
                const flds = FLDS[n];
                let cnt = 0, idx = -1;
                for (let i = 0; i < flds.length; i++) { // all fields of fieldset
                    const x = m.cand[flds[i]];
                    if (x && (x.vals & mask)) {
                        if (++cnt > 1)
                            break;
                        idx = flds[i];
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

    const findHiddenNaked = (m) => findHN(m, FLDSINBLK) || findHN(m, FLDSINROW) || findHN(m, FLDSINCOL);

    const solve = (fld) => {

        const model = {
            cnt: fld.reduce((acc, x) => acc + (x !== 0), 0),
            fld,
            cand: [],
            usedInRow: [],
            usedInCol: [],
            usedInBlk: []
        };

        fld.forEach((val, idx) => setUsedFlags(model, idx, val, true));

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
const { bitset } = require("../ol");
const { ol } = require("../ol");
const { array } = require("../ol");

const feedX = (x, f) => f(x);
const range = (n) => [...Array(n).keys()];
const row = (x) => x % 9;
const col = (x) => Math.floor(x / 9);
const block = (x) => Math.floor(col(x) / 3) * 3 + Math.floor(row(x) / 3);
const inSameCommectionSet = (x, y) => row(x) === row(y) || col(x) === col(y) || block(x) === block(y);
const connectionSet = (x) => range(9 * 9).reduce((acc, y) => inSameCommectionSet(x, y) ? [...acc, y] : acc, []);
const connectionSets = range(9 * 9).map(connectionSet);
const candidates = (fld, n) => range(9).map(x => x + 1).filter(x => !connectionSets[n].some(y => fld[y] === x));
const set = (fld, idx, c) => { const cpy = [...fld]; cpy[idx] = c; return cpy; }

const solve1 = (fld) => {
    let res;
    const solv = (fld) => feedX(
        fld.findIndex(x => x === 0),
        (idx) => idx < 0 ? (res = fld) : candidates(fld, idx).forEach(c => solv(set(fld, idx, c)))
    )
    solv(fld);
    return res;
}

const solve2 = (fld) => {
    let res;
    const solv = (fld) => {
        const idx = fld.findIndex(x => x === 0);
        if (idx < 0) {
            res = fld
        } else {
            const allCandidates = fld.map((x, i) => x === 0 ? candidates(fld, i) : []);
            // const bestIdx = indexOfBestCandidate(allCandidates);
            candidates(fld, idx).forEach(x => solv(set(fld, idx, x)))
        }
    }
    solv(fld);
    return res;
}


const solvx = (fld) => {
    const idx = fld.findIndex(x => x === 0);
    if (idx < 0) {
        res = fld
        // console.log("XXXX", fld.join(''));
    }
    else {
        const allCandidates = fld.map((x, i) => x === 0 ? candidates(fld, i) : []);
        const candidatesDirect = allCandidates.filter(c => c.length === 1);
        if (candidatesDirect.length > 1000) {
            candidatesDirect.forEach(c => fld = set(fld, idx, c));
            solvx(fld)
        }
        else {
            allCandidates.forEach(c => solvx(set(fld, idx, c)))
        }
    }
}

const indexOfBestCandidate = (allCandidates) => {
    const xxx = allCandidates.map((cand, idx) => ({ length: cand.length, idx }));
    const yyy = array(xxx).groupBy(c => c.length);
    const zzz = Object.keys(yyy).filter(x => x > 0).flatMap(x => yyy[x].map(y => y.idx));
    return zzz[0];
}

const solve3 = (fld) => {
    const connectionSet = (x) => range(9 * 9).reduce((acc, y) => inSameCommectionSet(x, y) ? [...acc, y] : acc,);
    const connectionSets = range(9 * 9).map(connectionSet);
    const candidates = (fld, n) => range(9).map(ol.inc).filter(x => !connectionSets[n].some(y => fld[y] === x));
    const set = (fld, idx, c) => { const cpy = [...fld]; cpy[idx] = c; return cpy; }

    let res;
    const field = fld.map((x, i) => bitset.fromArray(x === 0 ? candidates(fld, i) : [x]));
    const solv = (field) => {
        const idx = field.findIndex(x => bitset.size(x) > 1);
        if (idx < 0) {
            res = bitset.toArray(field)
        } else {
            candidates(fld, idx).forEach(x => solv(set(fld, idx, x)))
        }
    }
    solv(field);
    return res;
}


const solve4 = (() => {
    const ALL = range(81);
    const COORD = ALL.map(n => {
        const r = Math.floor(n / 9);
        const c = n % 9;
        return { r, c, b: Math.floor(r / 3) * 3 + Math.floor(c / 3) };
    });
    const FLDSINBLK = [[], [], [], [], [], [], [], [], []];
    const FLDSINROW = [[], [], [], [], [], [], [], [], []];
    const FLDSINCOL = [[], [], [], [], [], [], [], [], []];
    ALL.forEach(i => {
        const c = COORD[i];
        FLDSINROW[c.r].push(i);
        FLDSINCOL[c.c].push(i);
        FLDSINBLK[c.b].push(i);
    })

    const setUsedFlags = (model, idx, val, flag) => {
        const o = COORD[idx];
        if (flag) {
            model.usedRow[o.r] |= 1 << val;
            model.usedCol[o.c] |= 1 << val;
            model.usedBlk[o.b] |= 1 << val;
        } else {
            model.usedRow[o.r] &= ~(1 << val);
            model.usedCol[o.c] &= ~(1 << val);
            model.usedBlk[o.b] &= ~(1 << val);
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

    const getCandidates = (model, idx) => {  // Candidates for m[n]
        const o = COORD[idx];
        const unsetbits = ~(model.usedRow[o.r] | model.usedCol[o.c] | model.usedBlk[o.b]);
        const res = { cnt: 0, vals: unsetbits };
        for (let v = 1; v <= 9; v++) {
            if (unsetbits & (1 << v)) {
                res.cnt++;
            }
        }
        return res;
    }

    const getBestCandidates = (model) => { // returns entry with shortest list of candidates  
        let bestCandidates = null;
        model.cand = [];
        model.fld.forEach((x, r) => {
            if (x === 0) {
                const c = getCandidates(model, r);
                if (!bestCandidates || c.cnt < bestCandidates.cand.cnt) {
                    bestCandidates = { n: r, cand: c };
                }
                model.cand[r] = c;
            }
        });
        return bestCandidates;
    }

    const findHN = (m, FLDS) => {
        for (let v = 1; v <= 9; v++) { // all possible values of fld = 1,2,3,...,9
            const mask = 1 << v;
            for (let n = 0; n < 9; n++) { // all blocks ( or  cols or rows )
                const flds = FLDS[n];
                let cnt = 0, fld = -1;
                for (let i = 0; i < flds.length; i++) { // all fields of fieldset
                    const x = m.cand[flds[i]];
                    if (x && (x.vals & mask)) {
                        if (++cnt > 1)
                            break;
                        fld = flds[i];
                    }
                }
                if (cnt === 1) {
                    //console.log(">>> Naked Single: ", v, " Cell:", fld, flds);
                    //dump(m);
                    return { n: fld, cand: { cnt: 1, vals: mask } };
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
            usedRow: [],
            usedCol: [],
            usedBlk: []
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
                    setVal(m, c.n, i);
                    fill(m);
                    if (!res)
                        unsetVal(m, c.n);
                }
            }
        };
        fill(model);
        return res;
    }
    return solve
})();

module.exports = { solve1, solve2, solve3, solve4 };
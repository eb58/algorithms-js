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

    function setUsedFlags(m, n, v, flag) {
        const o = COORD[n];
        if (flag) {
            m.usedRow[o.r] |= 1 << v;
            m.usedCol[o.c] |= 1 << v;
            m.usedBlk[o.b] |= 1 << v;
        } else {
            m.usedRow[o.r] &= ~(1 << v);
            m.usedCol[o.c] &= ~(1 << v);
            m.usedBlk[o.b] &= ~(1 << v);
        }
    }

    function setVal(m, n, v) {
        if (v !== 0)
            m.cnt++;
        m.fld[n] = v;
        setUsedFlags(m, n, v, true);
    }

    function unsetVal(m, n) {
        m.cnt--;
        setUsedFlags(m, n, m.fld[n], false);
        m.fld[n] = 0;
    }

    function getCandidates(m, n) {  // Candidates for m[n]
        const o = COORD[n];
        const unsetbits = ~(m.usedRow[o.r] | m.usedCol[o.c] | m.usedBlk[o.b]);
        const res = { cnt: 0, vals: unsetbits };
        for (let v = 1; v <= 9; v++) {
            if (unsetbits & (1 << v)) {
                res.cnt++;
            }
        }
        return res;
    }

    function getBestCandidates(m) { // returns entry with shortest list of candidates  
        let bestCandidates = null;
        m.cand = [];
        for (let r = 0; r < m.fld.length; r++) if (m.fld[r] === 0) {
            const c = getCandidates(m, r);
            if (!bestCandidates || c.cnt < bestCandidates.cand.cnt) {
                bestCandidates = { n: r, cand: c };
            }
            m.cand[r] = c;
        }
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
            cnt: 0,
            fld: [],
            cand: [],
            usedRow: [],
            usedCol: [],
            usedBlk: []
        };

        fld.forEach((v, n) => setVal(model, n, v));

        let res = null;
        const fill = m => {
            if (m.cnt === 81)
                return res = [...m.fld];
            let c = getBestCandidates(m);
            if (!c)
                return;
            if (c.cand.cnt > 1) {
                const hn = findHiddenNaked(m);
                c = hn ? hn : c;
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
    return {
        solve,
    };
})().solve;


module.exports = { solve1, solve2, solve3, solve4 };

// const conv2Arr = s => s.split('').map(x => x === '.' ? 0 : Number(x));
// const mysolve = xs => solve(conv2Arr(xs)).join('')
// mysolve('.914.7..8.74.3.....8..2.9...2..4...6...2..5..8..5....1.37.1..5241...93..6.8......');



// Voxel-Mesher und Quad-Helfer.
(() => {
  "use strict";
  const KP = (window.KP ??= {});

  // ------------------------------------------------------------------
  //  Geometrie
  //  Eigenes Koordinatensystem pro Teil: x = Breite, y = Tiefe (nach hinten),
  //  z = Höhe. Einheit 1 u. Umrechnung nach three.js: (x, z, -y).
  // ------------------------------------------------------------------
  // Spiegelung links/rechts (1 = wie auf den Fotos)
  const MIRROR = 1;
  const toT = p => [MIRROR*p[0], p[2], -p[1]];

  function makeBuf() { return { pos: [], nor: [] }; }

  function pushQuad(buf, quad, normals) {
    let Q = quad.map(toT);
    let N = normals.map(toT);
    const ax = Q[1][0]-Q[0][0], ay = Q[1][1]-Q[0][1], az = Q[1][2]-Q[0][2];
    const bx = Q[2][0]-Q[0][0], by = Q[2][1]-Q[0][1], bz = Q[2][2]-Q[0][2];
    const cx = ay*bz - az*by, cy = az*bx - ax*bz, cz = ax*by - ay*bx;
    const n = [0,0,0];
    N.forEach(v => { n[0]+=v[0]; n[1]+=v[1]; n[2]+=v[2]; });
    if (cx*n[0] + cy*n[1] + cz*n[2] < 0) { Q = Q.slice().reverse(); N = N.slice().reverse(); }
    for (const t of [0,1,2, 0,2,3]) {
      buf.pos.push(Q[t][0], Q[t][1], Q[t][2]);
      buf.nor.push(N[t][0], N[t][1], N[t][2]);
    }
  }

  // Voxel-Mesher: gibt nur sichtbare Außenflächen aus (saubere Kanten).
  function voxels({ res, n, origin = [0,0,0], label, virt }) {
    const out = {};
    const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    const inside = (i,j,k) => i>=0 && j>=0 && k>=0 && i<n[0] && j<n[1] && k<n[2];
    const at = (i,j,k) => {
      const x = origin[0] + (i+0.5)*res, y = origin[1] + (j+0.5)*res, z = origin[2] + (k+0.5)*res;
      return { x, y, z };
    };
    const lab = (i,j,k) => { if (!inside(i,j,k)) return 0; const c = at(i,j,k); return label(c.x, c.y, c.z); };
    const isVirt = (i,j,k) => { if (!virt) return false; const c = at(i,j,k); return virt(c.x, c.y, c.z); };
    for (let i=0;i<n[0];i++) for (let j=0;j<n[1];j++) for (let k=0;k<n[2];k++) {
      const L = lab(i,j,k); if (!L) continue;
      for (const d of dirs) {
        const a=i+d[0], b=j+d[1], c=k+d[2];
        if (lab(a,b,c) || isVirt(a,b,c)) continue;
        const x0 = origin[0]+i*res, y0 = origin[1]+j*res, z0 = origin[2]+k*res, r = res;
        let q;
        if (d[0]) { const x = x0 + (d[0]>0 ? r : 0); q = [[x,y0,z0],[x,y0+r,z0],[x,y0+r,z0+r],[x,y0,z0+r]]; }
        else if (d[1]) { const y = y0 + (d[1]>0 ? r : 0); q = [[x0,y,z0],[x0+r,y,z0],[x0+r,y,z0+r],[x0,y,z0+r]]; }
        else { const z = z0 + (d[2]>0 ? r : 0); q = [[x0,y0,z],[x0+r,y0,z],[x0+r,y0+r,z],[x0,y0+r,z]]; }
        (out[L] ||= makeBuf());
        pushQuad(out[L], q, [d,d,d,d]);
      }
    }
    return out;
  }

  Object.assign(KP, { MIRROR, toT, makeBuf, pushQuad, voxels });
})();

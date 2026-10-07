// Die vier Puzzleteile: Geometrie-Bauer und Stammdaten.
(() => {
  "use strict";
  const KP = (window.KP ??= {});
  const { pushQuad, voxels } = KP;

  // ---- Kasten: außen 5 x 6 x 4, oben/unten offen, vorne Fenster 3 x 2, hinten zu
  function buildKasten() {
    const label = (x,y,z) => {
      const inOuter = x<5 && y<6 && z<4;
      if (!inOuter) return 0;
      const inCavity = x>1 && x<4 && y>1 && y<5;
      if (inCavity) {
        if (x>1 && x<2 && y>1 && y<2 && z>1 && z<2) return 2;   // Nase unten links hinter dem Fenster
        return 0;
      }
      if (y<1 && x>1 && x<4 && z>1 && z<3) return 0;            // Fenster vorne
      return 1;
    };
    return voxels({ res: 1, n: [5,6,4], label });
  }

  // ---- Klammern: Höhenraster [Reihe von vorne][Spalte], 2 = voll, 1 = halb
  function buildKlammer(H) {
    const label = (x,y,z) => {
      const e = Math.floor(x), r = Math.floor(y);
      const h = (H[r] && H[r][e]) || 0;
      return z < h ? 1 : 0;
    };
    return voxels({ res: 1, n: [4,3,2], label });
  }
  const K1 = [[2,0,1,2],[2,0,1,2],[2,2,1,2]];
  const K2 = [[2,0,0,2],[2,0,0,2],[2,2,1,2]];

  // ---- Haken: Rundöse (R 1,5 / r 0,5) + Schaft mit Stufen
  function buildHaken() {
    const res = 0.25;
    const label = (x,y,z) => {
      const outerRow = y<1 || y>2;
      if (x<2.25) return (outerRow && z<2) ? 1 : 0;           // Arme der Öse
      if (x<4.25) return (y<1 && z<1) ? 1 : 0;                 // halbhoher Schaft
      if (x<5.25) return (y<1 && z<2) ? 1 : 0;                 // volle Stufe
      if (x<6.25) return (y<2 && z<1) ? 1 : 0;                 // flacher Endblock (2 Reihen)
      return 0;
    };
    const virt = (x,y,z) => x<0 && (y<1 || y>2) && z>0 && z<2;
    const out = voxels({ res, n: [25,12,8], label, virt });
    const buf = out[1];
    // Halbrund: 90°..270°, Zentrum (0, 1.5)
    const SEG = 48, rs = [0.5,0.75,1,1.25,1.5], zs = [0,0.25,0.5,0.75,1,1.25,1.5,1.75,2];
    const P = (r,t,z) => [r*Math.cos(t), 1.5 + r*Math.sin(t), z];
    for (let j=0;j<SEG;j++) {
      const ta = Math.PI/2 + Math.PI*j/SEG, tb = Math.PI/2 + Math.PI*(j+1)/SEG;
      for (let i=0;i<rs.length-1;i++) {
        const ra = rs[i], rb = rs[i+1];
        pushQuad(buf, [P(ra,ta,2),P(rb,ta,2),P(rb,tb,2),P(ra,tb,2)], [[0,0,1],[0,0,1],[0,0,1],[0,0,1]]);
        pushQuad(buf, [P(ra,ta,0),P(rb,ta,0),P(rb,tb,0),P(ra,tb,0)], [[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1]]);
      }
      const na = [Math.cos(ta), Math.sin(ta), 0], nb = [Math.cos(tb), Math.sin(tb), 0];
      const ia = [-na[0],-na[1],0], ib = [-nb[0],-nb[1],0];
      for (let k=0;k<zs.length-1;k++) {
        const z0 = zs[k], z1 = zs[k+1];
        pushQuad(buf, [P(1.5,ta,z0),P(1.5,tb,z0),P(1.5,tb,z1),P(1.5,ta,z1)], [na,nb,nb,na]);
        pushQuad(buf, [P(0.5,ta,z0),P(0.5,tb,z0),P(0.5,tb,z1),P(0.5,ta,z1)], [ia,ib,ib,ia]);
      }
    }
    return out;
  }

  const PARTS = [
    {
      id: "kasten", name: "Kasten", color: "--c-kasten", size: [5,6,4],
      text: "Rahmen, oben und unten offen, vorne ein Fenster über die ganze Innenbreite, hinten zu. Innen sitzt unten am Fenster, in der Ecke, eine kleine würfelförmige Nase. „Kasten durchsichtig“ zeigt sie.",
      rows: [["Öffnung oben/unten","3 × 4 u"],["Fenster vorne","3 × 2 u"],["Wandstärke","1 u"],["Nase innen","1 × 1 × 1 u"],["Lage der Nase","unten links am Fenster"]],
      build: buildKasten, layout: [-7.5,-0.5]
    },
    {
      id: "k1", name: "Klammer 1", color: "--c-k1", size: [4,3,2],
      text: "Zwei volle Schenkel, oben verbunden. Der Streifen zwischen Brücke und rechtem Schenkel ist halbhoch und läuft über die ganze Länge.",
      rows: [["Schenkel","1 × 3 × 2 u"],["Halbhoher Streifen","1 × 3 × 1 u"]],
      build: () => buildKlammer(K1), layout: [-0.5, 2.2]
    },
    {
      id: "k2", name: "Klammer 2", color: "--c-k2", size: [4,3,2],
      text: "Wie Klammer 1, aber der halbhohe Teil sitzt nur in der Brücke. Darunter ist die Lücke offen.",
      rows: [["Schenkel","1 × 3 × 2 u"],["Halbhohe Brücke","1 × 1 × 1 u"]],
      build: () => buildKlammer(K2), layout: [5.3, 2.2]
    },
    {
      id: "haken", name: "Haken", color: "--c-haken", size: [7.75,3,2],
      text: "Runde Öse mit Schlitz, danach ein halbhoher Schaft, eine volle Stufe und am Ende ein flacher Block über zwei Reihen.",
      rows: [["Öse","Ø 3 u, Schlitz 1 u"],["Schaft","2 × 1 × 1 u"],["Stufe","1 × 1 × 2 u"],["Endblock","1 × 2 × 1 u"]],
      build: buildHaken, layout: [0.5, -4.2]
    }
  ];

  Object.assign(KP, { PARTS });
})();

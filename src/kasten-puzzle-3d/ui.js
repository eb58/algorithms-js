// Seitenleiste: Teileliste, Infotext, Drehen und Schalter.
(() => {
  "use strict";
  const KP = (window.KP ??= {});
  const { state, reduceMotion, PARTS, gridMinor, gridMajor, floor, frame } = KP;

  const list = document.getElementById("partList");
  const entries = [{ id: "all", name: "Alle Teile", all: true }, ...PARTS];
  entries.forEach(p => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "part-btn";
    b.dataset.id = p.id;
    const sw = document.createElement("span");
    sw.className = "swatch" + (p.all ? " all" : "");
    if (!p.all) sw.style.background = `var(${p.color})`;
    const nm = document.createElement("span"); nm.textContent = p.name;
    const sz = document.createElement("span"); sz.className = "part-size";
    sz.textContent = p.all ? "4 Teile" : p.size.map(fmt).join(" × ") + " u";
    b.append(sw, nm, sz);
    b.addEventListener("click", () => select(p.id));
    list.append(b);
  });

  function fmt(v) { return String(v).replace(".", ","); }
  const mm = v => fmt(Math.round(v * 100) / 10);

  const info = document.getElementById("info");
  function renderInfo() {
    info.textContent = "";
    const h = document.createElement("h2");
    const p = document.createElement("p");
    const dl = document.createElement("dl"); dl.className = "dims";
    const row = (a, b) => {
      const dt = document.createElement("dt"); dt.textContent = a;
      const dd = document.createElement("dd"); dd.textContent = b;
      dl.append(dt, dd);
    };
    if (state.selected === "all") {
      h.textContent = "Alle Teile";
      p.textContent = "Kasten, zwei Klammern und der Haken, so hingelegt wie auf deinem Foto. Klick auf ein Teil, um es einzeln anzusehen und zu drehen.";
      PARTS.forEach(q => row(q.name, `${q.size.map(mm).join(" × ")} mm`));
    } else {
      const q = PARTS.find(x => x.id === state.selected);
      h.textContent = q.name;
      p.textContent = q.text;
      row("Außenmaß", `${q.size.map(fmt).join(" × ")} u`);
      row("", `${q.size.map(mm).join(" × ")} mm`);
      q.rows.forEach(r => row(r[0], r[1]));
    }
    info.append(h, p, dl);
  }

  const badge = document.getElementById("badge");
  const rotBtns = ["rotX","rotY","rotZ","rotReset"].map(id => document.getElementById(id));
  const rotHint = document.getElementById("rotHint");

  function select(id) {
    state.selected = id;
    list.querySelectorAll(".part-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    PARTS.forEach(p => {
      const show = id === "all" || p.id === id;
      p.outer.visible = show;
      if (id === "all") { p.outer.position.copy(p.layoutPos); }
      else if (show) { p.outer.position.set(0, 0, 0); }
      p.outer.quaternion.copy(id === "all" ? new THREE.Quaternion() : p.userQuat);
      p.targetQuat = null;
    });
    const single = id !== "all";
    rotBtns.forEach(b => b.disabled = !single);
    rotHint.hidden = single;
    badge.textContent = single ? PARTS.find(p => p.id === id).name : "Alle Teile";
    renderInfo();
    frame(true);
  }

  // Teil drehen
  const AX = { rotX: new THREE.Vector3(1,0,0), rotY: new THREE.Vector3(0,1,0), rotZ: new THREE.Vector3(0,0,1) };
  function rotatePart(axisId) {
    const p = PARTS.find(q => q.id === state.selected); if (!p) return;
    if (axisId === "rotReset") p.userQuat.identity();
    else p.userQuat.premultiply(new THREE.Quaternion().setFromAxisAngle(AX[axisId], Math.PI/2));
    p.userQuat.normalize();
    if (reduceMotion) { p.outer.quaternion.copy(p.userQuat); p.targetQuat = null; }
    else p.targetQuat = p.userQuat.clone();
  }
  rotBtns.forEach(b => b.addEventListener("click", () => rotatePart(b.id)));

  // Schalter
  const tX = document.getElementById("tXray"), tE = document.getElementById("tEdges"),
        tG = document.getElementById("tGrid"), tS = document.getElementById("tSpin");
  function applyToggles() {
    state.xray = tX.checked; state.edges = tE.checked; state.grid = tG.checked; state.spin = tS.checked && !reduceMotion;
    const kasten = PARTS[0];
    kasten.materials.forEach(m => {
      if (!m.userData.isShell) return;
      m.transparent = state.xray;
      m.opacity = state.xray ? 0.26 : 1;
      m.depthWrite = !state.xray;
      m.needsUpdate = true;
    });
    kasten.inner.children.forEach(c => { if (c.isMesh && c.material.userData.isShell) c.castShadow = !state.xray; });
    PARTS.forEach(p => { p.edges.visible = state.edges; if (p.asmEdges) p.asmEdges.visible = state.edges; });
    if (KP.holders?.kasten) KP.holders.kasten.children.forEach(c => { if (c.isMesh && c.material.userData.isShell) c.castShadow = !state.xray; });
    gridMinor.visible = gridMajor.visible = floor.visible = state.grid;
  }
  [tX,tE,tG,tS].forEach(t => t.addEventListener("change", applyToggles));
  if (reduceMotion) { tS.disabled = true; }

  // Zusammenbau braucht den durchsichtigen Kasten
  const ensureXray = () => { if (!tX.checked) { tX.checked = true; applyToggles(); } };

  Object.assign(KP, { select, renderInfo, badge, applyToggles, ensureXray });
})();

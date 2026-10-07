// Zusammenbau: Posen, Zugfolge, Schrittliste und Player.
(() => {
  "use strict";
  const KP = (window.KP ??= {});
  const { app, reduceMotion, MIRROR, scene, PARTS, edgeMat, cssVar, linColor, frame, ease } = KP;

  const Cm = new THREE.Matrix4().set(MIRROR,0,0,0, 0,0,1,0, 0,-1,0,0, 0,0,0,1);
  const Ci = Cm.clone().invert();
  const vT = a => new THREE.Vector3(MIRROR*a[0], a[2], -a[1]);
  const MK = [[0,1,0],[0,0,-1],[-1,0,0]];
  const ASM = {
    k2:    { M: MK, W: [1,3,4], m: [0,-1,-1], a: [0,0,0], stage: [7, 3.5, 0] },
    k1:    { M: MK, W: [1,5,4], m: [0,-1,-1], a: [0,0,0], stage: [12, 3.5, 0] },
    haken: { M: [[0,1,0],[1,0,0],[0,0,-1]], W: [1,1,3], m: [0,0,-1], a: [2.25,0,0], stage: [8.5, -1, 0] }
  };
  const mulM = (M, v) => [0,1,2].map(r => M[r][0]*v[0] + M[r][1]*v[1] + M[r][2]*v[2]);
  function finalPose(id, o = [0,0,0]) {
    const A = ASM[id], Ma = mulM(A.M, A.a);
    const pos = [0,1,2].map(i => A.W[i] + o[i] - Ma[i]);   // Zelle [c,c+1] -> M·[c,c+1] + W
    const M = A.M;
    const R = new THREE.Matrix4().set(M[0][0],M[0][1],M[0][2],0, M[1][0],M[1][1],M[1][2],0, M[2][0],M[2][1],M[2][2],0, 0,0,0,1);
    const Q = new THREE.Matrix4().multiplyMatrices(Cm, R).multiply(Ci);
    return { q: new THREE.Quaternion().setFromRotationMatrix(Q), p: vT(pos) };
  }
  function stagePose(id, lift = 0) {
    const s = ASM[id].stage;
    return { q: new THREE.Quaternion(), p: vT([s[0], s[1], s[2] + lift]) };
  }

  const asmRoot = new THREE.Group();
  const pivot = vT([2.5, 3, 2]);
  asmRoot.position.copy(pivot);
  asmRoot.visible = false;
  scene.add(asmRoot);
  const asmInner = new THREE.Group();
  asmInner.position.copy(pivot).negate();
  asmRoot.add(asmInner);
  const holders = {};
  PARTS.forEach(p => {
    const h = new THREE.Group();
    p.specs.forEach(sp => { const m = new THREE.Mesh(sp.geo, sp.mat); m.castShadow = true; m.receiveShadow = true; h.add(m); });
    p.asmEdges = new THREE.LineSegments(p.edgeGeo, edgeMat);
    h.add(p.asmEdges);
    // Nase immer sichtbar: rot durchscheinend über allen Teilen
    p.specs.filter(sp => sp.mat.userData.token === "--c-einsatz").forEach(sp => {
      const col = linColor(cssVar("--c-einsatz"));
      const ghost = new THREE.Mesh(sp.geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.45, depthTest: false, depthWrite: false }));
      ghost.renderOrder = 998;
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(sp.geo, 25), new THREE.LineBasicMaterial({ color: col, depthTest: false, transparent: true, opacity: 0.95 }));
      line.renderOrder = 999;
      h.add(ghost, line);
    });
    asmInner.add(h);
    holders[p.id] = h;
  });

  // Zugfolge aus der Suche (Rückwärts-Zerlegung, umgedreht). Mehrere Teile
  // in einem Zug bewegen sich gemeinsam. Versatz in Rasterfeldern.
  const MOVES = [{"grp":["k2"],"dir":[0,0,-1],"n":3,"from":{"k2":[0,2,4]},"to":{"k2":[0,2,1]},"new":["k2"],"below":[]},{"grp":["haken"],"dir":[0,1,0],"n":4,"from":{"haken":[1,-5,0]},"to":{"haken":[1,-1,0]},"new":["haken"],"below":[]},{"grp":["haken"],"dir":[-1,0,0],"n":1,"from":{"haken":[1,-1,0]},"to":{"haken":[0,-1,0]},"new":[],"below":[]},{"grp":["k2"],"dir":[0,0,-1],"n":1,"from":{"k2":[0,2,1]},"to":{"k2":[0,2,0]},"new":[],"below":[]},{"grp":["k2"],"dir":[0,-1,0],"n":2,"from":{"k2":[0,2,0]},"to":{"k2":[0,0,0]},"new":[],"below":[]},{"grp":["haken"],"dir":[1,0,0],"n":1,"from":{"haken":[0,-1,0]},"to":{"haken":[1,-1,0]},"new":[],"below":[]},{"grp":["haken","k1","k2"],"dir":[0,0,-1],"n":1,"from":{"haken":[1,-1,0],"k1":[0,0,4],"k2":[0,0,0]},"to":{"haken":[1,-1,-1],"k1":[0,0,3],"k2":[0,0,-1]},"new":["k1"],"below":["k2"]},{"grp":["haken","k2"],"dir":[0,-1,0],"n":1,"from":{"haken":[1,-1,-1],"k2":[0,0,-1]},"to":{"haken":[1,-2,-1],"k2":[0,-1,-1]},"new":[],"below":["k2"]},{"grp":["k1"],"dir":[0,0,-1],"n":3,"from":{"k1":[0,0,3]},"to":{"k1":[0,0,0]},"new":[],"below":[]},{"grp":["haken","k2"],"dir":[0,1,0],"n":1,"from":{"haken":[1,-2,-1],"k2":[0,-1,-1]},"to":{"haken":[1,-1,-1],"k2":[0,0,-1]},"new":[],"below":["k2"]},{"grp":["haken","k1","k2"],"dir":[0,0,1],"n":1,"from":{"haken":[1,-1,-1],"k1":[0,0,0],"k2":[0,0,-1]},"to":{"haken":[1,-1,0],"k1":[0,0,1],"k2":[0,0,0]},"new":[],"below":[]},{"grp":["haken"],"dir":[-1,0,0],"n":1,"from":{"haken":[1,-1,0]},"to":{"haken":[0,-1,0]},"new":[],"below":[]},{"grp":["k1"],"dir":[0,0,-1],"n":1,"from":{"k1":[0,0,1]},"to":{"k1":[0,0,0]},"new":[],"below":[]},{"grp":["haken"],"dir":[0,1,0],"n":1,"from":{"haken":[0,-1,0]},"to":{"haken":[0,0,0]},"new":[],"below":[]}];
  const NAME = { k1: "Klammer 1", k2: "Klammer 2", haken: "Haken" };
  const DIRW = { "1,0,0": "nach rechts", "-1,0,0": "nach links", "0,1,0": "nach hinten", "0,-1,0": "nach vorne", "0,0,1": "nach oben", "0,0,-1": "nach unten" };
  const fields = n => n === 1 ? "1 Feld" : `${n} Felder`;
  function joinNames(ids) {
    if (ids.length === 3) return "alle drei Teile";
    const n = ids.map(id => id === "haken" ? "den Haken" : NAME[id]);
    return n.length === 1 ? n[0] : n.slice(0, -1).join(", ") + " und " + n[n.length - 1];
  }
  function titleNames(ids) {
    if (ids.length === 3) return "Alle drei";
    return ids.map(id => NAME[id]).join(" + ");
  }
  const MOVERS = ["k1", "k2", "haken"];
  const standQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI/2);
  const flatQ = new THREE.Quaternion();
  const add = (a, b, k = 1) => [a[0] + k*b[0], a[1] + k*b[1], a[2] + k*b[2]];

  // Schritte bauen: jede Phase = Liste paralleler Bewegungen {id, a, b}
  const STEPS = [{
    title: "Ausgangslage",
    text: "Kasten mit dem Fenster nach vorne hinstellen. Die rote Nase sitzt innen unten links, direkt hinter dem Fenster. Sie bleibt in allen Schritten rot durchscheinend sichtbar.",
    phases: [], end: {}
  }];
  (function buildSteps() {
    const last = {};
    MOVERS.forEach(id => last[id] = stagePose(id, 0));
    MOVES.forEach((mv, idx) => {
      const phases = [];
      const dirKey = mv.dir.join(",");
      let text = "";
      let title = "";
      mv.new.forEach(id => {
        const entry = mv.from[id];
        const lift = id === "haken" ? 3 : 8;
        const up = stagePose(id, lift);
        const appr = finalPose(id, add(entry, mv.dir, -4));
        const at = finalPose(id, entry);
        phases.push([{ id, a: last[id], b: up }]);
        phases.push([{ id, a: up, b: appr }]);
        phases.push([{ id, a: appr, b: at }]);
        last[id] = at;
        if (id === "haken") {
          text += "Haken mit der flachen Seite nach oben halten, der Schaft liegt links. Ganz rechts ins Fenster ansetzen. ";
        } else {
          text += `${NAME[id]} hochkant halten, die Seite mit den Stufen zeigt zum Fenster. Von oben an der Rückwand ansetzen. `;
        }
      });
      const par = mv.grp.map(id => {
        const b = finalPose(id, mv.to[id]);
        const tr = { id, a: last[id], b };
        last[id] = b;
        return tr;
      });
      phases.push(par);
      const who = joinNames(mv.grp);
      const verb = mv.new.includes("haken") && mv.grp.length === 1 ? "einschieben" : "schieben";
      if (mv.new.length && mv.grp.length > mv.new.length) {
        text += `Dann ${who} zusammen ${fields(mv.n)} ${DIRW[dirKey]} schieben.`;
      } else {
        const subj = mv.new.length ? (mv.new[0] === "haken" ? "Den Haken" : "Die Klammer") : (mv.grp.length > 1 ? who.charAt(0).toUpperCase() + who.slice(1) + " zusammen" : (mv.grp[0] === "haken" ? "Den Haken" : NAME[mv.grp[0]]));
        text += `${subj} ${fields(mv.n)} ${DIRW[dirKey]} ${verb}.`;
      }
      if (mv.below.length) text += ` ${mv.below.map(id => NAME[id]).join(" und ")} schaut dabei unten aus dem Kasten heraus, also den Kasten hochhalten.`;
      if (idx === MOVES.length - 1) text += " Jetzt ist alles verriegelt.";
      title = mv.new.length
        ? (mv.new.includes("haken") ? "Haken einsetzen" : `${NAME[mv.new[0]]} einsetzen`) + (mv.grp.length > mv.new.length ? `, alle ${DIRW[dirKey]}` : "")
        : `${titleNames(mv.grp)} ${fields(mv.n)} ${DIRW[dirKey]}`;
      const end = {};
      MOVERS.forEach(id => end[id] = last[id]);
      STEPS.push({ title, text, phases, end });
    });
    STEPS.push({
      title: "Aufstellen",
      text: "Fertig. Stell den Kasten auf die Rückseite: Alle Öffnungen sind geschlossen, heraus kommt ein Quader mit dem Haken als Henkel.",
      phases: [[{ id: "root", a: { q: flatQ }, b: { q: standQ } }]], stand: true, end: {}
    });
  })();

  function poseAt(i, id) {
    for (let k = i; k >= 1; k--) if (STEPS[k].end[id]) return STEPS[k].end[id];
    return stagePose(id, 0);
  }
  const standAt = i => STEPS.slice(0, i + 1).some(st => st.stand);

  function applyStep(i) {
    MOVERS.forEach(id => { const ps = poseAt(i, id); holders[id].quaternion.copy(ps.q); holders[id].position.copy(ps.p); });
    asmRoot.quaternion.copy(standAt(i) ? standQ : flatQ);
  }

  let cur = 0, anim = null, playing = false, playTimer = 0;

  function phaseDur(ph) {
    if (reduceMotion) return 0;
    let d = 0;
    ph.forEach(t => {
      if (t.id === "root") { d = Math.max(d, 1100); return; }
      d = Math.max(d, 240 + 150 * t.a.p.distanceTo(t.b.p) + 380 * t.a.q.angleTo(t.b.q));
    });
    return d;
  }
  function buildPhases(from, to) {
    const i = Math.max(from, to), forward = to > from;
    let ph = STEPS[i].phases.map(p => p.map(t => ({ ...t })));
    if (!forward) ph = ph.reverse().map(p => p.map(t => ({ id: t.id, a: t.b, b: t.a })));
    return ph.map(p => ({ tracks: p, dur: phaseDur(p) }));
  }
  function tickAnim(now) {
    if (!anim) return;
    const ph = anim.phases[anim.idx];
    if (!ph) { const done = anim.done; anim = null; done && done(); return; }
    if (anim.t0 == null) anim.t0 = now;
    const k = ph.dur ? Math.min(1, (now - anim.t0) / ph.dur) : 1;
    const e = ease(k);
    ph.tracks.forEach(t => {
      if (t.id === "root") { asmRoot.quaternion.copy(t.a.q).slerp(t.b.q, e); return; }
      const h = holders[t.id];
      h.position.lerpVectors(t.a.p, t.b.p, e);
      h.quaternion.copy(t.a.q).slerp(t.b.q, e);
    });
    if (k >= 1) { anim.idx++; anim.t0 = now; }
  }

  function goTo(i, animated) {
    i = Math.max(0, Math.min(STEPS.length - 1, i));
    if (anim) { anim = null; applyStep(cur); }
    const prev = cur;
    cur = i;
    renderSteps();
    if (animated && Math.abs(i - prev) === 1) {
      anim = { phases: buildPhases(prev, i), idx: 0, t0: null, done: () => { if (STEPS[i].stand || (STEPS[prev] && STEPS[prev].stand)) frame(true); afterStep(); } };
    } else {
      applyStep(i);
      afterStep();
    }
  }
  function afterStep() {
    if (!playing) return;
    if (cur >= STEPS.length - 1) { setPlaying(false); return; }
    playTimer = setTimeout(() => { if (playing) goTo(cur + 1, true); }, reduceMotion ? 900 : 650);
  }
  function setPlaying(on) {
    playing = on;
    clearTimeout(playTimer);
    btnPlay.textContent = on ? "Anhalten" : "Abspielen";
    if (on) {
      if (cur >= STEPS.length - 1) goTo(0, false);
      goTo(cur + 1, true);
    }
  }

  const stepList = document.getElementById("stepList");
  const stepTitle = document.getElementById("stepTitle");
  const stepText = document.getElementById("stepText");
  const stepProgress = document.getElementById("stepProgress");
  const btnPrev = document.getElementById("stepPrev"), btnNext = document.getElementById("stepNext");
  const btnPlay = document.getElementById("stepPlay"), btnReset = document.getElementById("stepReset");
  STEPS.forEach((st, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button"; b.className = "step-btn"; b.dataset.i = i;
    const n = document.createElement("span"); n.className = "step-num"; n.textContent = String(i + 1);
    const t = document.createElement("span"); t.className = "step-title"; t.textContent = st.title;
    b.append(n, t);
    b.addEventListener("click", () => { setPlaying(false); goTo(i, Math.abs(i - cur) === 1); });
    li.append(b);
    stepList.append(li);
  });
  function renderSteps() {
    stepList.querySelectorAll(".step-btn").forEach(b => {
      const i = +b.dataset.i;
      if (i === cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      b.classList.toggle("done", i < cur);
    });
    const st = STEPS[cur];
    stepTitle.textContent = st.title;
    stepText.textContent = st.text;
    stepProgress.textContent = `Schritt ${cur + 1} von ${STEPS.length}`;
    btnPrev.disabled = cur === 0;
    btnNext.disabled = cur === STEPS.length - 1;
    if (app.mode === "asm") KP.badge.textContent = `${cur + 1}/${STEPS.length} · ${st.title}`;
  }
  btnPrev.addEventListener("click", () => { setPlaying(false); goTo(cur - 1, true); });
  btnNext.addEventListener("click", () => { setPlaying(false); goTo(cur + 1, true); });
  btnPlay.addEventListener("click", () => setPlaying(!playing));
  btnReset.addEventListener("click", () => { setPlaying(false); goTo(0, false); frame(true, "iso"); });
  document.addEventListener("keydown", e => {
    if (mode !== "asm" || e.target.closest("input")) return;
    if (e.key === "ArrowRight") { setPlaying(false); goTo(cur + 1, true); }
    if (e.key === "ArrowLeft") { setPlaying(false); goTo(cur - 1, true); }
  });

  const showCurrent = () => applyStep(cur);

  Object.assign(KP, { asmRoot, holders, STEPS, applyStep, showCurrent, renderSteps, goTo, setPlaying, tickAnim });
})();

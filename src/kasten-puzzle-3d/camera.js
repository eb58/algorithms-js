// Orbit-Steuerung, Ansichten und Auswahl per Klick.
(() => {
  "use strict";
  const KP = (window.KP ??= {});
  const { app, state, reduceMotion, canvas, camera, allMeshes, PARTS } = KP;

  // ------------------------------------------------------------------
  //  Kamera-Steuerung (Orbit)
  // ------------------------------------------------------------------
  const orbit = { theta: -0.65, phi: 0.98, radius: 30, target: new THREE.Vector3() };
  const vel = { theta: 0, phi: 0 };
  let tween = null;

  function updateCamera() {
    const { theta, phi, radius, target } = orbit;
    camera.position.set(
      target.x + radius*Math.sin(phi)*Math.sin(theta),
      target.y + radius*Math.cos(phi),
      target.z + radius*Math.sin(phi)*Math.cos(theta)
    );
    camera.lookAt(target);
  }

  const pointers = new Map();
  let dragMode = null, downPos = null, moved = 0, lastPinch = 0;

  canvas.addEventListener("contextmenu", e => e.preventDefault());
  canvas.addEventListener("pointerdown", e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    tween = null;
    if (pointers.size === 1) {
      dragMode = (e.button === 2 || e.shiftKey) ? "pan" : "rotate";
      downPos = { x: e.clientX, y: e.clientY }; moved = 0;
    } else {
      dragMode = "pinch";
      lastPinch = pinchDist();
    }
    canvas.classList.add("dragging");
  });
  function pinchDist() {
    const p = [...pointers.values()];
    return p.length < 2 ? 0 : Math.hypot(p[0].x-p[1].x, p[0].y-p[1].y);
  }
  function pinchMid() {
    const p = [...pointers.values()];
    return { x: (p[0].x+p[1].x)/2, y: (p[0].y+p[1].y)/2 };
  }
  let lastMid = null;
  canvas.addEventListener("pointermove", e => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    if (dragMode === "pinch") {
      const before = pinchMid();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const d = pinchDist();
      if (lastPinch > 0 && d > 0) orbit.radius = clampR(orbit.radius * lastPinch / d);
      lastPinch = d;
      const after = pinchMid();
      pan(after.x - before.x, after.y - before.y);
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved += Math.abs(dx) + Math.abs(dy);
    if (dragMode === "rotate") {
      vel.theta = -dx * 0.0085;
      vel.phi = -dy * 0.0085;
      orbit.theta += vel.theta;
      orbit.phi = clampPhi(orbit.phi + vel.phi);
    } else if (dragMode === "pan") {
      pan(dx, dy);
    }
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      canvas.classList.remove("dragging");
      if (dragMode === "rotate" && moved < 5 && downPos) pick(e.clientX, e.clientY);
      if (dragMode !== "rotate" || reduceMotion) { vel.theta = 0; vel.phi = 0; }
      dragMode = null;
    } else if (pointers.size === 1) {
      dragMode = "rotate"; moved = 99;
      const p = [...pointers.values()][0];
      downPos = p;
    }
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    tween = null;
    orbit.radius = clampR(orbit.radius * Math.exp(e.deltaY * 0.0012));
  }, { passive: false });

  function clampPhi(v) { return Math.min(Math.PI - 0.02, Math.max(0.02, v)); }
  function clampR(v) { return Math.min(120, Math.max(4, v)); }
  function pan(dx, dy) {
    const h = canvas.clientHeight || 1;
    const scale = 2 * orbit.radius * Math.tan(THREE.MathUtils.degToRad(camera.fov/2)) / h;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
    orbit.target.addScaledVector(right, -dx*scale).addScaledVector(up, dy*scale);
  }

  // Klick auf ein Teil
  const ray = new THREE.Raycaster();
  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const v = new THREE.Vector2(((cx - r.left)/r.width)*2 - 1, -((cy - r.top)/r.height)*2 + 1);
    ray.setFromCamera(v, camera);
    const hit = ray.intersectObjects(allMeshes.filter(m => m.visible && isVisible(m)), false)[0];
    if (hit && app.mode === "parts" && state.selected === "all") KP.select(hit.object.userData.part);
  }
  function isVisible(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

  // Kamera auf sichtbare Teile ausrichten
  function visibleBox() {
    const bb = new THREE.Box3();
    if (app.mode === "asm") return bb.setFromObject(KP.asmRoot);
    PARTS.forEach(p => { if (p.outer.visible) bb.expandByObject(p.outer); });
    return bb;
  }
  function fitRadius(bb) {
    const s = bb.getBoundingSphere(new THREE.Sphere());
    const aspect = Math.max(0.5, camera.aspect);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fit = s.radius / Math.sin(Math.min(fov/2, Math.atan(Math.tan(fov/2)*aspect)));
    return clampR(fit * 0.95);
  }
  function frame(animated, view) {
    const bb = visibleBox();
    const c = bb.getCenter(new THREE.Vector3());
    const to = { theta: orbit.theta, phi: orbit.phi, radius: fitRadius(bb), target: c };
    if (view) Object.assign(to, VIEWS[view]);
    startTween(to, animated);
  }
  const VIEWS = {
    iso:    { theta: -0.65, phi: 0.98 },
    front:  { theta: 0, phi: Math.PI/2 - 0.001 },
    back:   { theta: Math.PI, phi: Math.PI/2 - 0.001 },
    left:   { theta: -Math.PI/2, phi: Math.PI/2 - 0.001 },
    right:  { theta: Math.PI/2, phi: Math.PI/2 - 0.001 },
    top:    { theta: 0, phi: 0.02 },
    bottom: { theta: 0, phi: Math.PI - 0.02 }
  };
  function startTween(to, animated) {
    vel.theta = vel.phi = 0;
    // kürzesten Weg für theta nehmen
    let dt = to.theta - orbit.theta;
    dt = Math.atan2(Math.sin(dt), Math.cos(dt));
    const from = { theta: orbit.theta, phi: orbit.phi, radius: orbit.radius, target: orbit.target.clone() };
    const goal = { theta: orbit.theta + dt, phi: to.phi, radius: to.radius, target: to.target.clone() };
    if (!animated || reduceMotion) { applyTween(from, goal, 1); tween = null; return; }
    tween = { from, goal, t0: performance.now(), dur: 650 };
  }
  function applyTween(a, b, k) {
    orbit.theta = a.theta + (b.theta - a.theta)*k;
    orbit.phi = a.phi + (b.phi - a.phi)*k;
    orbit.radius = a.radius + (b.radius - a.radius)*k;
    orbit.target.lerpVectors(a.target, b.target, k);
  }
  const ease = t => t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => frame(true, b.dataset.view)));

  // vom Render-Loop aufgerufen: Tween, Nachlauf und Dauerdrehung
  const stepCamera = now => {
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur);
      applyTween(tween.from, tween.goal, ease(k));
      if (k >= 1) tween = null;
    } else if (!dragMode) {
      if (Math.abs(vel.theta) > 1e-5 || Math.abs(vel.phi) > 1e-5) {
        orbit.theta += vel.theta; orbit.phi = clampPhi(orbit.phi + vel.phi);
        vel.theta *= 0.9; vel.phi *= 0.9;
      }
      if (state.spin) orbit.theta += 0.0035;
    }
  };

  Object.assign(KP, { orbit, updateCamera, stepCamera, frame, startTween, ease, VIEWS });
})();

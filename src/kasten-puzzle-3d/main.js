// Modusumschaltung, Größenanpassung und Render-Schleife.
(() => {
  "use strict";
  const KP = (window.KP ??= {});
  const { app, state, PARTS, canvas, renderer, scene, camera, sun, ground, select, applyToggles, ensureXray, stepCamera, updateCamera, frame, asmRoot, applyStep, showCurrent, renderSteps, setPlaying, tickAnim } = KP;

  const tabParts = document.getElementById("tabParts"), tabAsm = document.getElementById("tabAsm");
  const modeParts = document.getElementById("modeParts"), modeAsm = document.getElementById("modeAsm");
  function setMode(m) {
    if (app.mode === m) return;
    app.mode = m;
    tabParts.setAttribute("aria-selected", String(m === "parts"));
    tabAsm.setAttribute("aria-selected", String(m === "asm"));
    modeParts.hidden = m !== "parts";
    modeAsm.hidden = m !== "asm";
    setPlaying(false);
    asmRoot.visible = m === "asm";
    if (m === "asm") {
      PARTS.forEach(p => p.outer.visible = false);
      ensureXray();
      showCurrent();
      renderSteps();
      frame(true, "iso");
    } else {
      select(state.selected);
    }
  }
  tabParts.addEventListener("click", () => setMode("parts"));
  tabAsm.addEventListener("click", () => setMode("asm"));
  applyStep(0);
  renderSteps();

  // ------------------------------------------------------------------
  //  Render-Schleife
  // ------------------------------------------------------------------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w*renderer.getPixelRatio()) || canvas.height !== Math.round(h*renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  new ResizeObserver(resize).observe(canvas);

  const tmpBox = new THREE.Box3();
  function loop(now) {
    resize();
    stepCamera(now);
    PARTS.forEach(p => {
      if (p.targetQuat) {
        p.outer.quaternion.slerp(p.targetQuat, 0.16);
        if (p.outer.quaternion.angleTo(p.targetQuat) < 0.002) { p.outer.quaternion.copy(p.targetQuat); p.targetQuat = null; }
      }
    });
    // Boden unter die sichtbaren Teile legen
    tickAnim(now);
    tmpBox.makeEmpty();
    if (app.mode === "asm") tmpBox.setFromObject(asmRoot);
    else PARTS.forEach(p => { if (p.outer.visible) tmpBox.expandByObject(p.outer); });
    if (!tmpBox.isEmpty()) {
      ground.position.y += (tmpBox.min.y - 0.001 - ground.position.y) * 0.25;
      const c = tmpBox.getCenter(new THREE.Vector3());
      sun.target.position.set(c.x, tmpBox.min.y, c.z);
      sun.position.set(c.x - 9, tmpBox.min.y + 18, c.z + 12);
    }
    updateCamera();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  applyToggles();
  resize();
  select("all");
  frame(false, "iso");
  setMode("asm");
  setPlaying(true);
  requestAnimationFrame(loop);
})();

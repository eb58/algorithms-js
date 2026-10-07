// Renderer, Lichter, Boden, Materialien und Theme-Abgleich.
(() => {
  "use strict";
  const KP = (window.KP ??= {});
  const { MIRROR, PARTS, makeBuf } = KP;

  // ------------------------------------------------------------------
  //  Szene
  // ------------------------------------------------------------------
  const canvas = document.getElementById("stage");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 500);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9490, 0.62));
  const sun = new THREE.DirectionalLight(0xffffff, 0.78);
  sun.position.set(-9, 18, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  sun.shadow.bias = -0.0008;
  sun.shadow.radius = 4;
  scene.add(sun);
  scene.add(sun.target);
  const fill = new THREE.DirectionalLight(0xffffff, 0.32);
  fill.position.set(12, 6, -10);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 0.16);
  rim.position.set(0, 3, -16);
  scene.add(rim);

  const ground = new THREE.Group();
  scene.add(ground);
  const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.16 }));
  shadowPlane.rotation.x = -Math.PI/2;
  shadowPlane.receiveShadow = true;
  ground.add(shadowPlane);

  const FADE = 19.5;                       // Radius, ab dem Boden und Raster auslaufen
  const fadeOut = "float fadeOut(vec2 p) { return 1.0 - smoothstep(fade*0.45, fade, length(p)); }";

  const floorMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    extensions: { derivatives: true },
    uniforms: { cA: { value: new THREE.Color() }, cB: { value: new THREE.Color() }, op: { value: 0.55 }, fade: { value: FADE } },
    vertexShader: `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 cA, cB;
      uniform float op, fade;
      varying vec2 vP;
      ${fadeOut}
      void main() {
        vec2 w = fwidth(vP);
        // Karos zur Mischfarbe verschleifen, sobald ein Feld kleiner als ein Pixel wird
        float k = mix(mod(floor(vP.x) + floor(vP.y), 2.0), 0.5, clamp(max(w.x, w.y), 0.0, 1.0));
        gl_FragColor = vec4(mix(cA, cB, k), op * fadeOut(vP));
      }`
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), floorMat);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = -0.004;
  ground.add(floor);

  const gridMat = opacity => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { c: { value: new THREE.Color() }, op: { value: opacity }, fade: { value: FADE } },
    vertexShader: `
      varying vec3 vP;
      void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform vec3 c;
      uniform float op, fade;
      varying vec3 vP;
      ${fadeOut}
      void main() { gl_FragColor = vec4(c, op * fadeOut(vP.xz)); }`
  });

  function makeGrid(size, step, opacity) {
    const pts = [];
    for (let v = -size; v <= size + 1e-6; v += step) {
      pts.push(-size, 0, v, size, 0, v, v, 0, -size, v, 0, size);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.LineSegments(g, gridMat(opacity));
    l.position.y = 0.002;
    return l;
  }
  const gridMinor = makeGrid(20, 1, 0.16);
  const gridMajor = makeGrid(20, 5, 0.4);
  ground.add(gridMinor, gridMajor);

  const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
  const allMeshes = [];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function linColor(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

  function toGeometry(buf) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(buf.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(buf.nor, 3));
    return g;
  }

  PARTS.forEach(p => {
    const bufs = p.build();
    const outer = new THREE.Group();
    const inner = new THREE.Group();
    outer.add(inner);
    scene.add(outer);

    const merged = makeBuf();
    p.materials = [];
    p.specs = [];
    Object.keys(bufs).forEach(key => {
      const b = bufs[key];
      merged.pos.push(...b.pos); merged.nor.push(...b.nor);
      const isInsert = p.id === "kasten" && key === "2";
      const mat = new THREE.MeshStandardMaterial({
        roughness: 0.62, metalness: 0,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
        side: THREE.DoubleSide
      });
      mat.userData.token = isInsert ? "--c-einsatz" : p.color;
      mat.userData.isShell = p.id === "kasten" && !isInsert;
      const geo = toGeometry(b);
      p.specs.push({ geo, mat });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.part = p.id;
      inner.add(mesh);
      allMeshes.push(mesh);
      p.materials.push(mat);
    });
    p.edgeGeo = new THREE.EdgesGeometry(toGeometry(merged), 25);
    const edges = new THREE.LineSegments(p.edgeGeo, edgeMat);
    inner.add(edges);
    p.edges = edges;

    const box = new THREE.Box3().setFromObject(inner);
    const c = box.getCenter(new THREE.Vector3());
    inner.position.sub(c);        // Drehpunkt = Mitte des Teils
    p.center = c;
    p.outer = outer;
    p.inner = inner;
    p.userQuat = new THREE.Quaternion();
  });

  // Gesamtanordnung zentrieren
  (function centerLayout() {
    const bb = new THREE.Box3();
    PARTS.forEach(p => {
      const [lx, ly] = p.layout;
      p.layoutPos = new THREE.Vector3(lx + MIRROR*p.center.x, p.center.y, -ly + p.center.z);
      const half = new THREE.Vector3(p.size[0]/2, p.size[2]/2, p.size[1]/2);
      bb.expandByPoint(p.layoutPos.clone().sub(half));
      bb.expandByPoint(p.layoutPos.clone().add(half));
    });
    const mid = bb.getCenter(new THREE.Vector3());
    PARTS.forEach(p => { p.layoutPos.x -= mid.x; p.layoutPos.z -= mid.z; });
  })();

  function applyTheme() {
    PARTS.forEach(p => p.materials.forEach(m => m.color.copy(linColor(cssVar(m.userData.token)))));
    edgeMat.color.copy(linColor(cssVar("--edge")));
    const dark = cssVar("--bg").toLowerCase() === "#101514";
    // eigene Shader haengen nicht am Output-Encoding, deshalb direkt die sRGB-Werte
    [gridMinor, gridMajor].forEach(l => l.material.uniforms.c.value.set(cssVar("--grid")));
    floorMat.uniforms.cA.value.set(cssVar("--floor-a"));
    floorMat.uniforms.cB.value.set(cssVar("--floor-b"));
    floorMat.uniforms.op.value = dark ? 0.7 : 0.55;
    shadowPlane.material.opacity = dark ? 0.32 : 0.16;
    edgeMat.opacity = dark ? 0.75 : 0.55;
  }
  applyTheme();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  Object.assign(KP, { canvas, renderer, scene, camera, sun, ground, allMeshes, edgeMat, gridMinor, gridMajor, floor, cssVar, linColor });
})();

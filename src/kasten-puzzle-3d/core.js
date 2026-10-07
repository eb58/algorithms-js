// Gemeinsamer Zustand aller Module.
(() => {
  "use strict";
  const KP = (window.KP ??= {});

  KP.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  KP.state = { selected: "all", xray: false, edges: true, grid: true, spin: false };
  KP.app = { mode: "parts" };     // "parts" oder "asm", gesetzt von main.js
})();

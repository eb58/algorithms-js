const hanoiview = (h) => { // h = number of bricks
   const [wBrick, hBrick] = [250, 30];
   const hPole = hBrick * (h + 1);
   const papers = [null, null, null];
   Raphael(20, 20, 3 * (wBrick + 10), hPole + 80)
      .rect(0, 0, 3 * (wBrick + 10), hPole + 50)
      .attr({ fill: "#fff", stroke: "#000" });

   const drawPole = (n) => {
      const paper = papers[n];
      paper.rect(wBrick / 2 - 5, 10, 10, hPole).attr("fill", "#000"); // pole
      paper.rect(0, hPole, wBrick, 30).attr("fill", "#000"); // bottom plate

   }
   const drawTower = (n, arr) => {
      if (papers[n] === null)
         papers[n] = Raphael(30 + n * (wBrick + 5), 30, (wBrick + 50), hPole + 60);
      const paper = papers[n];
      paper.clear();
      paper.rect(0, 0, wBrick, hPole + 30).attr({ fill: "#eee", stroke: "#000" });
      drawPole(n);
      arr.forEach((v, i) => { // draw Bricks
         const w = v * wBrick / h;
         const l = (wBrick - w) / 2;
         const t = hPole - (i + 1) * hBrick;
         paper.rect(l, t, w, hBrick).attr("fill", "#c00");
      });
   }

   const drawModel = m => (drawTower(0, m.l), drawTower(1, m.c), drawTower(2, m.r))

   return {
      drawModel
   };
};
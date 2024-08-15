const hanoiview = (N) => { // N = number of bricks
   const [wBrick, hBrick, hPlate] = [150, 30, 10];
   const hPole = hBrick * (N + 1);

   const drawTower = (n, tower) => {
      const paper = Raphael(30 + n * (wBrick + 10), 15, wBrick, hPole + hPlate);
      paper.rect(0, 0, wBrick, hPole).attr({ fill: "lightgrey" }); // draw background
      paper.rect(wBrick / 2 - 5, 5, 10, hPole).attr("fill", "black"); // pole
      paper.rect(0, hPole, wBrick, hPlate).attr("fill", "black"); // bottom plate
      tower.forEach((v, i) => { // draw bricks
         const w = v * wBrick / N;
         const left = (wBrick - w) / 2;
         const top = hPole - (i + 1) * hBrick;
         paper.rect(left, top, w, hBrick).attr("fill", "red");
      });
   }

   return {
      drawModel: m => (drawTower(0, m.l), drawTower(1, m.c), drawTower(2, m.r))
   };
};
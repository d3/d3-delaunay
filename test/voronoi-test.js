import tape from "@observablehq/tape";
import Delaunay from "../src/delaunay.js";
import Context from "./context.js";

tape("voronoi.renderCell(i, context) is a noop for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.equal(voronoi.renderCell(3, {}), undefined);
});

tape("voronoi.renderCell(i, context) handles midpoint coincident with circumcenter", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1]]).voronoi([-1, -1, 2, 2]);
  let context = new Context;
  test.equal((voronoi.renderCell(0, context), context.toString()), `M-1,-1L0.5,-1L0.5,0.5L-1,0.5Z`);
  test.equal((voronoi.renderCell(1, context), context.toString()), `M2,-1L2,2L0.5,0.5L0.5,-1Z`);
  test.equal((voronoi.renderCell(2, context), context.toString()), `M-1,2L-1,0.5L0.5,0.5L2,2Z`);
});

tape("voronoi.contains(i, x, y) is false for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.equal(voronoi.contains(3, 1, 0), false);
  test.equal(voronoi.contains(1, 1, 0), true);
});

tape("voronoi.update() updates the voronoi", test => {
  let delaunay = Delaunay.from([[0, 0], [300, 0], [0, 300], [300, 300], [100, 100]]);
  let voronoi = delaunay.voronoi([-500, -500, 500, 500]);
  for (let i = 0; i < delaunay.points.length; i++) {
    delaunay.points[i] = 10 - delaunay.points[i];
  }
  const p = voronoi.update().cellPolygon(1); // correct after voronoi.update
  test.deepEqual(p, [[-500, 500], [-500, -140], [-240, -140], [-140, 60], [-140, 500], [-500, 500]]);
});

tape("voronoi.update() updates a degenerate voronoi", test => {
  const pts = [10, 10, -290, 10, 10, -290, -290, -290, -90, -90];
  let delaunay = new Delaunay(Array.from({length: pts.length}).fill(0));
  let voronoi = delaunay.voronoi([-500, -500, 500, 500]);
  test.deepEqual(voronoi.cellPolygon(0), [ [ 500, -500 ], [ 500, 500 ], [ -500, 500 ], [ -500, -500 ], [ 500, -500 ] ]);
  test.equal(voronoi.cellPolygon(1), null);
  for (let i = 0; i < delaunay.points.length; i++) {
    delaunay.points[i] = pts[i];
  }
  const p = voronoi.update().cellPolygon(1);
  test.deepEqual(p, [[-500, 500], [-500, -140], [-240, -140], [-140, 60], [-140, 500], [-500, 500]]);
});

tape("zero-length edges are removed", test => {
   const voronoi1 = Delaunay.from([[50, 10], [10, 50], [10, 10], [200, 100]]).voronoi([40, 40, 440, 180]);
   test.equal(voronoi1.cellPolygon(0).length, 4);
   const voronoi2 = Delaunay.from([[10, 10], [20, 10]]).voronoi([0, 0, 30, 20]);
   test.deepEqual(voronoi2.cellPolygon(0), [[15, 20], [0, 20], [0, 0], [15, 0], [15, 20]]);
});

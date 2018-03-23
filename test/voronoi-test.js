import tape from "@observablehq/tape";
import Delaunay from "../src/delaunay.js";
import Context from "./context";

tape("voronoi.find(x, y) returns the index of the cell that contains the specified point", test => {
  let voronoi = Delaunay.from([[0, 0], [300, 0], [0, 300], [300, 300], [100, 100]]).voronoi();
  test.deepEqual(voronoi.find(49, 49), 0);
  test.deepEqual(voronoi.find(51, 51), 4);
});

tape("voronoi.renderCell(i, context) is a noop for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.equal(voronoi.renderCell(3, {}), undefined);
});

tape("voronoi.renderCell(i, context) handles midpoint coincident with circumcenter", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1]]).voronoi([-1, -1, 2, 2]);
  let context = new Context;
  test.equal((voronoi.renderCell(0, context), context.toString()), `M-1,0.5L-1,-1L0.5,-1L0.5,0.5Z`);
  test.equal((voronoi.renderCell(1, context), context.toString()), `M0.5,-1L2,-1L2,2L2,2L0.5,0.5Z`);
  test.equal((voronoi.renderCell(2, context), context.toString()), `M2,2L-1,2L-1,0.5L0.5,0.5Z`);
});

tape("voronoi.contains(i, x, y) is false for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.equal(voronoi.contains(3, 1, 0), false);
  test.equal(voronoi.contains(1, 1, 0), true);
});

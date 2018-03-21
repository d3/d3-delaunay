import tape from "@observablehq/tape";
import Delaunay from "../src/delaunay.js";

tape("cell.render(context) is a noop for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.equal(voronoi.cells[3].render({}), undefined);
});

tape("cell.contains(x, y) is false for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.equal(voronoi.cells[3].contains(1, 0), false);
});

import tape from "@observablehq/tape";
import Delaunay from "../src/delaunay.js";

tape("Delaunay.from([[x0, y0], [x1, y1], …])", test => {
  let delaunay = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 1]]);
  test.deepEqual(delaunay.points, Float64Array.of(0, 0, 1, 0, 0, 1, 1, 1));
  test.deepEqual(delaunay.triangles, Uint32Array.of(0, 2, 1, 2, 3, 1));
  test.deepEqual(delaunay.halfedges, Int32Array.of(-1, 5, -1, -1, -1, 1));
});

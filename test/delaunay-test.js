import tape from "@observablehq/tape";
import Delaunay from "../src/delaunay.js";

tape("Delaunay.from(array)", test => {
  let delaunay = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 1]]);
  test.deepEqual(delaunay.points, Float64Array.of(0, 0, 1, 0, 0, 1, 1, 1));
  test.deepEqual(delaunay.triangles, Uint32Array.of(0, 2, 1, 2, 3, 1));
  test.deepEqual(delaunay.halfedges, Int32Array.of(-1, 5, -1, -1, -1, 1));
});

tape("Delaunay.from(iterable)", test => {
  let delaunay = Delaunay.from((function*() {
    yield [0, 0];
    yield [1, 0];
    yield [0, 1];
    yield [1, 1];
  })());
  test.deepEqual(delaunay.points, Float64Array.of(0, 0, 1, 0, 0, 1, 1, 1));
  test.deepEqual(delaunay.triangles, Uint32Array.of(0, 2, 1, 2, 3, 1));
  test.deepEqual(delaunay.halfedges, Int32Array.of(-1, 5, -1, -1, -1, 1));
});

tape("Delaunay.from(iterable, fx, fy)", test => {
  let delaunay = Delaunay.from((function*() {
    yield {x: 0, y: 0};
    yield {x: 1, y: 0};
    yield {x: 0, y: 1};
    yield {x: 1, y: 1};
  })(), d => d.x, d => d.y);
  test.deepEqual(delaunay.points, Float64Array.of(0, 0, 1, 0, 0, 1, 1, 1));
  test.deepEqual(delaunay.triangles, Uint32Array.of(0, 2, 1, 2, 3, 1));
  test.deepEqual(delaunay.halfedges, Int32Array.of(-1, 5, -1, -1, -1, 1));
});

tape("Delaunay.from({length}, fx, fy)", test => {
  let delaunay = Delaunay.from({length: 4}, (d, i) => i & 1, (d, i) => (i >> 1) & 1);
  test.deepEqual(delaunay.points, Float64Array.of(0, 0, 1, 0, 0, 1, 1, 1));
  test.deepEqual(delaunay.triangles, Uint32Array.of(0, 2, 1, 2, 3, 1));
  test.deepEqual(delaunay.halfedges, Int32Array.of(-1, 5, -1, -1, -1, 1));
});

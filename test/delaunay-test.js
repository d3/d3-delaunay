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

tape("delaunay.voronoi() uses the default bounds", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 1]]).voronoi();
  test.equal(voronoi.xmin, 0);
  test.equal(voronoi.ymin, 0);
  test.equal(voronoi.xmax, 960);
  test.equal(voronoi.ymax, 500);
});

tape("delaunay.voronoi([xmin, ymin, xmax, ymax]) uses the specified bounds", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 1]]).voronoi([-1, -1, 2, 2]);
  test.equal(voronoi.xmin, -1);
  test.equal(voronoi.ymin, -1);
  test.equal(voronoi.xmax, 2);
  test.equal(voronoi.ymax, 2);
});

tape("delaunay.voronoi() returns the expected diagram", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 1]]).voronoi();
  test.deepEqual(voronoi.circumcenters, Float64Array.of(0.5, 0.5, 0.5, 0.5));
  // test.deepEqual(voronoi.edges, Uint32Array.of(0, 0, 1, 1, 0, 1));
  // test.deepEqual(voronoi.index, Uint32Array.of(0, 1, 3, 5, 1, 3, 5, 6));
  test.deepEqual(voronoi.vectors, Float64Array.of(0, -1, -1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, 1, 0));
});

tape("delaunay.voronoi() skips cells for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.deepEqual(voronoi.circumcenters, Float64Array.of(0.5, 0.5));
  // test.deepEqual(voronoi.edges, Uint32Array.of(0, 0, 0));
  // test.deepEqual(voronoi.index, Uint32Array.of(0, 1, 2, 3, 1, 2, 0, 0));
  test.deepEqual(voronoi.vectors, Float64Array.of(0, -1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, 0, 0, 0));
});

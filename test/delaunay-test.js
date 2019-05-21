import tape from "@observablehq/tape";
import Delaunay from "../src/delaunay.js";
import Context from "./context";

tape("Delaunay.from(array)", test => {
  let delaunay = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 1]]);
  test.deepEqual(delaunay.points, Float64Array.of(0, 0, 1, 0, 0, 1, 1, 1));
  test.deepEqual(delaunay.triangles, Uint32Array.of(0, 2, 1, 2, 3, 1));
  test.deepEqual(delaunay.halfedges, Int32Array.of(-1, 5, -1, -1, -1, 1));
  test.deepEqual(delaunay.inedges, Int32Array.of(2, 4, 0, 3));
  test.deepEqual(Array.from(delaunay.neighbors(0)), [1, 2]);
  test.deepEqual(Array.from(delaunay.neighbors(1)), [3, 2, 0]);
  test.deepEqual(Array.from(delaunay.neighbors(2)), [0, 1, 3]);
  test.deepEqual(Array.from(delaunay.neighbors(3)), [2, 1]);
});

tape("Delaunay.from(array) handles coincident points", test => {
  let delaunay = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]);
  test.deepEqual(delaunay.inedges, Int32Array.of(2, 1, 0, -1));
  test.deepEqual(Array.from(delaunay.neighbors(0)), [1, 2]);
  test.deepEqual(Array.from(delaunay.neighbors(1)), [2, 0]);
  test.deepEqual(Array.from(delaunay.neighbors(2)), [0, 1]);
  test.deepEqual(Array.from(delaunay.neighbors(3)), []);
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
  test.deepEqual(voronoi.vectors, Float64Array.of(0, -1, -1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, 1, 0));
});

tape("delaunay.voronoi() skips cells for coincident points", test => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  test.deepEqual(voronoi.circumcenters, Float64Array.of(0.5, 0.5));
  test.deepEqual(voronoi.vectors, Float64Array.of(0, -1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, 0, 0, 0));
});

tape("delaunay.find(x, y) returns the index of the cell that contains the specified point", test => {
  let delaunay = Delaunay.from([[0, 0], [300, 0], [0, 300], [300, 300], [100, 100]]);
  test.equal(delaunay.find(49, 49), 0);
  test.equal(delaunay.find(51, 51), 4);
});

tape("delaunay.find(x, y) with coincident point", test => {
  let delaunay = Delaunay.from([[0, 0], [0, 0], [10,10], [10, -10]]);
  test.equal(delaunay.find(100,100), 2);
  test.ok(delaunay.find(0,0,1) > -1);
  delaunay = Delaunay.from(Array.from({length:1000}, () => [0, 0]).concat([[10,10], [10, -10]]));
  test.ok(delaunay.find(0,0,1) > -1);
});

tape("delaunay.find(x, y, i) traverses the convex hull", test => {
  let delaunay = new Delaunay(Float64Array.of(509,253,426,240,426,292,567,272,355,356,413,392,319,408,374,285,327,303,381,215,475,319,301,352,247,426,532,334,234,366,479,375,251,302,340,170,160,377,626,317,177,296,322,243,195,422,241,232,585,358,666,406,689,343,172,198,527,401,766,350,444,432,117,316,267,170,580,412,754,425,117,231,725,300,700,222,438,165,703,168,558,221,475,211,491,125,216,166,240,108,783,266,640,258,184,77,387,90,162,125,621,162,296,78,532,154,763,199,132,165,422,343,312,128,125,77,450,95,635,106,803,415,714,63,529,87,388,152,575,126,573,64,726,381,773,143,787,67,690,117,813,203,811,319));
  test.equal(delaunay.find(49, 311), 31);
  test.equal(delaunay.find(49, 311, 22), 31);
});

tape("delaunay.renderHull(context) is closed", test => {
  let delaunay = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 1]]);
  let context = new Context;
  test.equal((delaunay.renderHull(context), context.toString()), `M0,1L1,1L1,0L0,0Z`);
});

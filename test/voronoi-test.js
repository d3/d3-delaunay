import tape from "@observablehq/tape";
import Delaunay from "../src/delaunay.js";
import Context from "./context";

tape("voronoi.find(x, y) returns the index of the cell that contains the specified point", test => {
  let voronoi = Delaunay.from([[0, 0], [300, 0], [0, 300], [300, 300], [100, 100]]).voronoi();
  test.deepEqual(voronoi.find(49, 49), 0);
  test.deepEqual(voronoi.find(51, 51), 4);
});

tape("voronoi.find(x, y, i) traverses the convex hull", test => {
  let voronoi = new Delaunay(Float64Array.of(509,253,426,240,426,292,567,272,355,356,413,392,319,408,374,285,327,303,381,215,475,319,301,352,247,426,532,334,234,366,479,375,251,302,340,170,160,377,626,317,177,296,322,243,195,422,241,232,585,358,666,406,689,343,172,198,527,401,766,350,444,432,117,316,267,170,580,412,754,425,117,231,725,300,700,222,438,165,703,168,558,221,475,211,491,125,216,166,240,108,783,266,640,258,184,77,387,90,162,125,621,162,296,78,532,154,763,199,132,165,422,343,312,128,125,77,450,95,635,106,803,415,714,63,529,87,388,152,575,126,573,64,726,381,773,143,787,67,690,117,813,203,811,319)).voronoi();
  test.equal(voronoi.find(49, 311), 31);
  test.equal(voronoi.find(49, 311, 22), 31);
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

import assert from "node:assert";
import {it} from "vitest";
import {Delaunay} from "d3-delaunay";
import Context from "./context.js";

it("voronoi.renderCell(i, context) is a noop for coincident points", () => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  assert.strictEqual(voronoi.renderCell(3, {}), undefined);
});

it("voronoi.renderCell(i, context) handles midpoint coincident with circumcenter", () => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1]]).voronoi([-1, -1, 2, 2]);
  let context = new Context;
  assert.strictEqual((voronoi.renderCell(0, context), context.toString()), `M-1,-1L0.5,-1L0.5,0.5L-1,0.5Z`);
  assert.strictEqual((voronoi.renderCell(1, context), context.toString()), `M2,-1L2,2L0.5,0.5L0.5,-1Z`);
  assert.strictEqual((voronoi.renderCell(2, context), context.toString()), `M-1,2L-1,0.5L0.5,0.5L2,2Z`);
});

it("voronoi.contains(i, x, y) is false for coincident points", () => {
  let voronoi = Delaunay.from([[0, 0], [1, 0], [0, 1], [1, 0]]).voronoi([-1, -1, 2, 2]);
  assert.strictEqual(voronoi.contains(3, 1, 0), false);
  assert.strictEqual(voronoi.contains(1, 1, 0), true);
});

it("voronoi.update() updates the voronoi", () => {
  let delaunay = Delaunay.from([[0, 0], [300, 0], [0, 300], [300, 300], [100, 100]]);
  let voronoi = delaunay.voronoi([-500, -500, 500, 500]);
  for (let i = 0; i < delaunay.points.length; i++) {
    delaunay.points[i] = 10 - delaunay.points[i];
  }
  const p = voronoi.update().cellPolygon(1); // correct after voronoi.update
  assert.deepStrictEqual(p, [[-500, 500], [-500, -140], [-240, -140], [-140, 60], [-140, 500], [-500, 500]]);
});

it("voronoi.update() updates a degenerate voronoi", () => {
  const pts = [10, 10, -290, 10, 10, -290, -290, -290, -90, -90];
  let delaunay = new Delaunay(Array.from({length: pts.length}).fill(0));
  let voronoi = delaunay.voronoi([-500, -500, 500, 500]);
  assert.deepStrictEqual(voronoi.cellPolygon(0), [ [ 500, -500 ], [ 500, 500 ], [ -500, 500 ], [ -500, -500 ], [ 500, -500 ] ]);
  assert.strictEqual(voronoi.cellPolygon(1), null);
  for (let i = 0; i < delaunay.points.length; i++) {
    delaunay.points[i] = pts[i];
  }
  const p = voronoi.update().cellPolygon(1);
  assert.deepStrictEqual(p, [[-500, 500], [-500, -140], [-240, -140], [-140, 60], [-140, 500], [-500, 500]]);
});

it("zero-length edges are removed", () => {
   const voronoi1 = Delaunay.from([[50, 10], [10, 50], [10, 10], [200, 100]]).voronoi([40, 40, 440, 180]);
   assert.strictEqual(voronoi1.cellPolygon(0).length, 4);
   const voronoi2 = Delaunay.from([[10, 10], [20, 10]]).voronoi([0, 0, 30, 20]);
   assert.deepStrictEqual(voronoi2.cellPolygon(0), [[0, 20], [0, 0], [15, 0], [15, 20], [0, 20]]);
});

it("voronoi neighbors are clipped", () => {
   const voronoi = Delaunay.from([[300, 10], [200, 100], [300, 100], [10, 10], [350, 200], [350, 400]]).voronoi([0, 0, 500, 150]);
   assert.deepStrictEqual([0, 1, 2, 3, 4, 5].map(i => [...voronoi.neighbors(i)].sort()), [ [1, 2], [0, 2, 3], [0, 1, 4], [1], [2], []]);
});

it("unnecessary points on the corners are avoided (#88)", () => {
  for (const [points, lengths] of [
    [ [[289,25],[3,22],[93,165],[282,184],[65,89]], [ 6, 4, 6, 5, 6 ] ],
    [ [[189,13],[197,26],[47,133],[125,77],[288,15]], [ 4, 6, 5, 6, 5 ] ],
    [ [[44,42],[210,193],[113,103],[185,43],[184,37]], [ 5, 5, 7, 5, 6 ]]
  ]) {
    const voronoi = Delaunay.from(points).voronoi([0, 0, 290, 190]);
    assert.deepStrictEqual([...voronoi.cellPolygons()].map(d => d.length), lengths);
  }
});

it("a degenerate triangle is avoided", () => {
  const pts = [[424.75, 253.75],[424.75, 253.74999999999997],[407.17640687119285, 296.17640687119285],[364.75, 313.75],[322.32359312880715, 296.17640687119285],[304.75, 253.75],[322.32359312880715, 211.32359312880715],[364.75, 193.75],[407.17640687119285, 211.32359312880715],[624.75, 253.75],[607.1764068711929, 296.17640687119285],[564.75, 313.75],[522.3235931288071, 296.17640687119285],[504.75, 253.75],[564.75, 193.75]
  ]
  const voronoi = Delaunay.from(pts).voronoi([10, 10, 960, 500]);
  assert.strictEqual(voronoi.cellPolygon(0).length, 4);
});

it("cellPolygons filter out empty cells and have the cell index as a property", () => {
  const pts = [[0, 0], [3, 3], [1, 1], [-3, -2]];
  const voronoi = Delaunay.from(pts).voronoi([0, 0, 2, 2]);
  assert.deepStrictEqual([...voronoi.cellPolygons()], [
    Object.assign([[0, 0], [1, 0], [0, 1], [0, 0]], {index:0, }),
    Object.assign([[2, 2], [0, 2], [0, 1], [1, 0], [2, 0], [2, 2]], { index: 2 })
  ]);
});

it("voronoi.neighbors returns the correct neighbors", () => {
  const points = [[10, 10], [36, 27], [90, 19], [50, 75]];
  const voronoi = Delaunay.from(points).voronoi([0, 0, 100, 90]);
  assert.deepStrictEqual([0, 1, 2, 3].map(i => [...voronoi.neighbors(i)].sort()), [[1], [0, 2, 3], [1, 3], [1, 2]]);
});

it("voronoi.neighbors returns the correct neighbors, flipped vertically", () => {
  const points = [[10, -10], [36, -27], [90, -19], [50, -75]];
  const voronoi = Delaunay.from(points).voronoi([0, -90, 100, 0]);
  assert.deepStrictEqual([0, 1, 2, 3].map(i => [...voronoi.neighbors(i)].sort()), [[1], [0, 2, 3], [1, 3], [1, 2]]);
});

it("voronoi.neighbors returns the correct neighbors, flipped horizontally", () => {
  const points = [[-10, 10], [-36, 27], [-90, 19], [-50, 75]];
  const voronoi = Delaunay.from(points).voronoi([-100, 0, 0, 90]);
  assert.deepStrictEqual([0, 1, 2, 3].map(i => [...voronoi.neighbors(i)].sort()), [[1], [0, 2, 3], [1, 3], [1, 2]]);
});

it("voronoi.neighbors returns the correct neighbors, rotated", () => {
  const points = [[-10, -10], [-36, -27], [-90, -19], [-50, -75]];
  const voronoi = Delaunay.from(points).voronoi([-100, -90, 0, 0]);
  assert.deepStrictEqual([0, 1, 2, 3].map(i => [...voronoi.neighbors(i)].sort()), [[1], [0, 2, 3], [1, 3], [1, 2]]);
});

it("voronoi returns the expected result (#136)", () => {
  const points = [
    [447.27981036477433, 698.9400262172304],
    [485.27830313288746, 668.9946483670656],
    [611.9525697080425, 397.71056371206487],
    [491.44637766366105, 692.071157339428],
    [697.553622336339, 692.071157339428],
    [497.00778156318086, 667.1990851383492],
    [691.9922184368191, 667.1990851383492],
    [544.9897579870977, 407.0828550310619],
    [543.1738215956482, 437.35879519252677]
  ];
  const voronoi = Delaunay.from(points).voronoi([0, 0, 1000, 1000]);
  assert.strictEqual(voronoi.cellPolygon(3).length, 6);
});

it("voronoi returns the expected result (#141)", () => {
  const points = [[10, 190]].concat(Array.from({ length: 7 }, (d, i) => [i * 80, (i * 50) / 7]));
  const voronoi = Delaunay.from(points).voronoi([1, 1, 499, 199]);
  assert.deepEqual(Array.from(voronoi.cellPolygons(), (d) => d.length), [7, 5, 5, 5, 6, 5, 5, 5]);
});

it("voronoi returns the expected result for collinear points (#146)", () => {
  const points = [[25,20], [75,20], [125,20], [175,20], [225,20]];
  const voronoi = Delaunay.from(points).voronoi([0, 0, 250, 40]);
  assert.deepStrictEqual(Array.from(voronoi.cellPolygons(), (d) => d.map((u) => u.map((d) => Math.round(d)))), [[[50,0],[50,40],[0,40],[0,0],[50,0]],[[50,0],[100,0],[100,40],[50,40],[50,0]],[[100,0],[150,0],[150,40],[100,40],[100,0]],[[150,0],[200,0],[200,40],[150,40],[150,0]],[[200,0],[250,0],[250,40],[200,40],[200,0]]]);
  assert.strictEqual(voronoi.render(), "M50,0L50,40M100,0L100,40M150,0L150,40M200,0L200,40");
});

// Places points at positions × step on a line through [x, y], and checks that each
// distinct position gets the strip between its bisectors, and duplicates get no cell.
function assertCollinearCells(x, y, angle, step) {
  const positions = [8, 0, 3, 12, 8, 4, 20, 3, 7, 8], distinct = [...new Set(positions)].sort((a, b) => a - b);
  const ux = Math.cos(angle), uy = Math.sin(angle), [x0, y0, x1, y1] = [x - 2 * step, y - 2 * step, x + (20 * ux + 2) * step, y + (20 * uy + 2) * step];
  const points = positions.map((t) => [x + t * step * ux, y + t * step * uy]);
  const cells = Array.from(Delaunay.from(points).voronoi([x0, y0, x1, y1]).cellPolygons());
  const project = ([px, py]) => ((px - x) * ux + (py - y) * uy) / step;
  assert.deepStrictEqual(cells.map((cell) => positions[cell.index]).sort((a, b) => a - b), distinct);
  let area = 0;
  for (const cell of cells) {
    const t = positions[cell.index], k = distinct.indexOf(t), p = cell.map(project), a = Math.min(...p), b = Math.max(...p);
    if (k > 0) assert(Math.abs(a - (distinct[k - 1] + t) / 2) < 1e-9, `cell ${cell.index} starts at ${a}`);
    if (k < distinct.length - 1) assert(Math.abs(b - (t + distinct[k + 1]) / 2) < 1e-9, `cell ${cell.index} ends at ${b}`);
    for (let i = 0; i < cell.length - 1; ++i) area += (cell[i][0] * cell[i + 1][1] - cell[i + 1][0] * cell[i][1]) / 2;
  }
  assert(Math.abs(Math.abs(area) / ((x1 - x0) * (y1 - y0)) - 1) < 1e-9, `total area ${Math.abs(area)} instead of ${(x1 - x0) * (y1 - y0)}`);
}

it("voronoi returns the exact cells for collinear points (horizontal, step 1e-6)", () => assertCollinearCells(3e-6, -7e-6, 0, 1e-6));
it("voronoi returns the exact cells for collinear points (vertical, step 1e-3)", () => assertCollinearCells(-0.05, 0.02, Math.PI / 2, 1e-3));
it("voronoi returns the exact cells for collinear points (30°, step 1)", () => assertCollinearCells(17, -5, Math.PI / 6, 1));
it("voronoi returns the exact cells for collinear points (diagonal, step 1e3)", () => assertCollinearCells(-4e4, 9e3, Math.PI / 4, 1e3));
it("voronoi returns the exact cells for collinear points (1 radian, step 1e6)", () => assertCollinearCells(2e7, 3e6, 1, 1e6));

it("voronoi orders collinear points along the line despite rounding errors", () => {
  const voronoi = Delaunay.from([[0.3, 0], [0.1 + 0.2, 1], [0.3, 2], [0.3, 3]]).voronoi([0, -1, 1, 4]);
  assert.deepStrictEqual(Array.from(voronoi.cellPolygons(), (cell) => [Math.min(...cell.map(([, y]) => y)), Math.max(...cell.map(([, y]) => y))]), [[-1, 0.5], [0.5, 1.5], [1.5, 2.5], [2.5, 4]]);
});

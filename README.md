# Voronator

<img alt="Voronoi diagram" src="https://raw.githubusercontent.com/observablehq/voronator/master/img/spectral.png" width="932" height="600">

## API Reference

### Delaunay

<a href="#delaunay_from" name="delaunay_from">#</a> Delaunay.<b>from</b>(<i>points</i>[, <i>fx</i>[, <i>fy</i>]]) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

Returns the Delaunay triangulation for the given array of *points*. If *fx* and *fy* are not specified, then *points* is assumed to be an array of two-element arrays of numbers: [[*x0*, *y0*], [*x1*, *y1*], …]. Otherwise, *fx* and *fy* are functions that are invoked for each element in the *points* array in order, and must return the respective *x*- and *y*-coordinate for each point.

<a href="#delaunay_points" name="delaunay_points">#</a> <i>delaunay</i>.<b>points</b>

The coordinates of the points as an array [*x0*, *y0*, *x1*, *y1*, …].

<a href="#delaunay_halfedges" name="delaunay_halfedges">#</a> <i>delaunay</i>.<b>halfedges</b>

The half-edge indexes as an Int32Array [*j0*, *j1*, …]. For each index 0 ≤ *i* < *halfedges*.length, there is a half-edge from triangle vertex *j* = *halfedges*[*i*] to triangle vertex *i*. Equivalently, this means that triangle ⌊*i* / 3⌋ is adjacent to triangle ⌊*halfedges*[*i*] / 3⌋. If *halfedges*[*i*] is negative, then triangle ⌊*i* / 3⌋ is an exterior triangle, having an edge from triangle vertex *i* to triangle vertex *i* + 1 on the convex [hull](#delaunay_hull). For example, to render the edges of the Delaunay triangulation:

```js
const {points, halfedges, triangles} = delaunay;
for (let i = 0, n = halfedges.length; i < n; ++i) {
  const j = halfedges[i];
  if (i < j) continue;
  const ti = triangles[i] * 2;
  const tj = triangles[j < 0 ? i + 1 : j] * 2;
  context.moveTo(points[ti], points[ti + 1]);
  context.lineTo(points[tj], points[tj + 1]);
}
```

See also [*delaunay*.render](#delaunay_render).

<a href="#delaunay_hull" name="delaunay_hull">#</a> <i>delaunay</i>.<b>hull</b>

An arbitrary starting [node](#node) of the Delaunay triangulation’s convex hull. For example, to render the exterior edges of the Delaunay triangulation:

```js
const {hull} = delaunay;
let node = hull;
do {
  context.moveTo(node.x, node.y);
  context.lineTo(node.next.x, node.next.y);
} while ((node = node.next) !== hull);
```

See also [*delaunay*.renderHull](#delaunay_renderHull).

<a href="#delaunay_triangles" name="delaunay_triangles">#</a> <i>delaunay</i>.<b>triangles</b>

The triangle vertex indexes as an Int32Array [*i0*, *j0*, *k0*, *i1*, *j1*, *k1*, …]. Each contiguous triplet of indexes *i*, *j*, *k* forms a counterclockwise triangle. The coordinates of the triangle’s points can be found by going through [*delaunay*.triangles](#delaunay_triangles) and [*delaunay*.points](#delaunay_points). For example, to render triangle *i*:

```js
const {points, triangles} = delaunay;
const t0 = triangles[i * 3 + 0] * 2;
const t1 = triangles[i * 3 + 1] * 2;
const t2 = triangles[i * 3 + 2] * 2;
context.moveTo(points[t0], points[t0 + 1]);
context.lineTo(points[t1], points[t1 + 1]);
context.lineTo(points[t2], points[t2 + 1]);
context.closePath();
```

See also [*delaunay*.renderTriangle](#delaunay_renderTriangle).

<a href="#delaunay_render" name="delaunay_render">#</a> <i>delaunay</i>.<b>render</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

Renders the edges of the Delaunay triangulation to the specified *context*. The specified *context* must implement the *context*.moveTo and *context*.lineTo methods from the [CanvasPathMethods API](https://www.w3.org/TR/2dcontext/#canvaspathmethods).

<a href="#delaunay_renderHull" name="delaunay_renderHull">#</a> <i>delaunay</i>.<b>renderHull</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

Renders the convex hull of the Delaunay triangulation to the specified *context*. The specified *context* must implement the *context*.moveTo and *context*.lineTo methods from the [CanvasPathMethods API](https://www.w3.org/TR/2dcontext/#canvaspathmethods).

<a href="#delaunay_renderTriangle" name="delaunay_renderTriangle">#</a> <i>delaunay</i>.<b>renderTriangle</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

Renders triangle *i* of the Delaunay triangulation to the specified *context*. The specified *context* must implement the *context*.moveTo, *context*.lineTo and *context*.closePath methods from the [CanvasPathMethods API](https://www.w3.org/TR/2dcontext/#canvaspathmethods).

<a href="#delaunay_voronoi" name="delaunay_voronoi">#</a> <i>delaunay</i>.<b>voronoi</b>([<i>bounds</i>]) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

Returns the [Voronoi tessellation](#voronoi) for the associated [points](#delaunay_points). When rendering, the tessellation will be clipped to the specified *bounds* = [*xmin*, *ymin*, *xmax*, *ymax*]. If *bounds* is not specified, it defaults to [0, 0, 960, 500].

### Node

See [*delaunay*.hull](#delaunay_hull).

<a href="#node_i" name="node_i">#</a> <i>node</i>.<b>i</b>

…

<a href="#node_x" name="node_x">#</a> <i>node</i>.<b>x</b>

Equivalent to [*delaunay*.points](#delaunay_points)[2 * *node*.i].

<a href="#node_y" name="node_y">#</a> <i>node</i>.<b>y</b>

Equivalent to [*delaunay*.points](#delaunay_points)[2 * *node*.i + 1].

<a href="#node_t" name="node_t">#</a> <i>node</i>.<b>t</b>

…

<a href="#node_prev" name="node_prev">#</a> <i>node</i>.<b>prev</b>

The node before this node on the convex hull.

<a href="#node_next" name="node_next">#</a> <i>node</i>.<b>next</b>

The node after this node on the convex hull.

### Voronoi

<a href="#voronoi_cells" name="voronoi_cells">#</a> <i>voronoi</i>.<b>cells</b>

… <i>voronoi</i>.cells[<i>i</i>] represents the [cell](#cell) for point <i>i</i> in the Delaunay triangulation, *i.e.*, [<i>delaunay</i>.points[2 * <i>i</i>], <i>delaunay</i>.points[2 * <i>i</i> + 1]].

<a href="#voronoi_circumcenters" name="voronoi_circumcenters">#</a> <i>voronoi</i>.<b>circumcenters</b>

…

<a href="#voronoi_delaunay" name="voronoi_delaunay">#</a> <i>voronoi</i>.<b>delaunay</b>

… See [#delaunay](Delaunay).

<a href="#voronoi_xmin" name="voronoi_xmin">#</a> <i>voronoi</i>.<b>xmin</b><br>
<a href="#voronoi_ymin" name="voronoi_ymin">#</a> <i>voronoi</i>.<b>ymin</b><br>
<a href="#voronoi_xmax" name="voronoi_xmax">#</a> <i>voronoi</i>.<b>xmax</b><br>
<a href="#voronoi_ymax" name="voronoi_ymax">#</a> <i>voronoi</i>.<b>ymax</b><br>

…

<a href="#voronoi_render" name="voronoi_render">#</a> <i>voronoi</i>.<b>render</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/voronoi.js "Source")

…

<a href="#voronoi_renderBounds" name="voronoi_renderBounds">#</a> <i>voronoi</i>.<b>renderBounds</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/voronoi.js "Source")

Equivalent to *context*.rect(*voronoi*.xmin, *voronoi*.ymin, *voronoi*.xmax - *voronoi*.xmin, *voronoi*.ymax - *voronoi*.ymin).

### Cell

<a href="#cell_voronoi" name="cell_voronoi">#</a> <i>cell</i>.<b>voronoi</b>

…

<a href="#cell_triangles" name="cell_triangles">#</a> <i>cell</i>.<b>triangles</b>

…

<a href="#cell_v0" name="cell_v0">#</a> <i>cell</i>.<b>v0</b>

…

<a href="#cell_vn" name="cell_vn">#</a> <i>cell</i>.<b>vn</b>

…

<a href="#cell_render" name="cell_render">#</a> <i>cell</i>.<b>render</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/cell.js "Source")

…

<a href="#cell_points" name="cell_points">#</a> <i>cell</i>.<b>points</b>() [<>](https://github.com/observablehq/voronator/blob/master/src/cell.js "Source")

…

<a href="#cell_contains" name="cell_contains">#</a> <i>cell</i>.<b>contains</b>(<i>x</i>, <i>y</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/cell.js "Source")

…

# Voronator

<img alt="Voronoi diagram" src="https://raw.githubusercontent.com/observablehq/voronator/master/img/spectral.png" width="932" height="600">


## API Reference

### Delaunay

<a href="#delaunay_from" name="delaunay_from">#</a> Delaunay.<b>from</b>(<i>points</i>[, <i>fx</i>[, <i>fy</i>]]) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

…

<a href="#delaunay_points" name="delaunay_points">#</a> <i>delaunay</i>.<b>points</b>

…

<a href="#delaunay_halfedges" name="delaunay_halfedges">#</a> <i>delaunay</i>.<b>halfedges</b>

…

<a href="#delaunay_hull" name="delaunay_hull">#</a> <i>delaunay</i>.<b>hull</b>

…

<a href="#delaunay_triangles" name="delaunay_triangles">#</a> <i>delaunay</i>.<b>triangles</b>

…

<a href="#delaunay_render" name="delaunay_render">#</a> <i>delaunay</i>.<b>render</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

…

<a href="#delaunay_renderHull" name="delaunay_renderHull">#</a> <i>delaunay</i>.<b>renderHull</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

…

<a href="#delaunay_renderTriangle" name="delaunay_renderTriangle">#</a> <i>delaunay</i>.<b>renderTriangle</b>(<i>context</i>) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

…

<a href="#delaunay_voronoi" name="delaunay_voronoi">#</a> <i>delaunay</i>.<b>voronoi</b>([<i>bounds</i>]) [<>](https://github.com/observablehq/voronator/blob/master/src/delaunay.js "Source")

…

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

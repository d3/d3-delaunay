import Delaunay from "delaunator";
export {default} from "delaunator";
import Voronoi from "./voronoi.js";

Object.assign(Delaunay.prototype, {
  voronoi: function(bounds) {
    return new Voronoi(this, bounds);
  },
  render: function(context) {
    const {coords, halfedges, triangles} = this;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < 0 || j < i) continue;
      context.moveTo(coords[triangles[i] * 2 + 0], coords[triangles[i] * 2 + 1]);
      context.lineTo(coords[triangles[j] * 2 + 0], coords[triangles[j] * 2 + 1]);
    }
    this.renderHull(context);
  },
  renderTriangle: function(i, context) {
    const {coords, triangles} = this;
    context.moveTo(coords[triangles[i *= 3] * 2], coords[triangles[i] * 2 + 1]);
    context.lineTo(coords[triangles[i + 1] * 2], coords[triangles[i + 1] * 2 + 1]);
    context.lineTo(coords[triangles[i + 2] * 2], coords[triangles[i + 2] * 2 + 1]);
    context.closePath();
  },
  renderHull: function(context) {
    const {hull} = this;
    let node = hull;
    do {
      context.moveTo(node.x, node.y);
      context.lineTo(node.next.x, node.next.y);
    } while ((node = node.next) !== hull);
  }
});

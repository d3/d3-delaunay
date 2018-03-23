import Delaunator from "delaunator";
import Voronoi from "./voronoi.js";

export default class Delaunay {
  constructor(points, halfedges, hull, triangles) {
    this.points = points;
    this.halfedges = halfedges;
    this.hull = hull;
    this.triangles = triangles;
  }
  voronoi([xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {
    const {points, halfedges, hull, triangles} = this;
    const edges = new Uint32Array(halfedges.length);
    const i0 = new Uint32Array(points.length / 2);
    const i1 = new Uint32Array(points.length / 2);
    const v = new Float64Array(points.length * 2);
    const circumcenters = new Float64Array(triangles.length / 3 * 2);

    // Compute cell topology.
    for (let i = 0, e = 0, m = halfedges.length; i < m; ++i) {
      const t = triangles[i]; // Cell vertex.
      if (i0[t] !== i1[t]) continue; // Already connected.
      const e0 = i0[t] = e;
      let j = i;

      do { // Walk forward.
        edges[e++] = Math.floor(j / 3);
        j = halfedges[j];
        if (j === -1) break; // Went off the convex hull.
        j = j % 3 === 2 ? j - 2 : j + 1;
        if (triangles[j] !== t) break; // Bad triangulation; break early.
      } while (j !== i);

      if (j !== i) { // Stopped when walking forward; walk backward.
        const e1 = e;
        j = i;
        while (true) {
          j = halfedges[j % 3 === 0 ? j + 2 : j - 1];
          if (j === -1 || triangles[j] !== t) break;
          edges[e++] = Math.floor(j / 3);
        }
        if (e1 < e) {
          edges.subarray(e0, e1).reverse();
          edges.subarray(e0, e).reverse();
        }
      }

      i1[t] = e;
    }

    // Compute circumcenters.
    for (let i = 0, j = 0, n = triangles.length; i < n; i += 3, j += 2) {
      const t1 = triangles[i] * 2;
      const t2 = triangles[i + 1] * 2;
      const t3 = triangles[i + 2] * 2;
      const x1 = points[t1];
      const y1 = points[t1 + 1];
      const x2 = points[t2];
      const y2 = points[t2 + 1];
      const x3 = points[t3];
      const y3 = points[t3 + 1];
      const a2 = x1 - x2;
      const a3 = x1 - x3;
      const b2 = y1 - y2;
      const b3 = y1 - y3;
      const d1 = x1 * x1 + y1 * y1;
      const d2 = d1 - x2 * x2 - y2 * y2;
      const d3 = d1 - x3 * x3 - y3 * y3;
      const ab = (a3 * b2 - a2 * b3) * 2;
      circumcenters[j] = (b2 * d3 - b3 * d2) / ab;
      circumcenters[j + 1] = (a3 * d2 - a2 * d3) / ab;
    }

    // Compute exterior cell rays.
    {
      let node = hull;
      do {
        const {x: x1, y: y1, t: i, next: {x: x2, y: y2, t: j}} = node;
        const ci = Math.floor(i / 3) * 2;
        const cx = circumcenters[ci];
        const cy = circumcenters[ci + 1];
        const dx = (x1 + x2) / 2 - cx;
        const dy = (y1 + y2) / 2 - cy;
        const k = (x2 - x1) * (cy - y1) > (y2 - y1) * (cx - x1) ? -1 : 1;
        const ti = triangles[i] * 4;
        const tj = triangles[j] * 4;
        v[ti + 2] = v[tj] = k * dx;
        v[ti + 3] = v[tj + 1] = k * dy;
      } while ((node = node.next) !== hull);
    }

    return new Voronoi(this, circumcenters, edges, i0, i1, v, xmin, ymin, xmax, ymax);
  }
  render(context) {
    const {points, halfedges, triangles} = this;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < i) continue;
      const ti = triangles[i] * 2;
      const tj = triangles[j] * 2;
      context.moveTo(points[ti], points[ti + 1]);
      context.lineTo(points[tj], points[tj + 1]);
    }
    this.renderHull(context);
  }
  renderHull(context) {
    const {hull} = this;
    let node = hull;
    do {
      context.moveTo(node.x, node.y);
      context.lineTo(node.next.x, node.next.y);
    } while ((node = node.next) !== hull);
  }
  renderTriangle(i, context) {
    const {points, triangles} = this;
    const t0 = triangles[i *= 3] * 2;
    const t1 = triangles[i + 1] * 2;
    const t2 = triangles[i + 2] * 2;
    context.moveTo(points[t0], points[t0 + 1]);
    context.lineTo(points[t1], points[t1 + 1]);
    context.lineTo(points[t2], points[t2 + 1]);
    context.closePath();
  }
}

Delaunay.from = function(points, fx, fy) {
  const {coords, halfedges, hull, triangles} = Delaunator.from(points, fx, fy);
  return new Delaunay(coords, halfedges, hull, triangles);
};

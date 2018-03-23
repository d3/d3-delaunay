import Delaunator from "delaunator";
import Voronoi from "./voronoi.js";

function pointX(p) {
  return p[0];
}

function pointY(p) {
  return p[1];
}

export default class Delaunay {
  constructor(points) {
    const {halfedges, hull, triangles} = new Delaunator(points);
    this.points = points;
    this.halfedges = halfedges;
    this.hull = hull;
    this.triangles = triangles;
  }
  voronoi(bounds) {
    return new Voronoi(this, bounds);
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

Delaunay.from = function(points, fx = pointX, fy = pointY, that) {
  return new Delaunay("length" in points
      ? flatArray(points, fx, fy, that)
      : Float64Array.from(flatIterable(points, fx, fy, that)));
};

function flatArray(points, fx, fy, that) {
  const n = points.length;
  const array = new Float64Array(n * 2);
  for (let i = 0; i < n; ++i) {
    const p = points[i];
    array[2 * i] = fx.call(that, p, i, points);
    array[2 * i + 1] = fy.call(that, p, i, points);
  }
  return array;
}

function* flatIterable(points, fx, fy, that) {
  let i = 0;
  for (const p of points) {
    yield fx.call(that, p, i, points);
    yield fy.call(that, p, i, points);
    ++i;
  }
}

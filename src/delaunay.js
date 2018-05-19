import Delaunator from "delaunator";
import Path from "./path";
import Voronoi from "./voronoi.js";

const tau = 2 * Math.PI;

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
    this.hull = Uint32Array.from(hullIterable(hull));
    this.triangles = triangles;
  }
  voronoi(bounds) {
    return new Voronoi(this, bounds);
  }
  render(context) {
    const buffer = context == null ? context = new Path : undefined;
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
    return buffer && buffer.value();
  }
  renderPoints(context, r = 2) {
    const buffer = context == null ? context = new Path : undefined;
    const {points} = this;
    for (let i = 0, n = points.length; i < n; i += 2) {
      const x = points[i], y = points[i + 1];
      context.moveTo(x + r, y);
      context.arc(x, y, r, 0, tau);
    }
    return buffer && buffer.value();
  }
  renderHull(context) {
    const buffer = context == null ? context = new Path : undefined;
    const {points, hull, triangles} = this;
    const n = hull.length;
    let i0, i1 = triangles[hull[n - 1]] * 2;
    for (let i = 0; i < n; ++i) {
      i0 = i1, i1 = triangles[hull[i]] * 2;
      context.moveTo(points[i0], points[i0 + 1]);
      context.lineTo(points[i1], points[i1 + 1]);
    }
    return buffer && buffer.value();
  }
  renderTriangle(i, context) {
    const buffer = context == null ? context = new Path : undefined;
    const {points, triangles} = this;
    const t0 = triangles[i *= 3] * 2;
    const t1 = triangles[i + 1] * 2;
    const t2 = triangles[i + 2] * 2;
    context.moveTo(points[t0], points[t0 + 1]);
    context.lineTo(points[t1], points[t1 + 1]);
    context.lineTo(points[t2], points[t2 + 1]);
    context.closePath();
    return buffer && buffer.value();
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
    array[i * 2] = fx.call(that, p, i, points);
    array[i * 2 + 1] = fy.call(that, p, i, points);
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

function* hullIterable(hull) {
  let node = hull;
  do yield node.t;
  while ((node = node.next) !== hull);
}

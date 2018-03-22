export default class Cell {
  constructor(voronoi) {
    this.voronoi = voronoi;
    this.triangles = []; // Triangle indexes, similar to halfedges.
    this.v0 = null; // Starting edge vector if hull cell.
    this.vn = null; // Ending edge vector if hull cell.
  }
  _points() {
    const {triangles, voronoi: {circumcenters}} = this;
    if (triangles === null) return null;
    const points = new Float64Array(triangles.length * 2);
    for (let i = 0, n = triangles.length; i < n; ++i) {
      const pi = i * 2;
      const ti = triangles[i] * 2;
      points[pi] = circumcenters[ti];
      points[pi + 1] = circumcenters[ti + 1];
    }
    return points;
  }
  render(context) {
    const {v0, vn} = this;
    let points;
    if ((points = this._points()) === null) return;
    if ((points = this.voronoi._clip(points, v0, vn)) === null) return;
    context.moveTo(points[0], points[1]);
    for (let i = 2, n = points.length; i < n; i += 2) { // TODO Avoid last closing coordinate.
      context.lineTo(points[i], points[i + 1]);
    }
    context.closePath();
  }
  contains(x, y) {
    const points = this._points();
    return points === null ? false
        : this.v0 === null ? containsFinite(points, x, y)
        : containsInfinite(points, this.v0, this.vn, x, y);
  }
}

export function containsFinite(points, x, y) {
  const n = points.length;
  let x0, y0, x1 = points[n - 2], y1 = points[n - 1];
  for (let i = 0; i < n; i += 2) {
    x0 = x1, y0 = y1, x1 = points[i], y1 = points[i + 1];
    if ((x1 - x0) * (y - y0) < (y1 - y0) * (x - x0)) {
      return false;
    }
  }
  return true;
}

export function containsInfinite(points, [v0x, v0y], [vnx, vny], x, y) {
  const n = points.length;
  let x0, y0, x1 = points[0], y1 = points[1];
  if ((x0 + v0x - x) * (y1 - y) < (y0 + v0y - y) * (x1 - x)) return false;
  for (let i = 2; i < n; i += 2) {
    x0 = x1, y0 = y1, x1 = points[i], y1 = points[i + 1];
    if ((x0 - x) * (y1 - y) < (y0 - y) * (x1 - x)) return false;
  }
  if ((x0 - x) * (y1 + vny - y) < (y0 - y) * (x1 + vnx - x)) return false;
  return true;
}

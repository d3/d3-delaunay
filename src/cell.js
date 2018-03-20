export default class Cell {
  constructor(voronoi) {
    this.voronoi = voronoi;
    this.triangles = []; // Triangle indexes, similar to halfedges.
    this.v0 = null; // Starting edge vector if hull cell.
    this.vn = null; // Ending edge vector if hull cell.
  }
  _connect(i, j) {
    const {triangles} = this;
    if (j < 0) {
      if (triangles.length === 0) triangles.push([i]);
      return;
    }
    for (let n = triangles.length, a = 0; a < n; ++a) {
      let sa = triangles[a];
      if (sa[0] === j) {
        for (let b = a + 1; b < n; ++b) {
          let sb = triangles[b];
          if (sb[sb.length - 1] === i) {
            triangles.splice(b, 1);
            triangles[a] = sa = sb.concat(sa);
            return;
          }
        }
        sa.unshift(i);
        return;
      }
      if (sa[sa.length - 1] === i) {
        for (let b = a + 1; b < n; ++b) {
          let sb = triangles[b];
          if (sb[0] === j) {
            triangles.splice(b, 1);
            triangles[a] = sa = sa.concat(sb);
            return;
          }
        }
        sa.push(j);
        return;
      }
    }
    triangles.push([i, j]);
  }
  _points() {
    const {triangles, voronoi: {circumcenters}} = this;
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
    const points = this.voronoi._clip(this._points(), v0, vn);
    if (points === null) return;
    context.moveTo(points[0], points[1]);
    for (let i = 2, n = points.length; i < n; i += 2) { // TODO Avoid last closing coordinate.
      context.lineTo(points[i], points[i + 1]);
    }
    context.closePath();
  }
  contains(x, y) {
    const points = this._points();
    return this.v0 === null
        ? containsFinite(points, x, y)
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

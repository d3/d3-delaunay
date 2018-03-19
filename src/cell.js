export default class Cell {
  constructor(voronoi) {
    this.voronoi = voronoi;
    this.triangles = []; // Triangle indexes, similar to halfedges.
    this.v0 = null; // Starting edge vector if hull cell.
    this.vn = null; // Ending edge vector if hull cell.
  }
  render(context) {
    const {v0, vn} = this;
    let points;
    if (!(points = this._points())) return;
    if (!(points = this.voronoi._clip(points, v0, vn))) return;
    context.moveTo(points[0][0], points[0][1]);
    for (let i = 1, n = points.length; i < n; ++i) { // TODO Avoid last closing coordinate.
      context.lineTo(points[i][0], points[i][1]);
    }
    context.closePath();
  }
  _connect(i, j) {
    const {triangles} = this;
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
    if (!triangles) return null;
    let points = new Array(triangles.length); // TODO Zip as [x0, y0, …].
    for (let i = 0, n = triangles.length; i < n; ++i) {
      points[i] = [
        circumcenters[triangles[i] * 2 + 0],
        circumcenters[triangles[i] * 2 + 1]
      ];
    }
    return points;
  }
  contains(x, y) {
    let points = this._points();
    return points === null ? false
        : this.v0 ? containsInfinite({points, v0: this.v0, vn: this.vn}, x, y)
        : containsFinite(points, x, y);
  }
}

// TODO Represent points zipped as [x0, y0, x1, y1, …].
// TODO Change signature to (points, x, y).
export function containsFinite(points, x, y) {
  let n = points.length, x0, y0, [x1, y1] = points[n - 1];
  for (let i = 0; i < n; ++i) {
    x0 = x1, y0 = y1, [x1, y1] = points[i];
    if ((x1 - x0) * (y - y0) < (y1 - y0) * (x - x0)) {
      return false;
    }
  }
  return true;
}

// TODO Represent points zipped as [x0, y0, x1, y1, …].
// TODO Change signature to (polygon, x, y).
// TODO Inline the definition of clockwise.
export function containsInfinite({points, v0, vn}, x, y) {
  let n = points.length, p0, p1 = points[0];
  if (clockwise(x, y, [p1[0] + v0[0], p1[1] + v0[1]], p1)) return false;
  for (let i = 1; i < n; ++i) if (clockwise(x, y, p0 = p1, p1 = points[i])) return false;
  if (clockwise(x, y, p1, [p1[0] + vn[0], p1[1] + vn[1]])) return false;
  return true;
}

// TODO Inline into containsInfinite.
function clockwise(x0, y0, [x1, y1], [x2, y2]) {
  return (x1 - x0) * (y2 - y0) < (y1 - y0) * (x2 - x0);
}

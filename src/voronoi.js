export default class Voronoi {
  constructor(delaunay, [xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {
    if (!((xmax = +xmax) >= (xmin = +xmin)) || !((ymax = +ymax) >= (ymin = +ymin))) throw new Error("invalid bounds");
    const {points, halfedges, hull, triangles} = this.delaunay = delaunay;
    const circumcenters = this.circumcenters = new Float64Array(triangles.length / 3 * 2);
    const edges = this.edges = new Uint32Array(halfedges.length);
    const index = this.index = new Uint32Array(points.length);
    const vectors = this.vectors = new Float64Array(points.length * 2);
    this.xmax = xmax, this.xmin = xmin;
    this.ymax = ymax, this.ymin = ymin;

    // Compute cell topology.
    for (let i = 0, e = 0, m = halfedges.length; i < m; ++i) {
      const t = triangles[i]; // Cell vertex.
      if (index[t * 2] !== index[t * 2 + 1]) continue; // Already connected.
      const e0 = index[t * 2] = e;
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

      index[t * 2 + 1] = e;
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
    for (let n = hull.length, p0, x0, y0, p1 = triangles[hull[n - 1]] * 2, x1 = points[p1], y1 = points[p1 + 1], i = 0; i < n; ++i) {
      p0 = p1, x0 = x1, y0 = y1, p1 = triangles[hull[i]] * 2, x1 = points[p1], y1 = points[p1 + 1];
      vectors[p0 * 2 + 2] = vectors[p1 * 2] = y0 - y1;
      vectors[p0 * 2 + 3] = vectors[p1 * 2 + 1] = x1 - x0;
    }
  }
  render(context) {
    const {delaunay: {halfedges, hull, triangles}, circumcenters, vectors} = this;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < i) continue;
      const ti = Math.floor(i / 3) * 2;
      const tj = Math.floor(j / 3) * 2;
      const xi = circumcenters[ti];
      const yi = circumcenters[ti + 1];
      const xj = circumcenters[tj];
      const yj = circumcenters[tj + 1];
      this._renderSegment(xi, yi, xj, yj, context);
    }
    for (let i = 0, n = hull.length; i < n; ++i) {
      const t = Math.floor(hull[i] / 3) * 2;
      const x = circumcenters[t];
      const y = circumcenters[t + 1];
      const v = triangles[hull[i]] * 4;
      const p = this._project(x, y, vectors[v + 2], vectors[v + 3]);
      if (p) this._renderSegment(x, y, p[0], p[1], context);
    }
  }
  renderBounds(context) {
    context.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
  }
  renderCell(i, context) {
    const points = this._clip(i);
    if (points === null) return;
    context.moveTo(points[0], points[1]);
    for (let i = 2, n = points.length; i < n; i += 2) {
      context.lineTo(points[i], points[i + 1]);
    }
    context.closePath();
  }
  _renderSegment(x0, y0, x1, y1, context) {
    let S;
    const c0 = this._regioncode(x0, y0);
    const c1 = this._regioncode(x1, y1);
    if (c0 === 0 && c1 === 0) {
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
    } else if (S = this._clipSegment(x0, y0, x1, y1, c0, c1)) {
      context.moveTo(S[0], S[1]);
      context.lineTo(S[2], S[3]);
    }
  }
  contains(i, x, y) {
    const {vectors: V} = this;
    const points = this._cell(i);
    const v = i * 4;
    return points === null ? false
        : V[v] || V[v + 1] ? containsInfinite(points, V[v], V[v + 1], V[v + 2], V[v + 3], x, y)
        : containsFinite(points, x, y);
  }
  find(x, y, i = 0) {
    const {delaunay: {halfedges, points, triangles}, edges, index} = this;
    if (points.length === 0 || (x = +x, x !== x) || (y = +y, y !== y)) return -1;
    let di = (x - points[i * 2]) ** 2 + (y - points[i * 2 + 1]) ** 2;
    while (true) {
      const j0 = index[i * 2];
      const j1 = index[i * 2 + 1];
      let c = i, dc = di;
      let k = edges[j0] * 3;
      switch (i) { // Test previous point on triangle (for hull).
        case triangles[k]: k = triangles[k + 2]; break;
        case triangles[k + 1]: k = triangles[k]; break;
        case triangles[k + 2]: k = triangles[k + 1]; break;
      }
      let dk = (x - points[k * 2]) ** 2 + (y - points[k * 2 + 1]) ** 2;
      if (dk < dc) dc = dk, c = k;
      for (let j = j0; j < j1; ++j) {
        k = edges[j] * 3;
        switch (i) { // Test next point on triangle.
          case triangles[k]: k = triangles[k + 1]; break;
          case triangles[k + 1]: k = triangles[k + 2]; break;
          case triangles[k + 2]: k = triangles[k]; break;
        }
        dk = (x - points[k * 2]) ** 2 + (y - points[k * 2 + 1]) ** 2;
        if (dk < dc) dc = dk, c = k;
      }
      if (c === i) return c;
      i = c, di = dc;
    }
  }
  _cell(i) {
    const {index, edges, circumcenters} = this;
    const t0 = index[i * 2];
    const t1 = index[i * 2 + 1];
    if (t0 === t1) return null;
    const points = new Float64Array((t1 - t0) * 2);
    for (let t = t0, j = 0; t < t1; ++t, j += 2) {
      const ti = edges[t] * 2;
      points[j] = circumcenters[ti];
      points[j + 1] = circumcenters[ti + 1];
    }
    return points;
  }
  _clip(i) {
    const points = this._cell(i);
    if (points === null) return null;
    const {vectors: V} = this;
    const v = i * 4;
    return V[v] || V[v + 1]
        ? this._clipInfinite(points, V[v], V[v + 1], V[v + 2], V[v + 3])
        : this._clipFinite(points);
  }
  _clipFinite(points) {
    const n = points.length;
    let P = null, S;
    let x0, y0, x1 = points[n - 2], y1 = points[n - 1];
    let c0, c1 = this._regioncode(x1, y1);
    let e0, e1;
    for (let i = 0; i < n; i += 2) {
      x0 = x1, y0 = y1, x1 = points[i], y1 = points[i + 1];
      c0 = c1, c1 = this._regioncode(x1, y1);
      if (c0 === 0 && c1 === 0) {
        e0 = e1, e1 = 0;
        if (P) P.push(x1, y1);
        else P = [x1, y1];
      } else if (S = this._clipSegment(x0, y0, x1, y1, c0, c1)) {
        const [sx0, sy0, sx1, sy1] = S;
        if (c0) {
          e0 = e1, e1 = this._edgecode(sx0, sy0);
          if (e0 && e1) this._edge(points, e0, e1, P);
          if (P) P.push(sx0, sy0);
          else P = [sx0, sy0];
        }
        e0 = e1, e1 = this._edgecode(sx1, sy1);
        if (e0 && e1) this._edge(points, e0, e1, P);
        if (P) P.push(sx1, sy1);
        else P = [sx1, sy1];
      }
    }
    if (P) {
      e0 = e1, e1 = this._edgecode(P[0], P[1]);
      if (e0 && e1) this._edge(points, e0, e1, P);
    } else if (containsFinite(points, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
      return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
    }
    return P;
  }
  _clipSegment(x0, y0, x1, y1, c0, c1) {
    while (true) {
      if (c0 === 0 && c1 === 0) return [x0, y0, x1, y1];
      if (c0 & c1) return;
      let x, y, c = c0 || c1;
      if (c & 0b1000) x = x0 + (x1 - x0) * (this.ymax - y0) / (y1 - y0), y = this.ymax;
      else if (c & 0b0100) x = x0 + (x1 - x0) * (this.ymin - y0) / (y1 - y0), y = this.ymin;
      else if (c & 0b0010) y = y0 + (y1 - y0) * (this.xmax - x0) / (x1 - x0), x = this.xmax;
      else y = y0 + (y1 - y0) * (this.xmin - x0) / (x1 - x0), x = this.xmin;
      if (c0) x0 = x, y0 = y, c0 = this._regioncode(x0, y0);
      else x1 = x, y1 = y, c1 = this._regioncode(x1, y1);
    }
  }
  // TODO Consolidate corner traversal code using edge?
  _clipInfinite(points, vx0, vy0, vxn, vyn) {
    let P = Array.from(points), p;
    if (p = this._project(P[0], P[1], vx0, vy0)) P.unshift(p[0], p[1]);
    if (p = this._project(P[P.length - 2], P[P.length - 1], vxn, vyn)) P.unshift(p[0], p[1]);
    if (P = this._clipFinite(P)) {
      for (let i = 0, n = P.length, c0, c1 = this._edgecode(P[n - 2], P[n - 1]); i < n; i += 2) {
        c0 = c1, c1 = this._edgecode(P[i], P[i + 1]);
        if (c0 && c1) {
          while (c0 !== c1) {
            let cx, cy;
            switch (c0) {
              case 0b0101: c0 = 0b0100; continue; // top-left
              case 0b0100: c0 = 0b0110, cx = this.xmax, cy = this.ymin; break; // top
              case 0b0110: c0 = 0b0010; continue; // top-right
              case 0b0010: c0 = 0b1010, cx = this.xmax, cy = this.ymax; break; // right
              case 0b1010: c0 = 0b1000; continue; // bottom-right
              case 0b1000: c0 = 0b1001, cx = this.xmin, cy = this.ymax; break; // bottom
              case 0b1001: c0 = 0b0001; continue; // bottom-left
              case 0b0001: c0 = 0b0101, cx = this.xmin, cy = this.ymin; break; // left
            }
            if (containsInfinite(points, vx0, vy0, vxn, vyn, cx, cy)) {
              P.splice(i, 0, cx, cy), n += 2, i += 2;
            }
          }
        }
      }
    } else if (containsInfinite(points, vx0, vy0, vxn, vyn, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
      P.push(this.xmin, this.ymin, this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax);
    }
    return P;
  }
  // TODO Allow containsInfinite instead of contains for clipInfinite?
  _edge(points, e0, e1, P) {
    while (e0 !== e1) {
      let cx, cy;
      switch (e0) {
        case 0b0101: e0 = 0b0100; continue; // top-left
        case 0b0100: e0 = 0b0110, cx = this.xmax, cy = this.ymin; break; // top
        case 0b0110: e0 = 0b0010; continue; // top-right
        case 0b0010: e0 = 0b1010, cx = this.xmax, cy = this.ymax; break; // right
        case 0b1010: e0 = 0b1000; continue; // bottom-right
        case 0b1000: e0 = 0b1001, cx = this.xmin, cy = this.ymax; break; // bottom
        case 0b1001: e0 = 0b0001; continue; // bottom-left
        case 0b0001: e0 = 0b0101, cx = this.xmin, cy = this.ymin; break; // left
      }
      if (containsFinite(points, cx, cy)) {
        P.push(cx, cy);
      }
    }
  }
  _project(x0, y0, vx, vy) {
    let t = Infinity, c, x, y;
    if (vy < 0) { // top
      if (y0 <= this.ymin) return;
      if ((c = (this.ymin - y0) / vy) < t) y = this.ymin, x = x0 + (t = c) * vx;
    } else if (vy > 0) { // bottom
      if (y0 >= this.ymax) return;
      if ((c = (this.ymax - y0) / vy) < t) y = this.ymax, x = x0 + (t = c) * vx;
    }
    if (vx > 0) { // right
      if (x0 >= this.xmax) return;
      if ((c = (this.xmax - x0) / vx) < t) x = this.xmax, y = y0 + (t = c) * vy;
    } else if (vx < 0) { // left
      if (x0 <= this.xmin) return;
      if ((c = (this.xmin - x0) / vx) < t) x = this.xmin, y = y0 + (t = c) * vy;
    }
    return [x, y];
  }
  _edgecode(x, y) {
    return (x === this.xmin ? 0b0001
        : x === this.xmax ? 0b0010 : 0b0000)
        | (y === this.ymin ? 0b0100
        : y === this.ymax ? 0b1000 : 0b0000);
  }
  _regioncode(x, y) {
    return (x < this.xmin ? 0b0001
        : x > this.xmax ? 0b0010 : 0b0000)
        | (y < this.ymin ? 0b0100
        : y > this.ymax ? 0b1000 : 0b0000);
  }
}

function containsFinite(points, x, y) {
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

function containsInfinite(points, vx0, vy0, vxn, vyn, x, y) {
  const n = points.length;
  let x0, y0, x1 = points[0], y1 = points[1];
  if ((x1 + vx0 - x) * (y1 - y) < (y1 + vy0 - y) * (x1 - x)) return false;
  for (let i = 2; i < n; i += 2) {
    x0 = x1, y0 = y1, x1 = points[i], y1 = points[i + 1];
    if ((x0 - x) * (y1 - y) < (y0 - y) * (x1 - x)) return false;
  }
  if ((x1 - x) * (y1 + vyn - y) < (y1 - y) * (x1 + vxn - x)) return false;
  return true;
}

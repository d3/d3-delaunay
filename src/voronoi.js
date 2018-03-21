import Cell, {containsFinite, containsInfinite} from "./cell";

export default class Voronoi {
  constructor(cells, circumcenters, delaunay, xmin, ymin, xmax, ymax) {
    if (!((xmax = +xmax) >= (xmin = +xmin)) || !((ymax = +ymax) >= (ymin = +ymin))) throw new Error("invalid bounds");
    this.cells = cells;
    this.circumcenters = circumcenters;
    this.delaunay = delaunay;
    this.xmax = xmax, this.xmin = xmin;
    this.ymax = ymax, this.ymin = ymin;
  }
  find(x, y) {
    return this.cells[this.findIndex(x, y)];
  }
  findIndex(x, y) {
    const {cells, delaunay: {halfedges, points, triangles}} = this;
    if (cells.length === 0 || (x = +x, x !== x) || (y = +y, y !== y)) return -1;
    let c = 0, c2 = (x - points[0]) ** 2 + (y - points[1]) ** 2;
    while (true) {
      let d = c, d2 = c2;
      for (let T = cells[c].triangles, i = 0, n = T.length; i < n; ++i) {
        let k = T[i] * 3;
        switch (c) {
          case triangles[k]: k = triangles[k + 1]; break;
          case triangles[k + 1]: k = triangles[k + 2]; break;
          case triangles[k + 2]: k = triangles[k]; break;
        }
        let k2 = (x - points[k * 2]) ** 2 + (y - points[k * 2 + 1]) ** 2;
        if (k2 < d2) d2 = k2, d = k;
      }
      if (d === c) return d;
      c = d, c2 = d2;
    }
  }
  render(context) {
    const {cells, circumcenters, delaunay: {halfedges, hull}} = this;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < i) continue;
      const ti = Math.floor(i / 3) * 2;
      const tj = Math.floor(j / 3) * 2;
      context.moveTo(circumcenters[ti], circumcenters[ti + 1]);
      context.lineTo(circumcenters[tj], circumcenters[tj + 1]);
    }
    let node = hull;
    do {
      const t = Math.floor(node.t / 3) * 2;
      const x = circumcenters[t];
      const y = circumcenters[t + 1];
      const p = this._project(x, y, cells[node.i].vn);
      if (p) {
        context.moveTo(x, y);
        context.lineTo(p[0], p[1]);
      }
    } while ((node = node.next) !== hull);
  }
  renderBounds(context) {
    context.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
  }
  _clip(points, v0, vn) {
    return v0 ? this._clipInfinite(points, v0, vn) : this._clipFinite(points);
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
      if (c & 0b1000) x = x0 + (x1 - x0) * (this.ymax - y0) / (y1 - y0), y = this.ymax, c ^= 0b1000;
      else if (c & 0b0100) x = x0 + (x1 - x0) * (this.ymin - y0) / (y1 - y0), y = this.ymin, c ^= 0b0100;
      else if (c & 0b0010) y = y0 + (y1 - y0) * (this.xmax - x0) / (x1 - x0), x = this.xmax, c ^= 0b0010;
      else y = y0 + (y1 - y0) * (this.xmin - x0) / (x1 - x0), x = this.xmin, c ^= 0b0001;
      if (c0) x0 = x, y0 = y, c0 = c;
      else x1 = x, y1 = y, c1 = c;
    }
  }
  // TODO Consolidate corner traversal code using edge?
  _clipInfinite(points, v0, vn) {
    let P = Array.from(points), p;
    if (p = this._project(P[0], P[1], v0)) P.unshift(p[0], p[1]);
    if (p = this._project(P[P.length - 2], P[P.length - 1], vn)) P.unshift(p[0], p[1]);
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
            if (containsInfinite(points, v0, vn, cx, cy)) {
              P.splice(i, 0, cx, cy), n += 2, i += 2;
            }
          }
        }
      }
    } else if (containsInfinite(points, v0, vn, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
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
  _project(x0, y0, [vx, vy]) {
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

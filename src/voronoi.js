import Cell, {containsFinite, containsInfinite} from "./cell";

export default class Voronoi {
  constructor(delaunay, [xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {
    const {coords, halfedges, hull, triangles, trianglesLen} = delaunay;
    this.delaunay = delaunay;
    this.xmin = xmin = +xmin;
    this.xmax = xmax = +xmax;
    this.ymin = ymin = +ymin;
    this.ymax = ymax = +ymax;

    if (!(xmax >= xmin) || !(ymax >= ymin)) throw new Error("invalid bounds");

    // Compute cell topology.
    const cells = this.cells = new Array(coords.length / 2);
    for (let i = 0, n = cells.length; i < n; ++i) {
      cells[i] = new Cell(this);
    }
    for (let i = 0, m = halfedges.length; i < m; ++i) {
      cells[triangles[i]]._connect(Math.floor(i / 3), Math.floor(halfedges[i] / 3));
    }
    for (let i = 0, n = cells.length; i < n; ++i) {
      const cell = cells[i];
      cell.triangles = cell.triangles[0];
    }

    // Compute circumcenters.
    const circumcenters = this.circumcenters = new Float64Array(trianglesLen / 3 * 2);
    for (let i = 0, j = 0, n = trianglesLen; i < n; i += 3, j += 2) {
      const x1 = coords[triangles[i + 0] * 2 + 0];
      const y1 = coords[triangles[i + 0] * 2 + 1];
      const x2 = coords[triangles[i + 1] * 2 + 0];
      const y2 = coords[triangles[i + 1] * 2 + 1];
      const x3 = coords[triangles[i + 2] * 2 + 0];
      const y3 = coords[triangles[i + 2] * 2 + 1];
      const a2 = x1 - x2;
      const a3 = x1 - x3;
      const b2 = y1 - y2;
      const b3 = y1 - y3;
      const d1 = x1 * x1 + y1 * y1;
      const d2 = d1 - x2 * x2 - y2 * y2;
      const d3 = d1 - x3 * x3 - y3 * y3;
      const ab = (a3 * b2 - a2 * b3) * 2;
      circumcenters[j + 0] = (b2 * d3 - b3 * d2) / ab;
      circumcenters[j + 1] = (a3 * d2 - a2 * d3) / ab;
    }

    // Compute exterior cell rays.
    {
      let node = hull;
      do {
        const {x: x1, y: y1, t: i, next: {x: x2, y: y2, t: j}} = node;
        const cx = circumcenters[Math.floor(i / 3) * 2 + 0];
        const cy = circumcenters[Math.floor(i / 3) * 2 + 1];
        const dx = (x1 + x2) / 2 - cx;
        const dy = (y1 + y2) / 2 - cy;
        const k = (x2 - x1) * (cy - y1) > (y2 - y1) * (cx - x1) ? -1 : 1;
        cells[triangles[i]].vn = cells[triangles[j]].v0 = [k * dx, k * dy];
      } while ((node = node.next) !== hull);
    }
  }
  render(context) {
    const {halfedges} = this.delaunay;
    const {cells, circumcenters} = this;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < 0 || j < i) continue;
      context.moveTo(
        circumcenters[Math.floor(i / 3) * 2 + 0],
        circumcenters[Math.floor(i / 3) * 2 + 1]
      );
      context.lineTo(
        circumcenters[Math.floor(j / 3) * 2 + 0],
        circumcenters[Math.floor(j / 3) * 2 + 1]
      );
    }
    for (let i = 0, n = cells.length; i < n; ++i) {
      const cell = cells[i];
      if (cell.v0) {
        let p0 = [
          circumcenters[cell.triangles[0] * 2 + 0],
          circumcenters[cell.triangles[0] * 2 + 1]
        ];
        let p1 = this._project(p0, cell.v0);
        if (p1) {
          context.moveTo(p0[0], p0[1]);
          context.lineTo(p1[0], p1[1]);
        }
      }
    }
  }
  renderBounds(context) {
    context.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
  }
  _clip(points, v0, vn) {
    return v0
        ? this._clipInfinite(points, v0, vn)
        : this._clipFinite(points);
  }
  // TODO Construct P lazily; do not copy if no clipping is needed.
  // TODO Represent points zipped as [x0, y0, x1, y1, …].
  _clipFinite(points) {
    let n = points.length, P = [], S;
    let p0, p1 = points[n - 1];
    let c0, c1 = this._regioncode(p1[0], p1[1]);
    let e0, e1;
    for (let i = 0; i < n; ++i) {
      p0 = p1, p1 = points[i];
      c0 = c1, c1 = this._regioncode(p1[0], p1[1]);
      if (c0 === 0 && c1 === 0) {
        e0 = e1, e1 = 0;
        P.push(p1);
      } else if (S = this._clipSegment(p0, p1, c0, c1)) {
        let [s0, s1] = S;
        if (c0) {
          e0 = e1, e1 = this._edgecode(s0[0], s0[1]);
          if (e0 && e1) this._edge(points, e0, e1, P);
          P.push(s0);
        }
        e0 = e1, e1 = this._edgecode(s1[0], s1[1]);
        if (e0 && e1) this._edge(points, e0, e1, P);
        P.push(s1);
      }
    }
    if (P.length > 0) {
      e0 = e1, e1 = this._edgecode(P[0][0], P[0][1]);
      if (e0 && e1) this._edge(points, e0, e1, P);
    } else if (containsFinite(points, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
      P.push([this.xmax, this.ymin], [this.xmax, this.ymax], [this.xmin, this.ymax], [this.xmin, this.ymin]);
    } else {
      return null;
    }
    return P;
  }
  // TODO Change signature to (x0, y0, x1, y1, …).
  // TODO Update c0 or c1 directly rather than calling regioncode again.
  _clipSegment([x0, y0], [x1, y1], c0, c1) {
    while (true) {
      if (c0 === 0 && c1 === 0) return [[x0, y0], [x1, y1]];
      if (c0 & c1) return;
      let x, y, c = c0 || c1;
      if (c & 0b1000) x = x0 + (x1 - x0) * (this.ymax - y0) / (y1 - y0), y = this.ymax;
      else if (c & 0b0100) x = x0 + (x1 - x0) * (this.ymin - y0) / (y1 - y0), y = this.ymin;
      else if (c & 0b0010) y = y0 + (y1 - y0) * (this.xmax - x0) / (x1 - x0), x = this.xmax;
      else y = y0 + (y1 - y0) * (this.xmin - x0) / (x1 - x0), x = this.xmin;
      if (c === c0) x0 = x, y0 = y, c0 = this._regioncode(x0, y0);
      else x1 = x, y1 = y, c1 = this._regioncode(x1, y1);
    }
  }
  // TODO Represent points zipped as [x0, y0, x1, y1, …].
  // TODO Consolidate corner traversal code using edge?
  _clipInfinite(points, v0, vn) {
    let P = points.slice(), p;
    if (p = this._project(P[0], v0)) P.unshift(p);
    if (p = this._project(P[P.length - 1], vn)) P.unshift(p);
    if (P = this._clipFinite(P)) {
      for (let i = 0, n = P.length, c0, c1 = this._edgecode(P[n - 1][0], P[n - 1][1]); i < n; ++i) {
        c0 = c1, c1 = this._edgecode(P[i][0], P[i][1]);
        if (c0 && c1) {
          while (c0 !== c1) {
            let c;
            switch (c0) {
              case 0b0101: c0 = 0b0100; continue; // top-left
              case 0b0100: c0 = 0b0110, c = [this.xmax, this.ymin]; break; // top
              case 0b0110: c0 = 0b0010; continue; // top-right
              case 0b0010: c0 = 0b1010, c = [this.xmax, this.ymax]; break; // right
              case 0b1010: c0 = 0b1000; continue; // bottom-right
              case 0b1000: c0 = 0b1001, c = [this.xmin, this.ymax]; break; // bottom
              case 0b1001: c0 = 0b0001; continue; // bottom-left
              case 0b0001: c0 = 0b0101, c = [this.xmin, this.ymin]; break; // left
            }
            if (containsInfinite(points, v0, vn, c[0], c[1])) {
              P.splice(i, 0, c), ++n, ++i;
            }
          }
        }
      }
    } else if (containsInfinite(points, v0, vn, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
      P.push([this.xmin, this.ymin], [this.xmax, this.ymin], [this.xmax, this.ymax], [this.xmin, this.ymax]);
    } else {
      return null;
    }
    return P;
  }
  // TODO Represent points zipped as [x0, y0, x1, y1, …].
  // TODO Allow containsInfinite instead of contains for clipInfinite?
  _edge(points, e0, e1, P) {
    while (e0 !== e1) {
      let p;
      switch (e0) {
        case 0b0101: e0 = 0b0100; continue; // top-left
        case 0b0100: e0 = 0b0110, p = [this.xmax, this.ymin]; break; // top
        case 0b0110: e0 = 0b0010; continue; // top-right
        case 0b0010: e0 = 0b1010, p = [this.xmax, this.ymax]; break; // right
        case 0b1010: e0 = 0b1000; continue; // bottom-right
        case 0b1000: e0 = 0b1001, p = [this.xmin, this.ymax]; break; // bottom
        case 0b1001: e0 = 0b0001; continue; // bottom-left
        case 0b0001: e0 = 0b0101, p = [this.xmin, this.ymin]; break; // left
      }
      if (containsFinite(points, p[0], p[1])) {
        P.push(p);
      }
    }
  }
  // TODO Change signature to (x0, y0, vx, vy).
  _project([x0, y0], [vx, vy]) {
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

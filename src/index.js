import Delaunay from "delaunator";
export {default as Delaunay} from "delaunator";

Object.assign(Delaunay.prototype, {
  voronoi: function(bounds) {
    return new Voronoi(this, bounds);
  },
  path: function(context) {
    const {coords, halfedges, triangles} = this;
    for (let i = 0, n = halfedges.length; i < n; ++i) {
      const j = halfedges[i];
      if (j < 0 || j < i) continue;
      context.moveTo(coords[triangles[i] * 2 + 0], coords[triangles[i] * 2 + 1]);
      context.lineTo(coords[triangles[j] * 2 + 0], coords[triangles[j] * 2 + 1]);
    }
  }
});

// TODO Add voronoi.path([context]).
// TODO Add cell.contains(x, y).
// TODO Make cell.path(context)’s context optional and generate SVG.
export class Voronoi {
  constructor({coords, halfedges, hull, triangles, trianglesLen}, [xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {

    class Cell {
      constructor() {
        this.triangles = []; // Triangle indexes, similar to halfedges.
        this.v0 = null; // Starting edge vector if hull cell.
        this.vn = null; // Ending edge vector if hull cell.
      }
      path(context) {
        const {triangles, v0, vn} = this;
        if (!triangles) return; // Coincident point.
        let points = new Array(triangles.length); // TODO Zip as [x0, y0, …].
        for (let i = 0, n = triangles.length; i < n; ++i) {
          points[i] = [
            circumcenters[triangles[i] * 2 + 0],
            circumcenters[triangles[i] * 2 + 1]
          ];
        }
        points = v0 ? clipInfinite({points, v0, vn}) : clip(points); // TODO Avoid restructuring.
        if (!points) return;
        context.moveTo(points[0][0], points[0][1]);
        for (let i = 1, n = points.length; i < n; ++i) { // TODO Avoid last closing coordinate.
          context.lineTo(points[i][0], points[i][1]);
        }
        context.closePath();
      }
    }

    // Compute cell topology.
    const cells = this.cells = new Array(coords.length / 2);
    for (let i = 0, n = cells.length; i < n; ++i) {
      cells[i] = new Cell(this);
    }
    for (let i = 0, m = halfedges.length; i < m; ++i) {
      const j = halfedges[i];
      if (j < 0) continue;
      connect(cells[triangles[i]].triangles, Math.floor(i / 3), Math.floor(j / 3));
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

    // Coalesce the cell.
    for (let i = 0, n = cells.length; i < n; ++i) {
      const cell = cells[i];
      cell.triangles = cell.triangles[0];
    }

    // TODO Construct P lazily; do not copy if no clipping is needed.
    // TODO Represent points zipped as [x0, y0, x1, y1, …].
    function clip(points) {
      let n = points.length, P = [], S;
      let p0, p1 = points[n - 1];
      let c0, c1 = regioncode(p1[0], p1[1]);
      let e0, e1;
      for (let i = 0; i < n; ++i) {
        p0 = p1, p1 = points[i];
        c0 = c1, c1 = regioncode(p1[0], p1[1]);
        if (c0 === 0 && c1 === 0) {
          e0 = e1, e1 = 0;
          P.push(p1);
        } else if (S = clipSegment(p0, p1, c0, c1)) {
          let [s0, s1] = S;
          if (c0) {
            e0 = e1, e1 = edgecode(s0[0], s0[1]);
            if (e0 && e1) edge(points, e0, e1, P);
            P.push(s0);
          }
          e0 = e1, e1 = edgecode(s1[0], s1[1]);
          if (e0 && e1) edge(points, e0, e1, P);
          P.push(s1);
        }
      }
      if (P.length > 0) {
        e0 = e1, e1 = edgecode(P[0][0], P[0][1]);
        if (e0 && e1) edge(points, e0, e1, P);
      } else if (contains(points, [(xmin + xmax) / 2, (ymin + ymax) / 2])) {
        P.push([xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]);
      } else {
        return null;
      }
      return P;
    }

    // TODO Change signature to (x0, y0, x1, y1, …).
    // TODO Update c0 or c1 directly rather than calling regioncode again.
    function clipSegment([x0, y0], [x1, y1], c0, c1) {
      while (true) {
        if (c0 === 0 && c1 === 0) return [[x0, y0], [x1, y1]];
        if (c0 & c1) return;
        let x, y, c = c0 || c1;
        if (c & 0b1000) x = x0 + (x1 - x0) * (ymax - y0) / (y1 - y0), y = ymax;
        else if (c & 0b0100) x = x0 + (x1 - x0) * (ymin - y0) / (y1 - y0), y = ymin;
        else if (c & 0b0010) y = y0 + (y1 - y0) * (xmax - x0) / (x1 - x0), x = xmax;
        else y = y0 + (y1 - y0) * (xmin - x0) / (x1 - x0), x = xmin;
        if (c === c0) x0 = x, y0 = y, c0 = regioncode(x0, y0);
        else x1 = x, y1 = y, c1 = regioncode(x1, y1);
      }
    }

    // TODO Represent points zipped as [x0, y0, x1, y1, …].
    // TODO Consolidate corner traversal code using edge?
    function clipInfinite(polygon) {
      let P = polygon.points.slice(), p;
      if (p = project(P[0], polygon.v0)) P.unshift(p);
      if (p = project(P[P.length - 1], polygon.vn)) P.unshift(p);
      if (P = clip(P)) {
        for (let i = 0, n = P.length, c0, c1 = edgecode(P[n - 1][0], P[n - 1][1]); i < n; ++i) {
          c0 = c1, c1 = edgecode(P[i][0], P[i][1]);
          if (c0 && c1) {
            while (c0 !== c1) {
              let c;
              switch (c0) {
                case 0b0101: c0 = 0b0100; continue; // top-left
                case 0b0100: c0 = 0b0110, c = [xmax, ymin]; break; // top
                case 0b0110: c0 = 0b0010; continue; // top-right
                case 0b0010: c0 = 0b1010, c = [xmax, ymax]; break; // right
                case 0b1010: c0 = 0b1000; continue; // bottom-right
                case 0b1000: c0 = 0b1001, c = [xmin, ymax]; break; // bottom
                case 0b1001: c0 = 0b0001; continue; // bottom-left
                case 0b0001: c0 = 0b0101, c = [xmin, ymin]; break; // left
              }
              if (containsInfinite(polygon, c)) {
                P.splice(i, 0, c), ++n, ++i;
              }
            }
          }
        }
      } else if (containsInfinite(polygon, [(xmin + xmax) / 2, (ymin + ymax) / 2])) {
        P.push([xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax]);
      } else {
        return null;
      }
      return P;
    }

    // TODO Represent points zipped as [x0, y0, x1, y1, …].
    // TODO Allow containsInfinite instead of contains for clipInfinite?
    function edge(points, e0, e1, P) {
      while (e0 !== e1) {
        let p;
        switch (e0) {
          case 0b0101: e0 = 0b0100; continue; // top-left
          case 0b0100: e0 = 0b0110, p = [xmax, ymin]; break; // top
          case 0b0110: e0 = 0b0010; continue; // top-right
          case 0b0010: e0 = 0b1010, p = [xmax, ymax]; break; // right
          case 0b1010: e0 = 0b1000; continue; // bottom-right
          case 0b1000: e0 = 0b1001, p = [xmin, ymax]; break; // bottom
          case 0b1001: e0 = 0b0001; continue; // bottom-left
          case 0b0001: e0 = 0b0101, p = [xmin, ymin]; break; // left
        }
        if (contains(points, p)) {
          P.push(p);
        }
      }
    }

    // TODO Change signature to (x0, y0, vx, vy).
    function project([x0, y0], [vx, vy]) {
      let t = Infinity, c, x, y;
      if (vy < 0) { // top
        if (y0 <= ymin) return;
        if ((c = (ymin - y0) / vy) < t) y = ymin, x = x0 + (t = c) * vx;
      } else if (vy > 0) { // bottom
        if (y0 >= ymax) return;
        if ((c = (ymax - y0) / vy) < t) y = ymax, x = x0 + (t = c) * vx;
      }
      if (vx > 0) { // right
        if (x0 >= xmax) return;
        if ((c = (xmax - x0) / vx) < t) x = xmax, y = y0 + (t = c) * vy;
      } else if (vx < 0) { // left
        if (x0 <= xmin) return;
        if ((c = (xmin - x0) / vx) < t) x = xmin, y = y0 + (t = c) * vy;
      }
      return [x, y];
    }

    function edgecode(x, y) {
      return (x === xmin ? 0b0001
          : x === xmax ? 0b0010 : 0b0000)
          | (y === ymin ? 0b0100
          : y === ymax ? 0b1000 : 0b0000);
    }

    function regioncode(x, y) {
      return (x < xmin ? 0b0001
          : x > xmax ? 0b0010 : 0b0000)
          | (y < ymin ? 0b0100
          : y > ymax ? 0b1000 : 0b0000);
    }
  }
}

function connect(triangles, i, j) {
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

// TODO Represent points zipped as [x0, y0, x1, y1, …].
// TODO Change signature to (points, x, y).
function contains(points, [x, y]) {
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
function containsInfinite({points, v0, vn}, p) {
  let n = points.length, p0, p1 = points[0];
  if (clockwise(p, [p1[0] + v0[0], p1[1] + v0[1]], p1)) return false;
  for (let i = 1; i < n; ++i) if (clockwise(p, p0 = p1, p1 = points[i])) return false;
  if (clockwise(p, p1, [p1[0] + vn[0], p1[1] + vn[1]])) return false;
  return true;
}

// TODO Inline into containsInfinite.
function clockwise([x0, y0], [x1, y1], [x2, y2]) {
  return (x1 - x0) * (y2 - y0) < (y1 - y0) * (x2 - x0);
}

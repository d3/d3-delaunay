export default class Voronoi {
  constructor({coords, halfedges, hull, triangles, trianglesLen}) {

    class Cell {
      constructor() {
        this.points = [];
        this.v0 = null;
        this.vn = null;
      }
      path(context) { // TODO Clip to bounds = [xmin, ymin, xmax, ymax].
        const {points, v0, vn} = this;
        if (!points) return; // Coincident point.
        if (v0) {
          const l0 = 1e3 / Math.sqrt(v0[0] ** 2 + v0[1] ** 2);
          const l1 = 1e3 / Math.sqrt(vn[0] ** 2 + vn[1] ** 2);
          let cx = circumcenters[points[0] * 2 + 0];
          let cy = circumcenters[points[0] * 2 + 1];
          context.moveTo(cx + l0 * v0[0], cy + l0 * v0[1]);
          context.lineTo(cx, cy);
          for (let i = 1, n = points.length; i < n; ++i) {
            cx = circumcenters[points[i] * 2 + 0];
            cy = circumcenters[points[i] * 2 + 1];
            context.lineTo(cx, cy);
          }
          context.lineTo(cx + l1 * vn[0], cy + l1 * vn[1]);
        } else {
          let cx = circumcenters[points[0] * 2 + 0];
          let cy = circumcenters[points[0] * 2 + 1];
          context.moveTo(cx, cy);
          for (let i = 0, n = points.length - 1; i < n; ++i) {
            cx = circumcenters[points[i] * 2 + 0];
            cy = circumcenters[points[i] * 2 + 1];
            context.lineTo(cx, cy);
          }
          context.closePath();
        }
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
      cell_connect(cells[triangles[i]].points, Math.floor(i / 3), Math.floor(j / 3));
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
      cell.points = cell.points[0];
    }
  }
}

function cell_connect(points, i, j) {
  for (let n = points.length, a = 0; a < n; ++a) {
    let sa = points[a];
    if (sa[0] === j) {
      for (let b = a + 1; b < n; ++b) {
        let sb = points[b];
        if (sb[sb.length - 1] === i) {
          points.splice(b, 1);
          points[a] = sa = sb.concat(sa);
          return;
        }
      }
      sa.unshift(i);
      return;
    }
    if (sa[sa.length - 1] === i) {
      for (let b = a + 1; b < n; ++b) {
        let sb = points[b];
        if (sb[0] === j) {
          points.splice(b, 1);
          points[a] = sa = sa.concat(sb);
          return;
        }
      }
      sa.push(j);
      return;
    }
  }
  points.push([i, j]);
}

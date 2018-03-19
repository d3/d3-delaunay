export default class Cell {
  constructor(voronoi) {
    this.voronoi = voronoi;
    this.triangles = []; // Triangle indexes, similar to halfedges.
    this.v0 = null; // Starting edge vector if hull cell.
    this.vn = null; // Ending edge vector if hull cell.
  }
  render(context) {
    const {circumcenters} = this.voronoi;
    const {triangles, v0, vn} = this;
    if (!triangles) return; // Coincident point.
    let points = new Array(triangles.length); // TODO Zip as [x0, y0, …].
    for (let i = 0, n = triangles.length; i < n; ++i) {
      points[i] = [
        circumcenters[triangles[i] * 2 + 0],
        circumcenters[triangles[i] * 2 + 1]
      ];
    }
    points = this.voronoi._clip(points, v0, vn);
    if (!points) return;
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
}

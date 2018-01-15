function cross(x1, y1, x2, y2, x3, y3) {
  return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
}

export default function voronoi(context, points) {
  const delaunay = new delaunator(points);
  const n = delaunay.trianglesLen / 3;
  const circumcenters = new Float64Array(n * 2);

  // Compute the triangle circumcenters.
  for (let i = 0, ci = -1; i < n; ++i) {
    const [x1, y1] = points[delaunay.triangles[i * 3 + 0]];
    const [x2, y2] = points[delaunay.triangles[i * 3 + 1]];
    const [x3, y3] = points[delaunay.triangles[i * 3 + 2]];
    const a2 = x1 - x2;
    const a3 = x1 - x3;
    const b2 = y1 - y2;
    const b3 = y1 - y3;
    const d1 = x1 * x1 + y1 * y1;
    const d2 = d1 - x2 * x2 - y2 * y2;
    const d3 = d1 - x3 * x3 - y3 * y3;
    const ab = (a3 * b2 - a2 * b3) * 2;
    circumcenters[++ci] = (b2 * d3 - b3 * d2) / ab;
    circumcenters[++ci] = (a3 * d2 - a2 * d3) / ab;
  }

  // Draw lines between the circumcenters of adjacent internal triangles.
  for (let i = 0; i < delaunay.halfedges.length; ++i) {
    const j = delaunay.halfedges[i];
    if (j < 0 || j < i) continue;
    const ci = Math.floor(i / 3) * 2;
    const cj = Math.floor(j / 3) * 2;
    context.moveTo(circumcenters[ci], circumcenters[ci + 1]);
    context.lineTo(circumcenters[cj], circumcenters[cj + 1]);
  }

  // Draw lines extending from the circumcenters of hull triangles.
  let node = delaunay.hull;
  const head = node;
  do {
    const {x: x1, y: y1, t: i, next: {x: x2, y: y2}} = node;
    const ci = Math.floor(i / 3) * 2;
    const cx = circumcenters[ci];
    const cy = circumcenters[ci + 1];
    const dx = (x1 + x2) / 2 - cx;
    const dy = (y1 + y2) / 2 - cy;
    const l = 1e5 / Math.sqrt(dx * dx + dy * dy); // TODO Clip to extent.
    const k = cross(x1, y1, x2, y2, cx, cy) > 0 ? -l : l;
    context.moveTo(cx, cy);
    context.lineTo(cx + k * dx, cy + k * dy);
  } while ((node = node.next) !== head);
}

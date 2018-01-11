export default function voronoi(context, points) {
  const delaunay = new delaunator(points);
  const circumcenters = new Array(delaunay.trianglesLen / 3);

  for (let i = 0; i < circumcenters.length; ++i) {
    circumcenters[i] = circumcenter(i * 3);
  }

  function circumcenter(i) {
    const [x1, y1] = points[delaunay.triangles[i + 0]];
    const [x2, y2] = points[delaunay.triangles[i + 1]];
    const [x3, y3] = points[delaunay.triangles[i + 2]];
    const a2 = x1 - x2;
    const a3 = x1 - x3;
    const b2 = y1 - y2;
    const b3 = y1 - y3;
    const d1 = x1 * x1 + y1 * y1;
    const d2 = d1 - x2 * x2 - y2 * y2;
    const d3 = d1 - x3 * x3 - y3 * y3;
    const ab = (a3 * b2 - a2 * b3) * 2;
    const xa = (b2 * d3 - b3 * d2) / ab;
    const ya = (a3 * d2 - a2 * d3) / ab;
    return [xa, ya];
  }

  function cross(x1, y1, x2, y2, x3, y3) {
    return (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  }

  for (let i = 0; i < delaunay.halfedges.length; ++i) {
    const j = delaunay.halfedges[i];
    if (j < 0 || j < i) continue;
    const [cx1, cy1] = circumcenters[Math.floor(i / 3)];
    const [cx2, cy2] = circumcenters[Math.floor(j / 3)];
    context.moveTo(cx1, cy1);
    context.lineTo(cx2, cy2);
  }

  let node = delaunay.hull;
  const head = node;
  do {
    const {x: x1, y: y1, t: i, next: {x: x2, y: y2}} = node;
    const [cx, cy] = circumcenters[Math.floor(i / 3)];
    const dx = (x1 + x2) / 2 - cx;
    const dy = (y1 + y2) / 2 - cy;
    const l = 1e5 / Math.sqrt(dx * dx + dy * dy); // TODO Clip to extent.
    const k = cross(x1, y1, x2, y2, cx, cy) > 0 ? -l : l;
    context.moveTo(cx, cy);
    context.lineTo(cx + k * dx, cy + k * dy);
  } while ((node = node.next) !== head);
}


const PNG = require('pngjs').PNG;
const fs = require('fs');
const {Delaunay, Voronoi} = require('./dist/d3-delaunay.js');

const {width, height, data: rawData} = PNG.sync.read(fs.readFileSync('./obama.png'));

const data = new Float64Array(width * height);

for (let i = 0; i < rawData.length / 4; i++) data[i] = Math.max(0, 1 - rawData[i * 4] / 254);

const n = Math.round(width * height / 40);

const points = new Float64Array(n * 2);
const c = new Float64Array(n * 2);
const s = new Float64Array(n);

for (let i = 0; i < n; ++i) {
  for (let j = 0; j < 30; ++j) {
    const x = points[i * 2] = Math.floor(Math.random() * width);
    const y = points[i * 2 + 1] = Math.floor(Math.random() * height);
    if (Math.random() < data[y * width + x]) break;
  }
}

const K = 10;
console.time(`${K} iterations`);
for (let k = 0; k < K; ++k) {
  console.time(k);
  const delaunay = new Delaunay(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  c.fill(0);
  s.fill(0);
  for (let y = 0, i = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const w = data[y * width + x];
      i = delaunay.find(x + 0.5, y + 0.5, i);
      s[i] += w;
      c[i * 2] += w * (x + 0.5);
      c[i * 2 + 1] += w * (y + 0.5);
    }
  }

  const w = Math.pow(k + 1, -0.8) * 10;
  for (let i = 0; i < n; ++i) {
    const x0 = points[i * 2], y0 = points[i * 2 + 1];
    const x1 = s[i] ? c[i * 2] / s[i] : x0, y1 = s[i] ? c[i * 2 + 1] / s[i] : y0;
    points[i * 2] = x0 + (x1 - x0) * 1.8 + (Math.random() - 0.5) * w;
    points[i * 2 + 1] = y0 + (y1 - y0) * 1.8 + (Math.random() - 0.5) * w;
  }
  console.timeEnd(k);
}
console.timeEnd(`${K} iterations`);

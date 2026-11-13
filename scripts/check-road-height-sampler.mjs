import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRoadHeightSampler, nearestRoadHeight } from '../src/roads.js';

const data = JSON.parse(readFileSync(new URL('../public/data/campus.json', import.meta.url)));
const terrain = { sample: (x, z) => Math.sin(x * .05) + Math.cos(z * .03) + x * .002 };
const sample = createRoadHeightSampler(data.roads, terrain, .05);
let seed = 1729;
const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
const points = [];
for (const road of data.roads) {
  const p = road.points[Math.floor(random() * road.points.length)];
  if (p) points.push([p[0] + (random() - .5) * 2, p[1] + (random() - .5) * 2]);
}
for (let i = 0; i < 2500; i++) points.push([(random() - .5) * 260, (random() - .5) * 260]);

for (const [x, z] of points) {
  const exact = nearestRoadHeight(x, z, data.roads, terrain, .05);
  const indexed = sample(x, z);
  assert(Math.abs(exact - indexed) < 1e-9, `height mismatch at ${x},${z}: ${exact} vs ${indexed}`);
}
console.log(`PASS road height sampler matches all ${points.length} exact scans`);

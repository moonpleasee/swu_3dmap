import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildingParts} from '../src/model-details.js';
import {ExteriorBatch,decorateBuilding} from '../src/exteriors.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const data = read('../public/data/campus.json');
const profiles = read('../data-sources/exterior-profiles.json');
const ids = ['843421808', '843421784', '843465223'];
assert.equal(data.buildings.length, 300);
assert.equal(data.meta.individualExteriorProfiles, 63);
assert.equal(data.meta.gardenExteriorProfiles, 53);
assert.equal(data.buildings.filter(f => !['single-photo', 'garden-photo'].includes(f.exterior.basis)).length, 184);
for (const id of ids) {
  const f = data.buildings.find(x => x.id === id);
  assert(f, `missing target ${id}`);
  assert.equal(f.exterior.batchRevision, 'researched-2026-09-24');
  assert.equal(f.exterior.basis, 'single-photo');
  assert(f.exterior.source.startsWith('https://'));
  assert(f.exterior.referenceFile && f.exterior.referenceDate && f.exterior.dimensionsNote);
  assert(f.exterior.entry && f.exterior.entrySources.includes(f.exterior.source));
  assert.equal(profiles[id].batchRevision, 'researched-2026-09-24');
  for (const fine of [false, true]) {
    const batch = new ExteriorBatch();
    decorateBuilding(f, buildingParts(f), batch, fine);
    for (const records of batch.records.values()) for (const record of records) {
      assert(record.matrix.elements.every(Number.isFinite), `invalid facade transform ${id}`);
    }
  }
}
assert.equal(data.buildings.find(f => f.id === '843421808').levels, 11);
assert.equal(data.buildings.find(f => f.id === '843421784').levels, 6);
console.log('PASS: 300 buildings, 63 single-photo profiles, 53 garden references, 184 remaining; researched batch sources, entrances, levels, and facade transforms are valid.');

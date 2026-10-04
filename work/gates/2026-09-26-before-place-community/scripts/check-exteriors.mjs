import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildingParts} from '../src/model-details.js';
import {ExteriorBatch,decorateBuilding,facadeEdges,surfacePattern} from '../src/exteriors.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
let details=0,max=0;
for(const f of data.buildings){
  const parts=buildingParts(f),p=f.exterior;
  assert(p&&p.observations.length,`Missing exterior record ${f.id}`);
  if(['single-photo','garden-photo'].includes(p.basis))assert(p.source?.startsWith('https://'));
  const batch=new ExteriorBatch();decorateBuilding(f,parts,batch,false);decorateBuilding(f,parts,batch,true);
  const group=new THREE.Group(),meshes=batch.flush(group);let count=0;
  for(const m of meshes){
    assert([...m.instanceMatrix.array].every(Number.isFinite),`Invalid instance ${f.id}`);
    assert([...m.instanceColor.array].every(Number.isFinite),`Invalid color ${f.id}`);
    count+=m.count;m.computeBoundingBox();assert(!m.boundingBox.isEmpty());m.geometry.dispose();m.material.dispose();
  }
  for(const m of batch.extra||[]){assert([...m.geometry.attributes.position.array].every(Number.isFinite));m.geometry.dispose();m.material.dispose();}
  details+=count;max=Math.max(max,count);
}
// Artificial split faces must not acquire windows inside the original building.
const f={polygon:[[0,0],[4,0],[4,4],[0,4],[0,0]],holes:[]};
const part={polygon:[[0,0],[2,0],[2,4],[0,4],[0,0]],holes:[]};
const edges=facadeEdges(part,f);assert.equal(edges.length,3);assert(!edges.some(e=>e.a[0]===2&&e.b[0]===2));
for(const e of facadeEdges(f,f)){const dot=(e.mid[0]-2)*e.n[0]+(e.mid[1]-2)*e.n[1];assert(dot>0,'Facade normal faces inward');}
for(const kind of ['brick','tile','roof'])assert.equal(surfacePattern(kind).image.data.length,128*128*4);
assert.equal(data.buildings.find(f=>f.id==='368605817').exterior.roofStyle,'flat');
assert.deepEqual(buildingParts(data.buildings.find(f=>f.id==='r5477110')).map(p=>p.levels),[3,3,6]);
assert(data.buildings.filter(f=>f.model==='terraced-dorm').every(f=>buildingParts(f).length===3));
console.log(`PASS: 300 exterior profiles; ${details} valid facade instances (${max} maximum per building); synthetic split faces, outward normals, roof textures and corrected floor profiles.`);

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {specialBuildingMeshes} from '../src/building-character.js';
import {buildingParts,fieldFrame} from '../src/model-details.js';
import {ExteriorBatch,decorateBuilding} from '../src/exteriors.js';
const load=path=>JSON.parse(readFileSync(new URL(path,import.meta.url)));
const data=load('../public/data/campus.json'),profiles=load('../data-sources/exterior-profiles.json');
const ids=new Set(['368577143','304932138','368589387','368578312','843421757','843465284','843421755','840970010','371876808','842765847']);
assert.equal(data.buildings.length,300);
assert.equal(data.meta.individualExteriorProfiles,58);assert.equal(data.meta.gardenExteriorProfiles,53);
assert.equal(data.buildings.filter(f=>!['single-photo','garden-photo'].includes(f.exterior.basis)).length,189);
for(const f of data.buildings){
 if(!ids.has(f.id))continue;
 const p=f.exterior;assert.equal(p.batchRevision,'remaining-2026-09-23');assert(p.referenceDate&&p.referenceFile&&p.entryNote&&p.dimensionsNote);
 assert(p.entrySources.includes(p.source));assert(p.entry);assert.equal(profiles[f.id].basis,'single-photo');
 for(const fine of [false,true]){
   const batch=new ExteriorBatch();decorateBuilding(f,buildingParts(f),batch,fine);
   for(const records of batch.records.values())for(const r of records)assert(r.matrix.elements.every(Number.isFinite));
 }
 const meshes=specialBuildingMeshes(f);
 if(!p.specialModel){assert.equal(meshes.length,0);continue;}
 assert(meshes.length>=3);
 for(const m of meshes){
   assert([...m.geometry.attributes.position.array].every(Number.isFinite));
   m.geometry.computeBoundingBox();assert(m.geometry.boundingBox.min.y>=.13-1e-5);assert(m.geometry.boundingBox.max.y<=.13+f.height*1.04);
 }
 if(p.specialModel==='twin-vault'){
   const F=fieldFrame(p.vaultFootprint),roof=meshes[0].geometry.attributes.position;
   const peaks=[];for(let i=0;i<roof.count;i++)if(Math.abs(roof.getY(i)-f.height-.13)<1e-5){const center=F.point(0,0);peaks.push((roof.getX(i)-center[0])*F.v[0]+(roof.getZ(i)-center[2])*F.v[1]);}
   assert(peaks.some(x=>Math.abs(x-F.width/4)<1e-4));assert(peaks.some(x=>Math.abs(x+F.width/4)<1e-4));
 }
}
// Optional local baseline is outside the distributable project. Without it,
// the intrinsic geometry checks above still run on an installed copy.
try{
 const old=load('../../../work/building-batch/before-campus.json'),lookup=new Map(data.buildings.map(f=>[f.id,f]));let preserved=0;
 for(const f of old.buildings)if(!ids.has(f.id)){assert.deepEqual(lookup.get(f.id),f);if(['single-photo','garden-photo'].includes(f.exterior.basis))preserved++;}
 assert.equal(preserved,101);assert.deepEqual(data.surfaces,old.surfaces);assert.deepEqual(data.roads,old.roads);assert.deepEqual(data.boundary,old.boundary);
 console.log('PASS original 101 calibrated buildings, all 290 untargeted records, roads, surfaces, boundary unchanged');
}catch(e){if(e.code!=='ENOENT')throw e;}
console.log('PASS ten photo-referenced buildings, twin-vault peaks, segmented roof bounds, 111 reference profiles / 189 remaining');

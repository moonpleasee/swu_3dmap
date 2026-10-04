import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {roofFacets,planarRoof} from '../src/roofs.js';
import {ExteriorBatch,decorateBuilding,chooseFront,facadeEdges,facadeOverride} from '../src/exteriors.js';
import {buildingParts} from '../src/model-details.js';
import {entryDimensions} from '../src/entrances.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0))/2;
let roofs=0,doors=0;
for(const f of data.buildings){
 const p=f.exterior;
 if(p.roofStyle==='hip'){
  for(const part of buildingParts(f)){
   const facets=roofFacets(part.polygon,part.holes,p.roofRise,p.roofPlan);
   const expected=area(part.polygon)-part.holes.reduce((sum,h)=>sum+area(h),0);
   assert(Math.abs(facets.reduce((sum,f)=>sum+area(f.polygon),0)-expected)<.0001,`Roof coverage/overlap ${f.id}`);
   const mesh=planarRoof(part.polygon,part.holes,part.height,p.roofColor,p.roofRise,p.roofPlan);
   assert([...mesh.geometry.attributes.position.array].every(Number.isFinite));mesh.geometry.dispose();mesh.material.dispose();
  }
  roofs++;
 }
 if(p.entry&&['single-photo','garden-photo','inferred'].includes(p.basis)){
  const parts=buildingParts(f),batch=new ExteriorBatch();decorateBuilding(f,parts,batch,false);
  const front=chooseFront(parts.flatMap(part=>facadeEdges(part,f).map(e=>({...e,part}))),p),d=entryDimensions(front,p);
  assert(d.width>0&&d.height>0&&d.width<=front.length);assert(p.entryNote);
  assert(d.center-d.width/2>=-.00001&&d.center+d.width/2<=front.length+.00001,`Portal exceeds facade ${f.id}`);
  if(f.id==='368605820')assert(front.length>3,'Rain building collinear facade must be merged before reserving the doorway');
  const without=new ExteriorBatch();decorateBuilding({...f,exterior:{...p,entry:null}},parts,without,false);
  const total=b=>[...b.records.values()].reduce((s,a)=>s+a.length,0);
  assert(total(batch)>total(without),`Door missing in overview ${f.id}`);doors++;
 }
}
assert.deepEqual(buildingParts(data.buildings.find(f=>f.id==='305935503')).map(p=>p.levels).sort(),[3,3,4]);
for(const id of ['210254155','210254156','210254157']){
 const f=data.buildings.find(f=>f.id===id),edges=buildingParts(f).flatMap(part=>facadeEdges(part,f));
 for(const z of f.exterior.facadeZones)assert(edges.some(e=>facadeOverride(e,{facadeZones:[z]})),`Unmatched facade zone ${id}`);
}
// The three wing roof plans must retain proper ridges, not flat caps.
for(const id of ['843465224','368605820','843465275']){
 const f=data.buildings.find(f=>f.id===id),p=f.exterior,facets=roofFacets(f.polygon,f.holes,p.roofRise,p.roofPlan);
 assert(facets.some(f=>f.wing>=0));assert(facets.length<2000);
 const flat=facets.filter(f=>f.wing<0).reduce((s,f)=>s+area(f.polygon),0);assert(flat<.005,`Uncovered wing ${id}: ${flat}`);
}
console.log(`PASS: ${roofs} complete, non-overlapping planar roofs; ${doors} configured entrances (reference or inferred); three manually aligned wing plans; door evidence and dimensions.`);

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildingParts,fieldFrame,pitchedRoof,secondFieldDetails} from '../src/model-details.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url),'utf8'));
const all=[...data.buildings,...data.surfaces],feature=id=>all.find(f=>f.id===id);
const area=p=>Math.abs(p.slice(1).reduce((s,b,i)=>s+p[i][0]*b[1]-b[0]*p[i][1],0))/2;
const net=p=>area(p.polygon)-(p.holes||[]).reduce((s,h)=>s+area(h),0);
for(const f of data.buildings){
  assert(f.displayName&&f.nameNote&&f.heightNote&&f.sources.length,`Missing provenance: ${f.id}`);
  const parts=buildingParts(f);
  assert(Math.abs(parts.reduce((s,p)=>s+net(p),0)-net(f))<.01,`Partition changed footprint area: ${f.id}`);
  for(const p of parts){assert(p.levels>=1&&p.height>0);assert(p.polygon.every(v=>v.every(Number.isFinite)));}
  if(f.appearance?.roof==='hip')for(const p of parts){const roof=pitchedRoof(p.polygon,p.holes,p.height,f.appearance.roofColor);assert([...roof.geometry.attributes.position.array].every(Number.isFinite));}
}
assert.equal(feature('350242168').levels,15);
assert.deepEqual(buildingParts(feature('350242168')).map(p=>p.levels).sort((a,b)=>a-b),[5,15]);
assert.equal(feature('843465226').displayName,'伴月楼 · 29教');
assert.equal(feature('r11661636').displayName,'茶园1舍');
assert(feature('r11661636').aliases.includes('竹园A栋'));
assert.equal(feature('843465308').displayName,'杏园3舍');
assert.equal(feature('843421743').sourceIds.length,2);
assert(!feature('925243984'));
assert.equal(feature('840863405').nameStatus,'conflict');
const F=fieldFrame(feature('210254160').polygon);assert(F.width>6&&F.width<7);assert(F.length>10&&F.length<12);
const field=new THREE.Group();secondFieldDetails(field,feature('846878928'),feature('210254160'));
field.traverse(o=>{assert([o.position.x,o.position.y,o.position.z].every(Number.isFinite));if(o.geometry)assert([...o.geometry.attributes.position.array].every(Number.isFinite));});
console.log(`PASS: ${data.buildings.length} provenance entries; roof geometry and all footprint partitions; library floor split; aliases, name conflicts, duplicate merge; field dimensions and geometry.`);

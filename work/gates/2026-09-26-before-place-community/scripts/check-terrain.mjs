import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as THREE from 'three';
import {CampusTerrain,terrainGeometry,contains,drapeGeometry} from '../src/terrain.js';
import {CampusScene} from '../src/scene.js';
import {ExteriorBatch,decorateBuilding} from '../src/exteriors.js';
import {buildingParts} from '../src/model-details.js';

const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url)));
const raster=JSON.parse(readFileSync(new URL('../public/data/terrain.json',import.meta.url)));
const before=JSON.stringify(data),terrain=new CampusTerrain(data,raster);
assert.equal(raster.verticalExaggeration,1);
assert.equal(raster.metersPerUnit,10);
assert.equal(terrain.elevations.size,data.buildings.length+data.surfaces.filter(f=>f.kind!=='green').length);
// A synthetic north/south gradient catches row flips, scale and origin mistakes.
const fixture=new CampusTerrain({buildings:[],surfaces:[]},{x0:0,z0:0,step:1,cols:2,rows:2,elevations:[200,210,220,230],datumMeters:200,metersPerUnit:10});
assert.equal(fixture.raw(.5,.5),1.5);assert.equal(fixture.raw(0,1),2);assert.equal(fixture.raw(1,0),1);
assert.throws(()=>new CampusTerrain(data,{...raster,elevations:[NaN]}));
let min=Infinity,max=-Infinity;
for(let z=-114;z<114;z+=1.5)for(let x=-118;x<115;x+=1.5)if(contains([x,z],data.boundary)){
  const h=terrain.raw(x,z)*10+raster.datumMeters;min=Math.min(min,h);max=Math.max(max,h);assert(Number.isFinite(terrain.sample(x,z)));
}
assert(max-min>20&&max-min<200,'Unexpected campus relief');
const all=[...data.buildings,...data.surfaces];
for(const platform of terrain.platforms)for(const id of platform.ids){
  const f=all.find(f=>f.id===id);assert.equal(terrain.elevation(f),platform.y);
  // Polygon centroids may lie outside concave footprints; sample actual interiors.
  const b=f.polygon;
  for(let i=1;i<b.length;i++){const p=[b[i][0]*.499+b[i-1][0]*.499+f.center[0]*.002,b[i][1]*.499+b[i-1][1]*.499+f.center[1]*.002];if(contains(p,b))assert(Math.abs(terrain.sample(...p)-platform.y)<1e-9,`Platform not level: ${id}`);}
}
for(const ids of [['368605818','846878928','210254160'],['843421786','843421789','371877851'],['r5522696','r5522696_2','r5522696_3']]){
  assert(ids.every(id=>terrain.elevations.get(id)===terrain.elevations.get(ids[0])),`Shared platform split: ${ids}`);
}
// Exact footprint/hole triangulation, positive normals and conserved area.
const poly=[[0,0],[4,0],[4,4],[0,4],[0,0]],hole=[[1,1],[1,3],[3,3],[3,1],[1,1]];
const g=terrainGeometry(poly,[hole],(x,z)=>x*.2+z*.1),p=g.attributes.position;
let area=0;
for(let i=0;i<g.index.count;i+=3){const ids=[0,1,2].map(j=>g.index.getX(i+j));const [a,b,c]=ids.map(j=>[p.getX(j),p.getZ(j)]);const v=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);assert(v<1e-6);area+=Math.abs(v)/2;}
assert(Math.abs(area-12)<1e-5);g.dispose();

// Building body/roof geometry, colors and scales remain byte-for-byte identical;
// only the object Y translation changes. This covers the full set of 300.
function sceneFor(t){const s=Object.create(CampusScene.prototype);s.data=data;s.terrain=t;s.scene=new THREE.Scene();s.layers={buildings:new THREE.Group()};s.pickables=[];s.namedMeshes=new Map();s.buildBuildings();return s;}
const elevated=sceneFor(terrain),flat=sceneFor({elevation:()=>0});
for(const f of data.buildings){
  const a=elevated.baseModels.get(f.id),b=flat.baseModels.get(f.id);assert.equal(a.length,b.length);
  for(let i=0;i<a.length;i++){
    assert.deepEqual(a[i].geometry.attributes.position.array,b[i].geometry.attributes.position.array);
    assert.deepEqual(a[i].scale.toArray(),b[i].scale.toArray());assert.deepEqual(a[i].rotation.toArray(),b[i].rotation.toArray());
    assert(Math.abs(a[i].position.y-b[i].position.y-terrain.elevation(f))<1e-8);
    assert.deepEqual([a[i].material].flat().map(m=>m.color.getHex()),[b[i].material].flat().map(m=>m.color.getHex()));
  }
  const b0=new ExteriorBatch(),b1=new ExteriorBatch();b1.elevation=terrain.elevation(f);
  decorateBuilding(f,buildingParts(f),b0,false);decorateBuilding(f,buildingParts(f),b1,false);
  for(const [key,records] of b0.records){const other=b1.records.get(key);assert.equal(other.length,records.length);records.forEach((r,i)=>{assert.equal(r.color,other[i].color);for(let k=0;k<16;k++)assert(Math.abs(other[i].matrix.elements[k]-r.matrix.elements[k]-(k===13?b1.elevation:0))<1e-7);});}
}
const road=new THREE.PlaneGeometry(1,8,3,24);road.rotateX(-Math.PI/2);drapeGeometry(road,terrain,.095);
for(let i=0;i<road.attributes.position.count;i++){const a=road.attributes.position;assert(Math.abs(a.getY(i)-terrain.sample(a.getX(i),a.getZ(i))-.095)<1e-5);}
assert.equal(JSON.stringify(data),before,'Terrain must not mutate campus profiles or footprints');
const report={checkedBuildings:data.buildings.length,platforms:terrain.platforms.length,sourceGrid:[raster.cols,raster.rows],campusRawElevationRangeMeters:[min,max].map(v=>+v.toFixed(1)),verticalExaggeration:1,landmarks:data.landmarks.map(l=>({id:l.id,name:l.name,estimatedPlatformMeters:+terrain.meters(all.find(f=>f.id===l.id)).toFixed(1)}))};
writeFileSync(new URL('../data-sources/terrain/validation.json',import.meta.url),JSON.stringify(report,null,2));
console.log('PASS terrain, 300 preserved buildings, rigid sports/lakes, draped roads, holes and winding',JSON.stringify(report));

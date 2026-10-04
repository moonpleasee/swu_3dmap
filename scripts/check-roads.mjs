import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const data=JSON.parse(await readFile(new URL('../public/data/campus.json',import.meta.url)));
const inside=(p,ring)=>{let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
assert.match(data.meta.source,/OpenStreetMap/i);
assert.equal(data.roads.length,299);
const widths=new Set([.55,1.3,1.8]);let outside=0,invalid=0,buildingMidpoints=0,waterMidpoints=0;
for(const road of data.roads){
  assert(road.id&&road.points.length>=2);if(!widths.has(road.width))invalid++;
  for(const p of road.points)if(!inside(p,data.boundary))outside++;
  for(let i=1;i<road.points.length;i++){
    const a=road.points[i-1],b=road.points[i],m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    if(data.buildings.some(f=>inside(m,f.polygon)))buildingMidpoints++;
    if(data.surfaces.some(f=>f.kind==='water'&&inside(m,f.polygon)))waterMidpoints++;
  }
}
assert.equal(outside,0);assert.equal(invalid,0);
const report={source:data.meta.source,roads:data.roads.length,outsideVertices:outside,invalidWidths:invalid,potentialBuildingOverlapMidpoints:buildingMidpoints,potentialWaterOverlapMidpoints:waterMidpoints,note:'Overlap counts are audit flags from the original OSM snapshot; this check does not invent, delete or reroute roads.'};
await mkdir(new URL('../work/road-smoothing/',import.meta.url),{recursive:true});await writeFile(new URL('../work/road-smoothing/road-map-audit.json',import.meta.url),JSON.stringify(report,null,2));
console.log('PASS road source audit',JSON.stringify(report));

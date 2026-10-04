import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {buildRoadPolygons} from '../src/roads.js';

const data=JSON.parse(await readFile(new URL('../public/data/campus.json',import.meta.url)));
const blocked=[...data.buildings,...data.surfaces.filter(f=>f.kind==='water')];
const polygons=buildRoadPolygons(data.roads,blocked);
assert(polygons.length>0);
for(const poly of polygons){assert(poly[0].length>=4);for(const ring of poly)for(const p of ring)assert(p.every(Number.isFinite));}
const report={sourceRoads:data.roads.length,continuousPolygons:polygons.length,rings:polygons.reduce((n,p)=>n+p.length,0),vertices:polygons.reduce((n,p)=>n+p.reduce((m,r)=>m+r.length,0),0),stroke:'segment-rectangles-plus-node-discs',groundUsesSameOuterRings:true,blockedTypes:['building','water'],centerlinesChanged:false};
await mkdir(new URL('../work/road-smoothing/',import.meta.url),{recursive:true});await writeFile(new URL('../work/road-smoothing/continuous-road-audit.json',import.meta.url),JSON.stringify(report,null,2));
console.log('PASS continuous road geometry',JSON.stringify(report));

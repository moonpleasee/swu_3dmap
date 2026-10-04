import {readFileSync} from 'node:fs';
import {CampusTerrain,terrainGeometry} from '../src/terrain.js';
const data=JSON.parse(readFileSync(new URL('../public/data/campus.json',import.meta.url)));
const terrain=new CampusTerrain(data,JSON.parse(readFileSync(new URL('../public/data/terrain.json',import.meta.url))));
const g=terrainGeometry(data.boundary,[],(x,z)=>terrain.sample(x,z)-.01,.65,terrain);
const p=g.attributes.position,idx=g.index.array,buckets=new Map();
for(let i=0;i<idx.length;i+=3){
 const tri=[idx[i],idx[i+1],idx[i+2]].map(j=>[p.getX(j),p.getY(j),p.getZ(j)]);
 const key=Math.floor(tri.reduce((a,b)=>a+b[0],0)/3/.65)+','+Math.floor(tri.reduce((a,b)=>a+b[2],0)/3/.65);
 if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(tri);
}
const hits=[];
for(const f of data.buildings){
 let above=-Infinity,below=Infinity;
 for(let i=1;i<f.polygon.length;i++)for(const r of [.25,.5,.75]){
   const a=f.polygon[i-1],b=f.polygon[i],x=a[0]*(1-r)+b[0]*r,z=a[1]*(1-r)+b[1]*r;
   for(const [a,b,c] of buckets.get(Math.floor(x/.65)+','+Math.floor(z/.65))||[]){
     const den=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
     const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/den,v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/den;
     if(u>=-1e-5&&v>=-1e-5&&u+v<=1.00001){const error=a[1]*u+b[1]*v+c[1]*(1-u-v)-terrain.elevation(f);above=Math.max(above,error);below=Math.min(below,error);}
   }
 }
 if(above>.02||below<-.08)hits.push({id:f.id,name:f.displayName,above:+above.toFixed(3),below:+below.toFixed(3)});
}
console.log('Ground contact exceptions (>0.2m penetration / >0.8m gap):',JSON.stringify(hits));
if(hits.length)process.exitCode=1;

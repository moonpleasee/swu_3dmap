import * as THREE from 'three';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>t*t*(3-2*t);
export function contains(p,ring){
  let hit=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }
  return hit;
}
const box=p=>({x0:Math.min(...p.map(v=>v[0])),x1:Math.max(...p.map(v=>v[0])),z0:Math.min(...p.map(v=>v[1])),z1:Math.max(...p.map(v=>v[1]))});
const intersects=(a,b)=>a.x0<=b.x1&&b.x0<=a.x1&&a.z0<=b.z1&&b.z0<=a.z1;
function edgeDistance(p,a,b){
  const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);
}
function overlap(a,b){
  if(!intersects(a.bounds,b.bounds))return false;
  if(a.polygon.some(p=>contains(p,b.polygon))||b.polygon.some(p=>contains(p,a.polygon)))return true;
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  return a.polygon.slice(1).some((q,i)=>b.polygon.slice(1).some((s,j)=>{
    const p=a.polygon[i],r=b.polygon[j];
    return intersects(box([p,q]),box([r,s]))&&cross(p,q,r)*cross(p,q,s)<=0&&cross(r,s,p)*cross(r,s,q)<=0;
  }));
}

export class CampusTerrain {
  constructor(data,raster){
    if(!raster||raster.elevations.length!==raster.cols*raster.rows||raster.elevations.some(v=>!Number.isFinite(v)))throw new Error('Invalid terrain raster');
    this.raster=raster;this.elevations=new Map();this.buckets=new Map();this.bottom=-2.6;this.edgeCache=new Map();
    this.greens=data.surfaces.filter(f=>f.kind==='green').map(f=>({...f,bounds:box(f.polygon)}));
    const features=[...data.buildings,...data.surfaces.filter(f=>f.kind!=='green')];
    const items=features.map(f=>({...f,bounds:box(f.polygon)}));
    const parent=items.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
    // Shared sports outlines, courts and markings must stay on the same platform.
    for(let i=0;i<items.length;i++)for(let j=0;j<i;j++){
      const a=items[i],b=items[j];
      if((a.kind==='water'&&b.kind==='water'&&a.sourceId===b.sourceId)||overlap(a,b))parent[find(i)]=find(j);
    }
    const groups=new Map();items.forEach((f,i)=>{const k=find(i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(f);});
    this.platforms=[];
    for(const fs of groups.values()){
      const samples=[];
      for(const f of fs){
        const b=f.bounds;
        for(let z=b.z0;z<=b.z1;z+=1.5)for(let x=b.x0;x<=b.x1;x+=1.5)if(contains([x,z],f.polygon))samples.push(this.raw(x,z));
        if(!samples.length) samples.push(this.raw(...f.center));
      }
      samples.sort((a,b)=>a-b);const y=samples[Math.floor(samples.length/2)];
      const platform={ids:fs.map(f=>f.id),y,features:fs};this.platforms.push(platform);
      for(const f of fs){
        this.elevations.set(f.id,y);
        const b=f.bounds,margin=2.2;
        for(let z=Math.floor((b.z0-margin)/8);z<=Math.floor((b.z1+margin)/8);z++)for(let x=Math.floor((b.x0-margin)/8);x<=Math.floor((b.x1+margin)/8);x++){
          const key=`${x},${z}`;if(!this.buckets.has(key))this.buckets.set(key,[]);
          this.buckets.get(key).push({f,y});
        }
      }
    }
  }
  raw(x,z){
    const r=this.raster,fx=clamp((x-r.x0)/r.step,0,r.cols-1),fz=clamp((z-r.z0)/r.step,0,r.rows-1);
    const i=Math.min(Math.floor(fx),r.cols-2),j=Math.min(Math.floor(fz),r.rows-2),a=fx-i,b=fz-j;
    const v=(dx,dz)=>r.elevations[(j+dz)*r.cols+i+dx];
    return ((v(0,0)*(1-a)+v(1,0)*a)*(1-b)+(v(0,1)*(1-a)+v(1,1)*a)*b-r.datumMeters)/r.metersPerUnit;
  }
  sample(x,z){
    const raw=this.raw(x,z),p=[x,z],near=this.buckets.get(`${Math.floor(x/8)},${Math.floor(z/8)}`)||[];
    let sum=0,weight=0,max=0,closest=Infinity,closestY=raw;
    for(const {f,y} of near){
      const b=f.bounds;
      if(x<b.x0-2.2||x>b.x1+2.2||z<b.z0-2.2||z>b.z1+2.2)continue;
      if(contains(p,f.polygon))return y;
      let d=Infinity;for(let i=1;i<f.polygon.length;i++)d=Math.min(d,edgeDistance(p,f.polygon[i-1],f.polygon[i]));
      if(d<closest){closest=d;closestY=y;}
      const w=1-smooth(clamp((d-.65)/1.55,0,1));
      // Nearby uphill platforms must not pull soil through a lower building's
      // facade. Preserve its apron, then continuously blend into the slope.
      const influence=w/Math.max(.00001,d-.65)**2;
      sum+=influence*y;weight+=influence;max=Math.max(max,w);
    }
    if(closest<=.65)return closestY;
    return weight?raw*(1-max)+sum/weight*max:raw;
  }
  elevation(f){return this.elevations.get(f.id)??this.sample(...f.center);}
  meters(f){return this.elevation(f)*this.raster.metersPerUnit+this.raster.datumMeters;}
  edgesForCell(ix,iz,step){
    const key=`${ix},${iz},${step}`;if(this.edgeCache.has(key))return this.edgeCache.get(key);
    const b={x0:ix*step,x1:(ix+1)*step,z0:iz*step,z1:(iz+1)*step},near=new Set();
    for(let z=Math.floor(b.z0/8);z<=Math.floor(b.z1/8);z++)for(let x=Math.floor(b.x0/8);x<=Math.floor(b.x1/8);x++)for(const {f} of this.buckets.get(`${x},${z}`)||[])near.add(f);
    for(const f of this.greens)if(intersects(b,f.bounds))near.add(f);
    const edges=[];for(const f of near)if(intersects(b,f.bounds))for(const ring of [f.polygon,...f.holes])for(let i=1;i<ring.length;i++){const a=ring[i-1],c=ring[i];if(intersects(b,box([a,c])))edges.push([a,c]);}
    this.edgeCache.set(key,edges);return edges;
  }
}

// Paint green areas on the same terrain triangles. Separate draped sheets
// can intersect each other because their source triangulations differ.
export function colorTerrain(geometry,terrain){
  const g=geometry.toNonIndexed(),p=g.attributes.position,colors=new Float32Array(p.count*3);
  // Shade the ground as a continuous hillside, independent of tiny triangles
  // created by platform/green-area clipping. Positions remain unchanged so
  // roads, water, trees and building foundations retain their existing contact.
  const normals=new Float32Array(p.count*3),cache=new Map(),radius=.85;
  const height=(x,z)=>terrain.sample(x,z);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),key=`${Math.round(x*10000)},${Math.round(z*10000)}`;
    let n=cache.get(key);
    if(!n){
      let dx=0,dz=0;
      for(const [shift,w] of [[-radius,1],[0,2],[radius,1]]){
        dx+=w*(height(x+radius,z+shift)-height(x-radius,z+shift));
        dz+=w*(height(x+shift,z+radius)-height(x+shift,z-radius));
      }
      n=new THREE.Vector3(-dx/(8*radius),1,-dz/(8*radius)).normalize();cache.set(key,n);
    }
    normals[i*3]=n.x;normals[i*3+1]=n.y;normals[i*3+2]=n.z;
  }
  g.setAttribute('normal',new THREE.BufferAttribute(normals,3));
  const base=new THREE.Color('#c6d1b1'),green=new THREE.Color('#9fb787');
  for(let i=0;i<p.count;i+=3){
    const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;
    const covered=terrain.greens.some(f=>x>=f.bounds.x0&&x<=f.bounds.x1&&z>=f.bounds.z0&&z<=f.bounds.z1&&contains([x,z],f.polygon)&&!f.holes.some(h=>contains([x,z],h)));
    const c=covered?green:base;for(let j=0;j<3;j++){colors[(i+j)*3]=c.r;colors[(i+j)*3+1]=c.g;colors[(i+j)*3+2]=c.b;}
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));return g;
}

function clip(poly,axis,bound,lower){
  const out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],da=(a[axis]-bound)*(lower?1:-1),db=(b[axis]-bound)*(lower?1:-1);
    if(da>=-1e-9)out.push(a);
    if((da>0&&db<0)||(da<0&&db>0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  return out;
}

// Clip source polygon triangles to a shared grid: exact boundary and holes,
// without stretching a few huge triangles across a hill or a leveled platform.
export function terrainGeometry(polygon,holes,height,step=.65,terrain=null){
  const open=r=>r.slice(0,r.length-(r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1]?1:0));
  const rings=[open(polygon),...holes.map(open)],points=rings.flat();
  const triangles=THREE.ShapeUtils.triangulateShape(rings[0].map(p=>new THREE.Vector2(...p)),rings.slice(1).map(r=>r.map(p=>new THREE.Vector2(...p))));
  const vertices=[],indices=[],seen=new Map();
  const vertex=p=>{const key=`${Math.round(p[0]*1e5)},${Math.round(p[1]*1e5)}`;if(seen.has(key))return seen.get(key);const id=vertices.length/3;seen.set(key,id);vertices.push(p[0],height(...p),p[1]);return id;};
  for(const tri of triangles){
    const p=tri.map(i=>points[i]),b=box(p);
    for(let iz=Math.floor(b.z0/step);iz<=Math.floor(b.z1/step);iz++)for(let ix=Math.floor(b.x0/step);ix<=Math.floor(b.x1/step);ix++){
      let q=clip(p,0,ix*step,true);q=clip(q,0,(ix+1)*step,false);q=clip(q,1,iz*step,true);q=clip(q,1,(iz+1)*step,false);
      // Constrain ground triangles at every platform boundary. A raster-only
      // mesh can otherwise cut through a low facade beside a high platform.
      let pieces=q.length>=3?[q]:[];
      for(const [a,b] of terrain?.edgesForCell(ix,iz,step)||[]){
        const distance=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
        pieces=pieces.flatMap(poly=>{
          const ds=poly.map(distance);if(!ds.some(d=>d>1e-8)||!ds.some(d=>d< -1e-8))return [poly];
          return [1,-1].map(sign=>{
            const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],d=ds[i]*sign,e=ds[(i+1)%poly.length]*sign;if(d>=0)out.push(p);if((d>0&&e<0)||(d<0&&e>0)){const t=d/(d-e);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return out;
          });
        });
      }
      for(const piece of pieces)for(let k=1;k<piece.length-1;k++){
        const a=piece[0],c=piece[k],d=piece[k+1],cross=(c[0]-a[0])*(d[1]-a[1])-(c[1]-a[1])*(d[0]-a[0]);
        if(Math.abs(cross)<1e-10)continue;
        const ids=[vertex(a),vertex(c),vertex(d)];if(cross>0)ids.reverse();indices.push(...ids);
      }
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function drapeGeometry(g,terrain,offset=0){
  const a=g.attributes.position;
  for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)+terrain.sample(a.getX(i),a.getZ(i))+offset);
  a.needsUpdate=true;g.computeVertexNormals();return g;
}

export function boundaryPoints(boundary,terrain,offset=0){
  const points=[];
  for(let i=1;i<boundary.length;i++){
    const a=boundary[i-1],b=boundary[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.65);
    for(let j=0;j<n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;points.push(new THREE.Vector3(x,terrain.sample(x,z)+offset,z));}
  }
  points.push(points[0].clone());return points;
}

export function skirtGeometry(points,bottom){
  const v=[];
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];v.push(a.x,a.y,a.z,b.x,b.y,b.z,a.x,bottom,a.z,b.x,b.y,b.z,b.x,bottom,b.z,a.x,bottom,a.z);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();return g;
}

export function contourGeometry(g,datumMeters,metersPerUnit=10,intervalMeters=10){
  const a=g.attributes.position,idx=g.index.array,v=[];
  for(let i=0;i<idx.length;i+=3){
    const t=[idx[i],idx[i+1],idx[i+2]].map(j=>[a.getX(j),a.getY(j),a.getZ(j)]);
    const min=Math.min(...t.map(p=>p[1])),max=Math.max(...t.map(p=>p[1]));
    for(let level=Math.ceil((min*metersPerUnit+datumMeters)/intervalMeters)*intervalMeters;level<max*metersPerUnit+datumMeters;level+=intervalMeters){
      const y=(level-datumMeters)/metersPerUnit,p=[];
      for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y)){const f=(y-a[1])/(b[1]-a[1]);p.push([a[0]+f*(b[0]-a[0]),y+.025,a[2]+f*(b[2]-a[2])]);}}
      if(p.length===2)v.push(...p[0],...p[1]);
    }
  }
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(v,3));return out;
}

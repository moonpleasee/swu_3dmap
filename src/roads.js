import polygonClipping from 'polygon-clipping';

const EPS=1e-5;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function dedupe(points){
  const out=[];
  for(const p of points)if(!out.length||Math.hypot(p[0]-out.at(-1)[0],p[1]-out.at(-1)[1])>EPS)out.push(p);
  if(out.length>1&&Math.hypot(out[0][0]-out.at(-1)[0],out[0][1]-out.at(-1)[1])<EPS)out.pop();
  return out;
}
function circle(center,radius,segments=20){
  const ring=[];
  for(let i=0;i<segments;i++){
    const a=i/segments*Math.PI*2;ring.push([center[0]+Math.cos(a)*radius,center[1]+Math.sin(a)*radius]);
  }
  return [...ring,ring[0]];
}
function segmentRectangle(a,b,radius){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)||1;
  const nx=-dz/length*radius,nz=dx/length*radius;
  return [[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz], [a[0]+nx,a[1]+nz]];
}

// Build a road from overlapping rectangles and node discs. Unlike a single
// offset polygon, this construction has no mitre spikes at tight turns and
// keeps a connected, rounded surface at crossings and way joins. The OSM
// centerline is unchanged; these rings describe only the visible boundary.
export function strokeRoad(points,width){
  const clean=dedupe(points);if(clean.length<2)return [];
  const radius=Math.max(.275,width/2),pieces=[];
  for(let i=1;i<clean.length;i++){
    const a=clean[i-1],b=clean[i];
    if(Math.hypot(b[0]-a[0],b[1]-a[1])<=EPS)continue;
    pieces.push(segmentRectangle(a,b,radius));
  }
  for(const p of clean)pieces.push(circle(p,radius));
  return pieces;
}

function toPolygon(ring){return dedupe(ring).map(p=>[Number(p[0]),Number(p[1])]);}
export function buildRoadPolygons(roads,blocked=[]){
  const source=[];
  for(const road of roads){
    const rings=strokeRoad(road.points,Math.max(.55,Number(road.width)||1.3));
    if(rings.length)source.push(polygonClipping.union(...rings.map(r=>[r])));
  }
  if(!source.length)return [];
  let merged=polygonClipping.union(...source);
  if(blocked.length){
    const masks=blocked.map(f=>[f.polygon,...(f.holes||[])]).filter(p=>p[0]?.length>=4);
    if(masks.length)merged=polygonClipping.difference(merged,polygonClipping.union(...masks));
  }
  return merged.map(poly=>poly.map(toPolygon)).filter(poly=>poly[0]?.length>=4);
}

export function nearestRoadHeight(x,z,roads,terrain,offset=.022){
  let best=Infinity,bx=x,bz=z;
  for(const road of roads)for(let i=1;i<road.points.length;i++){
    const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1),px=a[0]+dx*t,pz=a[1]+dz*t,d=Math.hypot(x-px,z-pz);
    if(d<best){best=d;bx=px;bz=pz;}
  }
  return terrain.sample(bx,bz)+offset;
}

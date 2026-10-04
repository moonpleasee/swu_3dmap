import polygonClipping from 'polygon-clipping';

const EPS=1e-5;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function dedupe(points){
  const out=[];
  for(const p of points)if(!out.length||Math.hypot(p[0]-out.at(-1)[0],p[1]-out.at(-1)[1])>EPS)out.push(p);
  if(out.length>1&&Math.hypot(out[0][0]-out.at(-1)[0],out[0][1]-out.at(-1)[1])<EPS)out.pop();
  return out;
}
function lineIntersection(p,u,q,v){
  const cross=u[0]*v[1]-u[1]*v[0];if(Math.abs(cross)<1e-7)return null;
  const w=[q[0]-p[0],q[1]-p[1]],t=(w[0]*v[1]-w[1]*v[0])/cross;
  return [p[0]+u[0]*t,p[1]+u[1]*t];
}
function tangent(points,i,j){
  const dx=points[j][0]-points[i][0],dz=points[j][1]-points[i][1],len=Math.hypot(dx,dz)||1;
  return [dx/len,dz/len];
}

// Stroke each source OSM way with circular joins. The centerline is unchanged;
// the extra samples describe only the visible road boundary.
export function strokeRoad(points,width){
  const clean=dedupe(points);if(clean.length<2)return null;
  const radius=Math.max(.275,width/2),left=[],right=[];
  const join=(out,i,side)=>{
    const p=clean[i],u0=tangent(clean,i-1,i),u1=tangent(clean,i,i+1);
    const n0=[-u0[1]*side,u0[0]*side],n1=[-u1[1]*side,u1[0]*side];
    const turn=u0[0]*u1[1]-u0[1]*u1[0],outer=turn*side<0;
    if(!outer){
      const hit=lineIntersection([p[0]+n0[0]*radius,p[1]+n0[1]*radius],u0,[p[0]+n1[0]*radius,p[1]+n1[1]*radius],u1);
      if(hit&&Math.hypot(hit[0]-p[0],hit[1]-p[1])<radius*3.5){out.push(hit);return;}
    }
    const a0=Math.atan2(n0[1],n0[0]),a1=Math.atan2(n1[1],n1[0]);
    const delta=Math.atan2(Math.sin(a1-a0),Math.cos(a1-a0));
    const count=Math.max(3,Math.ceil(Math.abs(delta)*radius/.11));
    for(let k=0;k<=count;k++){const a=a0+delta*k/count;out.push([p[0]+Math.cos(a)*radius,p[1]+Math.sin(a)*radius]);}
  };
  const first=tangent(clean,0,1),last=tangent(clean,clean.length-2,clean.length-1);
  left.push([clean[0][0]-first[1]*radius,clean[0][1]+first[0]*radius]);
  right.push([clean[0][0]+first[1]*radius,clean[0][1]-first[0]*radius]);
  for(let i=1;i<clean.length-1;i++){join(left,i,1);join(right,i,-1);}
  left.push([clean.at(-1)[0]-last[1]*radius,clean.at(-1)[1]+last[0]*radius]);
  right.push([clean.at(-1)[0]+last[1]*radius,clean.at(-1)[1]-last[0]*radius]);
  const ring=dedupe([...left,...right.reverse()]);
  return ring.length>=3?[...ring,ring[0]]:null;
}

function toPolygon(ring){return dedupe(ring).map(p=>[Number(p[0]),Number(p[1])]);}
export function buildRoadPolygons(roads,blocked=[]){
  const source=[];
  for(const road of roads){const ring=strokeRoad(road.points,Math.max(.55,Number(road.width)||1.3));if(ring)source.push([ring]);}
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

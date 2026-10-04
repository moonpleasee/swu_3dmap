import * as THREE from 'three';

const value=(p,v)=>p[0]*v[0]+p[1]*v[1]+p[2];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const area=p=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);
// Clip an open convex ring to ax+bz+c >= 0.
function clip(poly,plane){
  if(!poly.length)return [];
  const out=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],da=value(plane,a),db=value(plane,b);
    if(da>=0)out.push(a);
    if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  return out.length>=3&&area(out)>1e-10?out:[];
}
function subtractConvex(poly,planes){
  const outside=[];let rest=poly;
  for(const p of planes){
    const piece=clip(rest,p.map(v=>-v));if(piece.length)outside.push(piece);
    rest=clip(rest,p);if(!rest.length)break;
  }
  return outside;
}
export function roofFrame(poly,angle){
  let longest=0,u=[1,0];
  for(let i=1;i<poly.length;i++){
    const a=poly[i-1],b=poly[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(d>longest){longest=d;u=[(b[0]-a[0])/d,(b[1]-a[1])/d];}
  }
  if(angle!==undefined)u=[Math.cos(angle),Math.sin(angle)];
  if(u[0]<0)u=u.map(v=>-v);const v=[-u[1],u[0]],origin=poly[0];
  const local=p=>[(p[0]-origin[0])*u[0]+(p[1]-origin[1])*u[1],(p[0]-origin[0])*v[0]+(p[1]-origin[1])*v[1]];
  const world=p=>[origin[0]+p[0]*u[0]+p[1]*v[0],origin[1]+p[0]*u[1]+p[1]*v[1]];
  return {local,world,u,v};
}
// A roof is the upper envelope of intersecting wing roofs. Every patch lies on
// an exact plane; intersection lines are explicitly clipped, never sampled.
// This prevents the triangulation-dependent zig-zag ridges of the old method.
export function roofFacets(poly,holes,rise,plan){
  const F=roofFrame(poly,plan?.angle),rings=[poly,...holes].map(r=>r.slice(0,-1).map(F.local));
  const points=rings.flat(),v2=rings.map(r=>r.map(p=>new THREE.Vector2(...p)));
  const tris=THREE.ShapeUtils.triangulateShape(v2[0],v2.slice(1)).map(t=>t.map(i=>points[i]));
  const xs=rings[0].map(p=>p[0]),zs=rings[0].map(p=>p[1]);
  const rects=plan?.rects||[[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs),rise]];
  const roofs=rects.map(([x0,x1,z0,z1,h=rise])=>{
    const s=h/(Math.min(x1-x0,z1-z0)/2);
    return [[s,0,-s*x0],[-s,0,s*x1],[0,s,-s*z0],[0,-s,s*z1]];
  });
  const candidates=[{index:-1,plane:[0,0,0],limits:[]}];
  roofs.forEach((planes,index)=>planes.forEach((plane,k)=>candidates.push({index,plane,limits:[plane,...planes.filter((_,j)=>j!==k).map(p=>sub(p,plane))]})));
  const facets=[];
  for(const c of candidates)for(const tri of tris){
    let p=tri;for(const limit of c.limits){p=clip(p,limit);if(!p.length)break;}if(!p.length)continue;
    let pieces=[p];
    for(let j=0;j<roofs.length&&pieces.length;j++){
      if(j===c.index)continue;
      const limits=roofs[j].map(plane=>{const q=sub(plane,c.plane);q[2]-=j<c.index?-1e-8:1e-8;return q;});
      pieces=pieces.flatMap(piece=>subtractConvex(piece,limits));
    }
    for(const piece of pieces)facets.push({plane:c.plane,polygon:piece,wing:c.index,frame:F});
  }
  return facets;
}
export function planarRoof(poly,holes,base,color,rise=.38,plan){
  const facets=roofFacets(poly,holes,rise,plan),positions=[],uv=[];
  for(const f of facets)for(let i=1;i<f.polygon.length-1;i++)for(const p of [f.polygon[0],f.polygon[i],f.polygon[i+1]]){
    const w=f.frame.world(p);positions.push(w[0],base+.04+Math.max(0,value(f.plane,p)),w[1]);uv.push(p[0],p[1]);
  }
  // Close eaves and clipped gable ends; otherwise a wing whose ridge meets an
  // outer wall can leave a visible gap between the roof and the wall below it.
  const boundaries=[poly,...holes].flatMap(r=>r.slice(1).map((b,i)=>[r[i],b]));
  const onSegment=(p,a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);return l>0&&Math.abs((p[0]-a[0])*dz-(p[1]-a[1])*dx)/l<1e-6&&(p[0]-a[0])*dx+(p[1]-a[1])*dz>=-1e-6&&(p[0]-b[0])*dx+(p[1]-b[1])*dz<=1e-6;};
  for(const f of facets)for(let i=0;i<f.polygon.length;i++){
    const a=f.polygon[i],b=f.polygon[(i+1)%f.polygon.length],A=f.frame.world(a),B=f.frame.world(b);
    if(!boundaries.some(([c,d])=>onSegment(A,c,d)&&onSegment(B,c,d)))continue;
    const yA=base+.04+Math.max(0,value(f.plane,a)),yB=base+.04+Math.max(0,value(f.plane,b));
    for(const v of [[A[0],base,A[1]],[B[0],base,B[1]],[B[0],yB,B[1]],[A[0],base,A[1]],[B[0],yB,B[1]],[A[0],yA,A[1]]]){positions.push(...v);uv.push(v[0],v[1]);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.87,side:THREE.DoubleSide}));mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

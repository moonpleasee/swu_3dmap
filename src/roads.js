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

// The road mesh asks for a centerline height at every grid vertex. Build an
// exact spatial index once instead of scanning every OSM segment for each one.
export function createRoadHeightSampler(roads,terrain,offset=.022){
  const segments=[];
  for(const road of roads)for(let i=1;i<road.points.length;i++){
    const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1];
    segments.push({ax:a[0],az:a[1],dx,dz,length2:dx*dx+dz*dz||1,
      minX:Math.min(a[0],b[0]),maxX:Math.max(a[0],b[0]),minZ:Math.min(a[1],b[1]),maxZ:Math.max(a[1],b[1]),order:segments.length});
  }
  const bounds=items=>({minX:Math.min(...items.map(s=>s.minX)),maxX:Math.max(...items.map(s=>s.maxX)),minZ:Math.min(...items.map(s=>s.minZ)),maxZ:Math.max(...items.map(s=>s.maxZ))});
  const build=items=>{
    const box=bounds(items);
    if(items.length<=8)return {...box,segments:items};
    const axis=box.maxX-box.minX>=box.maxZ-box.minZ?'x':'z';
    items.sort((a,b)=>axis==='x'?(a.minX+a.maxX)-(b.minX+b.maxX):(a.minZ+a.maxZ)-(b.minZ+b.maxZ));
    const mid=items.length>>1;
    return {...box,left:build(items.slice(0,mid)),right:build(items.slice(mid))};
  };
  const root=segments.length?build(segments):null;
  const boxDistance2=(box,x,z)=>{
    const dx=x<box.minX?box.minX-x:x>box.maxX?x-box.maxX:0;
    const dz=z<box.minZ?box.minZ-z:z>box.maxZ?z-box.maxZ:0;
    return dx*dx+dz*dz;
  };
  return (x,z)=>{
    let best=Infinity,bx=x,bz=z,bestOrder=Infinity;
    const visit=node=>{
      if(boxDistance2(node,x,z)>best)return;
      if(node.segments){
        for(const s of node.segments){
          const t=clamp(((x-s.ax)*s.dx+(z-s.az)*s.dz)/s.length2,0,1),px=s.ax+s.dx*t,pz=s.az+s.dz*t;
          const dx=x-px,dz=z-pz,d=dx*dx+dz*dz;
          if(d<best||(d===best&&s.order<bestOrder)){best=d;bx=px;bz=pz;bestOrder=s.order;}
        }
      }else{
        const left=boxDistance2(node.left,x,z),right=boxDistance2(node.right,x,z);
        if(left<=right){if(left<=best)visit(node.left);if(right<=best)visit(node.right);}
        else {if(right<=best)visit(node.right);if(left<=best)visit(node.left);}
      }
    };
    if(root)visit(root);
    return terrain.sample(bx,bz)+offset;
  };
}

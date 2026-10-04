import * as THREE from 'three';

// Lightweight details for water and garden polygons.  The existing surface
// meshes remain the source of truth for footprints and terrain height; this
// module only adds shallow edge bands, paths and planting accents around them.
//
// Coordinates are in the same campus x/z space as campus.json.  By default
// returned groups use local y values relative to `terrain.elevation(feature)`;
// pass { worldY: true } when adding a group directly to a world layer (as is
// normally done for a draped green surface).

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const length=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const openRing=ring=>{
  if(!Array.isArray(ring))return [];
  const out=ring.map(p=>[Number(p[0]),Number(p[1])]).filter(p=>p.every(Number.isFinite));
  if(out.length>1&&out[0][0]===out.at(-1)[0]&&out[0][1]===out.at(-1)[1])out.pop();
  return out;
};
const signedArea=ring=>{
  let a=0;for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length];a+=p[0]*q[1]-q[0]*p[1];}
  return a*.5;
};
const area=ring=>Math.abs(signedArea(ring));
const centroid=ring=>{
  const a=signedArea(ring);if(Math.abs(a)<1e-8){const c=ring.reduce((s,p)=>[s[0]+p[0],s[1]+p[1]],[0,0]);return [c[0]/Math.max(1,ring.length),c[1]/Math.max(1,ring.length)];}
  let x=0,z=0;for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],k=p[0]*q[1]-q[0]*p[1];x+=(p[0]+q[0])*k;z+=(p[1]+q[1])*k;}
  return [x/(6*a),z/(6*a)];
};
const inside=(p,ring)=>{
  let hit=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }
  return hit;
};
const inFeature=(p,ring,holes=[])=>inside(p,ring)&&!holes.some(h=>inside(p,h));
const bounds=ring=>ring.reduce((b,p)=>({minX:Math.min(b.minX,p[0]),maxX:Math.max(b.maxX,p[0]),minZ:Math.min(b.minZ,p[1]),maxZ:Math.max(b.maxZ,p[1])}),{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const pointKey=p=>`${p[0].toFixed(3)},${p[1].toFixed(3)}`;

function material(color,options={}){
  return new THREE.MeshStandardMaterial({color,roughness:options.roughness??.88,metalness:options.metalness??0,transparent:options.transparent??false,opacity:options.opacity??1,side:THREE.DoubleSide,depthWrite:options.depthWrite??true});
}

function heightSampler(feature,terrain,options={}){
  const base=Number.isFinite(options.elevation)?options.elevation:(terrain?.elevation?.(feature)??0);
  const worldY=options.worldY===true;
  return (x,z,offset=0)=>{
    const y=terrain?.sample?.(x,z)??base;
    return y+offset-(worldY?0:base);
  };
}

function stripGeometry(ring,insideDepth,outsideDepth,yAt,offset=0){
  const r=openRing(ring);if(r.length<3)return null;
  const ccw=signedArea(r)>0,vertices=[],indices=[];
  for(let i=0;i<r.length;i++){
    const a=r[i],b=r[(i+1)%r.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    if(len<.01)continue;
    // For a counter-clockwise ring the right hand normal faces outward.
    const n=ccw?[dz/len,-dx/len]:[-dz/len,dx/len];
    const k=vertices.length/3;
    const ai=[a[0]-n[0]*insideDepth,a[1]-n[1]*insideDepth],ao=[a[0]+n[0]*outsideDepth,a[1]+n[1]*outsideDepth];
    const bi=[b[0]-n[0]*insideDepth,b[1]-n[1]*insideDepth],bo=[b[0]+n[0]*outsideDepth,b[1]+n[1]*outsideDepth];
    vertices.push(ai[0],yAt(...ai,offset),ai[1],ao[0],yAt(...ao,offset),ao[1],bi[0],yAt(...bi,offset),bi[1],bo[0],yAt(...bo,offset),bo[1]);
    indices.push(k,k+2,k+1,k+1,k+2,k+3);
  }
  if(!vertices.length)return null;
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function edgeLine(ring,yAt,offset=0,inside=0){
  const r=openRing(ring);if(r.length<2)return null;const pts=[];
  const ccw=signedArea(r)>0;
  for(let i=0;i<r.length;i++){
    const a=r[i],b=r[(i+1)%r.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1;
    const n=ccw?[dz/len,-dx/len]:[-dz/len,dx/len];
    pts.push(new THREE.Vector3(a[0]-n[0]*inside,yAt(a[0]-n[0]*inside,a[1]-n[1]*inside,offset),a[1]-n[1]*inside));
  }
  pts.push(pts[0].clone());
  return new THREE.BufferGeometry().setFromPoints(pts);
}

function flatPatch(ring,yAt,color,options={}){
  const r=openRing(ring);if(r.length<3)return null;
  // ShapeGeometry is rotated onto the x/z plane below.  Negating z here
  // matches the campus scene's shapeOf() convention, so details stay on the
  // same side of the mapped polygon after the -PI/2 rotation.
  const shape=new THREE.Shape(r.map(p=>new THREE.Vector2(p[0],-p[1])));
  const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);
  const pos=g.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,yAt(pos.getX(i),pos.getZ(i),options.offset??0));
  pos.needsUpdate=true;g.computeVertexNormals();return new THREE.Mesh(g,material(color,options));
}

function scaledPatch(ring,center,scale){return ring.map(p=>[center[0]+(p[0]-center[0])*scale,center[1]+(p[1]-center[1])*scale]);}

function makeRippleLines(ring,yAt,group,options={}){
  const r=openRing(ring);if(r.length<3||area(r)<5)return;
  const c=centroid(r),b=bounds(r),major=Math.max(b.maxX-b.minX,b.maxZ-b.minZ);
  const count=clamp(Math.floor(major/2.8),2,8),axis=(b.maxX-b.minX>=b.maxZ-b.minZ)?[1,0]:[0,1];
  const matLine=new THREE.LineBasicMaterial({color:options.rippleColor??'#d8eee6',transparent:true,opacity:options.rippleOpacity??.34});
  for(let i=0;i<count;i++){
    const t=(i+.5)/count-.5,center=[c[0]+axis[0]*major*.5*t,c[1]+axis[1]*major*.5*t];
    const perp=[-axis[1],axis[0]],half=.28+((i*17)%5)*.035;
    const a=[center[0]-perp[0]*half,center[1]-perp[1]*half],b2=[center[0]+perp[0]*half,center[1]+perp[1]*half];
    if(!inFeature(center,r,options.holes||[]))continue;
    const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a[0],yAt(...a,(options.offset??0)+.012),a[1]),new THREE.Vector3(b2[0],yAt(...b2,(options.offset??0)+.012),b2[1])]);
    group.add(new THREE.Line(g,matLine));
  }
}

/**
 * Build a water detail group for one surface feature.  It adds a low bank
 * strip outside the mapped shoreline, a translucent shallow-water strip and
 * restrained ripple marks.  The source polygon is never changed.
 */
export function createWaterDetails(feature,terrain,options={}){
  const group=new THREE.Group();group.name=`water-details-${feature?.id??'surface'}`;
  const ring=openRing(feature?.polygon||[]);if(ring.length<3)return group;
  const yAt=heightSampler(feature,terrain,options),holes=(feature.holes||[]).map(openRing);
  const bank=stripGeometry(ring,.02,options.bankWidth??.18,yAt,options.bankOffset??.018);
  if(bank)group.add(new THREE.Mesh(bank,material(options.bankColor??'#647d70',{roughness:.94})));
  const shore=stripGeometry(ring,options.shallowWidth??.42,.015,yAt,options.shallowOffset??.024);
  if(shore)group.add(new THREE.Mesh(shore,material(options.shallowColor??'#a7d0c3',{roughness:.5,transparent:true,opacity:.52,depthWrite:false})));
  const line=edgeLine(ring,yAt,options.edgeOffset??.04,options.edgeInset??.025);
  if(line)group.add(new THREE.Line(line,new THREE.LineBasicMaterial({color:options.edgeColor??'#d5e9df',transparent:true,opacity:.62})));
  for(const hole of holes){
    const h=stripGeometry(hole,.12,.05,yAt,(options.bankOffset??.018)+.004);if(h)group.add(new THREE.Mesh(h,material(options.holeBankColor??'#6c8877',{roughness:.94})));
  }
  group.userData.waterGarden={kind:'water',featureId:feature?.id,coordinateSpace:options.worldY===true?'world':'surface-local',details:['shore','bank','edge']};
  return group;
}

function addPath(group,start,end,yAt,options={}){
  const dx=end[0]-start[0],dz=end[1]-start[1],len=Math.hypot(dx,dz);if(len<.8)return;
  const n=[-dz/len,dx/len],w=options.pathWidth??.22;
  const r=[[start[0]-n[0]*w,start[1]-n[1]*w],[end[0]-n[0]*w,end[1]-n[1]*w],[end[0]+n[0]*w,end[1]+n[1]*w],[start[0]+n[0]*w,start[1]+n[1]*w]];
  const mesh=flatPatch(r,yAt,options.pathColor??'#b5a98c',{roughness:.96,offset:options.pathOffset??.025});if(mesh){mesh.name='garden-path';group.add(mesh);}
}

function addPlanting(group,ring,holes,yAt,options={}){
  const r=openRing(ring);if(r.length<3||area(r)<4)return;
  const positions=[],spacing=options.plantSpacing??2.3;
  for(let i=0;i<r.length;i++){
    const a=r[i],b=r[(i+1)%r.length],len=length(a,b),n=Math.max(1,Math.floor(len/spacing));
    for(let j=0;j<n;j++){
      const p=lerp(a,b,(j+.45)/n),c=centroid(r),toward=[c[0]-p[0],c[1]-p[1]],d=Math.hypot(...toward)||1;
      const q=[p[0]+toward[0]/d*.38,p[1]+toward[1]/d*.38];
      if(inFeature(q,r,holes))positions.push(q);
    }
  }
  const dedupe=new Map();positions.forEach(p=>dedupe.set(pointKey(p),p));const pts=[...dedupe.values()].slice(0,options.maxPlants??26);
  if(!pts.length)return;
  const trunk=new THREE.CylinderGeometry(.035,.045,.12,6),crown=new THREE.ConeGeometry(.12,.22,6);
  const trunkMat=material(options.trunkColor??'#765b3d',{roughness:1}),crownMat=material(options.leafColor??'#557b57',{roughness:.98});
  const trunks=new THREE.InstancedMesh(trunk,trunkMat,pts.length),crowns=new THREE.InstancedMesh(crown,crownMat,pts.length),m=new THREE.Matrix4();
  pts.forEach((p,i)=>{const y=yAt(...p,(options.plantOffset??.035));m.makeTranslation(p[0],y+.06,p[1]);trunks.setMatrixAt(i,m);m.makeTranslation(p[0],y+.20,p[1]);crowns.setMatrixAt(i,m);});
  trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;trunks.name='garden-edge-trunks';crowns.name='garden-edge-crowns';group.add(trunks,crowns);
}

/**
 * Build restrained garden or park details.  Mapped leisure=garden areas get
 * an edge planting band, a central planting patch and a short paved path;
 * natural=wood areas only receive the edge band unless the caller opts in.
 */
export function createGardenDetails(feature,terrain,options={}){
  const group=new THREE.Group();group.name=`garden-details-${feature?.id??'surface'}`;
  const ring=openRing(feature?.polygon||[]);if(ring.length<3)return group;
  const holes=(feature.holes||[]).map(openRing),yAt=heightSampler(feature,terrain,options),tag=feature.tags||{};
  const garden=tag.leisure==='garden'||options.forceGarden===true;
  const b=stripGeometry(ring,.03,options.edgeWidth??.13,yAt,options.edgeOffset??.018);
  if(b)group.add(new THREE.Mesh(b,material(options.edgeColor??(garden?'#63805c':'#6c815b'),{roughness:.96})));
  const edge=stripGeometry(ring,options.plantBedWidth??.35,.01,yAt,options.bedOffset??.028);
  if(edge)group.add(new THREE.Mesh(edge,material(options.bedColor??(garden?'#6d8c61':'#708764'),{roughness:.98})));
  if(garden){
    const c=centroid(ring),inner=scaledPatch(ring,c,options.patchScale??.34);
    if(inner.every(p=>inFeature(p,ring,holes))){
      const patch=flatPatch(inner,yAt,options.patchColor??'#789867',{roughness:.98,offset:options.patchOffset??.035});
      if(patch){patch.name='garden-flower-bed';group.add(patch);}
    }
    addPlanting(group,ring,holes,yAt,options);
    const bb=bounds(ring),axis=(bb.maxX-bb.minX>=bb.maxZ-bb.minZ)?[1,0]:[0,1],maxLen=Math.max(bb.maxX-bb.minX,bb.maxZ-bb.minZ);let half=maxLen*.34;
    let s=[c[0]-axis[0]*half,c[1]-axis[1]*half],e=[c[0]+axis[0]*half,c[1]+axis[1]*half];
    while(half>.6&&(!inFeature(s,ring,holes)||!inFeature(e,ring,holes))){half*=.82;s=[c[0]-axis[0]*half,c[1]-axis[1]*half];e=[c[0]+axis[0]*half,c[1]+axis[1]*half];}
    if(inFeature(s,ring,holes)&&inFeature(e,ring,holes))addPath(group,s,e,yAt,options);
  }
  group.userData.waterGarden={kind:'garden',featureId:feature?.id,coordinateSpace:options.worldY===true?'world':'surface-local',details:garden?['edge','planting-bed','plants','path']:['edge','woodland-edge']};
  return group;
}

/** Convenience dispatcher for a single mapped surface. */
export function createWaterGardenDetails(feature,terrain,options={}){
  if(feature?.kind==='water'||feature?.tags?.natural==='water'||feature?.tags?.leisure==='swimming_pool')return createWaterDetails(feature,terrain,options);
  if(feature?.kind==='green'||feature?.tags?.leisure==='garden'||feature?.tags?.natural==='wood')return createGardenDetails(feature,terrain,options);
  return new THREE.Group();
}

/** Add details for a list of surface features and return the created groups. */
export function addWaterGardenDetails(root,features,terrain,options={}){
  const groups=[];for(const feature of features||[]){
    const group=createWaterGardenDetails(feature,terrain,options[feature.id]||options.default||options);
    if(group.children.length){root.add(group);groups.push(group);}
  }
  return groups;
}

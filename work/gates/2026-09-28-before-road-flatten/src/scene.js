import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ExteriorBatch, decorateBuilding, facadeEdges, chooseFront, surfacePattern } from './exteriors.js';
import {entryDimensions} from './entrances.js';
import {specialBuildingMeshes} from './building-character.js';
import { buildingParts, pitchedRoof, secondFieldDetails, footballMarkings, addBox } from './model-details.js';
import {CampusTerrain,terrainGeometry,drapeGeometry,boundaryPoints,skirtGeometry,contourGeometry,colorTerrain} from './terrain.js';
import {buildRoadDetails} from './road-details.js';
import {createWaterGardenDetails} from './water-garden-details.js';

export function inside([x,y], polygon) {
  let v=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) v=!v;
  }
  return v;
}
const distanceToSegment=(p,a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;
  const t=l?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
};
function shapeOf(poly, holes=[]) {
  const s=new THREE.Shape(poly.map(p=>new THREE.Vector2(p[0],-p[1])));
  for(const h of holes)s.holes.push(new THREE.Path(h.map(p=>new THREE.Vector2(p[0],-p[1]))));
  return s;
}
function extrusion(poly,height,holes=[]) {
  const g=new THREE.ExtrudeGeometry(shapeOf(poly,holes),{depth:height,bevelEnabled:false,curveSegments:1,steps:1});
  g.rotateX(-Math.PI/2);return g;
}
const mat=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...options});
function bounds(p) {
  const xs=p.map(p=>p[0]),zs=p.map(p=>p[1]);
  return {minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};
}

export class CampusScene {
  constructor(host,data,{onSelect,onMove,onReady,terrain}) {
    this.host=host;this.data=data;this.onSelect=onSelect;this.onMove=onMove;
    this.terrain=new CampusTerrain(data,terrain);
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#edece3');
    this.camera=new THREE.PerspectiveCamera(37,1,.15,2200);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    host.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label','西南大学北碚校区三维地图，可拖动旋转、滚轮缩放，也可通过地标列表选择建筑');
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.065;
    this.controls.minDistance=1;this.controls.maxDistance=660;
    this.controls.maxPolarAngle=Math.PI*.475;this.controls.minPolarAngle=.04;
    this.controls.screenSpacePanning=true;this.controls.target.set(0,0,0);
    this.controls.addEventListener('start',()=>{this.flight=null;this.onMove?.();});
    this.hemi=new THREE.HemisphereLight('#f9fbff','#7c8e69',2.65);this.scene.add(this.hemi);
    this.sun=new THREE.DirectionalLight('#fff2d8',3.15);this.sun.position.set(-100,190,100);
    this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);
    Object.assign(this.sun.shadow.camera,{left:-160,right:160,top:160,bottom:-160,near:1,far:480});
    this.sun.shadow.bias=-.0005;this.sun.shadow.normalBias=.09;this.scene.add(this.sun);
    this.layers={};for(const key of ['buildings','roads','nature','water','labels','contours'])this.layers[key]=new THREE.Group();
    this.layers.contours.visible=false;
    Object.values(this.layers).forEach(g=>this.scene.add(g));
    this.pickables=[];this.namedMeshes=new Map();this.labelElements=[];this.isNight=false;
    this.mapPickMode=null;this.communityMarkers=new Map();
    this.buildGround();this.buildSurfaces();this.buildBuildings();this.buildRoads();this.buildTrees();
    this.selection=new THREE.Group();this.scene.add(this.selection);
    this.createLabels();
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.renderer.domElement.addEventListener('pointerdown',e=>{this.down=[e.clientX,e.clientY];});
    this.renderer.domElement.addEventListener('pointerup',e=>{
      if(!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;
      const r=this.renderer.domElement.getBoundingClientRect();
      this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
      this.raycaster.setFromCamera(this.pointer,this.camera);
      if(this.mapPickMode){
        const hit=this.raycaster.intersectObject(this.campusBase?.[1],false)[0];
        if(hit){this.mapPickMode([hit.point.x,hit.point.z]);return;}
      }
      const hit=this.raycaster.intersectObjects(this.pickables.filter(m=>m.parent.visible),false)[0];
      if(hit){
        const feature=hit.object.userData.feature;
        if(feature?.kind==='community-place'&&this.onSelect)this.onSelect(feature);
        else if(feature)this.onSelect(feature);
      }
    });
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
    this.resize();this.reset(false);
    this.animate=this.animate.bind(this);this.renderer.setAnimationLoop(this.animate);
    requestAnimationFrame(()=>onReady?.());
  }
  buildGround(){
    const perimeter=boundaryPoints(this.data.boundary,this.terrain,-.01);
    const base=new THREE.Mesh(skirtGeometry(perimeter,this.terrain.bottom),mat('#b6c39f',{side:THREE.DoubleSide}));
    base.receiveShadow=true;this.scene.add(base);
    const geometry=terrainGeometry(this.data.boundary,[],(x,z)=>this.terrain.sample(x,z)-.01,.65,this.terrain);
    const top=new THREE.Mesh(colorTerrain(geometry,this.terrain),mat('#ffffff',{vertexColors:true}));
    top.receiveShadow=true;this.scene.add(top);
    this.layers.contours.add(new THREE.LineSegments(contourGeometry(geometry,this.terrain.raster.datumMeters+.1),new THREE.LineBasicMaterial({color:'#67774f',transparent:true,opacity:.48})));geometry.dispose();
    this.terrainMaterial=top.material;
    this.campusBase=[base,top];
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),mat('#edece3'));
    ground.rotation.x=-Math.PI/2;ground.position.y=-2.65;ground.receiveShadow=true;this.scene.add(ground);this.ground=ground;
    this.boundaryLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(boundaryPoints(this.data.boundary,this.terrain,.01)),new THREE.LineBasicMaterial({color:'#f9f7e9'}));
    this.scene.add(this.boundaryLine);
  }
  setMapPickMode(handler){this.mapPickMode=handler;}
  setMapMarker(point){
    const base=this.communityPlaces||[];
    this.setCommunityMarkers(point?[...base,{id:'__draft__',name:'正在创建的地点',point}]:base);
  }
  pickMapPoint(clientX,clientY){
    const r=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hit=this.raycaster.intersectObject(this.campusBase?.[1],false)[0];
    return hit?[hit.point.x,hit.point.z]:null;
  }
  setCommunityMarkers(places,onSelect){
    this.communityPlaces=(places||[]).filter(p=>p.id!=='__draft__');
    if(this.communityPickables?.length){const old=new Set(this.communityPickables);this.pickables=this.pickables.filter(m=>!old.has(m));}
    this.communityPickables=[];
    for(const group of this.communityMarkers.values()){group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.scene.remove(group);}
    this.communityMarkers.clear();
    for(const p of places||[]){
      if(!Array.isArray(p.point)||p.point.length<2)continue;
      const group=new THREE.Group();group.userData.feature={kind:'community-place',communityPlaceId:p.id,id:p.id,displayName:p.name,center:p.point};
      const pin=new THREE.Mesh(new THREE.ConeGeometry(.16,.48,12),new THREE.MeshStandardMaterial({color:'#c8664c',roughness:.65}));pin.position.y=.32;pin.rotation.x=Math.PI;pin.userData.feature=group.userData.feature;
      const ring=new THREE.Mesh(new THREE.RingGeometry(.20,.25,20),new THREE.MeshBasicMaterial({color:'#f1c889',transparent:true,opacity:.85,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.025;ring.userData.feature=group.userData.feature;
      group.add(pin,ring);group.position.set(p.point[0],this.terrain.sample(p.point[0],p.point[1]),p.point[1]);this.scene.add(group);this.communityMarkers.set(p.id,group);this.pickables.push(pin,ring);this.communityPickables.push(pin,ring);
    }
    this.communityMarkerSelect=onSelect;
  }
  buildSurfaces(){
    for(const f of [...this.data.surfaces].sort((a,b)=>({green:0,sport:1,water:2}[a.kind]-{green:0,sport:1,water:2}[b.kind]))){
      const starts=Object.fromEntries(['nature','water'].map(k=>[k,this.layers[k].children.length]));
      const isTrack=f.tags.leisure==='track';
      const isSecondTrack=f.id==='846878928',isSecondPitch=f.id==='210254160';
      const color=f.kind==='water'?'#7eb6af':f.kind==='green'?'#9fb787':f.tags.leisure==='stadium'?'#b8bcaa':isSecondTrack?'#9388b5':isTrack?'#bd806a':f.tags.sport==='basketball'?'#a68671':'#719260';
      const material=mat(color,{roughness:f.kind==='water'?.28:.94,metalness:f.kind==='water'?.12:0});
      if(f.kind==='green')material.visible=false;
      const mesh=new THREE.Mesh(f.kind==='green'?terrainGeometry(f.polygon,f.holes,(x,z)=>this.terrain.sample(x,z)-.005,.65,this.terrain):new THREE.ShapeGeometry(shapeOf(f.polygon,f.holes)),material);
      if(f.kind!=='green'){mesh.rotation.x=-Math.PI/2;mesh.position.y=f.kind==='water'?.055:f.tags.leisure==='stadium'?.005:isTrack?.035:.125;}
      mesh.receiveShadow=true;mesh.userData.feature=f;
      this.layers[f.kind==='water'?'water':'nature'].add(mesh);
      if(f.kind==='water'||f.kind==='green'){
        const details=createWaterGardenDetails(f,this.terrain);
        details.position.y+=this.terrain.elevation(f);
        details.userData.feature=f;
        this.layers[f.kind==='water'?'water':'nature'].add(details);
      }
      if(f.landmark!==undefined||f.displayName){this.pickables.push(mesh);this.namedMeshes.set(f.id,mesh);}
      if(f.tags.sport==='soccer'&&!isSecondPitch)footballMarkings(this.layers.nature,f.polygon);
      if(f.kind==='sport'&&isTrack&&!isSecondTrack){
        const b=bounds(f.polygon),cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;
        const width=b.maxX-b.minX,depth=b.maxZ-b.minZ;
        // Use scaled surveyed outline so each running track keeps its own orientation.
        for(let k=1;k<=3;k++){
          const s=1-k*.035;
          const pts=f.polygon.map(p=>new THREE.Vector3(cx+(p[0]-cx)*s,.065,cz+(p[1]-cz)*s));
          this.layers.nature.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#f4e7d7',transparent:true,opacity:.55})));
        }
        const p=f.polygon.map(p=>[cx+(p[0]-cx)*.73,cz+(p[1]-cz)*.73]);
        const turf=new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(p)),mat('#87a278'));
        turf.rotation.x=-Math.PI/2;turf.position.y=.07;turf.receiveShadow=true;this.layers.nature.add(turf);
        if(Math.min(width,depth)>6){
          const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.15,32),new THREE.MeshBasicMaterial({color:'#e9ebd6',side:THREE.DoubleSide}));
          ring.rotation.x=-Math.PI/2;ring.position.set(cx,.085,cz);this.layers.nature.add(ring);
        }
      }
      if(f.kind!=='green')for(const k of ['nature','water'])for(const m of this.layers[k].children.slice(starts[k]))m.position.y+=this.terrain.elevation(f);
    }
    const start=this.layers.nature.children.length;
    secondFieldDetails(this.layers.nature,this.data.surfaces.find(f=>f.id==='846878928'),this.data.surfaces.find(f=>f.id==='210254160'));
    const field=this.data.surfaces.find(f=>f.id==='846878928');
    for(const m of this.layers.nature.children.slice(start))m.position.y+=this.terrain.elevation(field);
  }
  buildBuildings(){
    this.baseModels=new Map();this.glassMaterials=[];
    const batch=new ExteriorBatch(),edges=[];
    for(const f of this.data.buildings){
      const p=f.exterior,parts=buildingParts(f),models=[];
      // Remove the old flat model's 0.13-unit display lift as one rigid
      // translation, so its unchanged entrance/door/body geometry meets ground.
      const elevation=this.terrain.elevation(f)-.13;batch.elevation=elevation;
      const wall=mat(p.wall,{map:['brick','tile'].includes(p.wallFinish)?surfacePattern(p.wallFinish):null});
      const roof=mat(p.roofColor);
      for(const part of parts){
        const geometry=extrusion(part.polygon,part.height,part.holes);
        const mesh=new THREE.Mesh(geometry,[roof,wall]);mesh.position.y=.13+elevation;
        mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.feature=f;
        this.layers.buildings.add(mesh);this.pickables.push(mesh);models.push(mesh);this.namedMeshes.set(f.id,mesh);
        const ed=new THREE.EdgesGeometry(geometry,25);ed.translate(0,.13+elevation,0);edges.push(ed);
        if(p.roofStyle==='hip'){
          const pitched=pitchedRoof(part.polygon,part.holes,.13+part.height,p.roofColor,p.roofRise,p.roofPlan);pitched.position.y=elevation;pitched.material.map=surfacePattern('roof');this.layers.buildings.add(pitched);models.push(pitched);
        }
      }
      const extraStart=(batch.extra||[]).length;
      decorateBuilding(f,parts,batch,false);
      for(const m of (batch.extra||[]).slice(extraStart))m.position.y+=elevation;
      if(!p.specialModel&&(f.id==='842765847'||f.model==='round-roof')){
        const b=bounds(f.polygon),dome=new THREE.Mesh(new THREE.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),mat('#9aafaa',{metalness:.3,roughness:.4}));
        dome.scale.set((b.maxX-b.minX)*.43,f.id==='842765847'?1.1:.55,(b.maxZ-b.minZ)*.43);dome.position.set((b.minX+b.maxX)/2,f.height+.13+elevation,(b.minZ+b.maxZ)/2);dome.castShadow=true;this.layers.buildings.add(dome);models.push(dome);
      }
      for(const m of specialBuildingMeshes(f)){m.position.y=elevation;m.userData.feature=f;this.layers.buildings.add(m);this.pickables.push(m);models.push(m);if(m.userData.glass)this.glassMaterials.push(m.material);}
      this.baseModels.set(f.id,models);
    }
    for(const mesh of batch.flush(this.layers.buildings))if(mesh.userData.glass)this.glassMaterials.push(mesh.material);
    for(const mesh of batch.extra||[])this.layers.buildings.add(mesh);
    const merged=mergeGeometries(edges);if(merged)this.layers.buildings.add(new THREE.LineSegments(merged,new THREE.LineBasicMaterial({color:'#7f887b',transparent:true,opacity:.16})));
    edges.forEach(g=>g.dispose());
    this.detailRoot=new THREE.Group();this.scene.add(this.detailRoot);
  }
  clearFine(){
    while(this.detailRoot?.children.length){const root=this.detailRoot.children[0];root.traverse(o=>{if(o.userData.exteriorOwned){o.geometry?.dispose();if(o.userData.ownedMap)o.material?.map?.dispose();o.material?.dispose();}});this.detailRoot.remove(root);}
  }
  updateFine(f){
    this.clearFine();if(f?.kind!=='building')return;
    this.detailRoot.position.y=this.inspectionMode?0:this.terrain.elevation(f)-.13;
    const parts=buildingParts(f),batch=new ExteriorBatch();
    if(this.inspectionMode){
      for(const base of this.baseModels.get(f.id)||[]){const clone=base.clone();clone.position.y-=this.terrain.elevation(f)-.13;this.detailRoot.add(clone);}
      decorateBuilding(f,parts,batch,false);
    }
    decorateBuilding(f,parts,batch,true);
    const models=batch.flush(this.detailRoot);
    for(const mesh of models)if(mesh.userData.glass)mesh.material.emissiveIntensity=this.isNight?1.3:0;
    for(const mesh of batch.extra||[]){mesh.userData.exteriorOwned=true;this.detailRoot.add(mesh);}
  }
  setInspection(enabled,refocus=true){
    if(enabled===!!this.inspectionMode)return;
    this.inspectionMode=enabled;
    this.selection.visible=!enabled&&this.layers.buildings.visible;
    document.body.classList.toggle('inspecting',enabled);this.resize();
    this.campusBase.forEach(m=>m.visible=!enabled);this.ground.position.y=enabled?.10:-2.65;
    if(enabled){
      this.savedLayerVisibility=Object.fromEntries(Object.entries(this.layers).map(([k,v])=>[k,v.visible]));
      Object.values(this.layers).forEach(g=>g.visible=false);this.labelHost.hidden=true;this.boundaryLine.visible=false;
    }else{
      for(const [k,v] of Object.entries(this.savedLayerVisibility||{}))this.layers[k].visible=v;
      this.terrainMaterial.vertexColors=this.layers.nature.visible;this.terrainMaterial.color.set(this.layers.nature.visible?'#ffffff':'#c6d1b1');this.terrainMaterial.needsUpdate=true;
      this.labelHost.hidden=this.labelsVisible===false;this.boundaryLine.visible=true;
      this.selection.visible=this.layers.buildings.visible;
    }
    if(refocus&&this.detailFeature)this.focus(this.detailFeature);
  }
  buildRoads(){
    const details=buildRoadDetails({roads:this.data.roads,terrain:this.terrain});
    this.layers.roads.add(details.group);this.roadDetails=details.counts;
  }
  buildTrees(){
    const buildingBounds=this.data.buildings.map(f=>({f,b:bounds(f.polygon)}));
    const surfaces=this.data.surfaces.filter(f=>f.kind!=='green').map(f=>({f,b:bounds(f.polygon)}));
    const segments=this.data.roads.flatMap(r=>r.points.slice(1).map((p,i)=>({a:r.points[i],b:p,w:r.width/2+.55})));
    let seed=20260921;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const positions=[];const bound=bounds(this.data.boundary);
    const hit=(p,item)=>p[0]>item.b.minX-.4&&p[0]<item.b.maxX+.4&&p[1]>item.b.minZ-.4&&p[1]<item.b.maxZ+.4&&inside(p,item.f.polygon);
    for(let i=0;i<15000&&positions.length<2300;i++){
      const p=[bound.minX+random()*(bound.maxX-bound.minX),bound.minZ+random()*(bound.maxZ-bound.minZ)];
      if(!inside(p,this.data.boundary)||buildingBounds.some(b=>hit(p,b))||surfaces.some(b=>hit(p,b)))continue;
      if(segments.some(s=>Math.abs(p[0]-(s.a[0]+s.b[0])/2)<Math.abs(s.a[0]-s.b[0])/2+s.w&&Math.abs(p[1]-(s.a[1]+s.b[1])/2)<Math.abs(s.a[1]-s.b[1])/2+s.w&&distanceToSegment(p,s.a,s.b)<s.w))continue;
      positions.push([p[0],p[1],.65+random()*.65,random()]);
    }
    const trees=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),mat('#709068',{flatShading:true}),positions.length);
    const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.1,.14,1,5),mat('#847b60'),positions.length);
    const obj=new THREE.Object3D(),color=new THREE.Color();
    positions.forEach(([x,z,s,c],i)=>{
      const elevation=this.terrain.sample(x,z);
      obj.position.set(x,s*.95+elevation,z);obj.scale.set(s*.67,s*.84,s*.67);obj.rotation.set(0,c*Math.PI,0);obj.updateMatrix();trees.setMatrixAt(i,obj.matrix);
      color.setHSL(.23+c*.075,.20+c*.1,.35+c*.12);trees.setColorAt(i,color);
      obj.position.y=s*.35+elevation;obj.scale.set(1,s*.7,1);obj.updateMatrix();trunks.setMatrixAt(i,obj.matrix);
    });
    trees.castShadow=true;trees.receiveShadow=true;this.layers.nature.add(trees,trunks);
    this.treeCount=positions.length;
  }
  createLabels(){
    this.labelHost=document.createElement('div');this.labelHost.className='map-labels';this.host.appendChild(this.labelHost);
    const landmarkIds=new Set(this.data.landmarks.map(l=>l.id));
    const entries=[...this.data.landmarks.map(l=>({...l,priority:3})),...[...this.data.buildings,...this.data.surfaces.filter(f=>f.displayName)].filter(f=>!landmarkIds.has(f.id)).map(f=>({id:f.id,name:f.displayName,center:f.center,height:f.height||0,priority:f.nameStatus==='unresolved'?0:f.category==='宿舍'?2:1}))];
    entries.forEach((l,i)=>{
      const f=this.data.buildings.concat(this.data.surfaces).find(f=>f.id===l.id);l.baseElevation=f?this.terrain.elevation(f):this.terrain.sample(...l.center);
      const button=document.createElement('button');button.className='map-label'+(l.priority<3?' ordinary-label':'')+(l.priority===0?' unresolved-label':'');
      const dot=document.createElement('i'),span=document.createElement('span');span.textContent=l.name;button.append(dot,span);
      button.setAttribute('aria-label',`查看${l.name}`);button.onclick=()=>this.onSelect(this.data.buildings.concat(this.data.surfaces).find(f=>f.id===l.id));
      this.labelHost.append(button);this.labelElements.push({button,l,index:i});
    });
  }
  resize(){
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h);
  }
  goTo(target,position,animated=true){
    if(!animated){this.controls.target.copy(target);this.camera.position.copy(position);this.controls.update();return;}
    this.flight={started:performance.now(),from:this.camera.position.clone(),fromTarget:this.controls.target.clone(),position,target};
  }
  reset(animated=true){
    const portrait=this.host.clientWidth<this.host.clientHeight;
    const position=portrait?new THREE.Vector3(-190,370,418):new THREE.Vector3(35,270,318);
    const y=this.terrain.sample(0,8);position.y+=y;this.goTo(new THREE.Vector3(0,y,8),position,animated);
    this.highlight(null);this.activeId=null;
  }
  focus(f){
    if(f.kind!=='building')this.setInspection(false,false);
    this.detailFeature=f;this.updateFine(f);
    this.activeId=f.id;this.highlight(f);
    const b=bounds(f.polygon),size=Math.max(b.maxX-b.minX,b.maxZ-b.minZ,f.height||0,8);
    const dist=Math.min(130,Math.max(29,size*2.3));const [x,z]=f.center;
    if(this.inspectionMode){
      const front=chooseFront(buildingParts(f).flatMap(p=>facadeEdges(p,f)),f.exterior),n=front?.n||[.7,.7];
      const radius=Math.hypot(b.maxX-b.minX,b.maxZ-b.minZ,(f.height||0)+.7)/2;
      const d=Math.max(5,radius/Math.sin(THREE.MathUtils.degToRad(this.camera.fov/2))*1.12)/Math.min(1,this.camera.aspect);
      const target=new THREE.Vector3((b.minX+b.maxX)/2,(f.height||0)*.48,(b.minZ+b.maxZ)/2);
      const angle=.24,nx=n[0]*Math.cos(angle)-n[1]*Math.sin(angle),nz=n[0]*Math.sin(angle)+n[1]*Math.cos(angle);
      this.goTo(target,new THREE.Vector3(target.x+nx*d,target.y+d*.38,target.z+nz*d));return;
    }
    const shift=this.host.clientWidth>760?dist*.1:0;
    const y=this.terrain.elevation(f);
    this.goTo(new THREE.Vector3(x+shift*.743,y+(f.height||0)*.3,z-shift*.669),new THREE.Vector3(x+dist*.72+shift*.743,y+dist*.85,z+dist*.8-shift*.669));
  }
  highlight(f){
    while(this.selection.children.length){const c=this.selection.children[0];c.geometry?.dispose();c.material?.dispose();this.selection.remove(c);}
    if(!f){this.setInspection(false,false);this.clearFine();this.detailFeature=null;return;}
    for(const part of f.kind==='building'?buildingParts(f):[{polygon:f.polygon,height:0}]){
      const points=part.polygon.map(p=>new THREE.Vector3(p[0],part.height+.24+this.terrain.elevation(f),p[1]));
      const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#df9b57',depthTest:false}));outline.renderOrder=10;this.selection.add(outline);
    }
  }
  focusPoint(point){
    if(!point||point.length<2)return;
    this.setInspection(false,false);this.detailFeature=null;this.activeId=null;
    const y=this.terrain.sample(point[0],point[1]);const target=new THREE.Vector3(point[0],y,point[1]);
    this.goTo(target,new THREE.Vector3(point[0]+12,y+10,point[1]+12));
  }
  focusEntrance(f){
    this.setInspection(true,false);this.focus(f);
    const e=chooseFront(buildingParts(f).flatMap(part=>facadeEdges(part,f).map(edge=>({...edge,part}))),f.exterior);
    if(!e)return;
    const dim=entryDimensions(e,f.exterior),height=f.exterior.entryArch?e.part.height:dim.height,target=new THREE.Vector3(...e.point(dim.center,.20+height*.5,.10));
    const d=Math.max(1.1,dim.width*1.7,height*2.3)/Math.min(1,this.camera.aspect);
    this.goTo(target,new THREE.Vector3(target.x+e.n[0]*d,target.y+d*.13,target.z+e.n[1]*d));
  }
  topView(){
    const target=this.controls.target.clone();this.goTo(target,new THREE.Vector3(target.x,target.y+Math.max(this.inspectionMode?8:90,this.camera.position.distanceTo(target)),target.z+.15));
  }
  zoom(factor){const t=this.controls.target.clone();this.goTo(t,this.camera.position.clone().sub(t).multiplyScalar(factor).add(t));}
  setLayer(key,enabled){
    if(this.inspectionMode&&key!=='labels'){this.savedLayerVisibility[key]=enabled;return;}
    if(key==='labels'){this.labelsVisible=enabled;this.labelHost.hidden=!enabled||!!this.inspectionMode;}
    else {this.layers[key].visible=enabled;if(key==='buildings')this.selection.visible=enabled;if(key==='nature'){this.terrainMaterial.vertexColors=enabled;this.terrainMaterial.color.set(enabled?'#ffffff':'#c6d1b1');this.terrainMaterial.needsUpdate=true;}}
  }
  setTime(mode){
    this.isNight=mode==='night';
    const themes={day:{bg:'#edece3',sky:'#f9fbff',ground:'#7c8e69',sun:'#fff2d8',sunPower:3.15,hemi:2.65,exposure:1.12,pos:[-100,190,100]},dusk:{bg:'#e8d9cb',sky:'#fce5cf',ground:'#766d63',sun:'#ffc08a',sunPower:3.5,hemi:1.7,exposure:1.1,pos:[-180,80,70]},night:{bg:'#1c2d35',sky:'#7598b8',ground:'#263c37',sun:'#9ebcda',sunPower:1.2,hemi:1.1,exposure:.98,pos:[-100,190,100]}};
    const t=themes[mode];this.scene.background.set(t.bg);this.ground.material.color.set(t.bg);this.hemi.color.set(t.sky);this.hemi.groundColor.set(t.ground);this.hemi.intensity=t.hemi;
    this.sun.color.set(t.sun);this.sun.intensity=t.sunPower;this.sun.position.set(...t.pos);this.renderer.toneMappingExposure=t.exposure;
    for(const material of this.glassMaterials)material.emissiveIntensity=this.isNight?1.3:mode==='dusk'?.2:0;
    this.detailRoot.traverse(o=>{if(o.userData.glass)o.material.emissiveIntensity=this.isNight?1.3:mode==='dusk'?.2:0;});
  }
  animate(now){
    if(this.flight){
      const f=this.flight,p=Math.min(1,(now-f.started)/(matchMedia('(prefers-reduced-motion: reduce)').matches?1:1250)),t=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
      this.camera.position.lerpVectors(f.from,f.position,t);this.controls.target.lerpVectors(f.fromTarget,f.target,t);if(p===1)this.flight=null;
    }
    this.controls.update();
    if(!this.inspectionMode){const floor=this.terrain.sample(this.camera.position.x,this.camera.position.z)+.6;if(this.camera.position.y<floor)this.camera.position.y=floor;}
    this.detailRoot.visible=!!this.inspectionMode||this.layers.buildings.visible;
    const w=this.host.clientWidth,h=this.host.clientHeight,used=[];
    const hostRect=this.host.getBoundingClientRect();
    const blocked=[...document.querySelectorAll('.explorer,.detail-card:not([hidden]),.bottom-controls,.masthead,.map-heading')].map(e=>e.getBoundingClientRect()).map(r=>({left:r.left-hostRect.left,right:r.right-hostRect.left,top:r.top-hostRect.top,bottom:r.bottom-hostRect.top}));
    const cameraDistance=this.camera.position.distanceTo(this.controls.target);
    const order=[...this.labelElements].sort((a,b)=>(b.l.id===this.activeId)-(a.l.id===this.activeId)||b.l.priority-a.l.priority);
    for(const {button,l,index} of order){
      const p=new THREE.Vector3(l.center[0],l.height+1.5+l.baseElevation,l.center[1]).project(this.camera);
      const x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
      const active=l.id===this.activeId;const collision=used.some(a=>Math.abs(a[0]-x)<125&&Math.abs(a[1]-y)<36);
      const nearTarget=Math.hypot(l.center[0]-this.controls.target.x,l.center[1]-this.controls.target.z)<cameraDistance*.7;
      const eligible=active||l.priority===3||(l.priority>0&&cameraDistance<190&&nearTarget)||(l.priority===0&&cameraDistance<65&&nearTarget);
      const underPanel=blocked.some(r=>x+55>r.left&&x-55<r.right&&y>r.top&&y-25<r.bottom);
      const show=eligible&&p.z<1&&p.z>-1&&x>25&&x<w-30&&y>20&&y<h-35&&!collision&&!underPanel;
      button.hidden=!show;button.classList.toggle('selected',active);
      if(show){button.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;used.push([x,y]);}
    }
    const compass=document.getElementById('compass-arrow');if(compass)compass.style.transform=`rotate(${-this.controls.getAzimuthalAngle()*180/Math.PI}deg)`;
    this.renderer.render(this.scene,this.camera);
  }
  async screenshot(){
    const canvas=document.createElement('canvas');const src=this.renderer.domElement;canvas.width=src.width;canvas.height=src.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(src,0,0);
    const size=Math.max(16,Math.round(canvas.width/65));ctx.fillStyle='rgba(249,248,240,.93)';ctx.fillRect(0,canvas.height-size*3.5,canvas.width,size*3.5);
    ctx.fillStyle='#285648';ctx.font=`600 ${size}px sans-serif`;ctx.fillText('西南大学 · 云游北碚  |  简化三维示意',size,canvas.height-size*1.9);
    ctx.font=`${Math.round(size*.7)}px sans-serif`;ctx.fillText('© OpenStreetMap contributors · Terrain Tiles / Mapzen / USGS · DEM 地形，平台估算',size,canvas.height-size*.7);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('无法生成图片');return blob;
  }
}

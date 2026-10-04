import * as THREE from 'three';
import {buildEntry,entryDimensions} from './entrances.js';
import {photoFacade} from './building-character.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const signedArea=p=>p.slice(1).reduce((sum,b,i)=>sum+p[i][0]*b[1]-b[0]*p[i][1],0)/2;
function pointSegment(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}

export function facadeEdges(part,feature){
  const boundary=[feature.polygon,...feature.holes].flatMap(r=>r.slice(1).map((b,i)=>[r[i],b]));
  return [part.polygon,...part.holes].flatMap((ring,hole)=>{
    const sign=(signedArea(ring)>0?1:-1)*(hole?-1:1);
    const edges=ring.slice(1).map((b,i)=>{
      const a=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      if(length<.12||!boundary.some(([c,d])=>pointSegment(mid,c,d)<.025))return null;
      const u=[dx/length,dz/length],n=[u[1]*sign,-u[0]*sign];
      return {a,b,length,u,n,mid,hole:!!hole,angle:-Math.atan2(dz,dx),point:(x,y,depth=0)=>[a[0]+u[0]*x+n[0]*depth,y,a[1]+u[1]*x+n[1]*depth]};
    }).filter(Boolean);
    // Survey vertices may split one straight facade exactly at its entrance.
    // Merge those edges before laying out windows or reserving the doorway.
    const mergeable=(a,b)=>Math.hypot(a.b[0]-b.a[0],a.b[1]-b.a[1])<.001&&a.u[0]*b.u[0]+a.u[1]*b.u[1]>.99999;
    const join=(a,b)=>({...a,b:b.b,length:a.length+b.length,mid:[(a.a[0]+b.b[0])/2,(a.a[1]+b.b[1])/2]});
    const out=[];for(const e of edges){if(out.length&&mergeable(out[out.length-1],e))out[out.length-1]=join(out[out.length-1],e);else out.push(e);}
    if(out.length>1&&mergeable(out[out.length-1],out[0])){out[0]=join(out[out.length-1],out[0]);out.pop();}
    return out;
  });
}

export class ExteriorBatch {
  constructor(){this.records=new Map();this.transform=new THREE.Object3D();this.elevation=0;}
  box(position,size,color,angle=0,kind='solid'){
    if(!size.every(v=>Number.isFinite(v)&&v>0)||!position.every(Number.isFinite))throw new Error('Invalid exterior geometry');
    const key=kind;let list=this.records.get(key);if(!list)this.records.set(key,list=[]);
    this.transform.position.set(...position);this.transform.position.y+=this.elevation;this.transform.scale.set(...size);this.transform.rotation.set(0,angle,0);this.transform.updateMatrix();list.push({matrix:this.transform.matrix.clone(),color});
  }
  cylinder(position,radius,height,color){this.box(position,[radius,height,radius],color,0,'column');}
  flush(group){
    const result=[];
    for(const [kind,list] of this.records){
      const g=kind==='column'?new THREE.CylinderGeometry(1,1,1,12):new THREE.BoxGeometry(1,1,1);
      const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:kind==='glass'?.26:.83,metalness:kind==='glass'?.28:0,emissive:kind==='glass'?'#eebf74':'#000000',emissiveIntensity:0});
      const m=new THREE.InstancedMesh(g,material,list.length),color=new THREE.Color();
      list.forEach((r,i)=>{m.setMatrixAt(i,r.matrix);m.setColorAt(i,color.set(r.color));});m.instanceMatrix.needsUpdate=true;m.castShadow=kind!=='glass';m.receiveShadow=true;m.userData.exteriorOwned=true;m.userData.glass=kind==='glass';group.add(m);result.push(m);
    }
    return result;
  }
}

export function chooseFront(edges,profile){
  if(profile.entryPoint)return edges.filter(e=>!e.hole).sort((a,b)=>pointSegment(profile.entryPoint,a.a,a.b)-pointSegment(profile.entryPoint,b.a,b.b))[0];
  const dir=profile.front||[.7,.7];
  return edges.filter(e=>!e.hole&&e.length>.6).sort((a,b)=>b.length*Math.max(.1,b.n[0]*dir[0]+b.n[1]*dir[1])-a.length*Math.max(.1,a.n[0]*dir[0]+a.n[1]*dir[1]))[0];
}
export function facadeOverride(e,p){return (p.facadeZones||[]).find(z=>pointSegment(z.point,e.a,e.b)<.035);}
function specialFacade(e,part,p,z,batch,fine){
  const put=(x,y,d,w,h,depth,c,kind='solid')=>batch.box(e.point(x,y,d),[w,h,depth],c,e.angle,kind);
  const H=part.height,L=e.length,floor=H/part.levels;
  if(z.kind==='blank'){
    if(!fine)for(let i=0;i<3;i++)put(L*(i+1)/4,.13+H*.27,.025,.07,.07,.02,p.glass,'glass');
    return;
  }
  if(z.kind==='curtain'){
    if(!fine)put(L/2,.13+H/2,.04,L*.94,H*.97,.035,p.glass,'glass');
    if(fine){
      const n=Math.max(2,Math.round(L/.20));
      for(let i=0;i<=n;i++)put(L*.03+L*.94*i/n,.13+H/2,.08,.012,H,.025,p.trim);
      for(let i=0;i<=part.levels*2;i++)put(L/2,.13+floor*i/2,.08,L*.96,.012,.025,p.trim);
    }
    return;
  }
  if(z.kind==='open-gallery'){
    if(!fine){
      put(L/2,.13+H/2,.025,L,H,.045,'#48514c');
      for(let r=0;r<=part.levels;r++)put(L/2,.13+r*floor,.15,L,.038,.32,p.trim);
      put(.045,.13+H/2,.20,.13,H,.40,p.accent);
      for(const x of [.045,L-.025])put(x,.13+H+.12,.12,.035,.24,.06,p.trim);
      put(L/2,.13+H+.24,.12,L,.045,.38,p.trim);
      for(let k=0;k<3;k++)put(L*(k+.5)/3,.13+H+.24,-.15,.025,.045,.9,p.trim);
    }else for(let r=1;r<part.levels;r++){
      put(L/2,.13+r*floor+.10,.29,L,.014,.014,p.trim);
      for(let j=0;j<=Math.ceil(L/.07);j++)put(L*j/Math.ceil(L/.07),.13+r*floor+.054,.29,.008,.1,.012,p.trim);
    }
  }
}
export function decorateBuilding(feature,parts,batch,fine=false){
  const p=feature.exterior,allEdges=parts.flatMap(part=>facadeEdges(part,feature).map(edge=>({...edge,part}))),front=chooseFront(allEdges,p);
  const known=['single-photo','garden-photo'].includes(p.basis);
  const configured=known||p.basis==='inferred';
  const put=(e,x,y,depth,w,h,d,color,kind='solid')=>batch.box(e.point(x,y,depth),[w,h,d],color,e.angle,kind);
  for(const part of parts){
    const floor=part.height/part.levels;
    for(const e of facadeEdges(part,feature)){
      if(p.specialModel==='segmented-arena')continue;
      const frontFace=front&&Math.abs(e.mid[0]-front.mid[0])+Math.abs(e.mid[1]-front.mid[1])<.03;
      const isLong=e.length>1.1,curtain=p.facade==='library'&&(part.levels<8||e.length>3),blank=(p.facade==='library'&&part.levels>8&&!curtain)||(p.facade==='art'&&e.length>2.3)||(p.facade==='museum'&&e.length<2);
      const bays=Math.max(1,Math.round(e.length/(curtain?.28:p.bay||.46))),pitch=e.length/bays;
      const isBalcony=!!p.balcony&&isLong;
      const winW=pitch*(curtain?.94:p.windowWidth||.64),winH=floor*(curtain?.90:p.windowHeight||.64);
      if(!fine){
        put(e,e.length/2,.18,.012,e.length,.10,.055,p.base||'#949789');
        if(p.roofStyle!=='hip'&&!p.specialModel){
          put(e,e.length/2,.13+part.height+.047,0,e.length,.095,.095,p.trim);
          put(e,e.length/2,.13+part.height+.09,0,e.length,.025,.13,p.roofColor);
        }else if(p.roofStyle==='hip')put(e,e.length/2,.14+part.height,0,e.length,.045,.16,p.trim);
      }
      if(p.photoFacade&&(frontFace||p.photoFacadePoints?.some(point=>pointSegment(point,e.a,e.b)<.035))){photoFacade(e,part,p,batch,fine);continue;}
      const zone=facadeOverride(e,p);
      if(zone){specialFacade(e,part,p,zone,batch,fine);continue;}
      if(blank){
        if(p.facade==='library'&&!fine)for(let r=0;r<part.levels;r++)put(e,e.length*.76,.13+floor*(r+.55),.014,.06,floor*.6,.025,p.glass,'glass');
        continue;
      }
      for(let r=0;r<part.levels;r++){
        const y=.13+floor*(r+.56),slab=.13+floor*r;
        if(!fine&&isLong&&['bands','banyue','louver','library','classical','frame','auditorium'].includes(p.facade))put(e,e.length/2,.13+floor*(r+1),.035,e.length,.026,.1,p.facade==='library'?p.accent:p.trim);
        for(let k=0;k<bays;k++){
          const x=(k+.5)*pitch,entrySize=front?entryDimensions(front,p):null,entryGap=configured&&p.entry&&frontFace&&r<(p.entryReserveFloors||p.entryFloors||1)&&Math.abs(x-entrySize.center)<(p.entryReserveWidth||entrySize.width)/2+.04;
          if(entryGap)continue;
          const narrowPanes=p.facade==='historic',shadowColor=p.facade==='historic'?'#65675e':'#666e68';
          if(!fine){
            put(e,x,y,.018,winW,winH,.034,p.glass,'glass');
            if(r===0&&['historic','frame','sunhood'].includes(p.facade)&&known&&isLong)put(e,k*pitch,.13+part.height/2,.022,.045,part.height,.04,p.facade==='historic'?p.accent:p.trim);
            if(r===0&&p.facade==='arcade'&&known&&isLong&&k%3===0)put(e,k*pitch,.13+part.height/2,.065,.1,part.height,.15,p.accent);
            if(p.facade==='louver'&&isLong)put(e,x+pitch*.34,y,.023,pitch*.24,floor*.87,.035,p.accent);
            continue;
          }
          const frame=p.frame||p.trim,thickness=p.frameWidth||.011;
          // Fine geometry is just in front of the overview glass, with an inset
          // surround to give the window reveal visible depth at close distance.
          put(e,x,y,.022,winW+.038,winH+.038,.028,shadowColor);
          put(e,x,y,.043,winW,winH,.018,p.glass,'glass');
          for(const s of [-1,1]){
            put(e,x+s*winW/2,y,.061,thickness,winH+.018,.035,frame);
            put(e,x,y+s*winH/2,.061,winW,thickness,.035,frame);
          }
          put(e,x,y,.062,thickness*.75,winH,.038,frame);
          if(narrowPanes||curtain)put(e,x,y+winH*.12,.063,winW,thickness*.7,.038,frame);
          put(e,x,y-winH/2-.012,.07,winW+.035,.016,.1,p.trim);
          if(p.facade==='sunhood'){
            put(e,x,y+winH/2+.03,.105,winW+.075,.04,.21,p.trim);
            for(const s of [-1,1])put(e,x+s*(winW/2+.025),y,.09,.04,winH+.05,.17,p.trim);
            for(let j=0;j<3;j++)put(e,x,y+winH/2+.013+j*.018,.205,winW+.03,.007,.013,p.accent);
          }
          if(p.facade==='louver'&&isLong)for(let slat=0;slat<7;slat++)put(e,x+pitch*.34,slab+floor*(.16+slat*.11),.054,pitch*.23,.011,.055,p.accent);
          if(isBalcony&&r>0){
            const bw=p.balcony==='continuous'?pitch:winW+.06,depth=p.balcony==='rounded'?.19:.13;
            put(e,x,slab+.01,depth/2,bw+.02,.035,depth+.04,p.trim);
            if(p.balcony==='rounded'){
              const points=Array.from({length:9},(_,i)=>{const t=i/8;return [x-bw/2+bw*t,.11+Math.sin(t*Math.PI)*.12];});
              for(let i=1;i<points.length;i++){
                const a=points[i-1],b=points[i],A=e.point(a[0],slab+.11,a[1]),B=e.point(b[0],slab+.11,b[1]);
                batch.box([(A[0]+B[0])/2,slab+.11,(A[2]+B[2])/2],[Math.hypot(B[0]-A[0],B[2]-A[2]),.018,.018],p.trim,-Math.atan2(B[2]-A[2],B[0]-A[0]));
                put(e,b[0],slab+.064,b[1],.014,.09,.014,p.trim);
              }
            }else{
              put(e,x,slab+.10,depth,bw,.016,.018,p.trim);
              put(e,x,slab+.05,depth,bw,.014,.018,p.trim);
              for(let rail=0;rail<=4;rail++)put(e,x-bw/2+bw*rail/4,slab+.065,depth,.009,.09,.012,p.trim);
              if(p.balcony==='rooms')for(const s of [-1,1])put(e,x+s*bw/2,slab+floor*.45,depth/2,.022,floor*.9,depth,p.wall);
            }
          }
          if(p.ac&&isLong&&r>0&&k%2===0){
            put(e,x+pitch*.4,y-winH*.28,.09,.085,.065,.11,'#c6c6b5');
            for(let j=0;j<3;j++)put(e,x+pitch*.4,y-winH*.28-.015+j*.016,.151,.06,.007,.008,'#8f9892');
          }
        }
      }
      if(!fine&&p.facade==='banyue'&&isLong){
        for(let k=0;k<bays;k++)if(k%4===0)put(e,(k+.5)*pitch,.13+part.height/2,.039,pitch*.38,part.height,.065,p.accent);
      }
      if(fine&&known&&p.glassSpine&&frontFace){
        const sw=Math.min(.5,e.length*.18),sx=e.length*.18;
        put(e,sx,.13+part.height*.5,.09,sw,part.height*.92,.04,p.glass,'glass');
        for(let r=0;r<=part.levels;r++)put(e,sx,.13+floor*r,.13,sw,.012,.035,p.trim);
        for(let s=-1;s<=1;s++)put(e,sx+s*sw/2,.13+part.height*.5,.13,.012,part.height,.035,p.trim);
      }
      if(fine&&known&&(feature.model==='terraced-dorm'||feature.model==='historic-wings')){
        const y=.13+part.height;
        put(e,e.length/2,y+.12,.025,e.length,.016,.018,p.accent);
        for(let k=0;k<=bays;k++)put(e,k*pitch,y+.06,.025,.012,.12,.015,p.trim);
      }
      if(fine&&known&&(p.crown||p.roofCrown||p.roofPergola)&&isLong){
        const h=.13+part.height+.18;
        for(let k=0;k<=bays;k+=2)put(e,k*pitch,h,.025,.045,.35,.06,p.crown?p.accent:p.trim);
        put(e,e.length/2,h+.18,.08,e.length+.12,.055,p.roofPergola?.38:.25,p.crown?p.accent:p.trim);
        if(p.roofPergola)for(let k=0;k<bays;k++)put(e,(k+.5)*pitch,h+.18,-.2,.025,.045,.6,p.trim);
      }
    }
  }
  if(!fine&&configured&&p.entry&&front)buildEntry(front,p,batch);
  if(fine&&feature.id==='368605817'&&front){
    const w=Math.min(front.length*.60,2.3),h=front.part.height;
    for(let i=0;i<5;i++){
      const x=front.length/2-w/2+w*i/4;
      put(front,x,.13+h*.49,.23,.075,h*.32,.36,p.accent);
      put(front,x,.13+h*.18,.12,.08,h*.30,.20,'#9b6f60');
    }
  }
  return {windowProfile:p.facade,sourceBasis:p.basis};
}

const textures=new Map();
export function surfacePattern(kind){
  if(textures.has(kind))return textures.get(kind);
  const n=128,pixels=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const mortar=kind==='roof'?(x%4===0||y%8===0):kind==='brick'?(y%4===0||(x+(Math.floor(y/4)%2)*4)%8===0):(x%8===0||y%8===0);
    const value=mortar?kind==='roof'?185:215:248+((x*17+y*23)%7);
    const i=(y*n+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
  }
  const texture=new THREE.DataTexture(pixels,n,n);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;textures.set(kind,texture);return texture;
}

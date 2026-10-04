import * as THREE from 'three';
import {fieldFrame} from './model-details.js';
import {entryDimensions} from './entrances.js';

// Only explicitly researched profiles enter these branches. Back/side facades
// retain the documented simplified treatment where no photograph is available.
export function photoFacade(e,part,p,batch,fine){
  const H=part.height,L=e.length,floor=H/part.levels,{center:cx,width:ew}=entryDimensions({...e,part},p);
  const put=(x,y,d,w,h,depth,c,kind='solid')=>batch.box(e.point(x,y,d),[w,h,depth],c,e.angle,kind);
  const window=(x,y,w,h)=>{
    if(!fine)put(x,y,.035,w,h,.035,p.glass,'glass');
    else{
      for(const s of [-1,1]){put(x+s*w/2,y,.06,.012,h,.035,p.frame||p.trim);put(x,y+s*h/2,.06,w,.012,.035,p.frame||p.trim);}
      put(x,y,.061,.011,h,.034,p.frame||p.trim);put(x,y+h*.12,.061,w,.01,.034,p.frame||p.trim);
    }
  };
  if(p.photoFacade==='guiyuan'){
    // 桂园宾馆照片显示白色板墙、深色连续百叶带和密集的竖向窗鳍。
    // 只在照片对应的主立面使用，侧面仍由通用立面表达。
    const n=Math.max(6,Math.round(L/.34)),pitch=L/n;
    if(!fine)put(L*.58,.13+H*.52,.035,L*.78,H*.86,.035,p.accent);
    for(let r=0;r<part.levels;r++){
      const y=.13+floor*(r+.56),h=floor*.70;
      for(let i=0;i<n;i++){
        const x=(i+.5)*pitch;
        const visible=i>=Math.round(n*.12)&&i<=Math.round(n*.82);
        if(visible)window(x,y,pitch*.56,h);
        if(fine&&visible)put(x+.015,y,.095,.018,h+.05,.05,p.trim);
      }
      if(!fine)put(L*.48,.13+floor*(r+1),.07,L*.83,.027,.10,p.trim);
    }
    if(!fine){
      put(L*.56,.13+H*.56,.092,L*.66,H*.78,.018,p.accent);
      for(let i=0;i<=Math.ceil(L*.66/.14);i++)put(L*.23+L*.66*i/Math.ceil(L*.66/.14),.13+H*.56,.12,.014,H*.82,.055,p.trim);
      put(L*.50,.13+H+.035,.06,L*.90,.055,.16,p.trim);
    }
    return;
  }
  if(p.photoFacade==='hospital'){
    // 医院官网照片覆盖一院入口立面：白色小砖、红色院名牌、灰色雨棚和宽台阶。
    const n=Math.max(3,Math.round(L/.82)),pitch=L/n;
    for(let r=0;r<part.levels;r++){
      const y=.13+floor*(r+.56),h=floor*.64;
      for(let i=0;i<n;i++){
        const x=(i+.5)*pitch;
        if(r===0&&Math.abs(x-cx)<ew*.72)continue;
        window(x,y,pitch*.68,h);
      }
      if(!fine&&r===0)put(L/2,.13+floor,.052,L,.06,.10,p.trim);
    }
    if(!fine){
      put(cx,.13+Math.min(floor*.95,H*.30),.095,ew*1.28,.065,.32,p.trim);
      put(cx,.13+Math.min(floor*.65,H*.22),.11,ew*1.06,.045,.24,p.accent);
    }
    return;
  }
  if(p.photoFacade==='meiyuan'){
    // 梅园食堂入口照片可见米白色分格石材、宽台阶和红色校名标识。
    const n=Math.max(3,Math.round(L/.72)),pitch=L/n;
    for(let r=0;r<part.levels;r++){
      const y=.13+floor*(r+.55),h=floor*.70;
      for(let i=0;i<n;i++){
        const x=(i+.5)*pitch;
        if(r===0&&Math.abs(x-cx)<ew*.70)continue;
        window(x,y,pitch*.68,h);
      }
      if(!fine)put(L/2,.13+floor*(r+1),.05,L,.035,.09,p.trim);
    }
    if(!fine){
      put(cx,.13+H*.36,.08,ew*1.28,.18,.12,p.accent);
      put(cx,.13+H*.24,.12,ew*1.04,.04,.22,p.trim);
    }
    return;
  }
  if(p.photoFacade==='yongxiu-a'){
    const n=5,pitch=L/n;
    for(let r=0;r<part.levels;r++)for(let i=0;i<n;i++){
      const x=(i+.5)*pitch;
      if(r===0&&Math.abs(x-cx)<ew*.55)continue;
      if(!fine)put(x,.13+floor*(r+.20),.018,pitch*.61,floor*.33,.04,p.trim);
      window(x,.13+floor*(r+.64),pitch*.61,floor*.67);
    }
    if(!fine){
      put(L/2,.13+H+.005,.065,L,.045,.13,p.trim);
      put(cx,.13+floor+.065,.035,ew*.88,.045,.035,'#47645b');
    }
    return;
  }
  if(p.photoFacade==='yongxiu-b'){
    // The mapped curved end is a chain of short straight wall faces. Keep its
    // own shape; attach continuous floor bands/rails to those faces only.
    const n=Math.max(1,Math.round(L/.48)),pitch=L/n;
    for(let r=0;r<part.levels;r++){
      for(let i=0;i<n;i++){
        const x=(i+.5)*pitch,pt=e.point(x,0);
        if(r===0&&Math.hypot(pt[0]-p.entryPoint[0],pt[2]-p.entryPoint[1])<.48)continue;
        const narrow=r===0&&e.mid[0]<38.2;
        window(x,.13+floor*(r+.65),pitch*(narrow?.33:.90),floor*(narrow?.85:.66));
      }
      if(!fine)put(L/2,.13+floor*(r+.22),.052,L,.12,.11,p.trim);
      if([1,3].includes(r)){
        if(!fine){put(L/2,.13+floor*r+.012,.10,L,.028,.22,p.trim);put(L/2,.13+floor*r+.125,.22,L,.014,.018,'#d9ddd2');}
        else for(let i=0;i<=Math.ceil(L/.045);i++)put(L*i/Math.ceil(L/.045),.13+floor*r+.073,.22,.007,.10,.01,'#d9ddd2');
      }
    }
    return;
  }
  if(p.photoFacade==='shops'){
    const n=Math.max(2,Math.round(L/.7)),pitch=L/n;
    for(let i=0;i<n;i++){
      const x=(i+.5)*pitch;
      window(x,.13+H*.45,pitch*.77,H*.77);
      if(!fine){
        put(x,.13+H*.89,.04,pitch*.95,H*.14,.08,i%2?'#366a56':'#457a73');
        put(x,.13+H*.83,.25,pitch*.96,.022,.48,['#508777','#507f87','#5571a0'][i%3]);
        put(x-pitch*.46,.13+H*.4,.44,.018,H*.8,.018,'#71827b');
      }else{put(x,.13+H*.32,.075,.013,H*.55,.025,p.trim);put(x,.13+H*.36,.10,.015,.04,.02,'#d3c7a2');}
    }
    return;
  }
  if(p.photoFacade==='animal'){
    const w=Math.min(L*.86,2.4),steps=16,base=.13,top=base+H;
    for(let i=0;i<steps;i++){
      const t=(i+.5)/steps,x=cx-w/2+w*t,depth=.10+.20*Math.sin(t*Math.PI),bottom=base+(Math.abs(x-cx)<Math.min(ew*.4,.5)?.44:0),h=top-bottom;
      if(!fine)put(x,bottom+h/2,depth,w/steps*1.01,h,.035,p.glass,'glass');
      else{
        put(x,bottom+h/2,depth+.025,.012,h,.024,p.frame);
        for(let j=1;j<6;j++)if(base+H*j/6>bottom)put(x,base+H*j/6,depth+.025,w/steps,.012,.024,p.frame);
      }
    }
    if(!fine){
      for(const s of [-1,1])put(cx+s*(w/2+.07),base+H/2,.18,.14,H,.38,p.trim);
      for(let i=0;i<=12;i++)put(cx-w/2+w*i/12,top+.07,.12,.027,.035,.68,p.trim);
      put(cx,top+.055,.39,w+.32,.045,.055,p.trim);
    }
    return;
  }
  if(p.photoFacade==='hotel')return; // Entrance close-up only; no invented full facade.
  if(p.photoFacade==='curtain-canteen'){
    if(!fine){
      put(L/2,.13+H/2,.04,L*.96,H*.98,.03,p.glass,'glass');
      for(let i=0;i<=Math.ceil(L/.85);i++)put(L*i/Math.ceil(L/.85),.13+H/2,.10,.06,H,.14,p.trim);
    }else{
      for(let j=0;j<=Math.ceil(H/.14);j++)put(L/2,.13+H*j/Math.ceil(H/.14),.07,L,.014,.025,p.frame);
      for(let i=0;i<=Math.ceil(L/.25);i++)put(L*i/Math.ceil(L/.25),.13+H/2,.075,.009,H,.025,p.frame);
    }
    return;
  }
  const n=Math.max(2,Math.round(L/(p.photoFacade==='badminton'?.85:.8))),pitch=L/n;
  for(let r=0;r<part.levels;r++){
    const y=.13+floor*(r+.56),h=floor*(p.photoFacade==='badminton'?.54:.76);
    for(let i=0;i<n;i++){
      const x=(i+.5)*pitch;
      if(r<(p.entryReserveFloors||1)&&Math.abs(x-cx)<ew*.6+pitch*.3)continue;
      window(x,y,pitch*.78,h);
      if(fine&&p.ac&&r===1&&i%2===0){put(x+pitch*.38,y-h*.30,.11,.09,.075,.13,'#c7ccc4');for(let j=0;j<4;j++)put(x+pitch*.38,y-h*.3-.02+j*.013,.18,.065,.006,.012,'#8a9791');}
    }
    if(!fine&&p.photoFacade==='blue-canteen')put(L/2,.13+floor*(r+1),.047,L,.045,.08,p.accent);
  }
  if(!fine&&p.photoFacade==='blue-canteen')for(let i=0;i<=n;i++)put(i*pitch,.13+H/2,.055,.06,H,.11,p.accent);
  if(!fine&&p.photoFacade==='badminton'){
    put(L/2,.13+H+.035,.17,L+.28,.14,.40,p.trim);
    for(let i=0;i<=Math.ceil(L/.2);i++)put(L*i/Math.ceil(L/.2),.13+H+.036,.375,.007,.13,.009,'#b8c3bd');
  }
}

function surface(vertices,color,glass=false){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:glass?.3:.64,metalness:glass?.2:.12,emissive:glass?'#eebf74':'#000000',emissiveIntensity:0}));
  m.castShadow=!glass;m.receiveShadow=false;m.userData.glass=glass;return m;
}
const quad=(out,a,b,c,d)=>{
  for(const [p,q,r] of [[a,b,c],[a,c,d]]){
    const u=q.map((v,i)=>v-p[i]),v=r.map((v,i)=>v-p[i]);
    if(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-10)out.push(...p,...q,...r);
  }
};

export function specialBuildingMeshes(f){
  const p=f.exterior,out=[];
  if(p.specialModel==='twin-vault'){
    const F=fieldFrame(p.vaultFootprint),W=F.width,L=F.length,r=W/4,base=.13+p.bodyHeight,rise=f.height-p.bodyHeight;
    const roof=[],caps=[],ribs=[];
    for(const side of [-1,1]){
      const cx=side*r;
      const pt=(a,z,dy=0)=>F.point(cx-r*Math.cos(a),z,base+rise*Math.sin(a)+dy);
      for(let i=0;i<48;i++){
        const a=i*Math.PI/48,b=(i+1)*Math.PI/48;
        quad(roof,pt(a,-L/2),pt(b,-L/2),pt(b,L/2),pt(a,L/2));
        for(const z of [-L/2,L/2])caps.push(...F.point(cx,z,base),...pt(a,z),...pt(b,z));
        // Thin seams follow the barrel across its length; no stacked domes.
        const eps=.008;quad(ribs,pt(a,-L/2,.012),pt(a+eps,-L/2,.012),pt(a+eps,L/2,.012),pt(a,L/2,.012));
      }
      for(const z of [-L/2,L/2])for(let i=0;i<48;i++){
        const a=i*Math.PI/48,b=(i+1)*Math.PI/48;
        quad(ribs,pt(a,z-.012,.025),pt(b,z-.012,.025),pt(b,z+.012,.025),pt(a,z+.012,.025));
      }
    }
    out.push(surface(roof,p.roofColor),surface(caps,p.accent),surface(ribs,p.trim));
  }
  if(p.specialModel==='segmented-arena'){
    const xs=f.polygon.map(a=>a[0]),zs=f.polygon.map(a=>a[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
    const rx=(Math.max(...xs)-Math.min(...xs))*.45,rz=(Math.max(...zs)-Math.min(...zs))*.45,H=f.height;
    const pt=(a,r,y)=>[cx+Math.cos(a)*rx*r,.13+y,cz+Math.sin(a)*rz*r];
    const shell=[],seams=[],roof=[],glass=[],walkway=[],posts=[];
    // Segmented folded shell and a shallow concentric top, from the aerial.
    const rings=[[.99,.57],[1.01,H*.68],[.98,H*.81],[.72,H*.94]];
    for(let k=0;k<16;k++){
      const a=k*Math.PI*2/16+.018,b=(k+1)*Math.PI*2/16-.018;
      for(let j=1;j<rings.length;j++)quad(shell,pt(a,...rings[j-1]),pt(b,...rings[j-1]),pt(b,...rings[j]),pt(a,...rings[j]));
      for(let j=1;j<rings.length;j++)quad(seams,pt(a-.036,...rings[j-1]),pt(a,...rings[j-1]),pt(a,...rings[j]),pt(a-.036,...rings[j]));
      quad(glass,pt(a,.965,.14),pt(b,.965,.14),pt(b,.965,.58),pt(a,.965,.58));
    }
    for(let i=0;i<128;i++){
      const a=i*Math.PI*2/128,b=(i+1)*Math.PI*2/128;
      for(let j=0;j<16;j++){
        const r0=.73*j/16,r1=.73*(j+1)/16,y=r=>H*(1.015-.075*(r/.73)**2);
        quad(roof,pt(a,r0,y(r0)),pt(b,r0,y(r0)),pt(b,r1,y(r1)),pt(a,r1,y(r1)));
      }
      quad(walkway,pt(a,.92,.40),pt(b,.92,.40),pt(b,1.09,.40),pt(a,1.09,.40));
      for(const r of [.20,.38,.56,.72])quad(seams,pt(a,r,H*(1.015-.075*(r/.73)**2)+.004),pt(b,r,H*(1.015-.075*(r/.73)**2)+.004),pt(b,r+.004,H*(1.015-.075*(r/.73)**2)+.004),pt(a,r+.004,H*(1.015-.075*(r/.73)**2)+.004));
    }
    for(let i=0;i<40;i++){
      const a=i*Math.PI*2/40,b=a+.008;
      for(const r of [1.045,1.052])quad(posts,pt(a,r,0),pt(b,r,0),pt(b,r,.40),pt(a,r,.40));
      for(const angle of [a,b])quad(posts,pt(angle,1.045,0),pt(angle,1.052,0),pt(angle,1.052,.40),pt(angle,1.045,.40));
    }
    out.push(surface(shell,p.roofColor),surface(roof,'#c1c7c2'),surface(seams,'#596866'),surface(glass,p.glass,true),surface(walkway,'#a7ada5'),surface(posts,p.trim));
  }
  return out;
}

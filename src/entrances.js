import * as THREE from 'three';

export function entryDimensions(e,p){
  const width=Math.min(e.length*.90,p.entryWidth||1);
  const center=p.entryPoint?Math.max(width/2,Math.min(e.length-width/2,(p.entryPoint[0]-e.a[0])*e.u[0]+(p.entryPoint[1]-e.a[1])*e.u[1])):e.length/2;
  return {width,height:p.entryHeight||Math.min(e.part.height*.95,e.part.height/e.part.levels*(p.entryFloors||1)),center};
}
function addFace(batch,points,color){
  const g=new THREE.BufferGeometry();const vertices=[];
  for(let i=1;i<points.length-1;i++)vertices.push(...points[0],...points[i],...points[i+1]);
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
  batch.extra??=[];batch.extra.push(new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,side:THREE.DoubleSide,roughness:.8})));
}
function sign(batch,e,cx,y,width,text,color,bg,aspect=6){
  if(typeof document==='undefined'||!text)return;
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,768,128);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 70px "Microsoft YaHei", sans-serif';ctx.fillText(text,384,65,725);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width/aspect),new THREE.MeshStandardMaterial({map,roughness:.8,side:THREE.DoubleSide}));
  m.position.set(...e.point(cx,y,.32));m.rotation.y=Math.atan2(e.n[0],e.n[1]);m.userData.ownedMap=true;batch.extra??=[];batch.extra.push(m);
}
// Portals live in the persistent building layer, including overview mode.
export function buildEntry(e,p,batch){
  const {width:w,height:h,center:cx}=entryDimensions(e,p);
  if(p.entry==='double-bank'){
    for(const s of [-1,1]){const point=e.point(cx+s*w*.25,0);buildEntry(e,{...p,entry:'glass-canopy',entryWidth:w*.44,entryPoint:[point[0],point[2]],entrySign:null,entryRailings:false},batch);}
    batch.box(e.point(cx,.13+h+.055,.12),[w+.16,.12,.28],p.trim,e.angle);
    batch.box(e.point(cx,.13+h/2,.11),[.08,h,.25],p.accent,e.angle);
    sign(batch,e,cx,.13+h+.07,w*.83,p.entrySign,p.signColor||'#bdac65',p.trim,p.signAspect);return;
  }
  const put=(x,y,d,ww,hh,dd,color,kind='solid')=>batch.box(e.point(cx+x,y,d),[ww,hh,dd],color,e.angle,kind);
  const dark='#25312f',frame=p.doorFrame||p.frame||'#777b70',stone=p.trim;
  const steps=p.entrySteps||4,stepH=.018,depth=p.porchDepth||.28;
  const floor=.13+steps*stepH,stepColor=p.entryStepColor||p.base;
  for(let j=0;j<steps;j++)put(0,.13+(j+.5)*stepH,depth+.09*(steps-j)/2,w+.16,stepH,.09*(steps-j),stepColor);
  put(0,floor-.016,depth/2,w,.032,depth,stepColor);
  const doorH=Math.min(p.doorHeight||.30,h*.74),doorW=Math.min(w*.74,p.doorWidth||.9),leaves=p.doorLeaves||2;
  put(0,floor+doorH/2,.022,doorW+.07,doorH+.03,.035,dark);
  for(let i=0;i<leaves;i++){
    const bw=doorW/leaves,x=-doorW/2+bw*(i+.5);
    put(x,floor+doorH/2,.053,bw-.016,doorH,.021,p.glass,'glass');
    for(const s of [-1,1])put(x+s*bw/2,floor+doorH/2,.073,.012,doorH+.02,.03,frame);
    for(const yy of [floor,floor+doorH,floor+doorH*.28])put(x,yy,.076,bw,.013,.025,frame);
    put(x+bw*.24,floor+doorH*.48,.102,.008,.064,.015,'#b4b8ac');
  }
  put(0,floor+doorH+.04,.05,doorW,.065,.024,p.glass,'glass');
  put(0,floor+doorH+.076,.075,doorW+.03,.016,.03,frame);
  for(const s of [-1,1])put(s*(doorW/2+.04),floor+doorH*.5,.085,.052,doorH+.06,.12,stone);
  // A shallow, continuous porch slab, with actual separate supports and doors.
  const top=Math.max(floor+doorH+.10,.15+h),porchColor=p.canopyColor||(p.entry==='canopy'?'#6f766d':stone);
  if(['glass-canopy','curved-canopy'].includes(p.entry)){
    if(p.entry==='glass-canopy'){
      put(0,top,depth/2,w+.14,.025,depth+.18,p.canopyColor||'#9caaa3');
      for(let i=0;i<=6;i++)put(-w/2+w*i/6,top+.017,depth/2,.012,.012,depth+.18,p.frame||stone);
      for(const s of [-1,1])put(s*w*.46,top-.07,depth*.63,.015,.15,.02,p.frame||stone);
    }else{
      for(let i=0;i<16;i++){
        const a=i/16,b=(i+1)/16,point=t=>[depth*t,top+.045*Math.sin(Math.PI*t)-.075*t*t];
        const A=point(a),B=point(b);
        addFace(batch,[e.point(cx-w*.56,A[1],A[0]),e.point(cx+w*.56,A[1],A[0]),e.point(cx+w*.56,B[1],B[0]),e.point(cx-w*.56,B[1],B[0])],p.canopyColor||'#aab1ac');
      }
      put(0,top-.07,depth,w*1.12,.06,.035,p.canopyColor||'#aab1ac');
      for(const s of [-1,1])put(s*w*.53,(floor+top)/2,.08,.09,top-floor,.16,p.accent);
    }
  }else if(p.entry==='lanhua-porch'){
    const bays=3;
    for(let i=0;i<=bays;i++)put(-w/2+w*i/bays,(floor+top)/2,depth-.04,.055,top-floor,.075,stone);
    put(0,top,depth/2,w+.08,.045,depth+.04,stone);
    for(let i=0;i<bays;i++){
      const x=-w/2+w*(i+.5)/bays;
      put(x,top+.025,depth/2,w/bays-.025,.015,depth+.10,'#98b2ac','glass');
      put(x,top+.041,depth/2,.015,.018,depth+.12,'#657975');
    }
  }else if(['colonnade','pediment','arcade'].includes(p.entry)){
    const n=p.columns||4,r=p.columnRadius||.045;
    for(let i=0;i<n;i++){
      const x=-w*.45+w*.90*i/(n-1);batch.cylinder(e.point(cx+x,(floor+top)/2,depth-.055),r,top-floor,p.columnColor||stone);
      put(x,floor+.02,depth-.055,r*2.8,.04,r*2.8,stone);put(x,top-.02,depth-.055,r*2.6,.04,r*2.6,stone);
    }
    put(0,top,depth/2,w+.16,.08,depth+.06,stone);put(0,top+.055,depth/2,w+.22,.026,depth+.12,stone);
  }else{
    for(const s of [-1,1])put(s*w*.47,(floor+top)/2,depth/2,.09,top-floor,depth,p.entry==='art-frame'?p.wall:stone);
    put(0,top,depth/2,w+.12,.07,depth+.11,porchColor);
  }
  if(p.entry==='yuseng-portal'){
    // Stepped stone surround, taken from the entrance close-up. No fake arch.
    for(const s of [-1,1]){
      put(s*w*.44,top+.065,.17,.13,.14,.30,stone);
      put(s*w*.33,top+.14,.17,.13,.08,.30,stone);
    }
    put(0,top+.18,.17,w*.62,.07,.30,stone);
  }
  if(p.entry==='pediment')addFace(batch,[e.point(cx-w*.58,top+.08,depth),e.point(cx+w*.58,top+.08,depth),e.point(cx,top+.31,depth)],stone);
  if(p.entryArch){
    const radius=w*.32,bottom=top+.10,spring=bottom+.25,thickness=.045;
    const outline=[e.point(cx-radius,bottom,.12),...Array.from({length:25},(_,i)=>{const a=Math.PI-i*Math.PI/24;return e.point(cx+radius*Math.cos(a),spring+radius*Math.sin(a),.12)}),e.point(cx+radius,bottom,.12)];
    addFace(batch,outline,p.glass);
    for(let i=0;i<24;i++){
      const a=i*Math.PI/24,b=(i+1)*Math.PI/24;
      addFace(batch,[e.point(cx+radius*Math.cos(a),spring+radius*Math.sin(a),.16),e.point(cx+(radius+thickness)*Math.cos(a),spring+(radius+thickness)*Math.sin(a),.16),e.point(cx+(radius+thickness)*Math.cos(b),spring+(radius+thickness)*Math.sin(b),.16),e.point(cx+radius*Math.cos(b),spring+radius*Math.sin(b),.16)],stone);
    }
    for(const s of [-1,1])put(s*(radius+thickness/2),(bottom+spring)/2,.16,thickness,spring-bottom,.045,stone);
    for(let j=-2;j<=2;j++){
      const x=radius*j/3,H=spring+Math.sqrt(radius*radius-x*x)-bottom;
      put(x,bottom+H/2,.15,.018,H,.025,p.frame);
    }
    for(let j=1;j<=4;j++){
      const y=bottom+j*.14,half=y>spring?Math.sqrt(Math.max(0,radius*radius-(y-spring)**2)):radius;
      if(half>0)put(0,y,.151,half*2,.014,.025,p.frame);
    }
    put(0,bottom+.20,.18,radius*2,.08,.03,stone);
  }
  if(p.entry==='bridge-portal'){
    const H=.38,W=w*1.32,Y=top+H/2+.04;
    put(0,Y,.15,W,H,.35,p.glass,'glass');
    for(let j=0;j<=8;j++)put(-W/2+W*j/8,Y,.338,.015,H+.03,.025,stone);
    for(let j=0;j<=3;j++)put(0,top+.04+H*j/3,.34,W,.014,.025,stone);
    put(0,top,.31,W+.08,.035,.64,stone);
  }
  if(p.entry==='museum-stair'){
    const H=e.part.height*.46,Y=top+H/2;
    put(0,Y,.10,w*1.2,H,.12,'#5d6967');
    for(let j=0;j<22;j++)put(0,top+H*j/22,.18,w*1.24,.012,.09,'#b8c1b9');
    for(const s of [-1,1])put(s*w*.56,floor*.65,.25,.11,floor*1.1,.50,stone);
  }
  if(p.entry==='colonnade'&&p.columns===6&&p.entryRailings){
    put(0,top+.18,depth,w+.1,.018,.02,stone);
    for(let j=0;j<=20;j++)put(-w/2+w*j/20,top+.12,depth,.014,.13,.02,stone);
  }
  if(p.entry==='art-frame'){
    const H=e.part.height*.88;
    for(const s of [-1,1])put(s*w*.65,.15+H/2,.40,.16,H,.22,p.wall);
    put(0,.15+H,.40,w*1.45,.18,.22,p.wall);
    for(let i=0;i<12;i++){
      const t=(i+.5)/12,x=-w*.26+w*.56*(t-.5),d=.25+Math.sin(t*Math.PI)*.28;
      put(x,.15+H/2,d,w*.56/12*.99,H,.025,p.glass,'glass');
      put(x,.15+H/2,d+.02,.01,H,.025,'#647b7b');
      for(let j=1;j<5;j++)put(x,.15+H*j/5,d+.02,w*.56/12,.012,.025,'#647b7b');
    }
  }
  if(p.entryRailings){
    for(const s of [-1,1]){
      for(let j=0;j<=steps;j++)put(s*(w/2+.045),.13+(steps-j)*stepH+.07,depth+.09*j,.014,.14,.014,'#a5aaa1');
      // Horizontal landing rails and a sloping stair handrail.
      put(s*(w/2+.045),floor+.14,depth/2,.016,.016,depth,'#a5aaa1');
      for(let j=0;j<steps;j++)put(s*(w/2+.045),floor+.14-j*stepH,depth+.09*(j+.5),.016,.016,.095,'#a5aaa1');
    }
  }
  sign(batch,e,cx,top+(p.entrySignOffset??.11),w*.75,p.entrySign,p.signColor||'#5c5746',p.signBackground||'#ddd7c5',p.signAspect);
}

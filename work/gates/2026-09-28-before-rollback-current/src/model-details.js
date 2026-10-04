import * as THREE from 'three';

export function clipPolygon(poly, normal, limit, keepBelow=true){
  const src=poly.slice(0,-1),out=[];
  const d=p=>(p[0]*normal[0]+p[1]*normal[1]-limit)*(keepBelow?1:-1);
  for(let i=0;i<src.length;i++){
    const a=src[i],b=src[(i+1)%src.length],da=d(a),db=d(b);
    if(da<=0)out.push(a);
    if((da<0&&db>0)||(da>0&&db<0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  if(out.length<3)return null;out.push(out[0]);return out;
}
export function buildingParts(f){
  const base={polygon:f.polygon,holes:f.holes,height:f.height,levels:f.levels||Math.max(1,Math.round(f.height/.33))};
  if(f.exterior?.specialModel)return [{...base,height:f.exterior.bodyHeight,levels:1}];
  const split=(normal,limit,low,high,lowFloors,highFloors)=>{
    const a=clipPolygon(f.polygon,normal,limit),b=clipPolygon(f.polygon,normal,limit,false);
    return [{...base,polygon:a,height:low,levels:lowFloors,holes:[]},{...base,polygon:b,height:high,levels:highFloors,holes:[]}].filter(p=>p.polygon);
  };
  if(f.model==='library')return split([.557,-.831],8.1,5.4,1.8,15,5);
  if(f.model==='tower-podium')return split([1,0],16.65,1.65,f.height,5,19);
  if(f.exterior?.massCenter){
    const p=f.exterior.massCenter,normal=fieldFrame(f.polygon).u,middle=p.point[0]*normal[0]+p.point[1]*normal[1];
    const cut=(poly,i)=>i===0?clipPolygon(poly,normal,middle-p.halfWidth):i===1?clipPolygon(poly,normal,middle+p.halfWidth,false):clipPolygon(clipPolygon(poly,normal,middle-p.halfWidth,false)||[],normal,middle+p.halfWidth);
    return [0,1,2].map(i=>({...base,polygon:cut(f.polygon,i),holes:f.holes.map(h=>cut(h,i)).filter(Boolean),height:(i===2?p.centerFloors:p.wingFloors)*.33,levels:i===2?p.centerFloors:p.wingFloors})).filter(p=>p.polygon);
  }
  if(f.model==='historic-wings'){
    const normal=fieldFrame(f.polygon).u,dots=f.polygon.map(p=>p[0]*normal[0]+p[1]*normal[1]),middle=(Math.min(...dots)+Math.max(...dots))/2;
    const cut=(p,i)=>i===0?clipPolygon(p,normal,middle-.85):i===1?clipPolygon(p,normal,middle+.85,false):clipPolygon(clipPolygon(p,normal,middle-.85,false)||[],normal,middle+.85);
    return [0,1,2].map(i=>({...base,polygon:cut(f.polygon,i),holes:(f.holes||[]).map(h=>cut(h,i)).filter(Boolean),height:i===2?1.98:.99,levels:i===2?6:3})).filter(p=>p.polygon);
  }
  if(f.model==='terraced-dorm'){
    const frame=fieldFrame(f.polygon),dots=f.polygon.map(p=>p[0]*frame.u[0]+p[1]*frame.u[1]),lo=Math.min(...dots),hi=Math.max(...dots),parts=[];
    for(let i=0;i<3;i++){
      const min=lo+(hi-lo)*i/3,max=lo+(hi-lo)*(i+1)/3;
      const clip=p=>{const first=clipPolygon(p,frame.u,min,false);return first&&clipPolygon(first,frame.u,max);};
      const p=clip(f.polygon),levels=Math.max(3,base.levels-(2-i));
      if(p)parts.push({...base,polygon:p,holes:f.holes.map(clip).filter(Boolean),height:levels*.33,levels});
    }
    return parts;
  }
  return [base];
}

const material=color=>new THREE.MeshStandardMaterial({color,roughness:.8});
const lineMaterial=new THREE.LineBasicMaterial({color:'#f2f0de'});
export function drawLine(group,points,color){
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),color?new THREE.LineBasicMaterial({color}):lineMaterial);group.add(line);return line;
}
export function addBox(group,position,scale,color,angle=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(...scale),material(color));m.position.set(...position);m.rotation.y=angle;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}
export { planarRoof as pitchedRoof } from './roofs.js';

export function fieldFrame(polygon){
  const p=polygon.slice(0,-1);let edge=0,max=0;
  for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>max){max=d;edge=i;}}
  const a=p[edge],b=p[(edge+1)%p.length],u=[(b[0]-a[0])/max,(b[1]-a[1])/max],v=[-u[1],u[0]];
  const xs=p.map(p=>p[0]*v[0]+p[1]*v[1]),ys=p.map(p=>p[0]*u[0]+p[1]*u[1]);
  const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  return {u,v,width:Math.max(...xs)-Math.min(...xs),length:Math.max(...ys)-Math.min(...ys),point:(x,z,h=.15)=>[v[0]*(cx+x)+u[0]*(cy+z),h,v[1]*(cx+x)+u[1]*(cy+z)]};
}
export function footballMarkings(group,polygon){
  const F=fieldFrame(polygon),w=F.width*.96,l=F.length*.96;
  const line=p=>drawLine(group,p.map(([x,z])=>F.point(x,z)));
  line([[-w/2,-l/2],[w/2,-l/2],[w/2,l/2],[-w/2,l/2],[-w/2,-l/2]]);line([[-w/2,0],[w/2,0]]);
  line(Array.from({length:49},(_,i)=>[Math.cos(i/48*Math.PI*2)*.915,Math.sin(i/48*Math.PI*2)*.915]));
  for(const s of [-1,1]){
    const end=s*l/2;
    for(const [ww,depth] of [[4.032,1.65],[1.832,.55]])line([[-ww/2,end],[-ww/2,end-s*depth],[ww/2,end-s*depth],[ww/2,end]]);
    const p=[[-.366,end],[.366,end]];
    drawLine(group,[F.point(p[0][0],end,.15),F.point(p[0][0],end,.394),F.point(p[1][0],end,.394),F.point(p[1][0],end,.15)]);
    line([[-.366,end+s*.22],[.366,end+s*.22]]);
  }
  return F;
}
export function secondFieldDetails(group,track,pitch){
  const F=fieldFrame(pitch.polygon);
  // OSM measures the outer running-track edge separately from the stadium site.
  // 8 lanes are illustrative; no surveyed lane-width document was available.
  const coords=track.polygon.slice(0,-1).map(p=>{const q=F.point(0,0);return [(p[0]-q[0])*F.v[0]+(p[1]-q[2])*F.v[1],(p[0]-q[0])*F.u[0]+(p[1]-q[2])*F.u[1]];});
  const minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0])),minZ=Math.min(...coords.map(p=>p[1])),maxZ=Math.max(...coords.map(p=>p[1]));
  const radius=(maxX-minX)/2,straight=(maxZ-minZ)/2-radius,cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
  for(let lane=0;lane<=8;lane++){
    const r=radius-.05-lane*.115,points=[];
    for(let i=0;i<=32;i++){const a=i/32*Math.PI;points.push(F.point(cx+r*Math.cos(a),cz+straight+r*Math.sin(a),.115));}
    for(let i=0;i<=32;i++){const a=Math.PI+i/32*Math.PI;points.push(F.point(cx+r*Math.cos(a),cz-straight+r*Math.sin(a),.115));}
    points.push(points[0]);drawLine(group,points,'#e4def0');
  }
  footballMarkings(group,pitch.polygon);
  // The two stands follow the long sidelines. Roof west; unobstructed seats east.
  const angle=Math.atan2(F.v[1],-F.v[0]);
  for(const side of [-1,1]){
    for(let row=0;row<8;row++){
      const x=side*(radius+.18+row*.17),p=F.point(x,0,.18+row*.105);
      addBox(group,p,[.19,.12,straight*2+1.15],row%3===0?'#bebdad':'#9eaaa0',angle);
    }
    const west=F.point(side*(radius+1),0)[0]<F.point(0,0)[0];
    if(west){
      for(let j=0;j<6;j++){
        const z=-straight+(2*straight)*(j+.5)/6,x=side*(radius+.65),p=F.point(x,z,1.7);
        const panel=addBox(group,p,[1.65,.065,2*straight/6+.04],'#eee9d7',angle);panel.rotation.z=side*.07;
        const pole=F.point(side*(radius+1.35),z,.85);addBox(group,pole,[.07,1.7,.07],'#8b9692');
        drawLine(group,[F.point(side*(radius+1.35),z,1.72),F.point(side*(radius-.1),z,1.59)],'#6f7f7b');
      }
    }
  }
  for(const side of [-1,1])for(const end of [-1,1]){
    const p=F.point(side*(radius+1.1),end*(straight+.9),1.8);addBox(group,p,[.075,3.6,.075],'#9aaba8');
    addBox(group,F.point(side*(radius+1.1),end*(straight+.9),3.6),[.46,.23,.14],'#e8e5cf',angle);
  }
}

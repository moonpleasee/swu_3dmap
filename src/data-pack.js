// A small, lossless JSON transport format. The editable public/data files stay readable.
// Only dist/data is packed at build time; no third-party decoder is needed in the browser.
const marker='@';
const isPointList=value=>value.length>=2&&value.every(point=>Array.isArray(point)&&point.length===2&&point.every(v=>typeof v==='number'&&Number.isFinite(v)));

export function packCampus(data){
  const counts=new Map(), signatures=new Map();
  function visit(value){
    if(typeof value==='string')counts.set(value,(counts.get(value)||0)+1);
    else if(Array.isArray(value))value.forEach(visit);
    else if(value&&typeof value==='object'){
      const signature=Object.keys(value).join('\u0001');
      signatures.set(signature,(signatures.get(signature)||0)+1);
      Object.values(value).forEach(visit);
    }
  }
  visit(data);
  const strings=[...counts].filter(([s,n])=>n>1&&s.length>8).sort((a,b)=>b[0].length*b[1]-a[0].length*a[1]).map(([s])=>s);
  const stringIds=new Map(strings.map((s,i)=>[s,i]));
  // Share recurring fragments inside otherwise unique notes and source URLs.
  const fragments=[];
  const fragmentText=new Map([...counts].filter(([s])=>!stringIds.has(s)&&s.length>=24).map(([s])=>[s,s]));
  for(let pass=0;pass<100;pass++){
    const grams=new Map();
    for(const value of fragmentText.values()){
      for(const part of value.split(/§\d+§/)){
        for(let i=0;i+12<=part.length;i++){
          const gram=part.slice(i,i+12);
          if(gram.includes('§'))continue;
          grams.set(gram,(grams.get(gram)||0)+1);
        }
      }
    }
    let best,score=0;
    for(const [gram,n] of grams){
      const gain=(Buffer.byteLength(gram)-6)*n-Buffer.byteLength(gram)-4;
      if(n>=3&&gain>score){best=gram;score=gain;}
    }
    if(score<40)break;
    const token=`§${fragments.length}§`;
    fragments.push(best);
    for(const [original,current] of fragmentText)if(current.includes(best))fragmentText.set(original,current.replaceAll(best,token));
  }
  const schemaNames=[...signatures].filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]).map(([s])=>s);
  const schemaIds=new Map(schemaNames.map((s,i)=>[s,i]));
  function encode(value){
    if(typeof value==='string'){
      if(stringIds.has(value))return `~${stringIds.get(value)}`;
      const fragmented=fragmentText.get(value);
      if(fragmented&&fragmented!==value)return `§${fragmented}`;
      return value.startsWith('~')||value.startsWith('§')?`~${value}`:value;
    }
    if(Array.isArray(value)){
      if(isPointList(value)){
        const scale=value.every(point=>point.every(v=>Math.abs(v*1000-Math.round(v*1000))<1e-7))?1000:10000;
        let px=0,py=0;
        const deltas=[];
        for(const [x,y] of value){const ix=Math.round(x*scale),iy=Math.round(y*scale);deltas.push(ix-px,iy-py);px=ix;py=iy;}
        return [scale===1000?'^':'^4',...deltas];
      }
      return value.map(encode);
    }
    if(value&&typeof value==='object'){
      const keys=Object.keys(value),id=schemaIds.get(keys.join('\u0001'));
      return id===undefined?Object.fromEntries(Object.entries(value).map(([key,v])=>[key,encode(v)])):[marker,id,...Object.values(value).map(encode)];
    }
    return value;
  }
  return {format:'campus-packed-v1',strings,fragments,schemas:schemaNames.map(s=>s?s.split('\u0001'):[]),data:encode(data)};
}

export function unpackCampus(packed){
  if(packed?.format!=='campus-packed-v1')return packed;
  const {strings,fragments,schemas}=packed;
  function decode(value){
    if(typeof value==='string'){
      if(value.startsWith('~~'))return value.slice(1);
      if(value.startsWith('~§'))return value.slice(1);
      if(/^~\d+$/.test(value))return strings[Number(value.slice(1))];
      if(value.startsWith('§'))return value.slice(1).replace(/§(\d+)§/g,(_,index)=>fragments[Number(index)]);
      return value;
    }
    if(Array.isArray(value)){
      if(value[0]===marker&&Number.isInteger(value[1]))return Object.fromEntries(schemas[value[1]].map((key,i)=>[key,decode(value[i+2])]));
      if(value[0]==='^'||value[0]==='^4'){
        const scale=value[0]==='^'?1000:10000,points=[];let x=0,y=0;
        for(let i=1;i<value.length;i+=2){x+=value[i];y+=value[i+1];points.push([x/scale,y/scale]);}
        return points;
      }
      return value.map(decode);
    }
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,decode(v)]));
    return value;
  }
  return decode(packed.data);
}

export function packTerrain(data){
  let previous=0;
  const deltas=data.elevations.map(value=>{const current=Math.round(value*100),delta=current-previous;previous=current;return delta;});
  const {elevations,...metadata}=data;
  return {...metadata,elevationEncoding:'delta-centimeters',elevationDeltas:deltas};
}

export function unpackTerrain(packed){
  if(packed?.elevationEncoding!=='delta-centimeters')return packed;
  let current=0;
  const elevations=packed.elevationDeltas.map(delta=>{current+=delta;return current/100;});
  const {elevationEncoding,elevationDeltas,...metadata}=packed;
  return {...metadata,elevations,source:metadata.source};
}

const KEY='swu-place-community-v1';
const now=()=>new Date().toISOString();
function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{"places":[]}');return v&&Array.isArray(v.places)?v:{places:[]};}catch{return {places:[]};}}
function write(v){localStorage.setItem(KEY,JSON.stringify(v));return v;}
export function communityState(){return read();}
export function saveCommunityState(v){return write(v);}
export function fixedPlace(id,feature){
 const state=read();let p=state.places.find(x=>x.id===`fixed:${id}`);
 if(!p){p={id:`fixed:${id}`,fixedId:id,name:feature?.displayName||feature?.name||'校园地点',description:'围绕这个校园地点分享照片和记忆。',point:feature?.center||[0,0],createdAt:now(),photos:[],comments:[],ratings:[]};state.places.push(p);write(state);}
 return p;
}
export function createPlace(input){
 const state=read();const p={id:`user:${crypto.randomUUID?.()||Date.now().toString(36)}`,name:String(input.name||'未命名地点').trim().slice(0,40)||'未命名地点',description:String(input.description||'').trim().slice(0,240),point:[Number(input.point[0]),Number(input.point[1])],createdAt:now(),photos:[],comments:[],ratings:[]};state.places.push(p);write(state);return p;
}
export function addPhoto(id,photo){const state=read(),p=state.places.find(x=>x.id===id);if(!p)throw new Error('地点不存在');p.photos.unshift({...photo,createdAt:now()});write(state);return p;}
export function addComment(id,text){const state=read(),p=state.places.find(x=>x.id===id);if(!p)throw new Error('地点不存在');const value=String(text||'').trim().slice(0,240);if(!value)return p;p.comments.push({id:Date.now().toString(36),text:value,createdAt:now()});write(state);return p;}
export function addRating(id,value){const state=read(),p=state.places.find(x=>x.id===id);if(!p)throw new Error('地点不存在');p.ratings.push(Math.max(1,Math.min(5,Number(value)||0)));write(state);return p;}
export function getPlace(id){return read().places.find(x=>x.id===id)||null;}
export function clearCommunityState(){localStorage.removeItem(KEY);}

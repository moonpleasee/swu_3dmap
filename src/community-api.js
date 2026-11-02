let state={places:[]};
export let currentUser=null;
export let backendAvailable=false;
export let communityEnabled=false;
export let moderation='manual';
export async function api(url,body,method=body?'POST':'GET'){
 const response=await fetch(url,{method,credentials:'same-origin',signal:AbortSignal.timeout(body instanceof FormData?60000:15000),headers:{'X-Campus-Request':'1',...(body instanceof FormData?{}:{'Content-Type':'application/json'})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});
 const result=await response.json();if(!response.ok){if(response.status===401)window.dispatchEvent(new Event('campus-login-required'));throw new Error(result.error||'请求失败');}return result;
}
export async function connectCommunity(){try{const health=await api('/api/health');communityEnabled=health.communityEnabled===true;moderation=health.moderation;if(!communityEnabled){state={places:[]};currentUser=null;return;}await reloadCommunity();backendAvailable=true;}catch{backendAvailable=false;communityEnabled=false;}}
export async function reloadCommunity(){currentUser=(await api('/api/me')).user;state=(await api('/api/places'));return state;}
export const communityState=()=>state;
function cache(p){const n=state.places.findIndex(x=>x.id===p.id);if(n<0)state.places.push(p);else state.places[n]=p;return p;}
export function fixedPlace(id,f){return state.places.find(x=>x.id===`fixed:${id}`)||{id:`fixed:${id}`,fixedId:id,name:f?.displayName||'校园地点',point:f?.center,photos:[],comments:[],ratings:[]};}
export const getPlace=id=>state.places.find(x=>x.id===id)||null;
export async function loadPlace(id){return cache(await api(`/api/places/${encodeURIComponent(id)}`));}
export async function createPlace(input){return cache(await api('/api/places',input));}
export async function addComment(id,text){return cache(await api(`/api/places/${encodeURIComponent(id)}/comments`,{text}));}
export async function addReply(id,parentId,text){return cache(await api(`/api/places/${encodeURIComponent(id)}/comments`,{text,parentId}));}
export async function addRating(id,value){return cache(await api(`/api/places/${encodeURIComponent(id)}/rating`,{value:Number(value)}));}
export async function addPhoto(id,file){const body=new FormData();body.append('photo',file);return cache(await api(`/api/places/${encodeURIComponent(id)}/photos`,body));}

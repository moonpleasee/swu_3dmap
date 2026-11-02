import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {createApp} from '../server/app.mjs';
test('community persistence, authentication, moderation, images and suggestions',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'swu-api-'));let server,db;
 async function start(){const instance=await createApp({dir,communityEnabled:true});db=instance.db;server=instance.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));return `http://127.0.0.1:${server.address().port}`;}
 async function stop(){await new Promise(r=>server.close(r));db.close();}
 let base=await start();const cookies={};
 async function call(url,body,user='',method=body?'POST':'GET',headers={}){const r=await fetch(base+url,{method,headers:{'X-Campus-Request':'1',...(body instanceof FormData?{}:{'Content-Type':'application/json'}),...(cookies[user]?{cookie:cookies[user]}:{}),...headers},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});const ck=r.headers.get('set-cookie');if(ck)cookies[user]=ck.split(';')[0];return {status:r.status,data:await r.json()};}
 try{
  const place='/api/places/fixed:368577143';
  assert.equal((await call(place+'/comments',{text:'anonymous'})).status,401);
  assert.equal((await call('/api/auth/register',{username:'tester',password:'test-password-123'},'owner')).status,200);
  assert.equal((await call('/api/auth/register',{username:'other',password:'test-password-123'},'other')).status,200);
  assert.equal((await call('/api/admin/queue',null,'owner')).status,403);
  assert.equal((await call(place+'/comments',{text:'bad origin'},'owner','POST',{Origin:'https://evil.example'})).status,403);
  assert.equal((await call(place+'/comments',{text:'A durable campus comment'},'owner')).status,201);
  let mine=(await call(place,null,'owner')).data;const post=mine.comments[0];assert.equal(post.status,'pending');assert.equal((await call(place)).data.comments.length,0);
  db.prepare("UPDATE users SET role='admin' WHERE username='tester'").run();
  assert.equal((await call('/api/admin/review',{type:'post',id:post.id,status:'approved'},'owner')).status,200);
  assert.equal((await call(place)).data.comments[0].text,'A durable campus comment');
  assert.equal((await call(place+'/comments',{text:'reply',parentId:post.id},'other')).status,201);
  await call(place+'/rating',{value:3},'other');await call(place+'/rating',{value:5},'other');assert.deepEqual((await call(place)).data.ratings,[5]);
  assert.equal((await call(place+'/rating',{value:99},'other')).status,400);
  const img=await sharp({create:{width:8,height:8,channels:3,background:'red'}}).png().toBuffer();const form=new FormData();form.append('photo',new Blob([img],{type:'image/png'}),'photo.png');
  const photo=(await call(place+'/photos',form,'other')).data.photos[0];assert.equal(photo.status,'pending');
  assert.equal((await fetch(base+photo.data)).status,404);assert.equal((await fetch(base+photo.data,{headers:{cookie:cookies.other}})).status,200);
  const bad=new FormData();bad.append('photo',new Blob(['not an image']),'fake.png');assert.equal((await call(place+'/photos',bad,'other')).status,400);
  assert.equal((await call('/api/buildings/368577143/suggestions',{name:'学生提供名称'},'other')).status,201);
  assert.equal((await call('/api/buildings/not-a-building/suggestions',{name:'错误楼栋',evidence:'test'},'other')).status,404);
  assert.equal((await call('/api/places',{name:'路边地点',description:'校园路边',point:[20,30]},'other')).status,201);
  assert.equal((await call('/api/posts/'+post.id,null,'other','DELETE')).status,403);
  assert.equal((await call('/api/posts/'+post.id+'/report',{reason:'测试举报'},'other')).status,200);
  await stop();base=await start();
  assert.equal((await call(place)).data.comments[0].text,'A durable campus comment');
  assert.equal((await call('/api/buildings/368577143/suggestions',null,'other')).data.suggestions.length,1);
  assert.equal((await call('/api/posts/'+photo.id,null,'other','DELETE')).status,200);assert.equal((await fetch(base+photo.data,{headers:{cookie:cookies.other}})).status,404);
  await call('/api/auth/logout',{},'other');assert.equal((await call(place+'/comments',{text:'after logout'},'other')).status,401);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});

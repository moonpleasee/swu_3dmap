import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {unpackCampus,unpackTerrain} from '../src/data-pack.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async file=>readFile(path.join(root,file));
const html=(await read('dist/index.html')).toString();
assert.match(html,/<link rel="preload" as="fetch" href="\.\/data\/campus\.json" crossorigin="anonymous"\s*\/>/);
const sizes={},source={};
for(const name of ['campus','terrain']){
  const original=JSON.parse((await read(`public/data/${name}.json`)).toString());
  const packedBytes=await read(`dist/data/${name}.json`);
  const restored=(name==='campus'?unpackCampus:unpackTerrain)(JSON.parse(packedBytes.toString()));
  assert.deepEqual(restored,original);
  sizes[name]={before:(await read(`public/data/${name}.json`)).length,after:packedBytes.length};
  source[name]=original;
}
assert(sizes.campus.after<=350_000);
assert(sizes.terrain.after<=120_000);
const browser=await chromium.launch({channel:'msedge',headless:true});
const dir=await mkdtemp(path.join(os.tmpdir(),'swu-pack-'));
// Use the existing app server so this checks the same dist files and headers as local preview.
const {createApp}=await import('../server/app.mjs');
const {app,db}=await createApp({dir,communityEnabled:false});
const server=createServer(app);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
try{
  for(const width of [390,1280]){
    const page=await browser.newPage({viewport:{width,height:width===390?844:800}});
    const errors=[],campusRequests=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    page.on('request',request=>{if(request.url().endsWith('/data/campus.json'))campusRequests.push(request.url());});
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__campusDebug,{timeout:120000});
    await page.locator('#loading').waitFor({state:'detached',timeout:120000});
    assert.equal(await page.evaluate(()=>window.__campusDebug.buildingCount),source.campus.buildings.length);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
    assert.equal(campusRequests.length,1,`campus.json fetched ${campusRequests.length} times at ${width}px`);
    if(width===390)await page.locator('#mobile-collapse').click();
    await page.locator('.landmark-item').first().click();
    await page.locator('#detail').waitFor({state:'visible'});
    assert(await page.locator('#detail h2').textContent());
    assert.deepEqual(errors,[]);
    console.log(`PASS ${width}px: ${source.campus.buildings.length} buildings, one campus request, detail visible, no overflow/errors`);
    await page.close();
  }
  console.log(`PASS data parity and sizes: campus ${sizes.campus.before} -> ${sizes.campus.after}, terrain ${sizes.terrain.before} -> ${sizes.terrain.after}`);
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
  db.close();
  await rm(dir,{recursive:true,force:true});
}

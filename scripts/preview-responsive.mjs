import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createApp} from '../server/app.mjs';

const out='work/mobile-layout-2026-11-17';
await mkdir(out,{recursive:true});
const dir=await mkdtemp(path.join(os.tmpdir(),'swu-phone-layout-'));
const {app,db}=await createApp({dir,communityEnabled:false});
const server=app.listen(0,'127.0.0.1');
await new Promise(resolve=>server.once('listening',resolve));
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[];
const measurements=[];
try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  let releaseCampus;
  const campusPending=new Promise(resolve=>{releaseCampus=resolve;});
  await page.route('**/data/campus.json',async route=>{
    await campusPending;
    await route.continue();
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  try{
    await page.locator('#loading').waitFor({state:'visible'});
    for(const [width,height,name] of [[390,844,'phone'],[1280,800,'desktop']]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(({width,height})=>{
        const shell=document.querySelector('.app-shell').getBoundingClientRect();
        const expectedWidth=width>760?Math.min(height,430*16/9)*9/16:Math.min(width,430);
        return innerWidth===width&&Math.abs(shell.width-expectedWidth)<1&&Math.abs(shell.x-(width-expectedWidth)/2)<1;
      },{width,height});
      const visibleAboveLoading=await page.evaluate(()=>{
        const sheet=document.getElementById('explorer').getBoundingClientRect();
        const loading=document.getElementById('loading').getBoundingClientRect();
        const top=Math.max(sheet.top,loading.top);
        const bottom=Math.min(sheet.bottom,loading.bottom);
        if(bottom<=top)return {visible:false,sheet:sheet.toJSON(),loading:loading.toJSON()};
        const target=document.elementFromPoint(sheet.left+sheet.width/2,(top+bottom)/2);
        return {visible:!!target?.closest('#explorer'),target:target?.outerHTML.slice(0,160),sheet:sheet.toJSON(),loading:loading.toJSON()};
      });
      await page.screenshot({path:`${out}/loading-${name}.png`});
      assert(visibleAboveLoading.visible,JSON.stringify(visibleAboveLoading));
    }
    await page.setViewportSize({width:390,height:844});
  }finally{
    releaseCampus();
  }
  await page.waitForFunction(()=>window.__campusDebug,null,{timeout:120000});
  await page.locator('#loading').waitFor({state:'detached',timeout:120000});
  for(const [width,height,name] of [[390,844,'phone'],[1280,800,'desktop'],[1440,900,'wide'],[900,700,'compact'],[1280,600,'short-desktop'],[360,640,'small-phone']]){
    await page.setViewportSize({width,height});
    const shell=await page.locator('.app-shell').boundingBox();
    const previewHeight=width>760?Math.min(height,430*16/9):height;
    const previewWidth=width>760?previewHeight*9/16:Math.min(width,430);
    assert(Math.abs(shell.width-previewWidth)<1);
    assert(Math.abs(shell.height-previewHeight)<1);
    assert(Math.abs(shell.x-(width-shell.width)/2)<1);
    assert(Math.abs(shell.y-(height-shell.height)/2)<1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
    const fullMap=await page.locator('#scene').boundingBox();
    assert(Math.abs(fullMap.y+fullMap.height-shell.y-shell.height)<2);
    assert.equal(await page.locator('#mobile-collapse').isVisible(),true);
    assert.equal(await page.locator('#explorer').evaluate(el=>el.classList.contains('collapsed')),true);
    await page.locator('#search').blur();
    await page.waitForTimeout(1500);
    if(name==='phone'||name==='desktop')await page.screenshot({path:`${out}/${name}.png`});
    await page.locator('#mobile-collapse').click();
    await page.locator('#search').fill('中心图书馆');
    await page.locator('.landmark-item[data-place="350242168"]').click();
    await page.locator('#detail').waitFor({state:'visible'});
    const detail=await page.locator('#detail').boundingBox();
    const contentWidth=await page.locator('.app-shell').evaluate(el=>el.clientWidth);
    assert(Math.abs(detail.x-shell.x)<2);
    assert(Math.abs(detail.width-contentWidth)<1);
    assert(Math.abs(detail.height-shell.height*.69)<2);
    const map=await page.locator('#scene').boundingBox();
    assert(map.y+map.height<=detail.y+12);
    assert.equal(await page.getByText('暂不开放',{exact:true}).isVisible(),true);
    await page.locator('#sources-open').click();
    const dialog=await page.locator('#sources-dialog').boundingBox();
    assert(dialog.x>=shell.x-1&&dialog.x+dialog.width<=shell.x+shell.width+1);
    await page.locator('#sources-dialog [data-close]').click();
    await page.waitForTimeout(1500);
    if(name==='desktop')await page.screenshot({path:`${out}/desktop-detail.png`});
    await page.locator('#detail-close').click();
    assert.equal(await page.locator('#search').inputValue(),'中心图书馆');
    assert.equal(await page.locator('.landmark-list').isVisible(),true);
    await page.locator('#reset').click();
    assert.equal(await page.locator('#explorer').evaluate(el=>el.classList.contains('collapsed')),true);
    await page.locator('#clear-search').click();
    measurements.push({viewport:{width,height},shell,map:fullMap,detail});
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/validation.json`,JSON.stringify({measurements,errors},null,2));
  console.log('PASS loading sheet visibility, 9:16 preview, phone layout, search, detail, dialogs and reset');
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
  db.close();
  await rm(dir,{recursive:true,force:true});
}

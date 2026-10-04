import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const ids=['368577143','304932138','368589387','368578312','843421757','843465284','843421755','840970010','371876808','842765847'];
const folder=new URL('../../../work/building-batch/',import.meta.url);await mkdir(folder,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
// Camera flights and OrbitControls damping continue after a click resolves.
// Require repeated identical canvas frames, including the final layout size.
async function settledShot(page,path){
 await page.waitForTimeout(1200);
 let previous='',stable=0;
 for(let i=0;i<40;i++){
   const current=(await page.locator('#scene canvas').screenshot()).toString('base64');
   stable=current===previous?stable+1:0;previous=current;
   if(stable>=2){await page.screenshot({path});return;}
   await page.waitForTimeout(120);
 }
 throw new Error('Scene did not settle before screenshot: '+path);
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4311/');await page.waitForFunction(()=>window.__campusDebug);await page.locator('#loading').waitFor({state:'detached'});
 for(const id of ids){
   if(await page.locator('body').evaluate(e=>e.classList.contains('inspecting')))await page.locator('#inspect-building').click();
   await page.goto(`http://127.0.0.1:4311/#place=${id}`);await page.waitForFunction(id=>window.__campusDebug.activeId===id,id);
   await page.locator('#inspect-building').click();
   await settledShot(page,fileURLToPath(new URL(`${id}.png`,folder)));
   await page.locator('#view-entrance').click();await settledShot(page,fileURLToPath(new URL(`${id}-entry.png`,folder)));
 }
 await page.locator('#detail-close').click();await page.locator('#reset').click();await settledShot(page,fileURLToPath(new URL('overview.png',folder)));
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4311/#place=304932138');await page.waitForFunction(()=>window.__campusDebug.activeId==='304932138');await page.locator('#inspect-building').click();
 await settledShot(page,fileURLToPath(new URL('mobile-tennis.png',folder)));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
 assert.deepEqual(errors,[]);const report={ids,errors,mobileWidth:390};await writeFile(new URL('browser-validation.json',folder),JSON.stringify(report,null,2));console.log('PASS batch browser',JSON.stringify(report));
}finally{await browser.close();}

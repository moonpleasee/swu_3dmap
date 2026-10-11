import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const out='work/mobile-forum';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4311/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__campusDebug,null,{timeout:120000});await page.locator('#loading').waitFor({state:'detached',timeout:120000});
 await page.screenshot({path:`${out}/mobile-map.png`});
 await page.goto('http://127.0.0.1:4311/#place=350242168',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__campusDebug?.activeId==='350242168',null,{timeout:120000});await page.locator('#loading').waitFor({state:'detached',timeout:120000});await page.waitForTimeout(500);
 const box=await page.locator('#detail').boundingBox();assert(box.height>844*.65);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
 await page.locator('#community-comment').fill('这里采光很好，分享一条校园记忆。');await page.locator('#community-comment-form button').click();
 await page.locator('.forum-post').waitFor();assert(page.url().endsWith('#place=350242168'));
 await page.locator('[data-reply-toggle]').click();await page.locator('[data-reply-form] input').fill('回复测试：谢谢分享！');await page.locator('[data-reply-form] button').click();await page.locator('.forum-replies').getByText('回复测试：谢谢分享！',{exact:false}).waitFor();
 await page.locator('#community-rating').selectOption('4');await page.locator('.community-heading').getByText(/4.0 分/).waitFor();
 await page.screenshot({path:`${out}/mobile-discussion.png`});
 await page.locator('[data-forum-tab=photos]').click();await page.locator('#community-photo').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('swu-place-community-v1')).places[0].photos.length===1);
 await page.locator('[data-forum-tab=photos]').click();await page.locator('.community-photos img').waitFor();
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__campusDebug,null,{timeout:120000});await page.locator('#loading').waitFor({state:'detached',timeout:120000});assert.equal(await page.locator('.forum-post').count(),1);assert.equal(await page.locator('.forum-replies p').count(),1);
 await page.setViewportSize({width:360,height:640});await page.screenshot({path:`${out}/mobile-9x16.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),360);
 await page.locator('#detail-close').click();assert(await page.locator('#detail').isHidden());assert(await page.locator('#explorer').isVisible());
 await page.setViewportSize({width:1440,height:960});await page.goto('http://127.0.0.1:4311/#place=350242168',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__campusDebug?.activeId==='350242168',null,{timeout:120000});await page.locator('#loading').waitFor({state:'detached',timeout:120000});await page.locator('.forum-building-info summary').click();await page.locator('#inspect-building').click();await page.waitForFunction(()=>document.body.classList.contains('inspecting'),null,{timeout:30000});await page.locator('#detail-close').click();assert(!await page.locator('body').evaluate(e=>e.classList.contains('inspecting')));
 assert.deepEqual(errors,[]);const report={checks:['390x844 map','69% forum sheet','fixed-place identity','post','reply','rating','photo upload','reload persistence','360x640 no overflow','close restores map','desktop building inspection'],errors};await writeFile(`${out}/validation.json`,JSON.stringify(report,null,2));console.log('PASS',report);
}finally{await browser.close();}

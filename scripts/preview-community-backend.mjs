import {chromium} from 'playwright';
import {createApp} from '../server/app.mjs';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';
const out='work/community-backend-2026-11-02';await mkdir(out,{recursive:true});
const dir=await mkdtemp(path.join(os.tmpdir(),'swu-ui-')),instance=await createApp({dir,communityEnabled:true});
const server=instance.app.listen(4313,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4313/');await page.waitForFunction(()=>window.__campusDebug?.buildingCount===300,null,{timeout:120000});await page.locator('#loading').waitFor({state:'detached',timeout:120000});
 await page.waitForTimeout(1000);assert.equal(await page.locator('.map-label:visible').count(),0);await page.screenshot({path:out+'/initial-no-labels.png'});
 await page.locator('#zoom-in').click();await page.waitForTimeout(1400);await page.locator('#zoom-in').click();await page.waitForTimeout(2000);assert(await page.locator('.map-label:visible').count()>0);await page.screenshot({path:out+'/zoom-labels.png'});
 await page.locator('[data-category="待核名"]').click();await page.locator('.landmark-item').first().click();await page.locator('.name-suggestion summary').click();assert(await page.locator('.name-suggestion form').isVisible());await page.waitForTimeout(1400);await page.screenshot({path:out+'/name-suggestion-desktop.png'});
 await page.locator('#account-open').click();await page.locator('#account-form input[name=username]').fill('ui_test_user');await page.locator('#account-form input[name=password]').fill('ui-test-password-123');await page.locator('#account-form button[value=register]').click();await page.locator('.account-dialog').waitFor({state:'hidden'});
 await page.locator('.name-suggestion input').fill('现场门牌名称');assert.equal(await page.locator('.name-suggestion textarea').count(),0);await page.locator('.name-suggestion button').click();await page.getByText('建议已保存，等待核实。').waitFor();
 await page.locator('#community-comment').fill('跨浏览器持久化测试');await page.locator('#community-comment-form button').click();await page.locator('.forum-post').getByText('跨浏览器持久化测试',{exact:true}).waitFor();
 const row=instance.db.prepare("SELECT id FROM posts WHERE text='跨浏览器持久化测试'").get();instance.db.prepare("UPDATE posts SET status='approved' WHERE id=?").run(row.id);
 const other=await browser.newContext();const p2=await other.newPage();const shared=await p2.request.get('http://127.0.0.1:4313/api/places/fixed:'+await page.evaluate(()=>window.__campusDebug.activeId));assert((await shared.json()).comments.some(p=>p.text==='跨浏览器持久化测试'));await other.close();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);assert(await page.locator('.name-suggestion').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.screenshot({path:out+'/name-suggestion-mobile.png'});
 assert.deepEqual(errors,[]);await writeFile(out+'/community-validation.json',JSON.stringify({initialLabels:0,zoomRevealsLabels:true,suggestionSaved:true,crossBrowserRead:true,mobileWidth:390,errors},null,2));console.log('PASS initial labels, zoom, naming form, account, comment, cross-browser read and mobile');
}finally{await browser.close();await new Promise(r=>server.close(r));instance.db.close();await rm(dir,{recursive:true,force:true});}

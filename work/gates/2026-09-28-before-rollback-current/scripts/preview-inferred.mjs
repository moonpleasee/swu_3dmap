import {chromium} from 'playwright';
import {readFileSync,mkdirSync} from 'node:fs';
const root=new URL('..',import.meta.url).pathname.replace(/^\//,'').replaceAll('/','\\');
const ids=['r5477108','840830757','371876809','842727329','843421814'];
mkdirSync(root+'work\\inferred-exteriors\\screenshots',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://127.0.0.1:4311/',{waitUntil:'networkidle'});
await page.waitForSelector('#loading.loaded',{timeout:20000}).catch(()=>{});
for(const id of ids){
 await page.goto(`http://127.0.0.1:4311/#place=${encodeURIComponent(id)}`,{waitUntil:'networkidle'});
 await page.waitForSelector('#detail:not([hidden])',{timeout:20000});
 await page.waitForTimeout(900);
 const info=await page.evaluate(()=>({title:document.querySelector('#detail h2')?.textContent,label:document.querySelector('.exterior-observations strong')?.textContent,entry:!!document.querySelector('#view-entrance')}));
 await page.screenshot({path:root+`work\\inferred-exteriors\\screenshots\\${id}.png`,fullPage:false});
 console.log(JSON.stringify({id,info}));
}
console.log(JSON.stringify({errors}));
await browser.close();

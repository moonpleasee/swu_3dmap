import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const phase=process.argv[2]||'after',out='work/road-contrast';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4311/',{waitUntil:'networkidle'});
await page.waitForFunction(()=>!!window.__campusDebug);await page.locator('#loading').waitFor({state:'detached'});
for(const id of ['r5477110','r5522696','368578307']) {
 await page.evaluate(id=>location.hash='place='+id,id);
 await page.waitForFunction(id=>window.__campusDebug.activeId===id,id);
 await page.waitForTimeout(1600);
 await page.screenshot({path:`${out}/${phase}-${id}.png`});
}
writeFileSync(`${out}/${phase}.json`,JSON.stringify({errors},null,2));if(errors.length)throw new Error(errors.join('\n'));
console.log(phase+': three road/park views loaded without page errors');
} finally {await browser.close();}

import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'work/responsive-2026-10-27';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const boxes = () => page.evaluate(() => Object.fromEntries(['.app-shell', '#scene', '#explorer', '#detail'].map(selector => {
  const element = document.querySelector(selector);
  const { x, y, width, height } = element.getBoundingClientRect();
  return [selector, { x, y, width, height, visible: getComputedStyle(element).display !== 'none' }];
})));

try {
  await page.goto('http://127.0.0.1:4311/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__campusDebug, null, { timeout: 120000 });
  await page.locator('#loading').waitFor({ state: 'detached', timeout: 120000 });
  const phone = await boxes();
  assert.equal(Math.round(phone['.app-shell'].width), 390);
  assert.equal(await page.locator('#mobile-collapse').isVisible(), true);
  assert.equal(await page.locator('.bottom-controls .time-switch').isVisible(), false);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.screenshot({ path: `${out}/phone.png` });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForFunction(() => {
    const scene = document.querySelector('#scene').getBoundingClientRect();
    const explorer = document.querySelector('#explorer').getBoundingClientRect();
    return scene.x >= explorer.right && scene.width > 700 && !document.querySelector('#explorer').classList.contains('collapsed');
  });
  const desktop = await boxes();
  assert.equal(Math.round(desktop['.app-shell'].width), 1280);
  assert(desktop['#explorer'].x < desktop['#scene'].x);
  assert(desktop['#scene'].width > 700);
  assert.equal(await page.locator('#mobile-collapse').isVisible(), false);
  assert.equal(await page.locator('.landmark-list').isVisible(), true);
  assert.equal(await page.locator('.bottom-controls .time-switch').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 1280);
  await page.screenshot({ path: `${out}/desktop.png` });

  await page.locator('.landmark-item').first().click();
  await page.locator('#detail').waitFor({ state: 'visible' });
  const detail = await boxes();
  assert(detail['#detail'].x > detail['#explorer'].x + detail['#explorer'].width);
  assert(detail['#detail'].height > 500);
  assert(detail['#scene'].width > 400);
  await page.screenshot({ path: `${out}/desktop-detail.png` });
  await page.locator('#detail-close').click();
  assert.equal(await page.locator('#detail').isVisible(), false);
  assert.equal(await page.locator('.landmark-list').isVisible(), true);
  await page.locator('#reset').click();
  assert.equal(await page.locator('#explorer').evaluate(element => element.classList.contains('collapsed')), false);
  assert.equal(await page.locator('.landmark-list').isVisible(), true);

  await page.setViewportSize({ width: 900, height: 700 });
  const compact = await boxes();
  assert(compact['#scene'].width > 500);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 900);
  await page.screenshot({ path: `${out}/compact-desktop.png` });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('#mobile-collapse').getBoundingClientRect().width > 0);
  assert.equal(await page.locator('#mobile-collapse').isVisible(), true);
  await page.locator('#mobile-collapse').click();
  await page.locator('.landmark-item').first().click();
  await page.locator('#detail').waitFor({ state: 'visible' });
  const phoneDetail = await boxes();
  assert(phoneDetail['#detail'].height > 540);
  assert(phoneDetail['#detail'].width >= 388 && phoneDetail['#detail'].width <= 390);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.screenshot({ path: `${out}/phone-detail.png` });
  assert.deepEqual(errors, []);

  const report = { phone, desktop, desktopDetail: detail, compact, phoneDetail, errors };
  await writeFile(`${out}/validation.json`, JSON.stringify(report, null, 2));
  console.log('PASS responsive phone, desktop, detail and compact desktop');
} finally {
  await browser.close();
}

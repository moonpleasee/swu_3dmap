import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'work/intro-video';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const snap = name => page.screenshot({ path: `${out}/${name}.png` });

try {
  await page.goto('http://127.0.0.1:4311/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__campusDebug?.buildingCount === 300, null, { timeout: 120000 });
  await page.locator('#loading').waitFor({ state: 'detached', timeout: 120000 });
  await snap('01-desktop-map');

  await page.locator('#search').fill('图书馆');
  await snap('02-search');
  await page.locator('.landmark-item').first().click();
  await page.locator('#detail').waitFor({ state: 'visible' });
  await page.waitForTimeout(2200);
  await snap('03-building-forum');

  await page.locator('#detail-close').click();
  await page.locator('#clear-search').click();
  await page.locator('#reset').click();
  await page.waitForTimeout(2200);
  await page.locator('[data-time="night"]').click();
  await page.waitForTimeout(1700);
  await snap('04-night');
  await page.locator('[data-time="day"]').click();
  await page.waitForTimeout(1700);
  await page.locator('#layers-open').click();
  await snap('05-layers');
  await page.locator('#layers-dialog [data-close]').click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector('#mobile-collapse').getBoundingClientRect().width > 0);
  await page.waitForTimeout(1200);
  await snap('06-phone-map');
  await page.locator('#mobile-collapse').click();
  await snap('07-phone-explore');
  await page.locator('.landmark-item').first().click();
  await page.locator('#detail').waitFor({ state: 'visible' });
  await page.waitForTimeout(1700);
  await snap('08-phone-forum');
  await page.locator('[data-forum-tab="photos"]').click();
  await snap('09-phone-photos');

  await writeFile(`${out}/capture-report.json`, JSON.stringify({ errors, screenshots: 9, note: 'All screenshots from a fresh browser context; no sample comments or photos were posted.' }, null, 2));
  console.log('Captured 9 website scenes', errors);
} finally {
  await browser.close();
}

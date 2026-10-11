import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'work/ui-refresh';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto('http://127.0.0.1:4311/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__campusDebug, null, { timeout: 120000 });
  await page.locator('#loading').waitFor({ state: 'detached', timeout: 120000 });
  assert(await page.locator('#explorer').isVisible());
  assert(await page.locator('#search').isVisible());
  assert(await page.locator('.categories').isHidden());
  await page.screenshot({ path: `${out}/collapsed.png`, fullPage: true });

  await page.locator('#mobile-collapse').click();
  assert(await page.locator('.categories').isVisible());
  await page.locator('#search').fill('大礼堂');
  assert(await page.locator('#clear-search').isVisible());
  const resultCount = await page.locator('.landmark-item').count();
  assert(resultCount > 0, '搜索“大礼堂”应返回至少一个结果');
  await page.screenshot({ path: `${out}/search-expanded.png`, fullPage: true });

  const queryBefore = await page.locator('#search').inputValue();
  await page.locator('.landmark-item').first().click();
  await page.locator('#detail').waitFor({ state: 'visible' });
  assert((await page.locator('#detail').boundingBox()).height > 844 * .65);
  await page.locator('#detail-close').click();
  assert(await page.locator('#detail').isHidden());
  assert.equal(await page.locator('#search').inputValue(), queryBefore);
  assert(await page.locator('.categories').isVisible());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.deepEqual(errors, []);
  const report = { checks: ['collapsed search launcher', 'expanded category filter', 'search clear affordance', 'result selection', 'detail close restores query', '390px no horizontal overflow'], errors };
  await writeFile(`${out}/validation.json`, JSON.stringify(report, null, 2));
  console.log('PASS', report);
} finally {
  await browser.close();
}

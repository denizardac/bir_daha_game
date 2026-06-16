import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = 'desktop-shots';
mkdirSync(OUT, { recursive: true });
const URL = process.env.SHOT_URL ?? 'http://localhost:5173/';
const VW = Number(process.env.DESKTOP_W ?? 1440);
const VH = Number(process.env.DESKTOP_H ?? 900);

async function shot(page, name) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot:', name);
}

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const reset = async () => {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
  };

  // --- MENU ---
  await reset();
  await shot(page, '01-menu');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, '01b-menu-scroll');

  for (const [label, file, screen] of [
    ['Koleksiyon', '02-collection', 'collection'],
    ['Nasıl Oynanır', '03-guide', 'gameGuide'],
    ['Hall of Fame', '04-halloffame', 'hallOfFame'],
    ['Sinerjiler', '05-synergies', 'synergies'],
    ['Ayarlar', '06-settings', 'settings'],
  ]) {
    await reset();
    await page.locator('.menu-footer-tile').filter({ hasText: label }).click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, file);
  }

  // --- IN-GAME ---
  await reset();
  await page.locator('.menu-play-btn--free').click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '07-startmodal');
  await page.locator('.start-run-modal .btn-primary').click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator('.tutorial-coach-btn').click({ timeout: 2000 }).catch(() => {});
  await shot(page, '08-cardselect');

  // lineup modal
  await page.locator('.lineup-show-btn, .lineup-center-trigger, .lineup-compact-btn').first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, '09-lineup-modal');
  await page.locator('.lineup-preview-close').click({ timeout: 2000 }).catch(() => {});

  // training modal
  await page.locator('.btn-train-pick').click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '10-training-modal');
  await page.locator('.training-modal-close').click({ timeout: 2000 }).catch(() => {});

  // confirm modal
  await page.getByText('Sıfırla', { exact: false }).first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '11-confirm-modal');
  await page.locator('.confirm-modal-btn--cancel').click({ timeout: 2000 }).catch(() => {});

  // play rounds: match, tactic, event
  const dismissCoach = async () => {
    await page.locator('.tutorial-coach-btn').click({ timeout: 800 }).catch(() => {});
  };

  let gotMatch = false;
  let gotTactic = false;
  let gotEvent = false;

  for (let r = 0; r < 12; r++) {
    await dismissCoach();

    if (!gotEvent && (await page.locator('.event-choice-card').count()) > 0) {
      await shot(page, '14-event');
      gotEvent = true;
      break;
    }

    if (!gotTactic && (await page.locator('.tactic-pick-rows').count()) > 0) {
      await shot(page, '13-tactic-pick');
      const rows = page.locator('.tactic-pick-row');
      const n = await rows.count();
      for (let i = 0; i < n; i++) {
        await rows.nth(i).locator('.tactic-pick-card-slot').first().click({ timeout: 2000 }).catch(() => {});
      }
      await page.locator('.tactic-pick-confirm').click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await page.locator('.match-continue-btn').click({ timeout: 2500 }).catch(() => {});
      await page.waitForTimeout(1000);
      gotTactic = true;
      continue;
    }

    const cards = await page.locator('.player-pick-card').count();
    if (cards === 0) break;

    await page.locator('.player-pick-card').first().click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(2200);

    if (!gotMatch) {
      await shot(page, '12-match');
      gotMatch = true;
    }

    await page.locator('.match-continue-btn').click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

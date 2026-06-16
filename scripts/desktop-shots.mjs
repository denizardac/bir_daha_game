import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const VW = Number(process.env.DESKTOP_W ?? 1440);
const VH = Number(process.env.DESKTOP_H ?? 900);
const OUT = process.env.SHOT_OUT ?? (VW >= 1920 ? 'desktop-shots-1920' : 'desktop-shots');
mkdirSync(OUT, { recursive: true });
const URL = process.env.SHOT_URL ?? 'http://localhost:5173/';

async function shot(page, name) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot:', `${OUT}/${name}.png`);
}

const dismissCoach = async (page) => {
  await page.locator('.tutorial-coach-btn').click({ timeout: 800 }).catch(() => {});
};

const dismissOverlays = async (page) => {
  await page.locator('.synergy-reveal-btn').click({ timeout: 1200 }).catch(() => {});
  await page.locator('.milestone-toast button').click({ timeout: 800 }).catch(() => {});
  await dismissCoach(page);
};

const waitForPickScreen = async (page) => {
  await page.waitForFunction(
    () =>
      document.querySelector('.player-pick-card')
      || document.querySelector('.tactic-pick-stage')
      || document.querySelector('.event-choice-card'),
    { timeout: 25000 },
  );
};

const advanceThroughMatch = async (page, { captureMatch = false } = {}) => {
  await page.locator('.match-speed-btn').filter({ hasText: 'Atla' }).click({ timeout: 12000 }).catch(() => {});
  await page.waitForSelector('.match-continue-btn, .loss-screen-cta', { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(500);

  for (let i = 0; i < 4; i++) {
    const btn = page.locator('.synergy-reveal-btn');
    if ((await btn.count()) === 0) break;
    await btn.click({ timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(350);
  }

  if (captureMatch) {
    await shot(page, '12-match');
  }

  await page.locator('.match-continue-btn').click({ timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(700);

  for (let i = 0; i < 4; i++) {
    const btn = page.locator('.synergy-reveal-btn');
    if ((await btn.count()) === 0) break;
    await btn.click({ timeout: 1200 }).catch(() => {});
    await page.waitForTimeout(350);
  }

  await page.locator('.loss-screen-cta').click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(700);
  await page.locator('.milestone-toast button').click({ timeout: 800 }).catch(() => {});
  await dismissCoach(page);
};

const pickCardAndContinueMatch = async (page, { captureMatch = false } = {}) => {
  await dismissOverlays(page);
  await waitForPickScreen(page);

  if ((await page.locator('.tactic-pick-stage').count()) > 0) return 'tactic';

  const cards = await page.locator('.player-pick-card').count();
  if (cards === 0) return false;

  await page.locator('.player-pick-card').first().click({ timeout: 5000 });
  await page.waitForTimeout(900);
  await advanceThroughMatch(page, { captureMatch });
  return true;
};

const run = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const reset = async () => {
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
  };

  // --- MENU ---
  await reset();
  await shot(page, '01-menu');

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
  await dismissCoach(page);
  await shot(page, '08-cardselect');

  await page.locator('.lineup-show-btn, .lineup-center-trigger, .lineup-compact-btn').first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, '09-lineup-modal');
  await page.locator('.lineup-preview-close').click({ timeout: 2000 }).catch(() => {});

  await page.locator('.card-pick-mode-btn').filter({ hasText: 'Özel antrenman' }).click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '10-training-modal');
  await page.locator('.training-modal-close').click({ timeout: 2000 }).catch(() => {});

  await page.getByText('Sıfırla', { exact: false }).first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  await shot(page, '11-confirm-modal');
  await page.locator('.confirm-modal-btn--cancel').click({ timeout: 2000 }).catch(() => {});

  // Antrenman modundan kart seçimine dön (screenshot adımı modu değiştirmiş olabilir)
  await page.locator('.card-pick-mode-btn').filter({ hasText: 'Oyuncu kartı' }).click({ timeout: 3000 }).catch(() => {});
  await page.locator('.training-modal-close').click({ timeout: 1000 }).catch(() => {});
  await page.waitForTimeout(300);

  let gotTactic = false;
  for (let i = 0; i < 5 && !gotTactic; i++) {
    await dismissOverlays(page);
    if ((await page.locator('.tactic-pick-stage').count()) > 0) {
      await shot(page, '13-tactic-pick');
      gotTactic = true;
      break;
    }
    const result = await pickCardAndContinueMatch(page, { captureMatch: i === 0 });
    if (result === 'tactic') {
      await shot(page, '13-tactic-pick');
      gotTactic = true;
      break;
    }
    if (!result) break;
  }

  if (!gotTactic) {
    console.warn('tactic screen not captured');
  }

  // Devam: taktik onayı + olay ekranı
  await page.locator('.tactic-pick-card-select').first().click({ timeout: 2000 }).catch(() => {});
  await page.locator('.tactic-pick-card-select').nth(2).click({ timeout: 2000 }).catch(() => {});
  await page.locator('.tactic-pick-confirm').click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.locator('.match-continue-btn').click({ timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(1200);

  for (let r = 0; r < 8; r++) {
    await dismissCoach(page);
    if ((await page.locator('.event-choice-card').count()) > 0) {
      await shot(page, '14-event');
      break;
    }
    const ok = await pickCardAndContinueMatch(page);
    if (!ok) break;
  }

  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

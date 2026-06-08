# Canlıya Hazırlık Raporu

Domain bağlama dışında tüm maddeler ele alındı. Durum: **deploy’a hazır** (Vercel/Netlify + `npm run build`).

---

## 1. Gerçek QA ve denge testi

| Durum | Hazır |
|-------|-------|
| Otomatik | `npm run qa` — 40 run batch, skor/min/max/moral |
| Unit | `playtest.test.ts` — simülasyon stabilitesi |
| Manuel | `docs/QA_CHECKLIST.md` — viewport + tam run |

**Karar:** Denge ayarları korundu; sistematik headless QA eklendi. Yayın öncesi checklist’te 1 mobil tam run önerilir.

---

## 2. Yayın altyapısı

| Bileşen | Dosya |
|---------|-------|
| Git | `git init` + `.gitignore` |
| CI | `.github/workflows/ci.yml` — test + qa + build |
| Deploy | `vercel.json` (SPA rewrite) |
| Build | `npm run build` |

**Domain:** Vercel/Netlify projesine repo bağla → production branch `main`.

---

## 3. Testler

`npm test` — Vitest:

- `scoring.test.ts` — puan, timer bonus, streak
- `matchSimulation.test.ts` — maç sonucu
- `cardDraw.test.ts` — teklif çekimi, determinism
- `lineupPreview.test.ts` — kadro yerleşimi
- `egoAnalysis.test.ts` — replay ego
- `playtest.test.ts` — batch simülasyon

---

## 4. Timer

| Ayar | Değer |
|------|-------|
| Süre | **20 sn** (`CARD_TIMER_SECONDS`) |
| Varsayılan | **Kapalı** (casual) |
| Açma | Ayarlar ekranı veya `VITE_CARD_TIMER=true` |
| Bonus | Kalan sn × 5 puan (`scoring.ts`) |
| Tick | `GameScreen` 1 sn interval + `tickTimer` |

---

## 5. PWA

- `vite-plugin-pwa` — service worker, offline cache
- `public/icons/` — 192, 512, apple-touch-icon (PNG, `npm run icons`)
- `manifest.json` güncellendi
- `index.html` — apple-touch-icon, viewport-fit
- `main.tsx` — SW kayıt

---

## 6. Leaderboard & anti-cheat

| Mevcut | Gelecek API |
|--------|-------------|
| Local günlük/haftalık/all-time | `buildSignedRunPayload` + `integrityDigest` |
| Bot rakipler | Sunucu `roundHistory` replay doğrulaması |
| `isLeaderboardEntryPlausible` | Skor sınırları |

**Not:** Gerçek sosyal rekabet için backend şart; istemci paketi hazır.

---

## 7. Maç deneyimi

- `pixi.js` kaldırıldı (kullanılmıyordu)
- `matchAnimSchedule.ts` — ~8–10 sn hedef (`MATCH_ANIM_*` sabitleri)
- CSS/Framer maç anlatımı korundu, tempo yavaşlatıldı

---

## 8. Sinerji “wow” anı

- `SynergyRevealOverlay` — burst parçacıklar, spring animasyon, “Neden: …” metni
- Keşif bonusu +200 vurgusu

---

## 9. Tutorial / onboarding

- `TutorialCoach.tsx` — round 1–3, faz bazlı adımlar
- `tutorialCompleted` persist
- “Nasıl Oynanır?” ekranı ayrıca duruyor

---

## 10. Günlük streak ödülü

- `DAILY_STREAK_REWARDS` — 3 gün: +1 yenileme, moral +2; 7 gün: +2 yenileme, moral +5
- `startRun(daily)` uygular (`initialRun`)
- Ana menüde ödül etiketi

---

## 11. Ego sistemi

- `analyzeEgoReplay` — round geçmişini oynayarak alternatif kartları `simulateMatch` + `calculateRoundPoints` ile karşılaştırır
- `leaderboard.analyzeEgo` → replay (legacy fallback)

---

## Hızlı komutlar

```bash
npm install
npm test
npm run qa
npm run build
npm run preview
```

Vercel: repo import → framework Vite → deploy.

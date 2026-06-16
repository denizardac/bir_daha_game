# Bir Daha

Futbol roguelite / draft strategy — [BIR_DAHA_GDD.md](./BIR_DAHA_GDD.md)

## Çalıştır

```bash
npm install
npm run dev
```

## Test & QA

```bash
npm test          # unit testler
npm run qa        # 40 headless run (denge özeti)
npm run build     # production build (+ PWA + ikonlar)
```

Canlıya hazırlık özeti: [docs/LAUNCH.md](./docs/LAUNCH.md) · Manuel QA: [docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md)

Deploy: Vercel/Netlify — `vercel.json` SPA rewrite, CI: `.github/workflows/ci.yml`

PWA: service worker + `public/icons/` PNG seti — mobilde ana ekrana eklenebilir.

## GDD Uyumu (V1 + V2 + V3)

### V1 MVP
- Core döngü: kart seç → maç → puan / kayıp
- 200+ oyuncu kartı, 26 tag, 29 sinerji
- Günlük seed, local save, devam et
- Anonim leaderboard (günlük)

### V2
- Taktik kartları (10 adet — formasyon + sistem)
- Olay kartları (56 adet havuz, round 4/8/12)
- Ego sistemi (en iyi karar / en kritik hata)
- Paylaşım kartı + kopyala
- Haftalık leaderboard
- Opsiyonel takma ad (Ayarlar)
- Sinerji kütüphanesi ekranı

### V3
- PWA (manifest + theme)
- All-time + Namağlup leaderboard
- Yakın rakip gösterimi (run sonu)
- Günlük streak
- Ses efektleri (Web Audio, ayarlardan kapatılır)
- Anti-frustration: recovery garantisi, ilk round koruması, tehlike modu

### Bilinçli sınırlar (backend bekliyor)
- Sunucu leaderboard / anti-cheat → local + `integrityDigest` paketi hazır
- Maç anlatımı → CSS/Framer (~8–10 sn), Pixi kaldırıldı
- Discord webhook → yok

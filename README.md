# Bir Daha

Futbol temalı, günlük-seed'li roguelite / draft strateji oyunu — tasarım dokümanı: [BIR_DAHA_GDD.md](./BIR_DAHA_GDD.md)

**Stack:** React 19 + TypeScript + Zustand + Vite 6 · plain CSS (`src/index.css`) · Vitest · PWA · Capacitor (Android/iOS kabuk) · Supabase (opsiyonel canlı leaderboard)

## Çalıştır

```bash
npm install
npm run dev
```

## Test & QA

```bash
npm test          # unit testler (27 dosya / 195 test)
npm run qa        # 40 headless run (denge özeti, CI eşik kontrolü)
npm run build     # production build (+ PWA + ikonlar)
```

Yol haritası: [docs/ROADMAP.md](./docs/ROADMAP.md) · Canlıya hazırlık özeti: [docs/LAUNCH.md](./docs/LAUNCH.md) · Manuel QA: [docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md) · Supabase kurulumu: [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md) · Native app: [docs/NATIVE_APP_ROADMAP.md](./docs/NATIVE_APP_ROADMAP.md) · Mobil optimizasyon brief'i: [docs/MOBILE_OPTIMIZATION_BRIEF.md](./docs/MOBILE_OPTIMIZATION_BRIEF.md)

Deploy: Vercel/Netlify/Cloudflare Pages — `vercel.json` SPA rewrite, CI: `.github/workflows/ci.yml` (test + qa + build). Domain akışı: [docs/DEPLOY_BIRDAHA_TECH.md](./docs/DEPLOY_BIRDAHA_TECH.md)

PWA: service worker + `public/icons/` PNG seti — mobilde ana ekrana eklenebilir.

## Oyun içeriği (güncel sayılar)

- **260 oyuncu kartı** (37'si efsane/imza kartı), **26 tag**, **29 sinerji**
- **20 taktik kartı** (10 formasyon + 10 oyun sistemi)
- **58 olay kartı** — olay roundları: **4 / 8 / 11 / 14** (bağlama duyarlı ağırlıklı çekim)
- **15 round** run; taktik/antrenman bonus roundları: **3 / 6 / 9 / 12**; round 15 = şampiyonluk finali
- Manuel ilk 11 editörü (sürükle-bırak pin sistemi) + otomatik diziliş yerleşimi

## Akış özeti

`cardSelect → (lineup editör onayı) → match → loss? → sonraki round … → runEnd`

- **Kart seçimi:** 3 oyuncu kartı (veya antrenman / pas geç); 3 yenileme hakkı (run başına, seri ödülüyle artar)
- **Maç:** deterministik seed'li simülasyon (`engine/matchSimulation.ts`), CSS/Framer anlatım ~8–10 sn
- **Kayıp:** mağlubiyette bir oyuncu ayrılır (yedek öncelikli), moral −16; kadro ≤4 → run biter
- **Skor:** `engine/scoring.ts` — rakip gücü, gol, seri çarpanı, sinerji ve taktik bonusları

## GDD Uyumu (V1 + V2 + V3)

### V1 MVP
- Core döngü: kart seç → maç → puan / kayıp
- 250+ oyuncu kartı, 26 tag, 29 sinerji
- Günlük seed (İstanbul takvimi), local save, devam et
- Anonim leaderboard (günlük)

### V2
- Taktik kartları (20 adet — 10 formasyon + 10 sistem, ayrı reroll hakları)
- Olay kartları (56 adet havuz, round 4/8/11/14, duruma göre ağırlıklı)
- Ego sistemi (en iyi karar / en kritik hata — replay tabanlı)
- Paylaşım kartı (PNG) + panoya kopyala
- Haftalık leaderboard
- Opsiyonel takma ad (run başında)
- Sinerji kütüphanesi + koleksiyon ekranı

### V3
- PWA (manifest + theme) + Capacitor Android/iOS projeleri
- All-time + Namağlup leaderboard, aylık Hall of Fame (sezon arşivi)
- Yakın rakip gösterimi (run sonu) + canlı rank (Supabase varsa)
- Günlük streak ödülleri (3 gün / 7 gün)
- Ses efektleri (Web Audio, ayarlardan kapatılır)
- Anti-frustration: recovery garantisi, ilk round galibiyet koruması, tehlike modu (moral tabanı 50), kaleci teklif garantisi
- Rehberli tutorial (TutorialCoach) + oyun rehberi ekranı

### V4 — sosyal ve kalıcılık
- **Meydan okuma linki:** `?seed=&score=&by=` ile arkadaşına aynı seed'i gönder; menüde banner ile karşılanır
- **Native paylaşım:** mobilde Web Share API (kart görseli + metin + link), masaüstünde PNG indir / panoya kopyala
- **Başarımlar:** 15 başarım (koleksiyon, skor, namağlup, seri) — koleksiyon ekranında ilerleme, run sonunda bildirim
- **Sezonluk kalıcı unvanlar:** bitmiş sezonların kürsüsü ("Haziran 2026 Şampiyonu") menüde ve Hall of Fame'de
- **Haftalık modifikatörler:** hafta anahtarından deterministik (Seri/Kale/Moral/Transfer Haftası)
- Yeniden tasarlanmış run sonu ekranı ve 1280×1600 paylaşım kartı

### Notlar / bilinçli kararlar
- Kart zamanlayıcısı **tamamen kaldırıldı** (kod içinde kapalı; skor bonusu pasif)
- Sunucu leaderboard: Supabase Edge Functions (`submit-score`, `record-start`) + `integrityDigest`; Supabase yoksa tamamen yerel çalışır
- Maç anlatımı: CSS/Framer (~8–10 sn), Pixi kaldırıldı
- Discord webhook → yok

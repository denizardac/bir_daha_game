# QA ve Denge Kontrol Listesi

Otomatik: `npm run qa` (40 headless run, skor/moral dağılımı).

## Manuel (yayın öncesi)

- [ ] **Mobil 390×844** — kart seçimi, lineup modal, maç ekranı taşmıyor
- [ ] **Tablet 768×1024** — yan panel + kart grid okunaklı
- [ ] **Desktop 1280+** — orta modal ve header dengeli
- [ ] **1 tam günlük run** — round 15 finale, run sonu ego + paylaşım
- [ ] **Kayıp hissi** — 2–3 mağlubiyet sonrası kadro inceliyor, recovery kartı geliyor
- [ ] **Beraberlik** — puan düşük ama oyuncu kaybı yok
- [ ] **Manuel ilk 11** — oyuncu seçince editör açılır, sürükle-bırak pin çalışır, iptal geri alır
- [ ] **Dokun-seç (mobil)** — editörde oyuncuya dokun → geçerli slotlar yanar → hedefe dokun → taşınır; uyumsuz takas reddedilir
- [ ] **Streak 3+** — menüde ödül metni, run başı +1 yenileme / moral
- [ ] **PWA** — Chrome “Yükle”, iOS Safari “Ana Ekrana Ekle”, offline açılış (cache)

## Otomatik eşikler (qa script)

- Ortalama skor tipik aralık: ~8k–25k (seed’e göre değişir)
- Ortalama kayıp: 2–5 (agresif auto-pick ile)

Sapma görülürse `src/constants/game.ts` ve `scoring.ts` gözden geçirilir.

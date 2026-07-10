# Bir Daha — Yol Haritası

Aşama aşama ilerleme planı. Zaman tahmini yok; her aşama bir öncekinin üstüne kurulur.
Güncel durum: oyun web'de oynanabilir, 206 unit test + telemetrili headless QA + CI yeşil, Supabase leaderboard altyapısı hazır (deploy opsiyonel), Capacitor Android/iOS kabukları bağlı.

---

## Aşama 0 — Temizlik ve tutarlılık ✅ (tamamlandı)

- [x] Ego replay moral cezası gerçek oyunla eşitlendi (−20 → −16)
- [x] Yakın rakip (arkadaki) hesabı düzeltildi
- [x] Maç gücü mevki-uyum cezası manuel ilk 11'i dikkate alıyor
- [x] Maç ekranı puan önizlemesi + saha noktaları manuel dizilişi kullanıyor
- [x] Ölü bot-rakip kodu kaldırıldı; QA raporuna beraberlik ortalaması eklendi
- [x] `players.ts` POOL içindeki ölü `efsane` şablonları temizlendi (efsaneler yalnızca LEGENDARY_PROFILES'tan gelir)
- [x] Taktik puanları tek kaynağa indirildi — `tacticRules.ts` sayıları `TACTIC_EFFECTS` alanlarından okur
- [x] `getWeekKey` İstanbul takvimine bağlandı (günlük anahtar ile tutarlı)
- [x] Sinerji/moral hesapları manuel ilk 11'i görüyor (`MatchContext.manualLineup` + `getBrokenSynergies`)
- [x] `evt_sakatlik` hizalandı: gösterilen özne = A'nın rating hedefi = B'nin çıkış hedefi (ilk 11'in en zayıf saha oyuncusu)

## Aşama 1 — Mobil web deneyimi ✅ (kod tarafı tamamlandı)

- [x] Kart seçim ekranı dokunma hedefleri doğrulandı (tümü ≥44px, mobil tek kolon akış çalışıyor)
- [x] Lineup Editor'e **dokun-seç / dokun-yerleştir** modu eklendi (sürükle-bırak korunur; oyuncuya dokun → geçerli slotlar yanar → hedefe dokun)
- [x] Maç ekranı mobilde tek kolon + yapışkan sonuç çubuğu (mevcut Mobile v2 katmanı doğrulandı)
- [x] Tooltip'ler dokunmatikte tap-to-toggle (HoverTip zaten destekliyordu; editör chip'lerinde çakışma giderildi)
- [x] `index.css` (~32k satır) 6 sıralı katman dosyasına bölündü (`src/styles/01-core.css` … `06-event-v2.css`, build çıktısı bayt-bayt aynı)
- [x] TutorialCoach `AnimatePresence` çift-key hatası düzeltildi (ilk run'da konsol spam'i + potansiyel animasyon bozulması)
- [ ] Gerçek cihaz QA turu (iOS Safari + Android Chrome) — `docs/QA_CHECKLIST.md` üzerinden manuel tur (kullanıcı)

## Aşama 2 — Canlı leaderboard'un devreye alınması ✅ (replay hariç tamamlandı)

- [x] Supabase projesi + migration + Edge Functions deploy — proje `bir-daha` (Frankfurt) canlı, migration 001 uygulanmış, iki fonksiyon aktif
- [x] `LEADERBOARD_HMAC_SECRET` üretildi ve set edildi — kayıtlar sunucu HMAC-SHA256 imzasıyla yazılıyor
- [x] Sunucu sertleştirme (submit-score yeniden deploy edildi):
  - Günlük modda seed↔dayKey tutarlılığı (uydurma seed'e skor basılamaz)
  - dayKey tazelik kontrolü (±2 gün — geçmişe skor basılamaz)
  - Skor, aynı seed için kayıtlı `run_starts` satırına bağlı (record-start olmadan skor yok)
  - Oyuncu başına günde 30 leaderboard satırı limiti (free mode seed flood koruması)
  - Tüm ret yolları canlı endpoint'te doğrulandı (400/403/429), tablo kirletilmeden
- [x] Rate limit: record-start 200 start/gün (mevcuttu) + submit 30 satır/gün (yeni)
- [x] Rank window UI: leaderboard'da kendi satırın vurgulu; top-20 dışındaysan `···` ayracıyla kendi sıran ve komşuların görünür (canlı listeyle doğrulandı)
- [ ] Sunucu tarafında `roundHistory` replay doğrulaması — en güçlü anti-cheat; motoru Deno fonksiyonuna paketlemeyi gerektirir (ayrı iş)
  - Not: haftalık modifikatör skoru etkiler — sunucu replay'i hafta anahtarına göre aynı modifikatörü uygulamalı
- [ ] Takma ad moderasyonu: canlı listede uygunsuz isimler görüldü — submit-score/record-start'ta küfür/uygunsuz kelime filtresi + gerekirse mevcut kayıtlar için temizlik

## Aşama 3 — Oyun derinliği ve denge ✅ (ilk tur tamamlandı)

- [x] Denge telemetrisi: QA batch'i sinerji/taktik kullanım istatistikleri + finale ulaşma/galibiyet oranı basıyor
- [x] Niş sinerjiler erişilebilir yapıldı: UCUZ KADRO 3→2 GERİLEYEN, ROTASYON USTASI 2 düşüş+1 → 1 düşüş+2 DAYANIKLI (telemetri: "hiç aktive olmayan" 4→2)
- [x] Zincirleme olaylar: önceki kararlar sonraki olay ağırlıklarını etkiliyor (`pastChoices` — ör. yıldız satıldıysa sözleşme krizi çıkmaz, kavga bastırıldıysa psikolog öne çıkar)
- [x] Finale revanş rakibi: şampiyonluk maçında run içinde seni yenen ilk takım karşına çıkar (+REVANŞ wow anı; rng akışı değişmez)
- [x] Zorluk eğrisi ölçüldü: finale ulaşma %100, finale galibiyeti %48 (agresif auto-pick ile) — sağlıklı, şimdilik ayar gerekmez
- [x] Haftalık meydan okuma modifikatörleri: hafta anahtarından deterministik 4 modifikatör (Seri/Kale/Moral/Transfer Haftası) — menü rozeti + skor/run-başı etkileri
- [x] İkinci tur:
  - [x] İnsan-benzeri (sinerji-hedefli) auto-pick — QA raporu artık greedy vs. hedefli oyuncuyu yan yana basıyor; "hangi sinerji hedefleyen oyuncuda bile açılmıyor" ölçülüyor
  - [x] YILDIZLAR GECE erişilebilir yapıldı: havuzda yalnızca 9 YABANCI YILDIZ var (257 kart) → "3 yıldız + 0 yerli" ulaşılmazdı; "2 yıldız + ≤1 yerli"ye çekildi (telemetride hedefli oyunda artık açılıyor). KARMA DENGE zaten hedefli oyunda açılıyordu — dokunulmadı
  - [x] Rakip stili artık maça HAFİF etkiyor (±%5): saldırgan = açık maç (iki yönde de gol ↑), savunmacı = kapalı maç (↓), dengeli = nötr; kim kazanır çok değişmez, maçın karakteri değişir (davranış testiyle kilitlendi)
- [ ] Üçüncü tur (ileride): rakip stiline oyuncu tepkisi (ör. savunmacıya karşı hücum taktiği ipucu), sinerji çeşitliliğini artıracak yeni YABANCI YILDIZ kartları

## Aşama 4 — Native app yayını

`docs/NATIVE_APP_ROADMAP.md` detaylı; özet:

- [ ] Java 17 ile Android debug/release build
- [ ] Android imzalama + Play Console internal testing
- [ ] iOS için macOS/Xcode veya CI (GitHub Actions macOS runner)
- [ ] Native dokunuşlar: haptics (Capacitor Haptics), safe-area, splash
- [ ] Store varlıkları: ekran görüntüleri, açıklama metinleri (`docs/MARKETING_VIDEO_IDEAS.md` ile birlikte)

## Aşama 5 — Sosyal ve kalıcılık ✅ (hesap bağlama hariç tamamlandı)

- [x] **Meydan okuma linki:** `?seed=&score=&by=` → menüde banner, "kabul et" ile aynı seed'de run başlar. Seed bugünün günlüğü değilse serbest mod olarak oynanır (sunucu seed↔gün kuralıyla tutarlı). URL okunduktan sonra temizlenir; bozuk parametreler sessizce yok sayılır (`engine/challenge.ts`, 7 test)
- [x] **Web Share API:** mobilde kart görseli + metin + link tek dokunuşla paylaşılır; dosya paylaşımı desteklenmiyorsa metin+link'e, hiç desteklenmiyorsa buton gizlenip PNG indir / görseli kopyala fallback'ine düşer. Kullanıcı iptali hata sayılmaz
- [x] **Başarım sistemi:** 15 başarım (efsane/olay/sinerji koleksiyonu, skor eşikleri, namağlup, seri, tecrübe) — koleksiyon ekranında ilerleme çubuklu sekme, run sonunda "yeni başarım" bildirimi (`engine/achievements.ts`, 12 test)
- [x] **Sezonluk kalıcı unvanlar:** bitmiş sezonlarda kürsüye giren oyuncuya unvan ("Haziran 2026 Şampiyonu") — menüde rozet, Hall of Fame'de "Kalıcı unvanların" bölümü ve arşivde şampiyon etiketi. Aktif sezon unvan vermez (`engine/seasonTitles.ts`)
- [x] **Run sonu + paylaşım kartı yeniden tasarlandı** (aşağıya bkz.)
- [ ] Opsiyonel hesap bağlama (Supabase auth) — cihazlar arası ilerleme taşıma

### Run sonu ve paylaşım kartı elden geçirmesi

- Kart sıfırdan yeniden çizildi: 1280×1600 (4:5 sosyal medya oranı), oyunun `Barlow Condensed` tipografisi, tier'a göre ışıma, sıralama barı, 2×2 istatistik ızgarası, "en iyi karar" ve kadro şeridi, meydan okuma alt bandı
- Kart artık **canlı sıralamayı** kullanıyor (önceden yerel analizi gösteriyordu)
- Web fontları yüklenmeden çizim yapılmıyor (`ensureShareFonts`)
- Run rozetleri (`SÜPER RUN` / `NAMAĞLUP` / `ELİT SKOR`) **artık gösteriliyor** — hesaplanıyor ama hiç render edilmiyordu
- Paylaşım bölümü tek panelde: Paylaş (native) · Meydan okuma linki · Görseli kopyala · PNG indir · Metni kopyala
- Yol boyunca düzeltilen hatalar: run sonu geçmiş listesinde yinelenen React key'i (olay roundlarında satırlar atlanabiliyordu), kartta metin/saha çizgisi çakışması, `"ANONIM"` yerine Türkçe `"ANONİM"`, alt sıralarda yanıltıcı "en iyi %95" ibaresi

---

## Sürekli (her aşamada geçerli)

- Her davranış değişikliğinde `npm test` + `npm run qa` (CI zaten zorluyor)
- Denge değişikliklerinde QA eşiklerini (`scripts/qa-playtest.ts`) bilinçli güncelle
- Deterministiklik kuralı: çekim/simülasyon fonksiyonlarına yeni rastgelelik eklerken mutlaka `createRng(seed, ...)` kullan — `Math.random()` günlük seed sözleşmesini bozar
- CSS: yeni stil eklerken ilgili katman dosyasına ekle (`src/styles/0X-*.css`), selector'ı önce tüm katmanlarda grep'le
- Persist şeması değişince `sanitizePersisted`'a alan bazlı kurtarma ekle

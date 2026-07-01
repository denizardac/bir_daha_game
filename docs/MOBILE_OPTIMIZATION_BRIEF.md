# Bir Daha — Mobile Web Optimizasyonu Brief

Bu belge, projeyi bir sonraki adımda **mobil web sürümüne optimize edecek geliştirici için** hazırlanmış tam bir bağlam paketidir. Amaç: yeni geliştirici projeye sıfırdan bakarken hem kodu okuyup öğrensin, hem de burada yazılmış kısıtları ve fırsatları bilerek doğru kararı versin.

---

## 1. Proje bir bakışta

**Bir Daha** — futbol temalı, günlük-seed'li roguelite/draft strateji oyunu. Vanilla React + Zustand + plain CSS (Tailwind eklendi ama neredeyse hiç kullanılmıyor — sınıflar `src/index.css` içinde ~29k satır tutuluyor).

- **Stack:** React 19, Zustand, TypeScript, Vite 6, plain CSS (BEM-ish class naming)
- **Deploy:** Vercel/Netlify (`vercel.json` SPA rewrite), Capacitor da bağlı ama şu an web öncelikli
- **Test:** Vitest, 183 test geçiyor
- **Ana ekranlar** ([App.tsx](../src/App.tsx)'te route yönlendirilen `screen` state'ine göre):
  - `MainMenu` (menü) — [MainMenu.tsx](../src/components/MainMenu.tsx)
  - `game` altında (in-run) fazlar → `phase` state'ine göre:
    - `cardSelect` — `CardSelectScreen` ([GameScreens.tsx:354](../src/components/GameScreens.tsx))
    - `event` — `EventScreen` ([GameScreens.tsx:653](../src/components/GameScreens.tsx))
    - `match` — `MatchScreen` ([GameScreens.tsx:868](../src/components/GameScreens.tsx))
    - `loss` — `LossScreen` ([GameScreens.tsx:1301](../src/components/GameScreens.tsx))
    - `runEnd` — `RunEndScreen` ([GameScreens.tsx:1504](../src/components/GameScreens.tsx))
  - Ana ekran dışı: `SynergiesScreen`, `LeaderboardScreen`, `HallOfFameScreen`, `SettingsScreen`, `GameGuideScreen`, `CollectionScreen`

## 2. Mevcut mobil durumu

**Kısa özet: masaüstü baştan sona tasarlanmış, mobil iyi durumda değil.** Son 6 ayda tüm ekranlar yeniden tasarlandı ve polish edildi ama bu çalışmaların hepsi masaüstü ekran genişlikleri için yapıldı. Mobilde:

- Bazı ekranlar `@media (max-width: 900px)` breakpoint'lerinde temel bir stacking sağlıyor ama gerçek anlamda mobil-first bir çalışma yok
- Dokunmatik hedefler (tap targets) çoğu yerde 44px altında
- Modal ve popup'lar (özellikle Diziliş popup, Lineup Editor, Card Compare Grid) mobilde ya sığmıyor ya da hover-tabanlı etkileşimlere bağımlı
- Font boyutları ve padding'ler masaüstü için ölçeklenmiş — mobilde ya çok küçük ya da çok yer kaplıyor
- Match ekranı özellikle çok yoğun (üç sütun) — mobilde şu an detay drawer'larla idare ediliyor ama UX iyi değil

## 3. Genel yapı & derinlik (yeni geliştiricinin bilmesi gerekenler)

### CSS mimarisi
- **Tek dosya:** [src/index.css](../src/index.css) — ~29,000 satır
- Tailwind kurulu ama nadir kullanılıyor; asıl stiller plain CSS class'ları
- BEM-ish naming: `.event-choice-card`, `.event-choice-card--selected`, `.event-v2 .event-brief-head` gibi
- **Önemli:** Zaman içinde birçok "override tabakası" birikmiş — aynı selector için 3-4 farklı yerde `!important` kuralı olabiliyor. Yeni bir stil eklerken dosyayı grep'lemek şart, aksi halde alt tarafta ezilir
- CSS değişkenleri: `--bg`, `--surface-2`, `--gold`, `--crimson`, `--green`, `--red`, `--tx`, `--tx-2`, `--tx-3` vb. (index.css'in başında)
- `.game-shell` / `.menu-shell` / `.game-viewport` ana kabuk sınıfları

### Store
- **Tek store:** [src/store/gameStore.ts](../src/store/gameStore.ts) — ~1300 satır, Zustand
- `screen` (ana route) + `phase` (game içi faz) + squad + morale + round + score vb.
- `persistRun()` ve `saveCurrentRun()` ile localStorage senkron
- Store action'ları (selectOffer, resolveEventChoice, finishMatch, finishLoss, vb.)

### Engine (state-less, saf)
- `src/engine/` altındaki modüller: `cardDraw`, `eventDraw`, `matchSimulation`, `lineupPreview`, `matchPower`, `scoring`, `squadLogic`, vb.
- Deterministik seed'li RNG kullanılıyor (`createRng`)
- Tüm domain kuralları burada — UI bunları çağırır, ters yönde bağımlılık yok

### Data
- `src/data/` — statik veri: `players.ts` (~200 oyuncu), `synergies.ts` (29 sinerji), `events.ts` (56 olay), `tactics.ts`, `training.ts`, `tags.ts`
- `eventVisuals.ts` her olayın atmosferi, anlatısı, sahne stili
- `positionStyle.ts` → mevki renkleri ve tag renkleri (`TAG_AVATAR_BG` gradient tanımları)

### Tooltip sistemi
- [HoverTip.tsx](../src/components/HoverTip.tsx) — portal + fixed positioning ile viewport içinde kalır
- **Mobilde hover yok** — bu component'in mobilde tap-to-toggle davranışı yok, dokunmatikte iyi çalışmıyor. Mobil optimizasyonu yaparken bu düşünülmeli

## 4. Son eklenen major düzeltmeler (bu commit)

Aşağıdakiler yakın zamanda yapıldı, dokunulmaması gereken ya da mobilde uyarlanması gereken şeyler:

- **LossScreen v2** — kırmızı tema, dört kartlı sol kolon + sağ saha, üstünde bir bant
- **EventScreen v2** — mor accent, banner sahne, seçilene onay rozeti, dinamik CTA metni
- **Diziliş popup** — 3-kolonlu grid satırlar (rating badge + name-row + role-row + tags), sabit isim sütunu
- **Antrenman paneli** — sabit yükseklik + internal scroll (16+ oyuncuda uzama fix'lendi)
- **Reroll bug** — art arda reroll aynı oyuncuyu vermiyor artık
- **Olay dengesi** — 2 olay balance düzeltildi, `evt_eksik_kadro` kadro doluyken çıkmıyor
- **Sinerji popup** — yakın sinerji sayısı popup ile uyumlu
- **Match speed control** — 1x/2x/Atla maç animasyonu üstünde floating
- **Bonus rakamları** — "+40" gibi anlamsız sayılar → "+%X gerçek güç" olarak gösteriliyor

## 5. Görev tanımı — Mobil optimizasyon

### Amaç
**Mobil web sürümünü şu an oynanabilir olan bir prototipten, gerçekten iyi bir mobil deneyime çıkarmak.** Kullanıcının çoğunluğu telefondan gelecek.

### Kritik kural
> **Masaüstü hiçbir şekilde bozulmamalı.** Tüm mobil stiller mobile-specific media query'ler ya da yeni class'lar ile eklenmeli. Mevcut masaüstü davranışını doğrulamak için browser dev tools'ta 1280×800+ boyutunda test şart.

### Serbestlik
- **Her ekrana körü körüne bağlı kalmak zorunda değilsin.** Masaüstünde 3 kolonlu bir ekran mobilde tab'lara, drawer'a veya alt sheet'e dönüşebilir. Sen en iyisini bildiğin gibi yap.
- Yeni component'ler oluşturmakta özgürsün. Mesela `MobileMatchScreen` diye bir wrapper yapıp `window.matchMedia` ile switch yapabilirsin — ya da CSS-only kalabilir. Kararı sen ver.
- Emin olmadığın kararlar için önce plan sun, sonra uygula.

### Öncelik sırası (senin en iyi bildiğin sırayla değiştirebilirsin)
1. **MainMenu** — kullanıcı en çok bunu görecek, ilk izlenim
2. **CardSelectScreen** — oyunun core loop'u, en çok kullanılan ekran
3. **MatchScreen** — masaüstünde 3 kolonlu, mobilde tamamen yeniden düşünülmeli
4. **EventScreen** — orta karmaşıklık
5. **LossScreen / RunEndScreen** — kısa süre kalınan ekranlar
6. **Diziliş popup, Lineup Editor** — modaller
7. **Diğer ekranlar** — Synergies, Leaderboard, HallOfFame, Settings, GameGuide, Collection

### Konkret düşünülmesi gerekenler
- **Tap targets** ≥ 44×44px
- **HoverTip**'lere mobil davranışı ekle (tap-to-show, dışına tap-to-close) — bu değişiklik ekranların yarısını etkiler
- **Modal / popup'lar** — mobilde full-screen ya da bottom-sheet olması gerekir
- **Match ekranındaki 3 sütun** — mobilde tab'a çevrilmesi doğal
- **Diziliş önizlemesi** — mobilde kadro paneli ve saha aynı anda sığmıyor
- **Card compare grid** — mobilde swipe/carousel'e çevrilebilir
- **Font ölçekleri** — `clamp()` iyi ama bazı yerlerde absolute px kalmış
- **Safe area** — iOS notch/home indicator için `env(safe-area-inset-*)` desteği
- **PWA** — vite-plugin-pwa zaten kurulu, mobil "ana ekrana ekle" davranışı düşünülmeli

## 6. Kullanışlı komutlar & test yolları

```bash
npm run dev              # dev server (port 5173)
npm run build            # production build
npm test                 # 183 unit test
npm run qa               # 40 headless run — denge özeti
```

**Mobil test için:**
- Chrome DevTools → Device Toolbar → iPhone 15, Pixel 7, iPad
- **Gerçek telefon test şart.** Vite'ın dev server'ı `--host` ile lokal ağa açılabilir
- Farklı yönler (portrait/landscape) test edilmeli
- iOS Safari ve Chrome Android arasındaki farklara dikkat (özellikle 100dvh, safe-area, position:fixed davranışları)

**Debug URL parametreleri** (development-only, App.tsx'te tanımlanabilir — şu an temiz):
- Örnek: `?debugLoss=1` → doğrudan loss ekranına git
- Yeni ekran testi için bu deseni kullan: `useEffect` içinde params kontrol, `useGameStore.setState({ screen, phase, ... })`

## 7. Beklenen çıktı

1. **Plan** — hangi ekrana hangi mobil stratejiyi uygulayacağın (CSS-only mi, component split mi, drawer mi tab mi)
2. **İncremental commit'ler** — her major ekran için ayrı commit (kolay review, kolay revert)
3. **Masaüstü testi** — her commit sonrası masaüstü hiçbir şey bozulmadığından emin ol
4. **Testler geçmeli** — mevcut 183 test geçmeli, mümkünse mobil davranış için yenileri ekle

## 8. Ekstra bağlam

- **Türkçe:** UI tamamen Türkçe. Mesajlarında dil karışıklığı yapma.
- **Yorum:** Kod yorumları minimum, "neden" için yaz "ne" için değil.
- **`!important` gerçekliği:** CSS overrides çok katmanlı — mobil rule'lar yazarken specificity yerine bazen `!important` gerçekten gerekiyor. Ama kötüye kullanma.
- **Framer Motion** kullanılıyor animasyonlar için, mobilde performans düşünülmeli (bazı animasyonlar mobilde disable edilebilir)
- **Test dosyaları** `src/**/*.test.ts` — playtest.ts özellikle bir run'ı headless simüle ediyor, denge kontrolü için değerli

---

**İyi çalışmalar. Her karar tepki bekliyor: hızlı ver, gerekçesini kısaca söyle, uygula.**

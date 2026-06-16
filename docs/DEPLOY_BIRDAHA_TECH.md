# birdaha.tech — Domain + Hosting (Cloudflare Pages)

Vercel kullanmadan, GitHub + ücretsiz Cloudflare Pages ile yayın.

---

## Supabase kontrol listesi (önce bunu doğrula)

| Adım | Durum |
|------|--------|
| SQL (`001_leaderboard.sql`) çalıştı | ✅ sen yaptın |
| `.env` → URL + anon key | ✅ |
| `submit-score` Edge Function deploy | ✅ deploy ettiysen tamam |
| Test: run bitir → `leaderboard_scores` satırı | ⬜ bir kez kontrol et |

Supabase **halloldu** sayılır: tabloda skor görünüyorsa ve Leaderboard’da “Canlı sıralama — Supabase” yazıyorsa devam.

---

## 1. Cloudflare hesabı

1. [dash.cloudflare.com](https://dash.cloudflare.com) → ücretsiz hesap
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. GitHub → repo: **denizardac/bir_daha_game**
4. Build ayarları:

| Alan | Değer |
|------|--------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

5. **Environment variables** (Production):

```
VITE_SUPABASE_URL=https://<PROJE-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (anon key — .env'deki ile aynı)
```

> Gerçek proje URL'si ve anahtarı dokümana yazma; yalnızca Cloudflare/Netlify
> ortam değişkenlerine ve gitignore'lanmış `.env` dosyasına gir.

6. **Save and Deploy** — ilk build bitsin (~2 dk)

Geçici adres: `https://bir-daha-game.pages.dev` gibi bir URL verir.

---

## 2. Domain’i Cloudflare Pages’e bağla

Pages projesi → **Custom domains** → **Set up a custom domain**

- `birdaha.tech`
- `www.birdaha.tech` (opsiyonel ama önerilir)

Cloudflare sana **DNS kayıtlarını** gösterecek.

---

## 3. get.tech panelinde DNS (şu an olduğun ekran)

`birdaha.tech` yanındaki **Manage** → **DNS** / **Nameservers**

### Seçenek A — Önerilen: Nameserver’ları Cloudflare’e taşı

1. Cloudflare’de site eklerken verilen 2 nameserver (ör. `ada.ns.cloudflare.com`)
2. get.tech → Manage → Nameservers → Cloudflare NS’leri yapıştır
3. 15 dk – 24 saat içinde `birdaha.tech` Pages’e bağlanır

### Seçenek B — DNS get.tech’te kalsın

Cloudflare Pages’in verdiği kayıtları get.tech DNS’e ekle:

- **CNAME** `www` → `bir-daha-game.pages.dev`
- **A** veya **CNAME** kök (`@`) → Cloudflare’in gösterdiği hedef

(get.tech arayüzüne göre “Quick Connect” yerine manuel DNS daha güvenilir.)

---

## 4. HTTPS

Cloudflare otomatik SSL verir. Nameserver değişince **Full (strict)** yeterli.

---

## 5. Yayın sonrası test

- [ ] https://birdaha.tech açılıyor
- [ ] Oyun yükleniyor, menü çalışıyor
- [ ] Günlük run → Supabase tablosunda skor
- [ ] Leaderboard canlı liste
- [ ] Mobilde “Ana ekrana ekle” (PWA)

---

## Alternatif: Netlify

Aynı mantık: GitHub bağla, build `npm run build`, publish `dist`, env ekle, custom domain `birdaha.tech`.

`public/_redirects` SPA routing için repoda hazır.

---

## Özet sıra

```
Cloudflare Pages ← GitHub repo
     ↓
Env: VITE_SUPABASE_*
     ↓
Custom domain: birdaha.tech
     ↓
get.tech Manage → DNS / NS
```

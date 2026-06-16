# Supabase Leaderboard + Anti-Cheat Kurulumu

Gerçek günlük/haftalık sıralama için Supabase kullanılır. Domain nereden alınırsa alınsın (Turhost, Cloudflare, Namecheap vb.) aynı adımlar geçerlidir.

---

## 1. Supabase projesi oluştur

1. [supabase.com](https://supabase.com) → **New project**
2. Proje adı: `bir-daha` (veya istediğin)
3. Database password kaydet
4. Region: **Frankfurt** (Türkiye’ye yakın) veya EU

---

## 2. Veritabanı tablosu

**SQL Editor** → New query → yapıştır → Run:

Dosya: `supabase/migrations/001_leaderboard.sql`

Bu tablo:
- `leaderboard_scores` — skorlar
- RLS: herkes **okur**, kimse doğrudan **yazamaz** (sadece Edge Function)

---

## 3. Edge Function (anti-cheat + kayıt)

### CLI ile (önerilen)

```bash
npm install -g supabase
supabase login
supabase link --project-ref SENIN_PROJECT_REF
supabase functions deploy submit-score
```

`project-ref`: Supabase → Project Settings → General → Reference ID

### Edge Function secrets (opsiyonel ama önerilir)

```bash
# Depolanan kayıtları sunucuya özel anahtarla HMAC-SHA256 imzalar (istemci taklit edemez)
supabase secrets set LEADERBOARD_HMAC_SECRET="uzun-rastgele-bir-deger"

# CORS'u yalnızca prod origin'e kısıtla (yoksa '*')
supabase secrets set ALLOWED_ORIGIN="https://birdaha.tech"
```

### Fonksiyon ne yapar?

1. Yalnızca `POST` kabul eder; CORS `ALLOWED_ORIGIN` ile kısıtlanabilir
2. `roundHistory` puanlarını toplar → `totalScore` ile karşılaştırır (±30 tolerans)
3. SHA-256 **digest** doğrular (client ile aynı algoritma — taşıma bütünlüğü)
4. `LEADERBOARD_HMAC_SECRET` varsa kaydı **HMAC-SHA256** ile imzalayıp saklar
5. Round başına şüpheli puan farkını reddeder
6. Service role ile DB’ye yazar (anon key ile yazılamaz)

---

## 4. İstemci ortam değişkenleri

Proje kökünde `.env` oluştur (`.env.example` kopyala):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Anon key: Supabase → **Project Settings → API → anon public**

**Önemli:** `service_role` anahtarını asla `.env` veya GitHub’a koyma — sadece Supabase Edge Function secrets’ta kalır.

---

## 5. Local test

```bash
npm install
npm run dev
```

1. Günlük run bitir
2. Supabase → **Table Editor → leaderboard_scores** — satır gelmeli
3. Leaderboard ekranında “Canlı sıralama — Supabase” yazısı görünür

---

## 6. Production deploy (domain)

Domain’i nereden alırsan al:

| Host | Ne yaparsın |
|------|-------------|
| **Cloudflare Pages** | GitHub repo bağla, build: `npm run build`, output: `dist`, env ekle |
| **Netlify** | Aynı + `_redirects` veya `netlify.toml` SPA rewrite |
| **Turhost / cPanel** | `npm run build` → `dist/` içeriğini `public_html`’e yükle |
| **GitHub Pages** | `dist` deploy action |

Build öncesi hosting panelinde **Environment variables** ekle:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Vite bu değişkenleri **build sırasında** gömer — domain değiştirince yeniden build gerekir.

### DNS (örnek)

Domain panelinde:
- **A** veya **CNAME** → hosting’in verdiği adrese
- SSL: Cloudflare / Netlify otomatik; cPanel’de Let’s Encrypt

---

## 7. GitHub’a yükleme

Repo: [github.com/denizardac/bir_daha_game](https://github.com/denizardac/bir_daha_game)

```bash
cd c:\Users\Deniz\Desktop\Projects\bir_daha
git remote add origin https://github.com/denizardac/bir_daha_game.git
git add .
git commit -m "Bir Daha — oyun + Supabase leaderboard"
git branch -M main
git push -u origin main
```

`.env` dosyası **commit edilmez** (`.gitignore`).

---

## 8. Anti-cheat seviyeleri

| Seviye | Durum |
|--------|--------|
| Digest + puan toplamı | ✅ Edge Function |
| Round başına tutarlılık | ✅ |
| Tam maç replay (sunucuda simulateMatch) | 🔜 İsteğe bağlı v2 |

Şu an hile yapan biri digest + history uydurmadan yüksek skor gönderemez; gelişmiş hile için ileride sunucu tarafı full replay eklenebilir.

---

## 9. Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| Leaderboard boş | `.env` build’e dahil mi? Run bittikten sonra tabloya bak |
| `Digest doğrulanamadı` | Client/edge aynı `roundHistory` formatında mı |
| CORS hatası | Edge function OPTIONS header’ları deploy’da var |
| Botlar hâlâ görünüyor | `VITE_SUPABASE_*` tanımlı değilse local bot modu aktif |

---

## 10. Sıra özeti

```
Supabase proje → SQL migration → deploy submit-score
     ↓
.env + npm run dev → test run
     ↓
GitHub push → hosting + domain DNS → production env → build
```

Domain bilgilerini paylaştığında DNS kayıtlarını o panele göre netleştiririz.

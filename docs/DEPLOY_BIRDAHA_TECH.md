# birdaha.tech - Domain + Hosting

GitHub + Cloudflare Pages ile yayin akisi.

## Supabase kontrol listesi

| Adim | Durum |
|------|-------|
| `supabase db push` / `001_leaderboard.sql` calisti | ✅ migration 001 remote'ta |
| `submit-score` Edge Function deploy edildi | ✅ sertlestirilmis surum aktif |
| `record-start` Edge Function deploy edildi | ✅ |
| `LEADERBOARD_HMAC_SECRET` set edildi | ✅ |
| `ALLOWED_ORIGINS` prod domainlere kisitlandi | ✅ (localhost skor GONDERIMI engellenir; okuma calisir) |
| Client env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ✅ (`.env` + Cloudflare env) |
| Test run: `run_starts` satiri | Kontrol et |
| Test run bitisi: `leaderboard_scores` satiri | Kontrol et |

### submit-score sunucu korumalari (guncel)

- Digest dogrulamasi: istemciyle ayni kanonik payload uzerinden SHA-256 karsilastirmasi
- HMAC-SHA256 imza: kayit `integrity_digest` alanina sunucu gizli anahtariyla imzalanip yazilir
- Gunluk modda seed `dayKey` ile baslamak zorunda (baska gune / uydurma seed'e skor basilamaz)
- `dayKey` sunucu saatinden ±2 gunden fazla sapamaz (gecmise skor basilamaz)
- Skor, ayni seed icin kayitli bir `run_starts` satirina baglidir — `record-start` cagrilmadan skor kabul edilmez
- Oyuncu basina gunde en fazla 30 leaderboard satiri (free mode benzersiz seed flood korumasi)
- `record-start`: oyuncu basina gunde 200 baslangic limiti
- Gelecek adim (Asama 2 devami): sunucu tarafinda `roundHistory` replay simulasyonu — haftalik modifikatoru hafta anahtarina gore uygulamayi unutma

Gerekli komutlar:

```bash
supabase db push
supabase functions deploy submit-score
supabase functions deploy record-start
supabase secrets set ALLOWED_ORIGINS="https://birdaha.tech,https://www.birdaha.tech"
```

`LEADERBOARD_HMAC_SECRET` icin birebir placeholder yazma. PowerShell'de gercek random secret uretip set et:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$secret = [Convert]::ToBase64String($bytes)
supabase secrets set "LEADERBOARD_HMAC_SECRET=$secret"
```

## Cloudflare Pages

1. Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git.
2. Repo: `denizardac/bir_daha_game`.
3. Build ayarlari:

| Alan | Deger |
|------|-------|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Production environment variables:

```env
VITE_SUPABASE_URL=https://<PROJE-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Gercek key'leri dokumana yazma. Cloudflare env ve local `.env` yeterli.

## Domain

Pages projesi -> Custom domains:
- `birdaha.tech`
- `www.birdaha.tech`

Cloudflare'in verdigi DNS yonlendirmesini domain panelinde uygula. Nameserver'i Cloudflare'e tasimak en temiz yoldur.

## Yayin sonrasi test

- `https://birdaha.tech` aciliyor.
- Oyun menu ve run akisi calisiyor.
- Gunluk run baslatinca `run_starts` satiri geliyor.
- Run bitince `leaderboard_scores` satiri geliyor.
- Leaderboard canli listeyi ve rank'i gosteriyor.
- Mobilde PWA yukleniyor.
- Browser devtools console'da CORS/CSP hatasi yok.

## Not

`public/_headers` Cloudflare Pages icin guvenlik header'larini ekler: CSP, frame engeli, nosniff, referrer policy ve permissions policy.

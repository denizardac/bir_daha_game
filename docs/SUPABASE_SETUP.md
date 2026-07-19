# Supabase Leaderboard + Guvenlik Kurulumu

Gercek gunluk/haftalik siralama icin Supabase kullanilir. Domain nereden alinirsa alinsin ayni sira gecerlidir.

## 1. Supabase projesi

1. Supabase'de yeni proje olustur.
2. Database password'u sakla.
3. Region olarak EU/Frankfurt secmek Turkiye icin uygundur.

## 2. Veritabani migration

SQL Editor'de veya CLI ile `supabase/migrations/001_leaderboard.sql` dosyasini calistir.

Bu migration:
- `leaderboard_scores` tablosunu olusturur.
- `run_starts` tablosunu olusturur.
- RLS'i acar.
- Herkese okuma izni verir.
- Anon/public client ile dogrudan insert/update/delete'i kapatir.
- Skor/rank RPC fonksiyonlarini ekler.

CLI ile:

```bash
supabase link --project-ref SENIN_PROJECT_REF
supabase db push
```

## 3. Edge Function deploy

Iki function da deploy edilmeli:

```bash
supabase functions deploy submit-score
supabase functions deploy record-start
supabase functions deploy submit-feedback
```

`submit-score` skor yazimini yapar. `record-start` run baslangiclarini yazar. Iki tabloya da client tarafindan dogrudan yazilmaz.

## 4. Edge Function secrets

Once rastgele secret uret:

```powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$secret = [Convert]::ToBase64String($bytes)
supabase secrets set "LEADERBOARD_HMAC_SECRET=$secret"
```

Sonra origin kisitini set et:

```bash
supabase secrets set ALLOWED_ORIGINS="https://birdaha.tech,https://www.birdaha.tech"
```

Local test icin gerekiyorsa gecici olarak localhost ekleyebilirsin:

```bash
supabase secrets set ALLOWED_ORIGINS="https://birdaha.tech,https://www.birdaha.tech,http://localhost:5173,http://127.0.0.1:5173"
```

`service_role` key sadece Supabase Function secrets tarafinda kalmali. Repo'ya, `.env` dosyasina veya hosting client env'ine konmaz.

## 5. Client ortam degiskenleri

Proje kokunde `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Production hosting panelinde de ayni iki degisken olmali:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 6. Function kontrolleri

`submit-score`:
- Sadece POST kabul eder.
- Origin allowlist uygular.
- Oyuncu, seed, gun, hafta, mod formatlarini kontrol eder.
- Round history uzunlugunu ve round araligini kontrol eder.
- Secilen kartin tekliflerde olup olmadigini kontrol eder.
- Event/taktik/mac turlarinin yapisini ayirir.
- Puan toplamlarini toleransla dogrular.
- HMAC signature ile kaydi sunucu tarafinda imzalar.
- Ayni player/seed/day icin sadece daha yuksek skoru yazar.

`record-start`:
- Sadece POST kabul eder.
- Origin allowlist uygular.
- Oyuncu, isim, seed, gun, mod formatlarini kontrol eder.
- Gunluk modda o gunun tam `v2` Ranked seed'ini dogrular.
- Player/gun basina temel spam limiti uygular.
- `run_starts` yazimini service role ile yapar.

## 7. Local test

```bash
npm install
npm run dev
```

1. Gunluk run baslat.
2. Supabase Table Editor'de `run_starts` satiri gorunmeli.
3. Run bitir.
4. `leaderboard_scores` satiri gorunmeli.
5. Leaderboard ekrani canli listeyi gostermeli.

## 8. Guvenlik notu

Bu kurulum public paylasim icin makul sertlestirme saglar: SQL injection riski dusuk, yazma islemleri RLS + Edge Function arkasinda, service role client'a cikmiyor, dependency audit temiz tutuluyor.

Tam rekabetci anti-cheat icin ileride sunucuda seed'den tam run replay/simulasyon ve IP tabanli rate limit eklenmeli. CORS tek basina guvenlik siniri degildir; tarayici disi istemciler Origin taklit edebilir.

## 9. Production deploy sirasi

```bash
supabase db push
supabase functions deploy submit-score
supabase functions deploy record-start
# Once yukaridaki PowerShell komutuyla gercek random secret set et.
supabase secrets set ALLOWED_ORIGINS="https://birdaha.tech,https://www.birdaha.tech"
npm run build
```

Sonra hosting tarafinda yeniden deploy al.

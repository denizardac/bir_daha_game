# Geri bildirim kutusu

Oyuncular ana menüdeki **Görüş** veya oyun içindeki **Bildir** düğmesinden not bırakır. Kayıtlar doğrudan tabloya değil, `submit-feedback` Edge Function üzerinden yazılır.

## Yayına alma

```powershell
supabase db push
supabase functions deploy submit-feedback
```

Function, mevcut `ALLOWED_ORIGINS` secret'ını kullanır. Canlı domain değişirse leaderboard function'larıyla birlikte güncelle:

```powershell
supabase secrets set ALLOWED_ORIGINS="https://birdaha.tech,https://www.birdaha.tech"
```

## Gelen notları okuma

Supabase Dashboard → **Table Editor** → `feedback_submissions` tablosunu aç. Varsayılan sıralama için `created_at` alanını azalan sırala.

- `category`: `bug`, `balance`, `suggestion`, `other`
- `message`: oyuncunun notu
- `contact`: yalnızca oyuncu yanıt isterse dolu olur
- `screen`, `phase`, `round`, `seed`, `client_version`, `platform`: teşhis bağlamı
- `status`: `new` → `reviewing` → `planned` / `resolved` / `closed`
- `admin_note`: kendi inceleme notun

`contact` kişisel bilgi olabilir. Dışa aktarımlarda paylaşma ve yalnızca yanıt vermek için kullan.

## Güvenlik

- Anonim ve giriş yapmış kullanıcıların tabloya doğrudan okuma/yazma izni yoktur.
- Edge Function origin kontrolü, sunucu tarafı alan doğrulaması, honeypot ve oyuncu başına saatte 5 kayıt limiti uygular.
- `service_role` anahtarı yalnızca Supabase Function ortamında kalır.

# Unlockable Sistemi — Son QA Raporu

Tarih: 15 Temmuz 2026  
Branch: `main`  
Kapsam: Kalıcı içerik çekirdeği, yeni oyuncu/olay/mekanikler, görünür ilerleme,
Ayın Efsanesi, save migration ve transfer ayrılık sinerjisi düzeltmesi.

## Faz kapıları

| Faz | Commit | Sonuç |
|---|---|---|
| Oyun denetimi ve ortak dil | `5e8d8b3` | Geçti |
| Tasarım sözleşmesi | `840b896` | Geçti |
| Ayrılan oyuncunun sinerji etkisi | `dcdb148` | Geçti |
| Unlock çekirdeği ve içerik havuzları | `3c6c32e` | Geçti |
| Garanti kuyruğu ve mekanikler | `963934d` | Geçti |
| Oyuncuya görünür ilerleme | `e9bc28c` | Geçti |
| Ayın Efsanesi | `699d215` | Geçti |

Her uygulama fazında test, QA ve production build çalıştırıldı; faz commit'i yalnız
bu üç kapı yeşilken `origin/main` dalına gönderildi.

## Otomatik doğrulama

- 43 test dosyası, 285 test: geçti.
- Production TypeScript + Vite + PWA build: geçti.
- Rating-odaklı bot: 1.000 Run, ortalama 8.237, min 1.230, max 19.673.
- Sinerji-odaklı bot: 1.000 Run, ortalama 8.946, max 20.391.
- İki stratejide de erişilemeyen Sinerji veya seçilemeyen Taktik kalmadı.
- Rating botunda Finale erişimi %100, Finale galibiyeti %52.
- Sinerji botunda Finale galibiyeti %51.

### Skor basamağı erişimi

| Eşik | Rating botu | Sinerji botu | Karar |
|---:|---:|---:|---|
| 5.000 | 800/1.000 | 854/1.000 | İlk kalıcı hedef için erişilebilir |
| 10.000 | 314/1.000 | 399/1.000 | İyi Run hedefi |
| 15.000 | 23/1.000 | 46/1.000 | Zor uzmanlık hedefi |
| 20.000 | 0/1.000 | 1/1.000 | Çok zor ustalık hedefi |
| 25.000 | 0/1.000 | 0/1.000 | Bilinçli aspirasyon/final ödülü |

25.000 eşiğinin botlarda görülmemesi kabul edilen tasarım kararıdır. Kullanıcının
isteğine uygun biçimde hedef oyunda kalır; yüksek skor bir Run'da beş ödülü birden
açmaz, skor zincirinde yalnız sıradaki basamak açılır.

## Kritik invariant sonuçları

- Kişisel oyuncu, olay ve mekanikler Günlük Seed'e sızmıyor.
- Ayın Efsanesi kişisel değildir; aynı doğrulanmış cache ile iki modun havuzuna
  aynı kart olarak giriyor ve Run başında donduruluyor.
- Oyuncu/Olay garantisi yalnız teklif gerçekten gösterildiğinde FIFO kuyruğundan
  tüketiliyor; resume ve terk etme öncesi kaybolmuyor.
- Yeni olay ilk uygun Olay Roundunda garanti, sonrasında normal olay havuzunda.
- Hedefli Scout ikinci kaleci, Kadro tekrarı veya yan teklif tekrarı üretmiyor.
- Kriz Kontratı maç veya Olay ayrılığıyla 5 kişiye düşüşte bir kez tetikleniyor.
- Run Sonu kaydı leaderboard/ağ hatasından bağımsız ve `runId` ile idempotent.
- Save v1/v4/v5 kayıtları v6'ya taşınıyor; bozuk alanlar güvenli varsayılana dönüyor.
- Transfer paneli yalnız ayrılan oyuncunun negatif Sinerji etkisini gösteriyor.

## Manuel tarayıcı QA

- Localhost desktop: Ana Menü, Koleksiyon/Kilitli İçerik, Hedefli Scout ve Ayın
  Efsanesi kontrol edildi.
- 390×844 mobil: Ana Menü, aylık kart, hedef paneli ve 12 unlock kartlı Koleksiyon
  kontrol edildi; yatay taşma veya kullanılamayan kontrol görülmedi.
- Tarayıcı sayfa hatası/exception: yok.
- Yerel geliştirmede Supabase Edge Function'a skor başlangıcı yazılamadığında oyun
  akışı bozulmuyor; bu beklenen ağ fallback'idir.

# Unlock Sistemi Öncesi Oyun Denetimi

Tarih: 15 Temmuz 2026

Bu denetimde çalışan kod ürün gerçeği kabul edildi. `BIR_DAHA_GDD.md` ve eski
planlar yalnızca niyeti açıklayan kaynaklardır; zamanlayıcı ve bazı sunucu
doğrulama iddiaları gibi kodla çelişen maddeler tasarım girdisi sayılmamıştır.

## 1. Gerçek oyun döngüsü

Run 7 kartlık deterministik başlangıç Kadrosu ve 50 taban moralle başlar. Kadro
üst sınırı 11'dir. Menajer Günlük Seed veya Serbest Mod seçer.

| Round | Gerçek akış |
|---|---|
| 1, 2, 5, 7, 10, 13, 15 | Üç Oyuncu Kartından biri, Özel Antrenman veya uygun olduğunda pas; ardından maç |
| 3, 6, 9, 12 | İki formasyon ve iki sistem teklifi; maç yok; +35 skor ve +8 moral |
| 4, 8, 11, 14 | Bir Olay seçimi; ardından aynı Round için normal kart seçimi ve maç |
| 15 | Şampiyonluk maçı; galibiyette +2.500, namağlup galibiyette ayrıca +2.000 |

- Maç galibiyeti seriyi büyütür ve moral +10 verir; beraberlik seriyi sıfırlar
  ve moral -5 verir; mağlubiyet seriyi sıfırlar, moral -16 verir ve bir oyuncu
  ayrılır.
- Mağlubiyet ayrılığı önce Yedekleri hedefler. MENTOR/LİDER/KAPİTAN değerleri
  ayrılığa karşı koruma sağlar; SAVAŞÇI bir kez korunabilir.
- Kadro 5 kişide Tehlike Moduna girer ve moral en az 50 tutulur. Kadro 4 kişiye
  düştüğü anda Erken Bitiş olur.
- Oyuncu Kartı seçimi dolu Kadroda bir Transfer Değişimidir. Menüden bağımsız
  oyuncu satışı yoktur. Bazı Olaylar oyuncu ayrılığı yaratabilir; unlock koşulu
  bu özel olayları açıkça adlandırmadıkça “satış” sayılamaz.
- Kart zamanlayıcısı kaldırılmıştır; `timerSeconds` uyumluluk için 0 taşınır.

## 2. Karar ve içerik uzayı

Kod tabanında 260 Oyuncu Kartı vardır: 69 normal, 89 iyi, 65 güçlü ve 37
efsane. Ayrıca 58 Olay, 29 Sinerji ve 10 formasyon + 10 sistem kartı vardır.

Trait'ler üç katmanda etki eder:

1. Hücum/savunma çarpanları ve pasif skor gibi doğrudan maç etkisi.
2. POTANSİYEL, MENTOR, GERİLEYEN ve risk trait'leri gibi Roundlar arası gelişim.
3. İlk 11 kombinasyonlarından doğan Sinerjiler.

Özel Antrenman normal Oyuncu Kartı seçiminin yerini alır, bir mevcut oyuncuya
uyumlu tek trait ekler ve ardından maç oynatır. Oyuncu başına üst sınır 5
trait'tir. Bu nedenle “bir oyuncuda 5 trait” hedefi gerçek ve ölçülebilirdir;
ödül Olayı üç trait ekleyecekse 5 trait üst sınırına, çelişen trait gruplarına
ve uygun hedef bulunamamasına karşı deterministik telafi davranışı gerekir.

## 3. Skor dengesi

15 Temmuz 2026'da `QA_RUNS=400 npm run qa` ile iki deterministik strateji
çalıştırıldı:

| Ölçüm | Rating odaklı | Sinerji odaklı |
|---|---:|---:|
| Ortalama skor | 8.333 | 8.986 |
| Gözlenen minimum / maksimum | 1.070 / 18.098 | — |
| Ortalama G / B / M | 5,7 / 1,9 / 3,5 | — |
| Finale ulaşma | %100 | — |
| Finale galibiyeti | %55 | %54 |

Sonuç: 5k ve 10k erken/orta ilerleme, 15k ileri hedef, 20k ve 25k ustalık
hedefidir. 25k kasıtlı olarak nadir kalabilir. Tek yüksek skorlu Run'ın beş
ödülü birden açması tekrar oynama hedefini zayıflatır; skor zinciri yalnızca
sıradaki kilidi ve Run başına en fazla bir skor ödülünü açmalıdır.

Mevcut QA eşikleri yalnızca katastrofik regresyonları yakalıyor
(`1.500 <= ortalama <= 60.000`). Unlock dengesi için hedef erişim oranlarını
ölçen ayrı bir batch raporu eklenmelidir.

## 4. Modların adalet sınırı

- Günlük Seed'in Interface'i seed + standart oyuncu/olay havuzu + haftalık ortak
  modifikatördür. Cihaza özgü unlock kaydı bu Interface'e giremez.
- Serbest Mod aynı maç ve skor Implementation'ını kullanır; kişisel Açılan
  İçerik yalnızca kart/olay havuzu Seam'inde eklenir.
- Kişisel içerik skor gücü sağlayabildiği için Serbest Mod skorları günlük
  listeye gönderilmez. Mevcut haftalık ve tüm-zamanlar listeleri iki modu aynı
  listede birleştirebildiğinden UI ödül gücünü açıkça belirtmeli; uzun vadede
  leaderboard kapsamı sunucuda mod alanıyla ayrılmalıdır.
- Ayın Efsanesi kişisel değil global içeriktir. Aynı ay herkese aynı kart
  verilirse Günlük Seed adaletini bozmaz; yine de kart üretimi ay + doğrulanmış
  şampiyon kaydı üzerinden deterministik olmalıdır.

## 5. Kayıt, doğrulama ve ağ gerçekleri

- Kalıcı istemci verisi `bir-daha-save` anahtarında sürümlüdür. Yeni alanlar
  bozuk/eski kayıtta normalize edilmeli ve mevcut koleksiyonlar yeniden
  kilitlenmemelidir.
- Run snapshot'ı kart, Kadro, taktik, Olay ve diziliş kararlarını taşıyarak devam
  etmeyi destekler. İlk Run Garantisi snapshot'a dahil edilmezse yenileme veya
  devam etme sırasında içerik kaybolabilir ya da iki kez tüketilebilir.
- İstemci ve Edge Function roundHistory toplamı, aralıklar, teklif-seçim uyumu
  ve SHA-256 digest kontrolü yapar. Digest gizli imza değildir; sunucu Run'ı
  seed'den baştan simüle etmez.
- Uzak leaderboard isteğe bağlıdır. Unlock ilerlemesi ağ veya leaderboard
  gönderimi başarısız olsa bile cihazda tamamlanmalıdır; rekabetçi skor kaydı ile
  kişisel ilerleme aynı hata sınırına bağlanmamalıdır.
- Aylık şampiyon yerel Hall of Fame'den üretilemez. Ayın Efsanesi için sunucudan
  önceki ayın tekil, doğrulanmış en iyi kaydı ve güvenli görünen ad gerekir.

## 6. Mevcut unlock taslağındaki açıklar

- Run sonu store alanı `newContentUnlocks` üretiyor fakat sonuç ekranı bunu
  render etmiyor; oyuncu açılan içeriği göremiyor.
- 5k/15k/25k üçlüsü kullanıcının istediği 5k adımlı zinciri karşılamıyor ve tek
  Run'da kademeli açılışı sınırlamıyor.
- “Hedefli Scout” sadece katalog adı; gerçek mekanik Implementation'ı yok.
- Açılan Olay için takip eden Run garantisi ve sonrasında normal eşit havuza
  dönüş durumu kayıt modelinde yok.
- Bazı koşullar yalnız Run sonu Kadrosunu ölçüyor. Run içinde ulaşılıp sonradan
  oyuncu kaybıyla düşen 7 YERLİ veya 5 trait hedefinin ürün niyeti kesin
  tanımlanmalı. Tasarım kararı: koşul özellikle “Run sonunda” demiyorsa Run
  boyunca görülen maksimum değer ölçülür.
- Erken biten Run ile Finaleye ulaşan Run aynı `runEnd` fazına düşüyor. Geri
  dönüş koşulu `round >= maxRounds` ile Finaleye ulaşmayı açıkça istemelidir.
- Yeni açılan içerik aynı Run'ın havuzuna girmemeli; yalnız tamamlanan Run'dan
  sonra başlayan Serbest Modda görünmelidir.
- Olay etkileri `roundHistory.pointsEarned` ile gerçek skor deltasını birebir
  yazmalıdır. Trait verilemediğinde eklenen telafi puanı da geçmişe eklenmezse
  doğrulama başarısız olur.

## 7. Mimari yön

Unlock alanı derin bir Module olarak tutulmalıdır. Dışarıya şu küçük Interface'i
sunması yeterlidir:

- biten Run telemetrisini kabul et,
- kalıcı ilerlemeyi ve yeni açılan ödülleri döndür,
- mod için erişilebilir içerik ve bekleyen İlk Run Garantilerini döndür,
- tüketilen garantiyi idempotent biçimde kaydet.

Store yalnız orkestrasyon Adapter'ıdır; koşul kurallarını veya içerik id'lerini
bilmemelidir. Kart ve Olay çekimleri iki ayrı havuz Seam'idir. Bu Locality,
migrasyon, UI ve testlerin unlock kural değişikliklerinden daha az etkilenmesini
sağlar; Module'ün Depth ve Leverage'ı burada oluşur.

## 8. Faz 0 kabul kontrolü

- [x] Kod, GDD, roadmap, QA listesi, store akışı, çekim, skor, Kadro ayrılığı,
  Trait/Sinerji, persistence, leaderboard ve Edge Function incelendi.
- [x] Günlük Seed ve Serbest Mod sınırı tanımlandı.
- [x] Genel satış varsayımı kaldırıldı.
- [x] Skor eşikleri 400 Run simülasyonuyla değerlendirildi.
- [x] Domain sözlüğü oluşturuldu.
- [x] Uygulama öncesi kritik invariant ve riskler kayda geçirildi.

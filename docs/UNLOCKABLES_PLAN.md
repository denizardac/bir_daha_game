# Kalıcı İçerik Sistemi — Uygulama Planı

Bu plan `docs/UNLOCK_SYSTEM_AUDIT.md` bulgularını uygular. Mevcut **Günlük
Seed** ve **Serbest Mod** adları korunur; “Kulüp Runı” adında üçüncü bir mod
oluşturulmaz.

## Ürün hedefi

Her Run sonunda Menajere “bir sonraki Run'da görebileceğim yeni bir şey var”
hissi vermek; bunu kalıcı düz stat artışıyla değil yeni Oyuncu Kartları, Olaylar
ve karar mekanikleriyle yapmak. Kişisel ödüller Günlük Seed'in eşit şartlarını
değiştirmez.

## Değişmez kurallar

1. Kişisel unlock'lar yalnız Serbest Mod içerik havuzunu etkiler.
2. Günlük Seed'in oyuncu, olay ve mekanik davranışı cihaz kaydından bağımsızdır.
3. Bir ödül, koşulun sağlandığı Run'ın içine geriye dönük girmez.
4. Skor zincirinde bir Run yalnız sıradaki tek basamağı açar. 25.000 yapan yeni
   bir kayıt bile önce 5.000 ödülünü açar; sonraki basamak için bir Run daha
   bitirmek gerekir.
5. Bağımsız koşullar aynı Run'da açılabilir; bunların İlk Run Garantileri FIFO
   kuyruğunda Run başına bir ödül olacak şekilde tüketilir.
6. Yeni açılan Oyuncu Kartı takip eden ilk uygun Serbest Mod Runında en geç 5.
   Rounddaki normal oyuncu tekliflerinden birinde görünür.
7. Yeni açılan Olay takip eden ilk uygun Serbest Mod Runının ilk Olay Roundunda
   kesin görünür. Garanti bir kez tüketildikten sonra diğer uygun Olaylarla aynı
   taban ağırlığa döner; bağlamsal uygunluk çarpanları tüm Olaylara olduğu gibi
   uygulanır.
8. Garanti yalnız içerik gerçekten teklif edildiğinde tüketilir. Sayfa yenileme,
   devam etme veya Run'ı tekliften önce terk etme garantiyi kaybettirmez.
9. Koşul “Run sonunda” demiyorsa Run boyunca görülen maksimum değer ölçülür.
10. Unlock ilerlemesi leaderboard, ağ veya paylaşım hatasından bağımsız olarak
    cihazda idempotent biçimde kaydedilir.
11. Eski kayıt, bozuk alan ve daha önce koleksiyona alınmış ödül içerikleri
    migration sırasında veri kaybetmez veya yeniden kilitlenmez.
12. Ayın Efsanesi kişisel unlock değildir; aynı takvim ayında herkese aynı kart
    profilini verir ve iki modda da standart havuza girer.

## İlk katalog

### Skor zinciri — Run başına yalnız sıradaki bir ödül

| Sıra | Tek Run skoru | Ödül | Oyun rolü |
|---:|---:|---|---|
| 1 | 5.000 | Gökhan Sazdağı (88 SÖB) | YERLİ/LİDER omurgasına erişilebilir ilk ödül |
| 2 | 10.000 | Peter Etebo (88 DOS) | Fiziksel ve geri dönüş planlarını açar |
| 3 | 15.000 | Daniel Güiza (87 SF) | Güçlü bitirici fakat TARTIŞMALI riskiyle yan seçim yaratır |
| 4 | 20.000 | Sabri Sarıoğlu (88 SÖB) | HIZLI ve duran top planlarını birleştirir |
| 5 | 25.000 | Burak Yılmaz (91 SF) | Zincirin zor, yüksek etkili final ödülü |

Bu sıra yalnız rating büyütmez; her basamak farklı bir Sinerji planı açar.
Güiza'nın 15k'da daha düşük ratingli olması bilinçlidir: riskli fakat farklı bir
build aracıdır. Burak 25k'nın gerçek ustalık ödülüdür.

### Bağımsız hedefler

| Açma Koşulu | Ödül | Tür | Neden anlamlı |
|---|---|---|---|
| Run boyunca bir Oyuncu Kartını 5 trait'e ulaştır | **Efsane Dokunuşu** | Olay | Özel Antrenman planını sonraki Runlarda hızlandırır |
| Aynı anda Kadroda 7 YERLİ bulundur | **Mahallenin Kaptanı** (87 OS) | Oyuncu | YERLİ KADRO ve TAKIM RUHU köprüsü kurar |
| Tek bir oyuncuyla bir Run'da 10 gol at | **Ceza Sahası Ustası** (89 SF) | Oyuncu | Gol odaklı planı tematik biçimde ödüllendirir |
| İlk 5 Roundda en az 2 mağlubiyet alıp Finaleye ulaş | **Geri Dönüşçü** (88 DOS) | Oyuncu | SAVAŞÇI/LİDER/DAYANIKLI ile kriz build'i sunar |
| Bir Run'da 5 farklı Sinerjiyi etkinleştir | **Hedefli Scout** | Mekanik | Serbest Modda Run başına bir kez sinerjiye uyan teklif üretir |
| Bir Run'da 100 morale ulaş | **Soyunma Odası Yemini** | Olay | Moral build'ine yeni karar verir |
| Kadro ilk kez 5 kişiye düştükten sonra, yeniden 4'e düşmeden 3 maç kazan | **Kriz Kontratı** | Mekanik | Gelecek Serbest Runlarda 5 kişiye ilk düşüşte +1 yenileme ve sonraki teklifte 78+ toparlanma kartı verir |

“Geri Dönüşçü: SAVAŞÇI · LİDER · DAYANIKLI” Efsane Dokunuşu Olayının verdiği
trait listesi değildir. Bu üç trait, açılan **Geri Dönüşçü Oyuncu Kartının**
kendi sabit profilidir.

## Ödül davranışları

### Efsane Dokunuşu

- A seçimi: en az bir uyumlu boş trait slotu olan oyuncular arasından
  deterministik hedef seçer ve kapasitesi kadar, en fazla 3 uyumlu pozitif trait
  ekler.
- Trait üst sınırı 5'tir; çelişen veya tekrar eden trait eklenmez.
- Hiç uygun hedef yoksa seçim boşa gitmez: +140 skor verir.
- B seçimi: Kadroyu değiştirmeden +140 skor verir.
- `roundHistory.pointsEarned`, gerçek skor değişimini birebir taşır.

### Soyunma Odası Yemini

- A seçimi: KAPİTAN trait'ini alabilecek en yüksek ratingli oyuncuya trait verir
  ve +15 moral sağlar. Uygun oyuncu yoksa +80 telafi skoru verir.
- B seçimi: +180 skor, -8 moral.

### Hedefli Scout

- Yalnız Serbest Modda ve normal oyuncu teklifinde görünür.
- Run başına bir kullanım hakkı vardır; mevcut üç teklifi ücretsiz yeniler.
- En az bir yeni teklif, mevcut İlk 11'in etkin olmayan fakat erişilebilir
  Sinerjilerinden birine en yüksek ilerlemeyi sağlayan Oyuncu Kartıdır.
- Kadrodaki veya yan tekliflerdekiler tekrar gelemez; kaleci garanti kuralı
  korunur. Eşit adaylar seed ile deterministik çözülür.
- Uygun ilerleme adayı yoksa normal güçlendirilmiş reroll'a düşer ve kullanım
  yine tüketilir; UI bunu seçimden önce açıklar.

### Kriz Kontratı

- Yalnız Serbest Modda aktiftir ve Run başına bir kez tetiklenir.
- Kadro bir maç mağlubiyeti sonunda ilk kez 5 kişiye düştüğünde +1 yenileme
  hakkı verir (global üst sınırı aşmaz).
- Takip eden ilk normal oyuncu teklifinde en az bir 78+ ve POTANSİYEL, MENTOR,
  LİDER, KAPİTAN veya DAYANIKLI trait'lerinden birini taşıyan uygun kart sunar.
- Bu garanti mevcut kaleci garantisiyle çakışırsa önce eksik kaleci korunur;
  toparlanma kartı ikinci slota yerleşir.

## Ayın Efsanesi

1. İstanbul takvimine göre önceki ay aralığı hesaplanır.
2. Yalnız Edge Function üzerinden yazılmış leaderboard kayıtları arasından her
   Menajerin en iyi skoru alınır ve en yüksek doğrulanmış kayıt seçilir.
3. Görünen ad NFC normalize edilir; kontrol karakterleri ve izin verilmeyen
   işaretler kaldırılır, 18 karaktere kesilir. Uygunsuz/boş ad
   **Ayın Şampiyonu** fallback'ine döner.
4. Kart id'si `monthly_legend_YYYY-MM`, profil seed'i `ay + player_id` olur.
   Rating 89'dur; mevki ve üç uyumlu pozitif trait deterministik seçilir.
5. Kart yalnız takip eden ay boyunca iki modun standart havuzuna eklenir.
6. Ağ yoksa son doğrulanmış aynı-ay cache kullanılır. Cache yoksa kart havuza
   eklenmez; günlük determinism cihazdan cihaza değişmesin diye yarım/farklı kart
   üretilmez.
7. Menü ve Koleksiyon kartın hangi ayın şampiyonundan geldiğini gösterir.

## Fazlar ve commit sınırları

### Faz 0 — Oyun denetimi ve ortak dil (tamamlandı)

- Gerçek Run/Round akışı, skor, kadro, trait, Sinerji, mod ve sunucu davranışı
  incelendi.
- 400'er Runlık iki QA stratejisiyle skor erişilebilirliği ölçüldü.
- `CONTEXT.md` ve `docs/UNLOCK_SYSTEM_AUDIT.md` oluşturuldu.

Kabul: 260 test, 400 Run QA ve production build yeşil.

### Faz 1 — Tasarım sözleşmesi (bu belge)

- Katalog, sıralı skor zinciri, garanti kuyruğu, mekanikler ve Ayın Efsanesi
  sözleşmesi dondurulur.
- Her koşulun kesin ölçüm anı ve fallback'i yazılır.

Kabul: Belgede yoruma açık “tamamla”, “sat”, “garanti” veya mod adı kalmaz.

### Faz 2 — Kadro değişimi sinerji düzeltmesi

- Transfer Değişimi paneli yalnız ayrılan oyuncunun Sinerjiler üzerindeki negatif
  etkisini gösterir.
- Gelen oyuncunun açtığı/ilerlettiği Sinerjiler “ayrılık etkisi” kutusuna girmez.
- Regresyon testi Yılmazcan benzeri bir giden/gelen senaryoyu doğrular.

Kabul: Component testi, tam test, QA ve build yeşil; görsel metin doğru.

### Faz 3 — Unlock çekirdeği ve telemetri

- Sürüm 5 kayıt şeması: katalog sürümü, istatistikler, açılan id'ler, garanti
  kuyruğu, aktif Run garantisi ve mekanik kullanım durumu.
- Run telemetrisi: maksimum trait/YERLİ, oyuncu başı goller, farklı Sinerjiler,
  maksimum moral, ilk 5 mağlubiyetleri, 5 kişilik Kadro sonrası galibiyetler.
- Skor zincirinde Run başına yalnız bir sonraki basamak.
- Tüm Run Sonu yolları tek, idempotent finalize Interface'ini çağırır.
- Unlock kaydı leaderboard doğrulamasından ayrılır.

Kabul: koşul, sıra, idempotency, Erken Bitiş, Finale, migration, bozuk kayıt ve
resume testleri yeşil.

### Faz 4 — İçerik, garanti kuyruğu ve mekanikler

- Beş skor oyuncusu ile üç özel oyuncu katalog/pool'a bağlanır.
- İki Olay gerçek etkileri ve doğrulama geçmişiyle bağlanır.
- Oyuncu/Olay İlk Run Garantisi FIFO ve resume güvenli uygulanır.
- Hedefli Scout ve Kriz Kontratı gerçek store aksiyonları ve UI kontrolüyle
  uygulanır.

Kabul: Günlük havuz byte-for-byte kişisel kayıttan bağımsız; Serbest havuz,
garanti tüketimi, eşit sonraki şans, duplicate ve kaleci invariant testleri
yeşil.

### Faz 5 — Oyuncuya görünür ilerleme

- Koleksiyona **Kilitli İçerik** sekmesi, ilerleme barı, ödül türü ve kesin koşul
  metni eklenir.
- Run Sonunda açılan ödül kartları, bekleyen garanti ve en yakın üç hedef
  gösterilir.
- Ana Menüde en yakın üç hedef ve Serbest Modda aktif mekanikler gösterilir.
- Kilitli efsaneler koleksiyon sayısını yanlış tamamlanmış göstermez.

Kabul: yeni kayıtta, kısmi ilerlemede, çoklu unlock'ta ve tümü açık durumda UI
component testleri ve klavye erişilebilirliği yeşil.

### Faz 6 — Ayın Efsanesi ve mod entegrasyonu

- Önceki ay şampiyonu sorgusu, ad temizleme, deterministik profil ve cache.
- Main Menu/Koleksiyon sunumu ve iki modun ortak havuz entegrasyonu.
- Ay değişimi, yıl değişimi, beraber skor, ağ yokluğu ve uygunsuz isim testleri.

Kabul: aynı ay/veri her cihazda aynı kartı üretir; kişisel unlock Günlük Seed'e
sızmaz; aylık global kart iki modda eşittir.

### Faz 7 — Son regresyon ve denge kapısı

- Tam test, production build, en az 1.000 Run rating + 1.000 Run Sinerji QA.
- Unlock koşulu erişim raporu ve skor dağılımı.
- Localhost desktop ve 390×844 mobil akış: yeni kayıt → ilerleme → unlock →
  sonraki Run garantisi → normal havuza dönüş.
- Save v1/v4/v5 fixture migration, offline resume ve Run terk etme senaryoları.
- README/GDD sayıları ve QA checklist güncellenir.

Kabul: test/build/QA hatası, console exception, kayıp garanti, Günlük Seed farkı
ve doğrulama toplamı uyuşmazlığı yoktur.

## Özellikle dikkat edilecek hata kapıları

- `persistRunEndScore` async tamamlanmadan “Bir Daha” basılması yeni unlock
  bildirimini kaybetmemeli; finalize sonucu ayrı kalıcı bildirim kuyruğuna yazılır.
- Olay Roundunda önce Olay sonra kart/maç vardır. Olay garantisi Roundu tüketmez
  veya ikinci olay üretmez.
- `currentRun` kaydında geçici 12 kişilik transfer taslağı saklanmaz; garanti
  edilen oyuncu seçimi iptal edilirse garanti “görüldü” sayılır ama açılmış
  içerik kaybolmaz.
- Günlük meydan okuma linki bugünün seed'i değilse Serbest Mod sayılır; kişisel
  içerik davranışı buna göre uygulanır.
- Ayın Efsanesi oyuncu adı kart id'si olarak kullanılmaz; Unicode ve duplicate
  sorunları ay anahtarlı id ile çözülür.
- Toplam skor ile `roundHistory` toplamı Olay fallback puanları dahil eşit kalır.
- Hedefli Scout Kadrodaki oyuncuyu, yan teklifi veya ikinci kaleciyi üretmez.

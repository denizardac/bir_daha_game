# BİR DAHA — Oyun Tasarım Dokümanı (GDD)
**Versiyon:** 1.0  
**Tarih:** Haziran 2026  
**Tür:** Futbol Roguelite / Draft Strategy  
**Platform:** Web (önce), Mobil (sonra)

---

## İÇİNDEKİLER

1. [Vizyon & Felsefe](#1-vizyon--felsefe)
2. [Hedef Kitle & Referanslar](#2-hedef-kitle--referanslar)
3. [Core Game Loop](#3-core-game-loop)
4. [Başlangıç Durumu](#4-başlangıç-durumu)
5. [Kart Sistemi](#5-kart-sistemi)
6. [Maç Simülasyonu](#6-maç-simülasyonu)
7. [Sinerji Sistemi](#7-sinerji-sistemi)
8. [İlerleme & Zorluk Skalası](#8-i̇lerleme--zorluk-skalası)
9. [Kayıp Mekaniği](#9-kayıp-mekaniği)
10. [Puanlama Sistemi](#10-puanlama-sistemi)
11. [Run Sonu — Ego Sistemi](#11-run-sonu--ego-sistemi)
12. [Leaderboard & Seed Sistemi](#12-leaderboard--seed-sistemi)
13. [UI/UX Tasarımı](#13-uiux-tasarımı)
14. [Ses Tasarımı](#14-ses-tasarımı)
15. [Oyuncu Psikolojisi & Retention](#15-oyuncu-psikolojisi--retention)
16. [Tutorial & Onboarding](#16-tutorial--onboarding)
17. [Anti-Frustration Mekanikleri](#17-anti-frustration-mekanikleri)
18. [Teknik Mimari](#18-teknik-mimari)
19. [İçerik Veritabanı Yapısı](#19-i̇çerik-veritabanı-yapısı)
20. [Geliştirme Yol Haritası](#20-geliştirme-yol-haritası)
21. [Açık Sorular & Gelecek Kararlar](#21-açık-sorular--gelecek-kararlar)

---

## 1. VİZYON & FELSEFE

### 1.1 Temel Hedef
"Bir Daha", oyuncuya şunu hissettirmelidir:
> *"Bu hamleyi benden başkası yapmazdı."*

Oyun şans üzerine kurulu gibi görünse de her karar önemlidir. Rastgele gelen kartları doğru okumak, rakibinden önce sinerji bulmak, olay kartlarında doğru riski almak — bunların hepsi **zekânın** ürünü hissi vermelidir. Oyuncu kazandığında şansını değil, kendini kutlamalıdır.

### 1.2 Üç Temel Duygu
| Duygu | Nasıl Yaratılır |
|-------|----------------|
| **Zekan yetti** | Aynı seedde başkası daha düşük skor yaptı |
| **Az kaldı, bir daha** | Run özeti tam nerede hata yaptığını gösteriyor |
| **Bunu keşfettim** | Sinerji ilk aktive olduğunda büyük efekt + animasyon |

### 1.3 Tasarım İlkeleri
- **Hız**: Bir run 5-8 dakikada bitmeli. 10'u geçmemeli.
- **Basitlik**: Her kart ilk bakışta anlaşılmalı. Tooltip gerekmemeli.
- **Derinlik saklanır**: Sinerjiler oyuna yazılmaz, keşfedilir.
- **Her karar önemli hissettirmeli**: "Önemsiz" round olmamalı.
- **Yenilgi öğretici olmalı**: "Ah, o yüzden!" anı yaratmalı.

---

## 2. HEDEF KİTLE & REFERANSLAR

### 2.1 Hedef Kitle
**Birincil:** 18-35 yaş, futbolu takip eden, mobil oyun oynayan erkekler  
**İkincil:** Slay the Spire, Balatro gibi roguelite oyuncuları  
**Üçüncül:** Fantasy football oynayan kulüp.

**Persona Örneği:**  
Ahmet, 24 yaşında. Sabah ulaşımda telefona bakıyor, akşam futbol maçı izliyor. Çok derin strateji oyunlarına zamanı yok ama sıradan bir idle game de ilgisini çekmiyor. 5 dakikada "iyi bir şey" yapmak istiyor.

### 2.2 Referans Oyunlar
| Oyun | Alınan İlham |
|------|-------------|
| **Balatro** | Kart sinerji sistemi, "bir daha" ritmi, run özeti |
| **Slay the Spire** | Her kararın kalıcı etkisi, zorluk tırmanması |
| **Wordle** | Günlük seed, herkesin aynı puzzle'ı çözmesi, sosyal karşılaştırma |
| **FUT Draft** | Hızlı kadro kurma, oyuncu kartı hissi |
| **38-0** | Referans oyun — ne alınır, ne bırakılır |
| **Rocket League (ranking)** | "Bir maç daha" döngüsünün psikolojisi |

### 2.3 38-0'dan Farkımız
| 38-0 | Bir Daha |
|------|----------|
| Kadroyu bir kere kurarsın | Her round karar alırsın |
| 38 maçlık sezon uzun | 5-8 dakika, tek seans |
| Sonuç deterministik hisseder | Her run farklı |
| Sinerji yok | Sinerjiler oyunun özü |
| Run özeti yok | Ego sistemi var |

---

## 3. CORE GAME LOOP

### 3.1 Makro Döngü (Bir Run)
```
BAŞLANGIÇ
   │
   ▼
[7 zayıf oyuncuyla başla]
   │
   ▼
┌─────────────────────────────┐
│         ROUND DÖNGÜSÜ       │◄──────────────┐
│                             │               │
│  3 kart göster (20 sn)      │               │
│         │                   │               │
│         ▼                   │               │
│  Oyuncu 1 kartı seçer       │               │
│         │                   │               │
│         ▼                   │               │
│  Maç otomatik oynanır       │               │
│  (8-10 sn animasyon)        │               │
│         │                   │               │
│    ┌────┴────┐               │               │
│  GALİP    MAGLUPp            │               │
│    │          │              │               │
│  Puan+     Oyuncu           │               │
│  Havuz      gidir           │               │
│  iyileşir     │             │               │
│               ▼             │               │
│          [Kadron 4'e        │               │
│           düştü mü?]        │               │
│           Evet→BITER        │               │
│           Hayır→────────────┘               │
└─────────────────────────────┘               │
         │ (Her 5 roundda)                     │
         ▼                                     │
    [OLAY KARTI]──── karar ver ───────────────┘
         
         │ (Round 15 tamamlandıysa)
         ▼
    [RUN SONU]
    Skor + Özet + Leaderboard
```

### 3.2 Mikro Döngü (Tek Round)
```
3 kart açılır
      │
      ├── Kart 1: Oyuncu (rating 82, [HIZLI][POTANSİYEL])
      ├── Kart 2: Taktik  (4-3-3 → Kontr Formasyonu)
      └── Kart 3: Oyuncu (rating 74, [MENTOR][YERLİ])
      
Oyuncu 1'ini seçer → Kart kadrosuna girer
      │
Maç animasyonu (rakip görünür, skor oluşur, gol anları flash geçer)
      │
Sonuç gösterilir:
  • Skor: 2-1 GALİP
  • Öne çıkan: "HIZLI sinerji aktif, +120 bonus puan"
  • Round puanı: +340
```

### 3.3 Zaman Çizelgesi (Hedef)
| Aşama | Süre |
|-------|------|
| Kart seçimi (×15 round) | ~3.5 dk |
| Maç animasyonları (×15) | ~2 dk |
| Olay kartları (×3) | ~1 dk |
| Run sonu ekranı | ~1 dk |
| **TOPLAM** | **~7.5 dk** |

---

## 4. BAŞLANGIÇ DURUMU

### 4.1 İlk Kadro
Oyuncu 7 oyuncuyla başlar, 11 slotu vardır. Başlangıç kadrosu **her zaman aynı** görünse de oyuncuların özellikleri hafif random olabilir (seed'e bağlı):

```
KL  — Rating: 62, [TECRÜBE] yok, özellik yok
STP — Rating: 61, [GENİŞ]
STP — Rating: 60, özellik yok
STP — Rating: 63, [KAPTANLIK -1] (zayıf lider)
OS  — Rating: 62, özellik yok
DOS — Rating: 61, özellik yok
SLK — Rating: 60, özellik yok
```

4 slot boş → Bu boş slotlar aktif zayıflık. Rakip güçlü gelirse o bölgeden sızıyor.

### 4.2 Başlangıç Kaynakları
- **Moral:** 50/100 (orta — hepsi yabancı, kimse birbirini tanımıyor)
- **Bütçe:** Yok (bütçe sistemi V2'de)
- **Seri:** 0 (kazanılan arka arkaya maç sayısı)
- **Aktif Sinerji:** Yok

### 4.3 İlk Round Garantisi
İlk round'da gelen 3 kart daima oynanabilir ve temel seviyededir. "Kahretsin, ilk roundda çöp kart geldi" deneyimi yasaktır. Bu anti-frustration için kritik.

---

## 5. KART SİSTEMİ

### 5.1 Kart Tipleri Genel Bakış
| Tip | Sıklık | Etki |
|-----|--------|------|
| Oyuncu Kartı | %70 | Kadroya oyuncu ekle / güçlendir |
| Taktik Kartı | %20 | Sistem veya formasyon değiştir |
| Olay Kartı | %10 (her 3-4 roundda zorla) | Risk/ödül kararı |

---

### 5.2 Oyuncu Kartları

#### Kart Anatomisi
```
┌────────────────────────────────┐
│  [RARELİK] ████████████        │
│                                │
│  OYUNCU ADI                    │
│  Rating: 84        [MEVKİ]     │
│                                │
│  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │ İKON │  │ İKON │  │ İKON │ │
│  │ TAG1 │  │ TAG2 │  │ TAG3 │ │
│  └──────┘  └──────┘  └──────┘ │
│                                │
│  ⚠️  [UYARI varsa burada]      │
└────────────────────────────────┘
```

#### Oyuncu Rarity Sistemi
| Rarity | Rating Aralığı | Renk | Olasılık (erken) | Olasılık (geç) |
|--------|---------------|------|-----------------|----------------|
| Normal | 60–69 | Gri | %55 | %20 |
| İyi | 70–79 | Beyaz | %30 | %35 |
| Güçlü | 80–86 | Sarı | %12 | %30 |
| Efsane | 87–92 | Kırmızı | %3 | %15 |

> **Not:** Rarity havuzu round ilerledikçe kayar. 10. rounddan sonra "Normal" kart nadiren çıkar.

---

#### Oyuncu Tag Listesi (Tüm Taglar)

**Fiziksel Taglar:**
| Tag | İkon | Etki |
|-----|------|------|
| HIZLI | ⚡ | Sprint durumunda gol ihtimali +15% |
| GÜÇLÜ | 💪 | İkili mücadele kazanma +20% |
| DAYANIKLI | 🛡️ | 15. rounddan önce yorgunluk yok |
| KISA | ↕️ | Kafa golü ihtimali -20%, top kontrolü +10% |
| UZUN | ↕️ | Kafa golü +25%, sprint -5% |

**Teknik Taglar:**
| Tag | İkon | Etki |
|-----|------|------|
| TEKNİK | 🎯 | Pas isabeti +15% |
| FİNİŞÖR | ⚽ | Gol dönüşüm oranı +20% |
| ASİSTÇİ | 🤝 | Yanındaki oyuncuların gol ihtimali +10% |
| SERBEST VURUŞ | 🥅 | Serbest vuruşlarda +30% |
| PENALTI | 🎯 | Penaltı dönüşümü %85 (normal %60) |

**Karakter Tagları:**
| Tag | İkon | Etki |
|-----|------|------|
| LİDER | 👑 | Takım morali +10 pasif |
| MENTOR | 📚 | Yanındaki [POTANSİYEL] oyuncuların her maç rating +2 |
| KAPİTAN | 🎖️ | [LİDER]'den güçlü, moral +15, geriden gol yeme ihtimali -10% |
| SAVAŞÇI | ⚔️ | Geride olunca performans artar |
| SOĞUKKANLILI | 🧊 | Baskı altında pas/şut isabeti düşmez |

**Sosyal Taglar:**
| Tag | İkon | Etki |
|-----|------|------|
| YERLİ | 🏠 | 7+ yerli olunca bonus aktif (EV SAHİBİ sinerjisi) |
| YABANCI YILDIZ | 🌍 | Pasif +5 puan/maç, ama moral katkısı yok |
| SOYUNMA ODASI | 🎤 | Tüm takımın moralini +5 pasif |
| TARTIŞMALI | 💥 | Çok güçlü ama olay kartlarında negatif seçenek olarak çıkabilir |

**Gelişim Tagları:**
| Tag | İkon | Etki |
|-----|------|------|
| POTANSİYEL | 📈 | Her maç rating +1 (tavan: mevcut rating +15) |
| PİK DÖNEM | ⭐ | Rating sabit ama şu an mükemmel |
| GERİLEYEN | 📉 | Her 3 maç rating -1, ama düşük fiyat |
| YENİ SEZON | 🌱 | İlk 3 roundda zayıf, sonra [POTANSİYEL] gibi davranır |

**Risk Tagları:**
| Tag | İkon | Etki |
|-----|------|------|
| SAKATLIK RİSKİ | 🤕 | %25 ihtimalle 2 maç oynamaz |
| KIRMIZI KART | 🟥 | %15 ihtimalle maçtan atılır |
| PERFORMANS DÜŞÜŞÜ | 📊 | 3 maç üst üste oynayınca rating geçici -5 |

---

### 5.3 Taktik Kartları

Taktik kartları kadrona oyuncu değil, **sistem** ekler. Etkisi o andan itibaren tüm maçlarda geçerlidir.

#### Formasyon Kartları
| Kart Adı | Etki |
|----------|------|
| 4-3-3 Kontr | Savunma +15, hızlı oyuncular için +20 |
| 4-4-2 Klasik | Dengeli, hiçbir tarafta bonus yok ama ceza da yok |
| 3-5-2 Baskı | Hücum +20, savunma -15 |
| 5-3-2 Kale | Savunma +30, gol ihtimali -25 |
| 4-2-3-1 Modern | [TEKNİK] oyuncular için +15 bonus |

#### Sistem Kartları
| Kart Adı | Etki |
|----------|------|
| Yüksek Blok | Gol yeme -20%, ama [DAYANIKLI] olmayan oyuncular yoruluyor |
| Topla Oyn | [TEKNİK] tag sayısı ×8 puan/maç ekstra |
| Direkt Oyun | [HIZLI] tag ×10 puan/maç ekstra |
| Rotasyon | [PERFORMANS DÜŞÜŞÜ] tagı devre dışı kalır |
| Tekli Forvet | Tek forveti [FİNİŞÖR] ise +30%, değilse -15% |

---

### 5.4 Olay Kartları

Her 3-4 roundda bir zorla gelir. Oyuncuya bir durum sunulur ve iki seçenek verilir. **Doğru cevap yok** — kadronun durumuna göre değişir.

#### Olay Kartı Şablonu
```
┌──────────────────────────────────────────────────┐
│  ⚡ TRANSFER TEKLİFİ                              │
│                                                   │
│  [RAKIP TAKIM] Ahmet Çelik'i istiyor.            │
│  Teklif: 3 "yeni oyuncu çek" hakkı               │
│                                                   │
│  ┌─────────────────────┐ ┌─────────────────────┐ │
│  │    SAT              │ │    REDDET           │ │
│  │  3 çek hakkı kazan │ │  Moral +15          │ │
│  │  Kadro -1 oyuncu   │ │  Takım bütünlüğü    │ │
│  └─────────────────────┘ └─────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### Olay Kartı Kategorileri & Örnekler

**Transfer / Kadro Olayları:**
- "Rakip kulüp yıldızını istiyor" → Sat (çek hakkı) / Reddet (moral +15)
- "Genç yetenek takıma katılmak istiyor" → Al (slot dolar, [POTANSİYEL] tag) / Reddet (puan bonus)
- "İki oyuncu arasında kavga" → Birini sat / İkisini oynatamazsın (2 maç)

**Teknik / Taktik Olaylar:**
- "Rakip formasyon oynadığın sistemi yiyor" → Formasyon değiştir (hazırlıksız, -10 tur) / Devam et (risk)
- "Hakem saha koşulları kötü dedi" → Doğrudan oyun (kötü sahada iyi) / Teknik oyun (iyi sahada iyi)

**Moral / Soyunma Odası Olayları:**
- "Kaptan liderliği sorguluyor" → Onu oynata (risk yüksek, ödül büyük) / Dinlendir (moral +10)
- "Basın takımı eleştiriyor" → Sessiz kal (sadece oyun puanı sayılır) / Cevap ver (moral +20 ama [TARTIŞMALI] tetiklenebilir)
- "Taraftar takımı baskı altında" → Hücuma ağırlık ver (risk yüksek) / Savunmada dayan

**Fiziksel Olaylar:**
- "Yıldız oyuncu sakatlandı" → Yedekle oyna / Zorunlu değişiklik (slot açılır, yeni kart çek)
- "Aşırı yorgunluk — 3 oyuncu etkilendi" → Rotasyon yap (-rating) / Riske gir (maç kaybı riski +30%)

**Özel / Komik Olaylar** (bağımlılık için):
- "Maç öncesi yemek zehirlenmesi — 2 oyuncu etkilendi" → Kimle devam?
- "Soyunma odasına efsane eski oyuncu konuşmaya geldi" → Moral +30 (bir seferlik dev bonus)
- "VAR sistemi arızalı" → Önceki 2 maçın bir golü iptal edildi (negatif) VEYA rakibin golü iptal (pozitif) — rastgele!

---

## 6. MAÇ SİMÜLASYONU

### 6.1 Temel Algoritma
Maç deterministik ama **seed'e bağlı** rastgelelik içerir. Aynı kadroyla aynı rakibe karşı her seferinde aynı sonuç çıkmaz, ama güçlü kadro çok daha yüksek olasılıkla kazanır.

```
MAÇ PUANI = (Kadro Gücü × Sistem Bonusu × Moral Katsayısı × Sinerji Bonusu)
             -
             (Rakip Gücü × Rakip Katsayısı)
             +
             Seed Varyasyonu (-15% ile +15% arası)
```

### 6.2 Kadro Gücü Hesabı
```
Kadro Gücü = (11 oyuncunun rating ortalaması)
             × (Dolu slot oranı: 11/11 = 1.0, 7/11 = 0.636)
             × (Yorgunluk katsayısı: tam dinlenik=1.0, yorgun=0.85)
             × (Moral katsayısı: 100 moral = 1.15, 0 moral = 0.75)
```

### 6.3 Gol Üretimi
```
Gol Sayısı = Baz Gol İhtimali × Bireysel Finisör Katsayısı × Oynayan Sinerji Bonusu

Baz Gol İhtimali:
  Her maç 0-5 gol arası. Ağırlıklı dağılım:
  • 0 gol: %15
  • 1 gol: %30
  • 2 gol: %30
  • 3 gol: %15
  • 4+ gol: %10

Yenilen Gol = Rakip'in aynı sistemi çalıştırması
```

### 6.4 Öne Çıkan Anlar (Maç Animasyonu)
Her maç sonunda 1-3 "flash an" gösterilir. Bunlar sadece görseldir ama **hangi sinerjinin aktive olduğunu** gösterir:

```
⚡ KONTR BATIŞ — [HIZLI] ×2 sinerji devrede — +80 puan
🎯 MÜKEMMEL FİNİŞ — [FİNİŞÖR] + [ASİSTÇİ] kombinasyonu — +120 puan
🛡️ TEMİZ SAYFA — 0 gol yendi — +50 bonus
```

Bu anlar oyuncuya "bak, kararın işe yaradı" hissini verir.

### 6.5 Rakip Sistem
Rakipler gerçek oyuncular değil, **prosedürel üretilmiş profiller:**

```javascript
// Rakip Yapısı
{
  name: string,           // "FC Demir", "Galaksi Spor" gibi jeneratif
  rating: number,         // Round'a göre artan (bkz. İlerleme bölümü)
  style: enum,            // "saldırgan" | "dengeli" | "savunmacı"
  weakness: tag[],        // Bu taglara karşı zayıf
  strength: tag[]         // Bu taglara karşı güçlü
}
```

Rakip **stil bilgisi** karta yazılı gösterilir ama **weakness/strength gizlidir.** Deneyimli oyuncu zamanla hangi stil hangi oluşuma karşı zayıf olduğunu öğrenir.

---

## 7. SİNERJİ SİSTEMİ

### 7.1 Felsefe
Sinerjiler oyuna **yazılmaz.** Oyuncu ikon kombinasyonlarını görür. İlk kez çalıştığında büyük bir efektle gösterilir ve o andan itibaren "kart üzerinde aktif" olarak işaretlenir.

### 7.2 Sinerji Aktive Animasyonu
```
[Sinerji İlk Aktive Olduğunda]

Ekran hafif parlıyor
"★ YENİ SİNERJİ KEŞFEDİLDİ" yazısı çıkıyor
Sinerji adı + efekt gösteriliyor (3 saniye)
Sonra maç devam ediyor

[Sonraki aktive olduşlarda]
Sadece küçük ikon yanıyor, ses efekti var ama ekran kesmez
```

### 7.3 Tüm Sinerjiler

#### Hızlı Oyun Sinerjileri
| Sinerji Adı | Koşul | Efekt |
|-------------|-------|-------|
| **KONTR ATILIK** | [HIZLI] tag × 3+ | Gol başına +80 puan |
| **RÜZGAR GİBİ** | [HIZLI] × 5+ | Kontr + rakip savunma -20% |
| **KANATLARIN GÜCÜ** | SLK + SÖK her ikisi de [HIZLI] | Kanatlarda gol ihtimali ×1.5 |

#### Teknik Oyun Sinerjileri
| Sinerji Adı | Koşul | Efekt |
|-------------|-------|-------|
| **TOPA SAHIP OL** | [TEKNİK] × 4+ | Rakip topla oynuyor olsa bile top possession bonus +10 puan/dakika |
| **MİSTER ASIST** | [ASİSTÇİ] × 2+ | Her asist +50 ekstra puan |
| **DURAN TOP USTASI** | [SERBEST VURUŞ] + [PENALTI] aynı kadroda | Duran topa özel round çıkabilir: penaltı/serbest vuruş modu |

#### Karakter Sinerjileri
| Sinerji Adı | Koşul | Efekt |
|-------------|-------|-------|
| **AKADEMİ** | [MENTOR] + [POTANSİYEL] aynı kadroda | [POTANSİYEL] oyuncuların gelişimi ×2 |
| **KAPİTAN MODU** | [LİDER] + Moral ≥ 80 | Her galibiyet +150 ekstra puan |
| **EFSANEVİ SOYUNMA ODASI** | [KAPİTAN] + [SOYUNMA ODASI] + [MENTOR] hepsi kadroda | Moral düşemez, minimum 70 sabittir |

#### Kimlik Sinerjileri
| Sinerji Adı | Koşul | Efekt |
|-------------|-------|-------|
| **EV SAHİBİ** | [YERLİ] × 7+ | Her maçta moral +20, her galibiyette ekstra +100 puan |
| **SÜPER YABANCI** | [YABANCI YILDIZ] × 3+ ve hiç [YERLİ] yok | Rating katkısı ×1.2, ama olay kartı "dil bariyeri" tetiklenebilir |
| **KARMA GÜÇ** | 4 [YERLİ] + 4 [YABANCI YILDIZ] tam dengede | İkisinin bonusu yarı yarıya, ama penalty puanı yok |

#### Pozisyon Sinerjileri
| Sinerji Adı | Koşul | Efekt |
|-------------|-------|-------|
| **TEMİZ SAYFA** | KL rating ≥ 82 + 3 STP kadroda | Gol yeme ihtimali -30% |
| **ÜÇ BOYUTLU HÜCUM** | SF + SLK + SÖK hepsi [FİNİŞÖR] | Gol skoru ×1.3 |
| **SAĞLAM ORTA** | DOS + OOS her ikisi [TEKNİK] veya [GÜÇLÜ] | Orta sahadan gol yeme yok |

#### Özel / Gizli Sinerjiler (Ultra Rare)
| Sinerji Adı | Koşul | Efekt |
|-------------|-------|-------|
| **TANRI MODU** | [KAPİTAN] + [FİNİŞÖR] + [SERBEST VURUŞ] + Moral 100 | Tek seferlik: o maç kesin galibiyet + ×3 puan |
| **FIRTINA** | 5 [HIZLI] + [TEKNİK] × 3 + [ASİSTÇİ] | Rakip stili ne olursa olsun zayıflık yok |
| **EFSANELERİN TAKIMI** | 4+ [Efsane] rarity kart | Moral hiç düşmez, her galibiyet +200 |

### 7.4 Sinerji Önizleme Sistemi
Kart seçme ekranında, eğer seçilmek üzere olan kart mevcut bir sinerjiye katkı sağlayacaksa:

```
[Kart görünür, sol alt köşede]
"⚡ KONTR ATILIĞI tamamlıyor (2/3)"
```

Bu bilgi **görünür** çünkü oyuncu zaten 2 [HIZLI] oyuncuya sahip — gizleme gerekmiyor. Ama henüz sinerji ismi öğrenilmediyse sadece ikon gösterilir, metin yok.

---

## 8. İLERLEME & ZORLUK SKALASI

### 8.1 Round Başına Rakip Rating
```
Round 1-3:  Rakip rating 55-62 (Yeni başlayan kadroya karşı kazanılabilir)
Round 4-6:  Rakip rating 63-70
Round 7-9:  Rakip rating 71-78
Round 10-12: Rakip rating 79-85
Round 13-15: Rakip rating 83-90 (Efsane kadro gerektirir)
```

### 8.2 Kart Havuzu Evrimi
```
Round 1-4:   %70 Normal, %28 İyi, %2 Güçlü
Round 5-8:   %30 Normal, %45 İyi, %22 Güçlü, %3 Efsane
Round 9-12:  %10 Normal, %30 İyi, %40 Güçlü, %20 Efsane
Round 13-15: %0 Normal, %15 İyi, %45 Güçlü, %40 Efsane
```

### 8.3 Milestone Bonuslar (Ara Ödüller)
| Milestone | Koşul | Ödül |
|-----------|-------|------|
| **İLK GALİBİYET** | Round 1 kazanıldı | +200 puan bonus, moral +10 |
| **ŞERIT** | 3 üst üste galibiyet | "Seri Bonusu" aktive: her maç +5% puan |
| **ÇİFT HANELİ** | Round 10'a ulaşıldı | Ekstra kart çek hakkı (1 seferlik) |
| **DAYANMA** | 15 round tamamlandı | "SÜPER RUN" etiketi |
| **KAYIPSIZ** | 15 roundu hiç oyuncu kaybetmeden bitir | "NAMAĞLUP" unvanı (leaderboard'da görünür) |

### 8.4 Zor Anlara Hazırlık
Round 7 ve Round 12 kasıtlı olarak en zor iki nokta tasarlanır. Bu anlarda:
- Rakip rating zıplar
- Kart havuzunda zayıf kart çıkma ihtimali artır (bir "dip" veriyoruz)
- Olay kartı zorlu bir seçenek sunabilir

Bu tasarımlı zorluklar "oyun zaten bitiyordu" değil, "o kriz roundunu aştım" hissini yaratır.

---

## 9. KAYIP MEKANİĞİ

### 9.1 Maç Kaybedilince Ne Olur?
```
KAYIP SONRASI EKRAN
│
├── Kadrodaki en düşük rating oyuncu otomatik ayrılır
│   [İSTİSNA: Eğer [SAVAŞÇI] tagı varsa o oyuncu 1 sefer korunur]
│
├── Moral -20 düşer
│
└── Bir sonraki roundda kart havuzuna "Acil Transfer" kartı girer
    (Daha düşük ratingli ama acil durum için işe yarar 1 oyuncu)
```

### 9.2 Kim Gider?
Ayrılan oyuncu **en düşük rating** değil, şu formülle belirlenir:
```
Ayrılma Skoru = Rating × (Tag Değeri) × Moral Katkısı

En düşük ayrılma skoru olan oyuncu gider.
```

Bu şu anlama geliyor: Düşük ratingli ama [MENTOR] olan bir oyuncu, yüksek ratingli ama [GERİLEYEN] oyuncudan önce ayrılmayabilir. Oyuncu bunu zamanla öğrenir.

### 9.3 Kritik Eşik (4 Oyuncu)
Kadron 4 oyuncuya düşünce oyun biter. Ama bu "ani ölüm" değil:
```
5 oyuncuda: "TEHLIKE MODU" göstergesi aktive
4 oyuncuda: Son round oynanır, ne olursa olsun biter
3 oyuncuda: Matematiksel olarak ulaşılamaz (5'te zaten biter)
```

"Tehlike Modu"nda moral maksimuma kilitlenir (+20 "sırtı duvara" etkisi) ama rating katkısı düşük kaldığından çok zor.

### 9.4 Recovery Kartı
Her kayıptan sonra kart havuzuna gizli bir "Recovery" kartı girer. Bu kart 3 round içinde gelir (garanti değil ama eğilimli). Recovery kartları:
- Küçük rating, ama yüksek [POTANSİYEL]
- Veya düşük rating ama [MENTOR] — hemen faydalı
- Veya bir Taktik kartı — oyuncu değil sistem değiştir, pozisyonu kapat

Bu mekanik "bir şans daha ver" hissini destekler ama garantilemez.

---

## 10. PUANLAMA SİSTEMİ

### 10.1 Temel Puan Kaynakları
```
GALİBİYET PUANI:
  • Rakip ratingine göre baz: (Rakip Rating - 50) × 10
  • Örnek: Rating 80 rakibi yendiysen: 30 × 10 = 300 baz puan

GOL PUANI:
  • Her gol: +50 puan
  • Her yenilen gol: -20 puan
  • Sıfır gol yeme (Clean Sheet): +100 bonus

SERİ BONUSU:
  • 2 üst üste galibiyet: +10%
  • 3 üst üste: +20%
  • 4+ üst üste: +35%
  (Yenilince sıfırlanır)

BERABERLIK:
  • Baz: Rakip rating × 2
  (Çok düşük — beraberlik kötü)

YENILGI:
  • Puan yok, oyuncu gider
```

### 10.2 Sinerji Bonusları (Puan Üstü)
Her aktif sinerji round puanına direkt eklenir:
```
KONTR ATILIĞI:  Her gole +80
KAPİTAN MODU:  Her galibiyete +150
AKADEMİ:       Her round +30 pasif (gelişim göstergesi)
EV SAHİBİ:     Her galibiyete +100
TANRI MODU:    Tek seferlik ×3 çarpan
```

### 10.3 Özel Puan Anları
```
"ŞOKCU" PUANI:    Rating 15+ fark olan rakibi yendiysen: +500 bonus
"SIFIRA DAYANMA": 4 oyuncuyla kazandıysan: +800 bonus
"MÜKEMMEL RUN":   Hiç kaybetmeden 15 round bittiyse: +2000 bonus
"KEŞİF BONUSU":   İlk kez sinerji aktive ettiysen (o run): +200
```

### 10.4 Zaman Bonusu (Opsiyonel — V2)
Kart seçiminde 20 saniye var. Kullanılmayan her saniye için +5 puan. Bu oyuncuyu hızlı düşünmeye teşvik eder ve "hızlı okudum, doğru seçtim" hissini katar.

---

## 11. RUN SONU — EGO SİSTEMİ

### 11.1 Run Sonu Ekran Akışı
```
1. SKOR EKRANI (2 sn otomatik, sonra tap ile devam)
   └── Toplam skor büyük ve animasyonlu gösterilir

2. SIRA BULMA (1 sn yükleme animasyonu)
   └── "Bugünkü oyuncuların %91'ini geçtin"

3. ÖZET EKRANI (ana ekran — tap ile kaydır)
   ├── En iyi kararın
   ├── En kritik hatan
   ├── Keşfettiğin sinerjiler
   └── Kadro son hali

4. PAYLAŞ KARTI (opsiyonel)
   └── Görsel kart üret

5. "BİR DAHA" BUTONU
```

### 11.2 En İyi Karar Analizi
```
┌──────────────────────────────────────────────────────┐
│  📊 EN İYİ KARARININ                                │
│                                                      │
│  Round 7: [POTANSİYEL] Isaac'ı aldın               │
│  → Bunu yalnızca %6 oyuncu yaptı                    │
│  → Sana toplam 3.200 puan kazandırdı                │
│  → AKADEMİ sinerjisini de aktive etti               │
└──────────────────────────────────────────────────────┘
```

**Hesaplama:** Sistem her kart seçimini kaydeder. Aynı roundda diğer 2 kart seçilseydi ne olurdu? Simüle edilir. Fark hesaplanır. En büyük pozitif fark "en iyi karar" olur.

### 11.3 En Kritik Hata Analizi
```
┌──────────────────────────────────────────────────────┐
│  🔴 EN KRİTİK HATAN                                 │
│                                                      │
│  Round 12: Olay kartında "Kaptan dinlensin" dedin   │
│  → Moral 45'e düştü (kritik eşiğin altı)           │
│  → Sonraki 2 round'da yedek performans düştü        │
│  → Bu 2 round: 890 puan kaybettin                   │
└──────────────────────────────────────────────────────┘
```

**Not:** Bu hata analizi oyuncuyu suçlamaz, **sistemi açıklar.** "Şunu bilseydim" dedirtmeli, "oyun haksız" dedirtmemeli.

### 11.4 Sinerji Özeti
```
Bu runda keşfettiğin sinerjiler:
  ⚡ KONTR ATILIĞI — 7 kez aktive, toplam +560 puan
  🏠 EV SAHİBİ — 5 kez aktive, toplam +500 puan
  
Daha önce keşfetmiştin:
  ★ AKADEMİ (ilk keşif: 3 run önce)
  
Henüz keşfetmediğin sinerjiler: 11/22
[KEŞFETMEYİ BEKLEYEN SİNERJİLER yalnızca sayı olarak gösterilir]
```

Bu kısım oyuncuyu tekrar oynamaya iter — "11 tane daha var mı?"

### 11.5 Paylaşım Kartı
```
┌──────────────────────────────────────────────┐
│  ██████████████████████████████████████████  │
│  █                                        █  │
│  █   BİR DAHA                             █  │
│  █   Günlük Skor: 12.440                  █  │
│  █   Sıra: #847 / 14.293                  █  │
│  █                                        █  │
│  █   En İyi Karar: Round 7 Isaac seçimi   █  │
│  █   Aktif Sinerji: KONTR ATILIĞI ⚡      █  │
│  █   Namağlup: 10 round ✅                █  │
│  █                                        █  │
│  █   "Bugünkü oyuncuların %91'ini geçtim" █  │
│  ██████████████████████████████████████████  │
└──────────────────────────────────────────────┘
[KOPYALA] [PAYLAŞ]
```

Kartın rengi sıraya göre değişir: Gold (top %10), Silver (top %25), Bronze (top %50), Default (altı).

---

## 12. LEADERBOARD & SEED SİSTEMİ

### 12.1 Günlük Seed Sistemi
```
Her gün UTC 00:00'da yeni seed üretilir.
Seed o günün tüm kartlarını, sıralarını ve olay kartlarını belirler.
Herkes aynı kartları aynı sırada görür.
FARKI YARATAN: Senin kararların.
```

Bu şu soruyu sormayı mümkün kılar:
> *"Aynı elleri alan başkası ne yaptı?"*

Bu sorunun cevabı leaderboard'da. Bu yüzden günlük leaderboard güçlüdür.

### 12.2 Leaderboard Yapısı
```
GÜNLÜK LEADERBOARD
  └── Sadece bugünkü seed skoru
  └── Sıfırlanır: Gece yarısı
  └── Gösterge: #X / Y kişi oynadı

HAFTALIK LEADERBOARD
  └── 7 günlük toplam skor
  └── Sıfırlanır: Pazartesi
  └── Gösterge: Haftalık toplam + kaç gün oynandı

ALL-TIME LEADERBOARD
  └── En yüksek tek run skoru
  └── Silinmez
  └── Yan bilgi: "X tarihininde yapıldı"

NAMAĞLUP LEADERBOARD
  └── Hiç oyuncu kaybetmeden en çok round (tüm zamanlar)
  └── "Bu rekor kırılmadı: 15 round – Ahmet K."
```

### 12.3 Yakın Rakip Sistemi
Leaderboard'da global sıralamanın yanı sıra:
```
SENDEN HEMEN ÖNCE: Murat B. — 12.680 (240 puan önde)
SENDEN HEMEN SONRA: Zeynep A. — 12.100 (340 puan geride)
```

Bu "neredeyse" hissini somutlaştırır. Murat'ı geçmek için bir kez daha oynamak ister.

### 12.4 Skor Doğrulama
Hile önlemi olarak her hamle sunucuya log'lanır:
```javascript
// Her kart seçimi loglanır
{
  round: number,
  seed: string,
  timestamp: number,
  cardShown: [cardId1, cardId2, cardId3],
  selected: cardId,
  resultScore: number
}
```

Tutarsız log = skor geçersiz. Bu basit anti-cheat yeterlidir.

---

## 13. UI/UX TASARIMI

### 13.1 Tasarım Dili
**Referans:** 38-0'ın dark theme'i iyi, onu base al. Farklılaştır:
- **Font:** Condensed, bold, spor hissi (Barlow Condensed / Bebas Neue)
- **Ana Renk:** Siyah arka plan
- **Vurgu:** Keskin kırmızı (kritik anlar) + Beyaz (standart UI)
- **Sinerji Rengi:** Altın sarısı (bu renk sinerjiye özel, başka yerde kullanma)
- **Tehlike:** Parlayan kırmızı (kadron azalınca kenarlık titrer)

### 13.2 Ekran Akışı
```
ANA MENÜ
  ├── OYNA (Günlük Seed)
  ├── SERBEST MOD (Random Seed)
  ├── LEADERBOARD
  └── SINERJILER (keşfedilenleri göster)
        │
        ▼
KART SEÇİM EKRANI (ana oyun ekranı)
  ├── Sol panel: Mevcut kadro + moral göstergesi
  ├── Orta: 3 kart yan yana
  ├── Sağ panel: Aktif sinerjiler + skor
  └── Alt bar: Round sayısı + timer
        │
        ▼
MAÇ ANİMASYON EKRANI (8-10 sn)
  ├── Rakip profil kartı (kısa süre)
  ├── Skor animasyonu
  ├── Öne çıkan anlar (sinerji flashları)
  └── Sonuç: Galibiyet / Beraberlik / Yenilgi
        │
        ▼
RUN SONU EKRANI
  ├── Skor (büyük, animasyonlu)
  ├── Sıra (yükleme efekti)
  └── Özet (swipe ile kaydır)
```

### 13.3 Kart Seçim Ekranı — Detay
```
┌─────────────────────────────────────────────────────────────────┐
│ ROUND 7/15    ■■■■■■■□□□□□□□□    SKOR: 4.220    SERİ: 3 ⚡    │
├──────────────┬──────────────────────────────┬───────────────────┤
│              │                              │                   │
│  KADRO       │     [KART 1]  [KART 2]  [KART 3]               │
│  ─────────   │                              │  AKTİF SİNERJİLER │
│  KL  62 ●   │      Hover → büyür           │  ⚡ KONTR ATILIĞI  │
│  STP 71 ●   │      Click → seç             │  🏠 EV SAHİBİ     │
│  STP 68 ●   │                              │                   │
│  ... (11)   │     20   [████████████] sn   │  MORAL: 72/100    │
│              │                              │  ████████░░       │
│  ● = dolu    │                              │                   │
│  ○ = boş     │                              │                   │
└──────────────┴──────────────────────────────┴───────────────────┘
```

### 13.4 Animasyon Kılavuzu
| Olay | Animasyon |
|------|-----------|
| Kart hover | Hafif yukarı kayar + gölge artar |
| Kart seçildi | Seçilen büyür + diğerleri solar + kadro paneline uçar |
| Sinerji aktive | Altın parıltı + "★ YENİ SİNERJİ" banner |
| Galibiyet | Yeşil flash + konfeti (hafif) |
| Yenilgi | Kırmızı titreme + "oyuncu ayrılıyor" animasyonu |
| Oyuncu gidişi | Oyuncu kartı karartılır + üstüne "X" çizilir + solucur |
| Tehlike modu | Kenar kırmızı pulse (sürekli) |

### 13.5 Timer Tasarımı
20 saniyelik timer görsel olarak:
- 20-10 sn: Normal beyaz
- 10-5 sn: Sarıya döner
- 5-0 sn: Kırmızı + timer hızlanır (aldatma, gerçekte hızlanmaz ama hissettirmeli)
- 0 sn: Otomatik en yüksek rating kartı seçilir (varsayılan seçim mantığı)

**Timer dolunca otomatik seçim:** Her zaman en pahalı kart değil, **kadronun o anki ihtiyacını** karşılayan kart seçilir (boş slot varsa dolduran, yoksa en yüksek rating).

---

## 14. SES TASARIMI

### 14.1 Ses Kategorileri
Oyun atmosfer için sessiz değil, ama **abartısız** olmalı. Futbol sahasının sessiz sesi + UI sesleri.

| Ses | Durum | Ton |
|-----|-------|-----|
| Kart hover | Kart üzerine gelince | Hafif "tick" |
| Kart seçildi | Kart seçilince | Net "thud" — ağır, kasıtlı |
| Maç başlangıcı | Maç ekranı açılınca | Saha sesi (kalabalık fısıltı) |
| Gol | Gol anımda | Kalabalık "ohhh" + ıslık |
| Yenilen gol | Gol yenince | Kısa sessizlik + rakip alkışı |
| Sinerji aktive | İlk keşif | Metalik "çan" sesi — unutulmaz |
| Sinerji aktive | Tekrar aktive | Küçük "ping" |
| Galibiyet | Maç kazanılınca | Sıcak alkış (5-6 sn) |
| Yenilgi | Maç kaybedilince | Sessizlik → tek ıslık |
| Oyuncu gider | Kadrodan ayrılınca | Kapı kapanma sesi |
| Tehlike modu | 5 oyuncuda aktive | Düşük, sürekli "hum" (alarm değil, gerilim) |
| Run sonu | Özet ekranında | Orchestral, sakin |

### 14.2 Müzik
Oyun içi müzik yoktur (distraksiyon yaratır). Sadece:
- **Bekleme ekranı:** Hafif lofi beat (opsiyonel — ayarlardan kapanabilir)
- **Run sonu:** 10 saniyelik kısa orchestral snippet

---

## 15. OYUNCU PSİKOLOJİSİ & RETENTION

### 15.1 "Bir Daha" Döngüsünü Tetikleyen 5 His
| His | Mekanik | Tetiklenme Anı |
|-----|---------|----------------|
| "Daha iyisini yapabilirim" | Run özeti hatayı gösterir | Her run sonu |
| "Şanssızlık değildi" | Aynı seedde biri daha iyisi yaptı | Leaderboard skoru |
| "Neredeyse kırdım" | 1 sıra geride bitirmek | "Murat B. 240 puan önde" |
| "Bunu keşfettim" | Yeni sinerji ilk aktive | Oyun içi (anında) |
| "Bugün farklı hissettirdi" | Seed değişiyor, farklı deneyim | Ertesi gün girişte |

### 15.2 Ego Pekiştirmesi — Doğru Kullanımı
Oyun şunu yapmamalı: "Harikasın! Muhteşemsin! Efsane!"  
Oyun şunu yapmalı: **Nesnel verileri öyle çerçevele ki oyuncu kendini zeki hissetsin.**

```
❌ Kötü: "Harika bir run!"
✓ İyi:  "Round 7 Isaac seçimini yalnızca %6 oyuncu yaptı"

❌ Kötü: "Bir dahisin!"
✓ İyi:  "Bu sinerjiyi bu runda aktive eden oyuncuların %9'undasın"
```

### 15.3 Günlük Alışkanlık Kurgusu
```
Günlük seed: Sabah güncellenir
Hedef: Öğle veya akşam "5 dakikan var, oyna" kanca
Hatırlatma (opsiyonel): "Bugün X kişi oynadı, henüz oynamadın"

Ertesi gün girişte:
  "Dünkü en iyi skor: 14.200 — Bugün daha iyisini yapabilir misin?"
```

### 15.4 Sosyal Kıyas (Offline-First ama Mümkün)
Leaderboard anonim isimlerle çalışır — giriş gerektirmez (V1).  
V2'de: Takma ad girişi → aynı takma adla her gün otomatik skoru görme.

---

## 16. TUTORIAL & ONBOARDING

### 16.1 Felsefe
Tutorial **olmayacak.** Yani geleneksel "bunu şuraya tıkla, şimdi bunu yap" tutorial yok.

Onun yerine: **İlk run'un kendisi tutorial.**

### 16.2 İlk Run Mekanikleri
```
İlk run başladığında:
  • Round 1: Kartların altında tek satır açıklama (soluncur 5 sn sonra)
    "[HIZLI]: Sprint durumunda gol bonus" → Tooltip değil, flash metin
  
  • Round 2: İlk sinerji ipucu
    "⚡ 2 [HIZLI] oyuncun var. Bir tane daha..."
    (Bu ipucu yalnızca ilk runda çıkar)
    
  • Round 3: Olay kartı açıklaması
    "Karar anı — iki seçenek, ikisi de geçerli"
    
  Sonrasında: Hiç açıklama yok. Oyuncu kendi öğrenir.
```

### 16.3 "Nasıl Oynanır?" Ekranı (Ana Menüde)
5 ekranlık statik bir kılavuz (tap ile geç):
1. Kadro kurul, maç oyna
2. Her round bir karar
3. Kaybedersen oyuncu gider
4. Sinerjileri keşfet
5. Aynı seed, farklı kararlar → leaderboard

Her ekran: 1 görsel, 1 cümle açıklama. Uzun değil.

---

## 17. ANTİ-FRUSTRATION MEKANİKLERİ

### 17.1 İlk Round Garantisi
İlk round'da hiçbir zaman şunlar olmaz:
- Yalnızca [GERİLEYEN] kartlar
- [SAKATLIK RİSKİ] kartı
- Çok güçlü rakip

İlk round dengeli başlar. Oyuncu oyuna ısınır.

### 17.2 "Kötü Seed" Algısını Engelleme
Aynı seed herkes için aynı. Yani "kötü seed geldi" çıkışı yoktur. Ama:
- 3 kart de çok zayıfsa: arka planda yedek havuzdan 1 kart upgrade edilir (sessizce, görünmez şekilde)
- Bu **yalnızca** round 1-3 arası çalışır

### 17.3 Kayıp Sonrası Recovery Garantisi
İlk 2 kayıptan sonra Recovery kartı garantiyle 2 round içinde gelir. 3. kayıptan sonra garantisi kalkar.

### 17.4 Timer Otomatik Seçim Akıllıca Çalışır
Timer dolunca yapılan otomatik seçim her zaman makul bir seçimdir. "Timer doldu ve oyun aptalca bir kart seçti" frustrasyon kaynağı olmaz.

### 17.5 "Vay be" Anı — Pozitif Sürpriz
Her run'da düşük olasılıklı bir "vay be" anı kasıtlı tutulur:
- Rating 90+ rakibini yendiysen: ekstra animasyon + özel ses
- 3 sinerji aynı anda aktive olursa: "SINERJI FIRTINASI" banner
- Clean sheet + galibiyet: "MÜKEMMEL SAVUNMA" rozeti

---

## 18. TEKNİK MİMARİ

### 18.1 Önerilen Stack (Web-First)

**Frontend:**
```
React + TypeScript
  ├── Zustand (state yönetimi — basit, roguelite için ideal)
  ├── Framer Motion (animasyonlar)
  ├── Tailwind CSS (UI)
  └── Canvas / Pixi.js (maç animasyonu için — V2'de)
```

**Backend (Leaderboard için):**
```
Node.js + Express (veya Next.js API routes)
  ├── PostgreSQL (skor veritabanı)
  ├── Redis (günlük seed cache + hızlı sıralama)
  └── JWT (anonim oturum — V1'de isim bile almadan)
```

**Seed Üretimi:**
```javascript
// Deterministik seed sistemi
import Seedrandom from 'seedrandom';

const DAILY_SEED = `${currentDate}-bir-daha-v1`;
const rng = new Seedrandom(DAILY_SEED);

function drawCards(round: number): Card[] {
  // Aynı seed + aynı round = aynı 3 kart
  // Farklı seed = farklı oyun
}
```

### 18.2 Veri Modeli

**Oyuncu (Kart) Modeli:**
```typescript
interface PlayerCard {
  id: string;
  name: string;
  rating: number;
  position: Position; // KL | STP | OS | DOS | SLK | SÖK | SF
  rarity: 'normal' | 'iyi' | 'güçlü' | 'efsane';
  tags: Tag[];
  risks: Risk[];       // Opsiyonel — SAKATLIK vs.
  currentRating: number; // POTANSİYEL ile değişebilir
}

type Tag =
  | 'HIZLI' | 'GÜÇLÜ' | 'DAYANIKLI'
  | 'TEKNİK' | 'FİNİŞÖR' | 'ASİSTÇİ'
  | 'LİDER' | 'MENTOR' | 'KAPİTAN'
  | 'YERLİ' | 'YABANCI_YILDIZ'
  | 'POTANSİYEL' | 'GERİLEYEN'
  | 'SAKATLIK_RİSKİ' | 'KIRMIZI_KART'
  // ...
```

**Oyun State Modeli:**
```typescript
interface GameState {
  seed: string;
  round: number;           // 1-15
  squad: PlayerCard[];     // Max 11
  morale: number;          // 0-100
  score: number;
  streak: number;          // Üst üste galibiyet
  activesynergies: Synergy[];
  roundHistory: RoundResult[];
  phase: 'cardSelect' | 'match' | 'event' | 'runEnd';
}

interface RoundResult {
  round: number;
  cardsShown: [Card, Card, Card];
  cardSelected: Card;
  matchResult: MatchResult;
  pointsEarned: number;
}
```

**Skor Modeli (DB):**
```typescript
interface Score {
  id: string;
  anonymousId: string;    // Local storage UUID — kayıt gerektirmez
  displayName?: string;   // Opsiyonel — V2
  seed: string;           // Günlük seed
  totalScore: number;
  roundsCompleted: number;
  roundHistory: RoundResult[]; // Anti-cheat için
  timestamp: number;
  isNameless: boolean;    // Tam anonim mi?
}
```

### 18.3 Save Sistemi (Offline-First)
```
Local Storage'da tutulur:
  ├── currentRun: Devam eden run (sayfa kapanırsa kaldığı yerden devam)
  ├── todayScore: Bugünkü en iyi skor (her cihazda ayrı)
  ├── anonymousId: UUID (bir kez üretilir, silinmez)
  ├── discoveredSynergies: Keşfedilen sinerjiler
  └── allTimeStats: Toplam istatistikler
```

**Run devam etme:**
```
Oyuncu sayfayı kapattı, geri döndü:
  "Devam eden runun var (Round 9/15, Skor: 5.220). Devam et?"
  [DEVAM ET] [YENİ RUN]
```

### 18.4 Anti-Cheat (Basit)
```
Her round'da client → server'a log gönderilir:
  { seed, round, selectedCard, timestamp, resultHash }

Server checkler:
  1. Timestamp'ler makul aralıkta mı? (20 sn'den az aralarında mı?)
  2. Seçilen kart o seed + round için gerçekten çıkan kartlardan mı?
  3. Puan hesabı tutarlı mı?

Tutarsızlık → Skor "unranked" işaretlenir (silinmez, gösterilmez)
```

---

## 19. İÇERİK VERİTABANI YAPISI

### 19.1 Oyuncu Havuzu
MVP için ~200 oyuncu kartı yeterlidir. Gruplar:

**Yerli Oyuncular (40 kart):**
- 10× Normal (60-68)
- 15× İyi (69-76)
- 10× Güçlü (77-84)
- 5× Efsane (85-91)

**Yabancı Oyuncular (40 kart):**
- Aynı dağılım

**Özel Oyuncular (20 kart):**
- Sadece belirli kombinasyonlarla gelen "gizli" kartlar
- Olay kartı sonucu açılan kartlar

**Serbest Havuz (100 kart):**
- Genel havuz, seed'e göre çekilir

### 19.2 Olay Kartı Havuzu
~50 olay kartı yeterlidir MVP için. Kategori dağılımı:
- Transfer: 15 kart
- Taktik: 12 kart
- Moral/Soyunma odası: 13 kart
- Fiziksel: 7 kart
- Özel/Komik: 3 kart

### 19.3 Sinerji Tanımları (Kod Yapısı)
```typescript
interface Synergy {
  id: string;
  name: string;
  icon: string;
  condition: SynergyCondition;  // Hangi koşulda aktive olur
  effect: SynergyEffect;        // Ne yapar
  discovered: boolean;          // Oyuncu keşfetti mi?
  displayName: string;          // Keşfedilmeden önce "???" gösterilir
}

// Örnek:
const KONTR_ATILIGI: Synergy = {
  id: 'synergy_kontr_atiligi',
  name: 'KONTR ATILIĞI',
  icon: '⚡',
  condition: {
    type: 'tag_count',
    tag: 'HIZLI',
    minimum: 3
  },
  effect: {
    type: 'per_goal_bonus',
    value: 80
  },
  discovered: false,
  displayName: '???'
}
```

---

## 20. GELİŞTİRME YOL HARİTASI

### V1 — MVP (Hedef: 4-6 Hafta)
```
✅ Core oyun döngüsü (card seç → maç oyna → puan)
✅ Oyuncu kartları (50 kart)
✅ Temel tag sistemi (10 tag)
✅ 5 sinerji
✅ Maç simülasyonu (basit formül)
✅ Kayıp mekaniği (oyuncu gider)
✅ Run sonu ekranı (skor + temel özet)
✅ Günlük seed
✅ Anonim leaderboard (isim gerekmez)
✅ Local save (devam et)

❌ Olay kartları (V2'ye ertelendi)
❌ Taktik kartları (V2)
❌ Recovery garantisi dışındaki kompleks mekanikler
```

### V2 — Derinlik (Hedef: +4 Hafta)
```
✅ Tüm taglar (20+)
✅ Tüm sinerjiler (22)
✅ Olay kartları (50 kart)
✅ Taktik kartları (10 kart)
✅ Ego sistemi tam (en iyi karar + en kötü hata analizi)
✅ Paylaşım kartı (görsel üretim)
✅ Haftalık leaderboard
✅ İsim girişi (opsiyonel)
✅ Keşfedilen sinerji kütüphanesi
✅ Maç animasyonu (görsel iyileştirme)
```

### V3 — Sosyal & Polish (Hedef: +4 Hafta)
```
✅ Mobil (PWA veya native React Native)
✅ All-time ve Namağlup leaderboard
✅ "Yakın rakip" sistemi
✅ Günlük streak ödülleri
✅ Ses sistemi (tam)
✅ Yeni kart içerikleri (genişletilmiş havuz)
✅ Sezon sistemi (her ay sıfırlanan hall of fame)
✅ Opsiyonel: Discord entegrasyonu (webhook ile günlük top 10)
```

### Post-V3 Değerlendirme
```
❓ Snake Draft / Multiplayer modu (büyük investisyon)
❓ Monetization (reklamsız premium skor paylaşımı?)
❓ Özel turnuva modu (hafta sonu farklı seed kuralları)
❓ Gerçek oyuncu lisansı (eğer büyürse)
```

---

## 21. AÇIK SORULAR & GELECEK KARARLAR

### Tasarım Soruları
| Soru | Seçenek A | Seçenek B | Notlar |
|------|-----------|-----------|--------|
| Timer atlanabilir mi? | Evet, tap ile geç | Hayır, 20 sn bekle | B daha bağımlılık yaratır ama frustrasyon riski var |
| Sinerji adı ne zaman gösterilir? | İlk aktive anında | Yalnızca run sonunda | A daha tatmin edici |
| Olay kartı her zaman gelsin mi? | Deterministik (3-4 roundda bir) | Rastgele | Deterministik daha tasarlanabilir |
| Kadro pozisyon zorunluluğu var mı? | Evet (KL slotuna KL koyman lazım) | Hayır (dilediğin yere koy) | V1'de zorunluluk olmasın, karmaşıklık artırır |
| Beraberlik mekanizması | Puan ver (çok az) | Hiç puan verme | Çok az puan daha iyi — sıfır ceza gibi hissettirmez |

### Teknik Sorular
| Soru | Notlar |
|------|--------|
| Maç simülasyonu ne kadar gerçekçi olmalı? | V1'de basit formül yeterli. V2'de stat-based gelişebilir. |
| Anti-cheat ne kadar katı? | V1'de hafif yeterli. Büyüyünce sunucu taraflı doğrulama. |
| Seed aynı gün birden fazla oynama? | Her zaman aynı skor mu saydırmalı? İlk veya en iyi skor mu? → Öneri: En iyi skor |

### İçerik Soruları
| Soru | Notlar |
|------|--------|
| Gerçek oyuncu isimleri mi, kurgusal mı? | MVP'de kurgusal daha az hukuki risk. Lisanslama masraflı. |
| Kaç sinerji launch'ta açık olsun? | 22 toplam, 5'i başta açık → 17'si keşfedilecek |
| Türkçe mi, çift dil mi? | MVP Türkçe. V2'de İngilizce katman. |

---

## EKLER

### Ek A — Kısaltmalar & Mevki Kodları
```
KL  = Kaleci
STP = Stoper
SLB = Sol Bek
SÖB = Sağ Bek
DOS = Defansif Orta Saha
OS  = Orta Saha
SLK = Sol Kanat
SÖK = Sağ Kanat
OOS = Ofansif Orta Saha
SF  = Santrafor
GDD = Game Design Document
```

### Ek B — Puan Senaryosu (Örnek Run)
```
Round 1: Rating 61 rakip, 2-0 kazandın, gol yok
  Baz: 110, Gol: +100, Clean: +100 → 310 puan

Round 3: Rating 68 rakip, sinerji aktive (ilk)
  Baz: 180, Gol: 150, Sinerji: +160 → 490 puan
  
Round 7: Rating 78, kapitan modu aktive
  Baz: 280, Gol: 150, Kapitan: +150, Seri (x1.2): × → 696 puan
  
Round 12: Rating 84, 3 sinerji aktive
  Baz: 340, Gol: 200, Tüm sinerjiler: +320, Seri (x1.35): × → 1161 puan

Round 15: Rating 88, TANRM MODU (×3)
  Base: 380, Gol: 250, ×3 → 1890 puan

[Toplam tahmini iyi run: 10.000 - 14.000 puan]
[Toplam mükemmel run: 18.000 - 22.000 puan]
```

### Ek C — İlk 10 Sinerji (Launch Listesi)
1. KONTR ATILIĞI (3× HIZLI)
2. AKADEMİ (MENTOR + POTANSİYEL)
3. EV SAHİBİ (7× YERLİ)
4. KAPİTAN MODU (LİDER + Moral ≥80)
5. TEMİZ SAYFA (KL ≥82 + 3 STP)
6. TOPA SAHİP OL (4× TEKNİK)
7. MİSTER ASİST (2× ASİSTÇİ)
8. SAVAŞÇI RUHU (2× SAVAŞÇI + Geride olma durumu)
9. ÜÇ BOYUTLU HÜCUM (SF + SLK + SÖK hepsi FİNİŞÖR)
10. SAĞLAM ORTA (DOS + OOS her ikisi TEKNİK veya GÜÇLÜ)

---

*Bu doküman yaşayan bir belgedir. Her geliştirme kararı bu dosyaya yansıtılmalı, açık sorular kapatıldıkça "Karar: X" notu düşülmelidir.*

**Son Güncelleme:** Haziran 2026  
**Sonraki Güncelleme Hedefi:** V1 sprint başlamadan önce
```

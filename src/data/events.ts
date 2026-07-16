import type { EventCard } from '@/types';

export const EVENT_CARDS: EventCard[] = [
  {
    id: 'evt_transfer_teklif', category: 'transfer', icon: '💰', title: 'Transfer Teklifi',
    description: 'Menajerin telefonu çalıyor: rakip kulüp, kadrodaki yıldızına yüksek teklif yapmış. Satış parası kasaya girecek ama sahada boşluk kalacak.',
    optionA: { label: 'SAT', description: 'Yıldız satılır · +220 puan · +3 çek hakkı' },
    optionB: { label: 'REDDET', description: 'Takım birlikte kalır · Moral +15' },
  },
  {
    id: 'evt_genc_yetenek', category: 'transfer', icon: '🌱', title: 'Genç Yetenek',
    description: 'Akademiden POTANSİYEL bir oyuncu katılmak istiyor.',
    optionA: { label: 'AL', description: 'Kadroya genç oyuncu eklenir' },
    optionB: { label: 'REDDET', description: '+150 anlık puan bonusu' },
  },
  {
    id: 'evt_kavga', category: 'transfer', icon: '💥', title: 'Soyunma Odası Kavgası',
    description: 'Antrenman sonrası soyunma odasında sesler yükseldi. İki oyuncu birbirine girdi; takım ikiye bölünmüş durumda.',
    optionA: { label: 'BİRİNİ UZAKLAŞTIR', description: 'Kavga eden ayrılır · Moral +5' },
    optionB: { label: 'İKİSİNİ DE TUT', description: 'Gerginlik sürer · Moral -10' },
  },
  {
    id: 'evt_formasyon', category: 'taktik', icon: '📋', title: 'Rakip Formasyonu',
    description: 'Rakip senin sistemini yiyor gibi görünüyor.',
    optionA: { label: 'DEĞİŞTİR', description: 'Yeni diziliş · Sonraki maç +100 · Moral -8' },
    optionB: { label: 'DEVAM ET', description: 'Sistem korunur · Moral +8 · +25 puan' },
  },
  {
    id: 'evt_saha', category: 'taktik', icon: '🌧️', title: 'Kötü Saha',
    description: 'Zemin ağır ve top sekerek gidiyor. Kısa pas riske girer; fizik gücü olan oyuncular daha güvenli oynar.',
    optionA: { label: 'DİREKT OYNA', description: 'GÜÇLÜ/HIZLI oyunculara göre sonraki maç bonusu' },
    optionB: { label: 'YERDEN ÇIK', description: 'TEKNİK oyunculara göre sonraki maç bonusu' },
  },
  {
    id: 'evt_kaptan', category: 'moral', icon: '👑', title: 'Kaptan Liderliği',
    description: 'Kaptan takımı ateşlemek istiyor ama son haftalarda yükü çok arttı. Onu öne çıkarırsan takım sert tepki verir; dinlendirirsen soyunma odası sakinleşir.',
    optionA: { label: 'SAHAYA SÜR', description: 'Sonraki maç +175 · maç riski %18' },
    optionB: { label: 'DİNLENDİR', description: 'Moral +10 · güvenli tercih' },
  },
  {
    id: 'evt_basin', category: 'moral', icon: '📰', title: 'Basın Eleştirisi',
    description: 'Basın takımı eleştiriyor.',
    optionA: { label: 'SESSİZ KAL', description: 'Gürültüye aldırma · odak +35 puan' },
    optionB: { label: 'CEVAP VER', description: 'Moral +20 · medyaya yanıt' },
  },
  {
    id: 'evt_taraftar', category: 'moral', icon: '📣', title: 'Taraftar Baskısı',
    description: 'Tribünler baskı yapıyor.',
    optionA: { label: 'HÜCUM', description: 'Belirgin takım gücü avantajı · kontrollü rakip baskısı' },
    optionB: { label: 'SAVUN', description: 'Moral +5 · güvenli' },
  },
  {
    id: 'evt_sakatlik', category: 'fiziksel', icon: '🤕', title: 'Sakatlık',
    description: 'Son antrenmanda ilk 11 oyuncularından biri yere kapandı. Doktor “oynatabilirim ama risk var” diyor; yedek hazır bekliyor.',
    optionA: { label: 'İĞNEYLE OYNAT', description: 'Sakat oyuncu 1 maç rating -5 · Moral -5' },
    optionB: { label: 'KADRODAN ÇIKAR', description: 'Sakat oyuncu ayrılır · slot boşalır' },
  },
  {
    id: 'evt_yorgunluk', category: 'fiziksel', icon: '😴', title: 'Aşırı Yorgunluk',
    description: 'İlk 11’den birkaç oyuncu tempo testinde düşüş gösterdi. Rotasyon ritmi bozar ama sakince toparlar; zorlamak kısa vadede güç verir.',
    optionA: { label: 'ROTASYON YAP', description: 'Takım dinlenir · +10 puan · Moral +6' },
    optionB: { label: 'ZORLA', description: 'Yüksek takım gücü avantajı · rakip baskısı %22 · Moral -6' },
  },
  {
    id: 'evt_zehir', category: 'ozel', icon: '🍽️', title: 'Yemek Zehirlenmesi',
    description: 'Maç sabahı iki oyuncu mide problemi yaşadı. As kadroyu bozmazsan direnç gösterirsin; yedeklerle çıkarsan takım daha rahat olur ama kalite düşer.',
    optionA: { label: 'ASLARLA DEVAM', description: '+40 puan · Moral -6' },
    optionB: { label: 'YEDEKLERİ KOY', description: 'Moral +8 · maç riski %12' },
  },
  {
    id: 'evt_efsane_konusma', category: 'ozel', icon: '🏆', title: 'Efsane Konuşması',
    description: 'Kulüp efsanesi soyunma odasına girdi. Gençlerin gözleri parlıyor, tecrübesini paylaşmak istiyor.',
    optionA: { label: 'DİNLE', description: 'Takım toplantısı · Moral +30' },
    optionB: { label: 'ANTRENMANA GEÇ', description: 'Kısa teşekkür · +50 puan (anında)' },
  },
  {
    id: 'evt_var', category: 'ozel', icon: '📺', title: 'VAR Arızası',
    description: 'VAR sistemi arızalı — gol kararı belirsiz.',
    optionA: { label: 'KABUL ET', description: 'Gol iptali kabul · -60 puan · Moral +6' },
    optionB: { label: 'İTİRAZ ET', description: 'Rakip golü iptal · +90 puan · maç riski' },
  },
  {
    id: 'evt_moral_boost', category: 'moral', icon: '🎤', title: 'Takım Toplantısı',
    description: 'Oyuncular bir araya geldi.',
    optionA: { label: 'MOTİVE ET', description: 'Moral +15' },
    optionB: { label: 'ANTRENMAN', description: 'Sonraki maç +50 bonus' },
  },
  {
    id: 'evt_scout', category: 'transfer', icon: '🔍', title: 'Scout Raporu',
    description: 'Scout yeni bir oyuncu öneriyor.',
    optionA: { label: 'İMZALA', description: 'Orta rating oyuncu eklenir' },
    optionB: { label: 'BEKLE', description: 'Alternatif isimler · +1 çek hakkı · +40 puan' },
  },
  {
    id: 'evt_yildiz_sozlesme', category: 'transfer', icon: '📝', title: 'Yıldız Sözleşmesi',
    description: 'Yıldız oyuncu prim istiyor.',
    optionA: { label: 'ÖDE', description: '-80 puan · Moral +16 · oyuncu kalır' },
    optionB: { label: 'PAZARLIK', description: '+40 puan · Moral -8' },
  },
  {
    id: 'evt_diger_kulup', category: 'transfer', icon: '👀', title: 'Gizli Gözlem',
    description: 'Alt sıralardan bir kulüp rotasyonda kalan oyuncuna garanti forma önerdi. Satarsan gelir alırsın; tutarsan oyuncu kendini kanıtlamak ister.',
    optionA: { label: 'BIRAK', description: 'Rotasyon oyuncusu ayrılır · +160 puan' },
    optionB: { label: 'İKNA ET', description: 'Sonraki maç +55 · Moral +4' },
  },
  {
    id: 'evt_acemi_hata', category: 'transfer', icon: '😬', title: 'Acemi Hatası',
    description: 'Genç oyuncu antrenmanda büyük hata yaptı.',
    optionA: { label: 'CEZALANDIR', description: 'Sonraki maç +50 · Moral -6' },
    optionB: { label: 'DESTEKLE', description: 'Moral +10' },
  },
  {
    id: 'evt_kiralik', category: 'transfer', icon: '🔄', title: 'Kiralık Teklif',
    description: 'Kiralık oyuncu teklifi geldi.',
    optionA: { label: 'AL', description: 'Kadroya oyuncu eklenir' },
    optionB: { label: 'REDDET', description: '+100 puan' },
  },
  {
    id: 'evt_emekli', category: 'transfer', icon: '🎖️', title: 'Emeklilik',
    description: 'Kaptan sezon sonu emekli olacağını söyledi.',
    optionA: { label: 'VEDA TÖRENİ', description: 'Takım kenetlenir · Moral +20' },
    optionB: { label: 'HEMEN AYIR', description: 'Oyuncu ayrılır · slot boşalır' },
  },
  {
    id: 'evt_sponsor', category: 'transfer', icon: '💼', title: 'Sponsor Etkinliği',
    description: 'Ana sponsor maç öncesi reklam çekimi istiyor. Katılırsan gelir artar ama antrenman bölünür; reddedersen takım sahaya odaklanır.',
    optionA: { label: 'ÇEKİME GİT', description: '+120 puan · Moral -8' },
    optionB: { label: 'ANTRENMAN YAP', description: 'Moral +14 · Sonraki maç +20' },
  },
  {
    id: 'evt_menajer_krizi', category: 'transfer', icon: '🤝', title: 'Menajer Krizi',
    description: 'Bir oyuncunun menajeri ayrılık için bastırıyor. Serbest bırakırsan tazminat alırsın; tutarsan kadro korunur ama konu soyunma odasını gerer.',
    optionA: { label: 'SERBEST BIRAK', description: 'Oyuncu gider · +120 puan' },
    optionB: { label: 'MASAYA OTUR', description: '+70 puan · Moral -6' },
  },
  {
    id: 'evt_antrenman_camp', category: 'taktik', icon: '⛺', title: 'Kamp Haftası',
    description: 'Teknik direktör yoğun kamp istiyor.',
    optionA: { label: 'KAMP', description: 'Sonraki maç +70 · Moral -8' },
    optionB: { label: 'HAFİF', description: 'Dinlenme · Moral +14' },
  },
  {
    id: 'evt_kaleci_hata', category: 'taktik', icon: '🧤', title: 'Kaleci Hatası',
    description: 'Kaleci son antrenmanda kritik hata yaptı.',
    optionA: { label: 'ELEŞTİR', description: 'Moral -10 · Sonraki maç +40' },
    optionB: { label: 'DESTEKLE', description: 'Moral +12' },
  },
  {
    id: 'evt_penalti_antrenman', category: 'taktik', icon: '🎯', title: 'Penaltı Antrenmanı',
    description: 'Penaltı performansı düşük.',
    optionA: { label: 'ÇALIŞ', description: 'Sonraki maç +85 · Moral -5' },
    optionB: { label: 'ATLA', description: 'Moral +14 · +30 puan' },
  },
  {
    id: 'evt_korner_taktik', category: 'taktik', icon: '📐', title: 'Korner Taktikleri',
    description: 'Set piece koçu yeni varyasyon öneriyor.',
    optionA: { label: 'UYGULA', description: 'Sonraki maç +55 · Moral -4' },
    optionB: { label: 'STANDART', description: 'Moral +12' },
  },
  {
    id: 'evt_yagmur', category: 'taktik', icon: '🌧️', title: 'Yağmur Uyarısı',
    description: 'Maç yağmurda oynanacak.',
    optionA: { label: 'FİZİKSEL', description: 'GÜÇLÜ/HIZLI oyuncu başına bonus' },
    optionB: { label: 'TEKNİK', description: 'TEKNİK oyuncu başına bonus' },
  },
  {
    id: 'evt_ofsayt', category: 'taktik', icon: '🚩', title: 'Ofsayt Tuzağı',
    description: 'Rakip ofsayt tuzağı kuruyor.',
    optionA: { label: 'HIZLILARLA DEL', description: 'HIZLI oyuncu başına bonus' },
    optionB: { label: 'NORMAL', description: 'Moral +16' },
  },
  {
    id: 'evt_kontratak', category: 'taktik', icon: '⚡', title: 'Kontra Antrenmanı',
    description: 'Hızlı çıkışlar üzerine çalışılacak.',
    optionA: { label: 'AGRESİF', description: 'Takım gücü avantajı · orta rakip baskısı' },
    optionB: { label: 'DENGELİ', description: 'Moral +7' },
  },
  {
    id: 'evt_kirmizi_forma', category: 'taktik', icon: '🟥', title: 'Agresif Plan',
    description: 'Sert oyun planı tartışılıyor.',
    optionA: { label: 'SERT OYNA', description: 'Takım gücü avantajı · kontrollü rakip baskısı' },
    optionB: { label: 'DİSİPLİN', description: 'Moral +6' },
  },
  {
    id: 'evt_sicak_hava', category: 'fiziksel', icon: '☀️', title: 'Sıcak Hava',
    description: '40°C sıcaklık uyarısı var.',
    optionA: { label: 'TEMPO', description: 'Takım gücü avantajı · hafif rakip baskısı' },
    optionB: { label: 'YAVAŞ', description: 'Moral +10 · +15 puan' },
  },
  {
    id: 'evt_soguk_hava', category: 'fiziksel', icon: '❄️', title: 'Soğuk Hava',
    description: 'Donma riski olan hava koşulları.',
    optionA: { label: 'DEVAM', description: '+45 puan · Moral -4' },
    optionB: { label: 'ISINMA', description: 'Sonraki maç +40' },
  },
  {
    id: 'evt_deplasman', category: 'fiziksel', icon: '✈️', title: 'Uzun Deplasman',
    description: '12 saatlik yolculuk var.',
    optionA: { label: 'ERKEN ÇIK', description: 'Sonraki maç +50 · Moral -6' },
    optionB: { label: 'KONFORLU GİT', description: '+40 puan · Moral +8' },
  },
  {
    id: 'evt_doktor', category: 'fiziksel', icon: '🏥', title: 'Sağlık Kontrolü',
    description: 'Takım doktoru tam kontrol istiyor.',
    optionA: { label: 'KONTROL', description: 'Moral +8' },
    optionB: { label: 'ATLA', description: 'Ölçülü takım gücü avantajı · düşük rakip baskısı' },
  },
  {
    id: 'evt_fizyoterapist', category: 'fiziksel', icon: '💆', title: 'Fizyoterapi',
    description: 'Yoğun maç temposu kasları yordu.',
    optionA: { label: 'SEANS', description: 'Moral +12' },
    optionB: { label: 'ANTRENMAN', description: 'Sonraki maç +35 · Moral -4' },
  },
  {
    id: 'evt_yedek_kaleci', category: 'fiziksel', icon: '🥅', title: 'Kaleci Sakatlığı',
    description: '1. kaleci hafif sakat.',
    optionA: { label: 'RİSKE GİR', description: 'Sakat kalecinin tecrübesiyle güç avantajı · rakip baskısı %15' },
    optionB: { label: 'YEDEK', description: 'Moral +8' },
  },
  {
    id: 'evt_havaalanı', category: 'fiziksel', icon: '🛫', title: 'Uçuş Gecikmesi',
    description: 'Deplasman uçuşu gecikti.',
    optionA: { label: 'BEKLE', description: 'Sonraki maç +35 · Moral -4' },
    optionB: { label: 'ÖZEL UÇAK', description: '+70 puan · Moral +4' },
  },
  {
    id: 'evt_derbi', category: 'moral', icon: '🔥', title: 'Derbi Haftası',
    description: 'Şehir derbisi yaklaşıyor.',
    optionA: { label: 'ATEŞLE', description: 'Takım gücü avantajı · orta rakip baskısı' },
    optionB: { label: 'SAKİN', description: 'Moral +8' },
  },
  {
    id: 'evt_social_media', category: 'moral', icon: '📱', title: 'Sosyal Medya',
    description: 'Taraftarlar sosyal medyada baskı yapıyor.',
    optionA: { label: 'ODAKLAN', description: 'Odak korundu · +25 puan' },
    optionB: { label: 'YANITLA', description: 'Taraftarla etkileşim · Moral +15' },
  },
  {
    id: 'evt_tv_program', category: 'moral', icon: '📺', title: 'TV Programı',
    description: 'Ulusal kanal kaptanı ve iki oyuncuyu programa çağırdı. Katılmak moralleri yükseltir; reddetmek maç hazırlığını korur.',
    optionA: { label: 'KATIL', description: 'Moral +18' },
    optionB: { label: 'ODAKLAN', description: 'Sonraki maç +40' },
  },
  {
    id: 'evt_psikolog', category: 'moral', icon: '🧠', title: 'Spor Psikoloğu',
    description: 'Mental destek öneriliyor.',
    optionA: { label: 'SEANS', description: 'Moral +22' },
    optionB: { label: 'ANTRENMAN', description: '+50 puan · Moral -4' },
  },
  {
    id: 'evt_aile', category: 'moral', icon: '👨‍👩‍👧', title: 'Aile Sorunu',
    description: 'Bir oyuncu ailevi sebeple izin istiyor. Zorlarsan takım huzursuz olur; izin verirsen kadro eksilir ama karar saygı görür.',
    optionA: { label: 'KADRODA TUT', description: 'Moral -10' },
    optionB: { label: 'İZİN VER', description: 'Oyuncu ayrılır · Moral +5' },
  },
  {
    id: 'evt_dogum_gunu', category: 'moral', icon: '🎂', title: 'Doğum Günü',
    description: 'Kaptanın doğum günü bugün.',
    optionA: { label: 'KUTLA', description: 'Moral +12' },
    optionB: { label: 'KISA', description: 'Sonraki maç +25 bonus' },
  },
  {
    id: 'evt_taraftar_koreografi', category: 'moral', icon: '🎭', title: 'Tribün Koreografisi',
    description: 'Taraftarlar özel koreografi hazırladı.',
    optionA: { label: 'KUTLA', description: 'Moral +16' },
    optionB: { label: 'ODAKLAN', description: 'Sonraki maç +40 bonus' },
  },
  {
    id: 'evt_sessiz_stadyum', category: 'moral', icon: '🔇', title: 'Boş Tribün',
    description: 'Ceza nedeniyle maç seyircisiz oynanacak.',
    optionA: { label: 'KABUL', description: 'Moral +8' },
    optionB: { label: 'KAPALI ANT.', description: 'Sonraki maç +45 · Moral -6' },
  },
  {
    id: 'evt_ceza', category: 'ozel', icon: '⚖️', title: 'Federasyon Cezası',
    description: 'Disiplin kurulu para cezası kesti.',
    optionA: { label: 'ÖDE', description: '-70 puan' },
    optionB: { label: 'İTİRAZ', description: '-25 puan · Moral -12 · maç riski' },
  },
  {
    id: 'evt_bonus', category: 'ozel', icon: '💵', title: 'Galibiyet Primi',
    description: 'Yönetim galibiyet primi teklif ediyor.',
    optionA: { label: 'DAĞIT', description: 'Moral +20 · +30 puan' },
    optionB: { label: 'BİRİKTİR', description: '+200 puan · Moral -8' },
  },
  {
    id: 'evt_kupa', category: 'ozel', icon: '🏆', title: 'Kupa Kurası',
    description: 'Kupada güçlü rakip çıktı.',
    optionA: { label: 'HEYECAN', description: 'Moral +16 · +20 puan' },
    optionB: { label: 'HAZIRLAN', description: 'Sonraki maç +65 · Moral -5' },
  },
  {
    id: 'evt_rakip_ispiyon', category: 'ozel', icon: '🕵️', title: 'Rakip İstihbarat',
    description: 'Rakip takımın oyun planı sızdırıldı.',
    optionA: { label: 'KULLAN', description: 'Sonraki maç +75 · Moral -4' },
    optionB: { label: 'GÖRMEZDEN', description: 'Etik duruş · Moral +12 · +25 puan' },
  },
  {
    id: 'evt_hakem_korkusu', category: 'ozel', icon: '🟨', title: 'Sert Hakem',
    description: 'Maçın hakemi kartları sever.',
    optionA: { label: 'TEMKİNLİ', description: 'Sakin kal · Moral +8' },
    optionB: { label: 'ANALİZ', description: 'Sonraki maç +50 · Moral -6' },
  },
  {
    id: 'evt_eksik_kadro', category: 'ozel', icon: '⚠️', title: 'Eksik Kadro',
    description: 'Birden fazla oyuncu cezalı/sakat.',
    optionA: { label: 'RİSKE GİR', description: 'Yüksek takım gücü avantajı · rakip baskısı %20' },
    optionB: { label: 'TRANSFER', description: 'Acil oyuncu eklenir' },
  },
  {
    id: 'evt_uzatma', category: 'ozel', icon: '⏱️', title: 'Uzatma Hazırlığı',
    description: 'Kupada uzatma ihtimali yüksek.',
    optionA: { label: 'HAZIRLAN', description: 'Takım gücü avantajı · orta rakip baskısı' },
    optionB: { label: 'NORMAL', description: 'Moral +5' },
  },
  {
    id: 'evt_ceza_sahasi', category: 'ozel', icon: '📦', title: 'Ceza Sahası Kaosu',
    description: 'Son maçlarda ceza sahasında gol yedin.',
    optionA: { label: 'ÇALIŞ', description: 'Sonraki maç +60 · Moral -4' },
    optionB: { label: 'ATLA', description: 'Moral +12' },
  },
  {
    id: 'evt_sampiyonluk_baskisi', category: 'ozel', icon: '👑', title: 'Şampiyonluk Baskısı',
    description: 'Basın şampiyonluk konuşmaya başladı.',
    optionA: { label: 'BASKI', description: 'Çok yüksek takım gücü avantajı · yüksek rakip baskısı' },
    optionB: { label: 'SAKİN', description: 'Moral +10' },
  },
  {
    id: 'evt_tesis', category: 'ozel', icon: '🏟️', title: 'Yeni Tesis',
    description: 'Kulüp antrenman tesisini yeniledi.',
    optionA: { label: 'KUTLA', description: 'Moral +16 · +20 puan' },
    optionB: { label: 'KONDİSYON', description: 'Bir oyuncu DAYANIKLI olur · +60 puan · Moral -6' },
  },
  {
    id: 'evt_legend_ziyaret', category: 'ozel', icon: '⭐', title: 'Efsane Ziyareti',
    description: 'Kulüp efsanesi antrenmana geldi.',
    optionA: { label: 'DİNLE', description: 'Bir oyuncu MENTOR olur · Moral +18' },
    optionB: { label: 'ODAK', description: '+80 puan' },
  },
  {
    id: 'evt_unlock_efsane_dokunusu', category: 'ozel', icon: '✨', title: 'Efsane Dokunuşu',
    description: 'Kulüp efsanesi bir oyuncuyu özel çalışmaya aldı. Bir gecede üç farklı yönünü geliştirebilir; teklif yalnızca bir kez geçerli.',
    optionA: { label: 'ÖZEL ÇALIŞ', description: 'Uygun bir oyuncu aynı anda 3 pozitif trait kazanır' },
    optionB: { label: 'DÜZENİ BOZMA', description: '+140 puan · mevcut roller korunur' },
  },
  {
    id: 'evt_unlock_soyunma_odasi_yemini', category: 'moral', icon: '🤝', title: 'Soyunma Odası Yemini',
    description: 'Takım kapıları kapattı ve sezonun geri kalanı için söz verdi. Bir lider öne çıkabilir ya da bu enerji puana çevrilebilir.',
    optionA: { label: 'LİDERİ SEÇ', description: 'Uygun bir oyuncu KAPİTAN olur · Moral +15' },
    optionB: { label: 'ENERJİYİ SAHAYA TAŞI', description: '+180 puan · Moral -8' },
  },
];

export const PERSONAL_UNLOCK_EVENT_IDS = new Set([
  'evt_unlock_efsane_dokunusu',
  'evt_unlock_soyunma_odasi_yemini',
]);

export const EVENT_ROUNDS = [4, 8, 11, 14] as const;

export function isEventRound(round: number): boolean {
  return EVENT_ROUNDS.includes(round as (typeof EVENT_ROUNDS)[number]);
}

export function getEventById(id: string): EventCard | undefined {
  return EVENT_CARDS.find((e) => e.id === id);
}

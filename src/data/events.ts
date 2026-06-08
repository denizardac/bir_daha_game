import type { EventCard } from '@/types';

export const EVENT_CARDS: EventCard[] = [
  {
    id: 'evt_transfer_teklif', category: 'transfer', icon: '💰', title: 'Transfer Teklifi',
    description: 'Rakip kulüp yıldız oyuncunu istiyor.',
    optionA: { label: 'SAT', description: '3 çek hakkı · Kadro -1 oyuncu' },
    optionB: { label: 'REDDET', description: 'Moral +15 · Takım bütünlüğü' },
  },
  {
    id: 'evt_genc_yetenek', category: 'transfer', icon: '🌱', title: 'Genç Yetenek',
    description: 'Akademiden POTANSİYEL bir oyuncu katılmak istiyor.',
    optionA: { label: 'AL', description: 'Kadroya genç oyuncu eklenir' },
    optionB: { label: 'REDDET', description: '+150 anlık puan bonusu' },
  },
  {
    id: 'evt_kavga', category: 'transfer', icon: '💥', title: 'Soyunma Odası Kavgası',
    description: 'İki oyuncu arasında gerginlik var.',
    optionA: { label: 'BİRİNİ SAT', description: 'En zayıf oyuncu gider · Moral +5' },
    optionB: { label: 'İKİSİNİ DE OYNAT', description: '2 maç moral -10 riski' },
  },
  {
    id: 'evt_formasyon', category: 'taktik', icon: '📋', title: 'Rakip Formasyonu',
    description: 'Rakip senin sistemini yiyor gibi görünüyor.',
    optionA: { label: 'DEĞİŞTİR', description: 'Hazırlıksız formasyon · -10 moral' },
    optionB: { label: 'DEVAM ET', description: 'Risk al · Galibiyet +100 potansiyel' },
  },
  {
    id: 'evt_saha', category: 'taktik', icon: '🌧️', title: 'Kötü Saha',
    description: 'Hakem saha koşullarının kötü olduğunu söyledi.',
    optionA: { label: 'DİREKT OYUN', description: 'GÜÇLÜ/HIZLI bonus' },
    optionB: { label: 'TEKNİK OYUN', description: 'TEKNİK bonus' },
  },
  {
    id: 'evt_kaptan', category: 'moral', icon: '👑', title: 'Kaptan Liderliği',
    description: 'Kaptan liderliği sorgulanıyor.',
    optionA: { label: 'OYNAT', description: 'Risk yüksek · Ödül büyük (+200 puan)' },
    optionB: { label: 'DİNLENDİR', description: 'Moral +10 · Güvenli' },
  },
  {
    id: 'evt_basin', category: 'moral', icon: '📰', title: 'Basın Eleştirisi',
    description: 'Basın takımı eleştiriyor.',
    optionA: { label: 'SESSİZ KAL', description: 'Sadece oyun puanı sayılır' },
    optionB: { label: 'CEVAP VER', description: 'Moral +20 · TARTIŞMALI riski' },
  },
  {
    id: 'evt_taraftar', category: 'moral', icon: '📣', title: 'Taraftar Baskısı',
    description: 'Tribünler baskı yapıyor.',
    optionA: { label: 'HÜCUM', description: 'Risk yüksek · Gol bonusu' },
    optionB: { label: 'SAVUN', description: 'Moral +5 · Güvenli' },
  },
  {
    id: 'evt_sakatlik', category: 'fiziksel', icon: '🤕', title: 'Sakatlık',
    description: 'Yıldız oyuncu sakatlandı.',
    optionA: { label: 'YEDEKLE OYNA', description: 'Rating -5 geçici' },
    optionB: { label: 'ZORUNLU DEĞİŞİKLİK', description: 'Slot açılır · Yeni kart çek' },
  },
  {
    id: 'evt_yorgunluk', category: 'fiziksel', icon: '😴', title: 'Aşırı Yorgunluk',
    description: '3 oyuncu yorgunluk belirtisi gösteriyor.',
    optionA: { label: 'ROTASYON', description: 'Rating -3 geçici' },
    optionB: { label: 'RİSKE GİR', description: 'Maç kaybı riski +30%' },
  },
  {
    id: 'evt_zehir', category: 'ozel', icon: '🍽️', title: 'Yemek Zehirlenmesi',
    description: 'Maç öncesi 2 oyuncu etkilendi.',
    optionA: { label: 'ZAYIFLARLA DEVAM', description: 'Moral -10' },
    optionB: { label: 'YEDEKLERLE', description: 'Rating düşük ama moral +5' },
  },
  {
    id: 'evt_efsane_konusma', category: 'ozel', icon: '🏆', title: 'Efsane Konuşması',
    description: 'Efsane eski oyuncu soyunma odasına geldi.',
    optionA: { label: 'DİNLE', description: 'Moral +30 (bir seferlik)' },
    optionB: { label: 'GEÇ', description: '+50 puan' },
  },
  {
    id: 'evt_var', category: 'ozel', icon: '📺', title: 'VAR Arızası',
    description: 'VAR sistemi arızalı — gol kararı belirsiz.',
    optionA: { label: 'KABUL ET', description: 'Önceki gol iptal (-100 puan)' },
    optionB: { label: 'İTİRAZ ET', description: 'Rakip golü iptal (+100 puan)' },
  },
  {
    id: 'evt_moral_boost', category: 'moral', icon: '🎤', title: 'Takım Toplantısı',
    description: 'Oyuncular bir araya geldi.',
    optionA: { label: 'MOTİVE ET', description: 'Moral +15' },
    optionB: { label: 'ANTRENMAN', description: 'Sonraki maç +50 puan' },
  },
  {
    id: 'evt_scout', category: 'transfer', icon: '🔍', title: 'Scout Raporu',
    description: 'Scout yeni bir oyuncu öneriyor.',
    optionA: { label: 'İMZALA', description: 'Orta rating oyuncu eklenir' },
    optionB: { label: 'BEKLE', description: 'Moral +8' },
  },
  {
    id: 'evt_yildiz_sozlesme', category: 'transfer', icon: '📝', title: 'Yıldız Sözleşmesi',
    description: 'Yıldız oyuncu prim istiyor.',
    optionA: { label: 'ÖDE', description: 'Skor -80 · Oyuncu kalır' },
    optionB: { label: 'PAZARLIK', description: 'Moral +12' },
  },
  {
    id: 'evt_diger_kulup', category: 'transfer', icon: '👀', title: 'Gizli Gözlem',
    description: 'Rakip kulüp kadronu izliyor.',
    optionA: { label: 'SAT', description: 'En zayıf oyuncu gider' },
    optionB: { label: 'KORU', description: 'Moral +10' },
  },
  {
    id: 'evt_acemi_hata', category: 'transfer', icon: '😬', title: 'Acemi Hatası',
    description: 'Genç oyuncu antrenmanda büyük hata yaptı.',
    optionA: { label: 'CEZALANDIR', description: 'Moral -8' },
    optionB: { label: 'DESTEKLE', description: 'Sonraki maç +40 bonus' },
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
    optionA: { label: 'VEDA ET', description: 'Moral +20 · Son maçları' },
    optionB: { label: 'DEVAM', description: 'Oyuncu ayrılır · Slot açılır' },
  },
  {
    id: 'evt_sponsor', category: 'transfer', icon: '💼', title: 'Sponsor Etkinliği',
    description: 'Ana sponsor takımla etkinlik istiyor.',
    optionA: { label: 'KATIL', description: '+120 puan' },
    optionB: { label: 'REDDET', description: 'Antrenman · Moral -5' },
  },
  {
    id: 'evt_menajer_krizi', category: 'transfer', icon: '🤝', title: 'Menajer Krizi',
    description: 'Menajer başka kulübe transfer baskısı yapıyor.',
    optionA: { label: 'AYIR', description: 'Oyuncu gider' },
    optionB: { label: 'TUT', description: 'Moral +8' },
  },
  {
    id: 'evt_antrenman_camp', category: 'taktik', icon: '⛺', title: 'Kamp Haftası',
    description: 'Teknik direktör yoğun kamp istiyor.',
    optionA: { label: 'KAMP', description: 'Sonraki maç +70 bonus' },
    optionB: { label: 'HAFİF', description: 'Moral -6 · Dinlenme' },
  },
  {
    id: 'evt_kaleci_hata', category: 'taktik', icon: '🧤', title: 'Kaleci Hatası',
    description: 'Kaleci son antrenmanda kritik hata yaptı.',
    optionA: { label: 'ELEŞTİR', description: 'Moral -12' },
    optionB: { label: 'DESTEKLE', description: 'Sonraki maç +60 bonus' },
  },
  {
    id: 'evt_penalti_antrenman', category: 'taktik', icon: '🎯', title: 'Penaltı Antrenmanı',
    description: 'Penaltı performansı düşük.',
    optionA: { label: 'ÇALIŞ', description: 'Sonraki maç +90 bonus' },
    optionB: { label: 'ATLA', description: 'Moral +5' },
  },
  {
    id: 'evt_korner_taktik', category: 'taktik', icon: '📐', title: 'Korner Taktikleri',
    description: 'Set piece koçu yeni varyasyon öneriyor.',
    optionA: { label: 'UYGULA', description: 'Sonraki maç +55 bonus' },
    optionB: { label: 'STANDART', description: 'Moral +4' },
  },
  {
    id: 'evt_yagmur', category: 'taktik', icon: '🌧️', title: 'Yağmur Uyarısı',
    description: 'Maç yağmurda oynanacak.',
    optionA: { label: 'FİZİKSEL', description: 'GÜÇLÜ/HIZLI bonus' },
    optionB: { label: 'TEKNİK', description: 'TEKNİK bonus' },
  },
  {
    id: 'evt_ofsayt', category: 'taktik', icon: '🚩', title: 'Ofsayt Tuzağı',
    description: 'Rakip ofsayt tuzağı kuruyor.',
    optionA: { label: 'HAZIRLAN', description: 'Sonraki maç +55 bonus' },
    optionB: { label: 'NORMAL', description: 'Moral +4' },
  },
  {
    id: 'evt_kontratak', category: 'taktik', icon: '⚡', title: 'Kontra Antrenmanı',
    description: 'Hızlı çıkışlar üzerine çalışılacak.',
    optionA: { label: 'AGRESİF', description: 'Risk + ödül +95 bonus' },
    optionB: { label: 'DENGELİ', description: 'Moral +7' },
  },
  {
    id: 'evt_kirmizi_forma', category: 'taktik', icon: '🟥', title: 'Agresif Plan',
    description: 'Sert oyun planı tartışılıyor.',
    optionA: { label: 'SERT OYNA', description: 'Risk · +70 bonus' },
    optionB: { label: 'DİSİPLİN', description: 'Moral +6' },
  },
  {
    id: 'evt_sicak_hava', category: 'fiziksel', icon: '☀️', title: 'Sıcak Hava',
    description: '40°C sıcaklık uyarısı var.',
    optionA: { label: 'TEMPO', description: 'Yüksek tempo riski' },
    optionB: { label: 'YAVAŞ', description: 'Moral +6' },
  },
  {
    id: 'evt_soguk_hava', category: 'fiziksel', icon: '❄️', title: 'Soğuk Hava',
    description: 'Donma riski olan hava koşulları.',
    optionA: { label: 'DEVAM', description: 'Moral -4' },
    optionB: { label: 'ISINMA', description: 'Sonraki maç +35 bonus' },
  },
  {
    id: 'evt_deplasman', category: 'fiziksel', icon: '✈️', title: 'Uzun Deplasman',
    description: '12 saatlik yolculuk var.',
    optionA: { label: 'HEMEN GİT', description: 'Moral -8' },
    optionB: { label: 'ERKEN GİT', description: '+80 puan · Dinlenme' },
  },
  {
    id: 'evt_doktor', category: 'fiziksel', icon: '🏥', title: 'Sağlık Kontrolü',
    description: 'Takım doktoru tam kontrol istiyor.',
    optionA: { label: 'KONTROL', description: 'Moral +8' },
    optionB: { label: 'ATLA', description: 'Acele dönüş riski' },
  },
  {
    id: 'evt_fizyoterapist', category: 'fiziksel', icon: '💆', title: 'Fizyoterapi',
    description: 'Yoğun maç temposu kasları yordu.',
    optionA: { label: 'SEANS', description: 'Moral +6' },
    optionB: { label: 'ANTRENMAN', description: 'Sonraki maç +30 bonus' },
  },
  {
    id: 'evt_yedek_kaleci', category: 'fiziksel', icon: '🥅', title: 'Kaleci Sakatlığı',
    description: '1. kaleci hafif sakat.',
    optionA: { label: 'RİSKE GİR', description: 'Moral -7' },
    optionB: { label: 'YEDEK', description: 'Sonraki maç +45 bonus' },
  },
  {
    id: 'evt_havaalanı', category: 'fiziksel', icon: '🛫', title: 'Uçuş Gecikmesi',
    description: 'Deplasman uçuşu gecikti.',
    optionA: { label: 'BEKLE', description: 'Moral -5' },
    optionB: { label: 'ÖZEL UÇAK', description: '+70 puan' },
  },
  {
    id: 'evt_derbi', category: 'moral', icon: '🔥', title: 'Derbi Haftası',
    description: 'Şehir derbisi yaklaşıyor.',
    optionA: { label: 'ATEŞLE', description: 'Risk · +120 bonus' },
    optionB: { label: 'SAKİN', description: 'Moral +8' },
  },
  {
    id: 'evt_social_media', category: 'moral', icon: '📱', title: 'Sosyal Medya',
    description: 'Taraftarlar sosyal medyada baskı yapıyor.',
    optionA: { label: 'SESSİZ', description: 'Odak korundu' },
    optionB: { label: 'YANITLA', description: 'Moral +15' },
  },
  {
    id: 'evt_tv_program', category: 'moral', icon: '📺', title: 'TV Programı',
    description: 'Ulusal kanal takımı davet ediyor.',
    optionA: { label: 'KATIL', description: 'Moral +18' },
    optionB: { label: 'REDDET', description: 'Antrenman +40 bonus' },
  },
  {
    id: 'evt_psikolog', category: 'moral', icon: '🧠', title: 'Spor Psikoloğu',
    description: 'Mental destek öneriliyor.',
    optionA: { label: 'SEANS', description: 'Moral +14' },
    optionB: { label: 'ANTRENMAN', description: '+60 puan' },
  },
  {
    id: 'evt_aile', category: 'moral', icon: '👨‍👩‍👧', title: 'Aile Sorunu',
    description: 'Bir oyuncunun ailevi problemi var.',
    optionA: { label: 'DEVAM', description: 'Moral -10' },
    optionB: { label: 'İZİN VER', description: 'Oyuncu gider · Moral +5' },
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
    optionA: { label: 'KABUL', description: 'Moral -8' },
    optionB: { label: 'KAPALI ANT.', description: 'Sonraki maç +40 bonus' },
  },
  {
    id: 'evt_ceza', category: 'ozel', icon: '⚖️', title: 'Federasyon Cezası',
    description: 'Disiplin kurulu para cezası kesti.',
    optionA: { label: 'ÖDE', description: 'Skor -150' },
    optionB: { label: 'İTİRAZ', description: 'Moral -5' },
  },
  {
    id: 'evt_bonus', category: 'ozel', icon: '💵', title: 'Galibiyet Primi',
    description: 'Yönetim galibiyet primi teklif ediyor.',
    optionA: { label: 'DAĞIT', description: 'Moral +10' },
    optionB: { label: 'BİRİKTİR', description: '+200 puan' },
  },
  {
    id: 'evt_kupa', category: 'ozel', icon: '🏆', title: 'Kupa Kurası',
    description: 'Kupada güçlü rakip çıktı.',
    optionA: { label: 'HEYECAN', description: 'Moral +10' },
    optionB: { label: 'HAZIRLAN', description: 'Sonraki maç +65 bonus' },
  },
  {
    id: 'evt_rakip_ispiyon', category: 'ozel', icon: '🕵️', title: 'Rakip İstihbarat',
    description: 'Rakip takımın oyun planı sızdırıldı.',
    optionA: { label: 'KULLAN', description: 'Sonraki maç +75 bonus' },
    optionB: { label: 'GÖRMEZDEN', description: 'Moral -3 · Etik' },
  },
  {
    id: 'evt_hakem_korkusu', category: 'ozel', icon: '🟨', title: 'Sert Hakem',
    description: 'Maçın hakemi kartları sever.',
    optionA: { label: 'KORK', description: 'Moral -6' },
    optionB: { label: 'ANALİZ', description: 'Sonraki maç +50 bonus' },
  },
  {
    id: 'evt_eksik_kadro', category: 'ozel', icon: '⚠️', title: 'Eksik Kadro',
    description: 'Birden fazla oyuncu cezalı/sakat.',
    optionA: { label: 'RİSKE GİR', description: 'Maç kaybı riski +25%' },
    optionB: { label: 'TRANSFER', description: 'Acil oyuncu eklenir' },
  },
  {
    id: 'evt_uzatma', category: 'ozel', icon: '⏱️', title: 'Uzatma Hazırlığı',
    description: 'Kupada uzatma ihtimali yüksek.',
    optionA: { label: 'HAZIRLAN', description: 'Risk · +85 bonus' },
    optionB: { label: 'NORMAL', description: 'Moral +5' },
  },
  {
    id: 'evt_ceza_sahasi', category: 'ozel', icon: '📦', title: 'Ceza Sahası Kaosu',
    description: 'Son maçlarda ceza sahasında gol yedin.',
    optionA: { label: 'ÇALIŞ', description: 'Sonraki maç +60 bonus' },
    optionB: { label: 'ATLA', description: 'Moral +3' },
  },
  {
    id: 'evt_sampiyonluk_baskisi', category: 'ozel', icon: '👑', title: 'Şampiyonluk Baskısı',
    description: 'Basın şampiyonluk konuşmaya başladı.',
    optionA: { label: 'BASKI', description: 'Büyük risk · +150 bonus' },
    optionB: { label: 'SAKİN', description: 'Moral +10' },
  },
  {
    id: 'evt_tesis', category: 'ozel', icon: '🏟️', title: 'Yeni Tesis',
    description: 'Kulüp antrenman tesisini yeniledi.',
    optionA: { label: 'KUTLA', description: 'Moral +12' },
    optionB: { label: 'ANTRENMAN', description: '+100 puan' },
  },
  {
    id: 'evt_legend_ziyaret', category: 'ozel', icon: '⭐', title: 'Efsane Ziyareti',
    description: 'Kulüp efsanesi antrenmana geldi.',
    optionA: { label: 'DİNLE', description: 'Moral +25' },
    optionB: { label: 'ODAK', description: '+80 puan' },
  },
];

export const EVENT_ROUNDS = [4, 8, 12] as const;

export function isEventRound(round: number): boolean {
  return EVENT_ROUNDS.includes(round as (typeof EVENT_ROUNDS)[number]);
}

export function getEventById(id: string): EventCard | undefined {
  return EVENT_CARDS.find((e) => e.id === id);
}

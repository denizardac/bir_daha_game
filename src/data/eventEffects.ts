import type { EventOutcome } from '@/engine/events';

type Pair = [EventOutcome, EventOutcome];

const e = (
  a: Partial<EventOutcome> & Pick<EventOutcome, 'description'>,
  b: Partial<EventOutcome> & Pick<EventOutcome, 'description'>,
): Pair => [
  { moraleDelta: 0, scoreDelta: 0, ...a },
  { moraleDelta: 0, scoreDelta: 0, ...b },
];

export const EVENT_EFFECTS: Record<string, Pair> = {
  evt_transfer_teklif: e(
    { removeWeakest: true, grantRerolls: 3, description: 'Yıldız oyuncu satıldı — ekstra çek hakkı.' },
    { moraleDelta: 15, description: 'Teklif reddedildi — takım birlikte kaldı, moral yükseldi.' },
  ),
  evt_genc_yetenek: e(
    { addYouth: true, description: 'Genç yetenek kadroya katıldı.' },
    { scoreDelta: 150, description: 'Yetenek reddedildi, puan bonusu alındı.' },
  ),
  evt_kavga: e(
    { removeWeakest: true, moraleDelta: 5, description: 'Kavga eden oyuncu ayrıldı.' },
    { moraleDelta: -10, description: 'İkisi de kaldı ama moral düştü.' },
  ),
  evt_formasyon: e(
    { moraleDelta: -10, description: 'Formasyon değişti, hazırlıksızlık.' },
    { nextMatchBonus: 100, description: 'Sistem korundu, risk alındı.' },
  ),
  evt_saha: e(
    { nextMatchBonus: 50, description: 'Direkt oyun tercih edildi.' },
    { nextMatchBonus: 50, description: 'Teknik oyun tercih edildi.' },
  ),
  evt_kaptan: e(
    { nextMatchBonus: 175, nextMatchRisk: 0.18, description: 'Kaptan oynatıldı — yüksek ödül, orta risk.' },
    { moraleDelta: 10, description: 'Kaptan dinlendirildi.' },
  ),
  evt_basin: e(
    { description: 'Sessiz kalındı.' },
    { moraleDelta: 20, description: 'Basına cevap verildi.' },
  ),
  evt_taraftar: e(
    { nextMatchBonus: 90, nextMatchRisk: 0.2, description: 'Hücuma ağırlık — bonus ve kontrollü risk.' },
    { moraleDelta: 5, description: 'Savunmada kalındı.' },
  ),
  evt_sakatlik: e(
    { moraleDelta: -5, tempRatingDelta: -5, description: 'Yıldız yedekle oynadı — rating −5 (1 maç).' },
    { removeWeakest: true, description: 'Zorunlu değişiklik yapıldı.' },
  ),
  evt_yorgunluk: e(
    { moraleDelta: -3, description: 'Rotasyon yapıldı.' },
    { nextMatchRisk: 0.22, moraleDelta: -8, description: 'Yorgunlar oynatıldı — maç zorlaşır.' },
  ),
  evt_zehir: e(
    { moraleDelta: -10, description: 'Etkilenenlerle devam.' },
    { moraleDelta: 5, description: 'Yedeklerle devam.' },
  ),
  evt_efsane_konusma: e(
    { moraleDelta: 30, description: 'Efsane dinlendi — soyunma odası ayağa kalktı, moral patladı.' },
    { scoreDelta: 50, description: 'Kısa teşekkür edildi, antrenmana dönüldü.' },
  ),
  evt_var: e(
    { scoreDelta: -100, description: 'Gol iptal edildi.' },
    { scoreDelta: 100, description: 'Rakip golü iptal!' },
  ),
  evt_moral_boost: e(
    { moraleDelta: 15, description: 'Takım motive edildi.' },
    { nextMatchBonus: 50, description: 'Ekstra antrenman.' },
  ),
  evt_scout: e(
    { addYouth: true, description: 'Scout önerisi kabul edildi.' },
    { moraleDelta: 8, description: 'Scout bekletildi.' },
  ),
  evt_yildiz_sozlesme: e(
    { scoreDelta: -80, description: 'Prim ödendi, bütçe daraldı.' },
    { moraleDelta: 12, description: 'Yıldız mutlu, moral arttı.' },
  ),
  evt_diger_kulup: e(
    { removeWeakest: true, description: 'Oyuncu gitti, kadro inceldi.' },
    { moraleDelta: 10, description: 'Takım birlikte kaldı.' },
  ),
  evt_acemi_hata: e(
    { moraleDelta: -8, description: 'Gençler etkilendi.' },
    { nextMatchBonus: 40, description: 'Hata analizi yapıldı.' },
  ),
  evt_kiralik: e(
    { addYouth: true, description: 'Kiralık oyuncu geldi.' },
    { scoreDelta: 100, description: 'Transfer iptal, puan bonusu.' },
  ),
  evt_emekli: e(
    { moraleDelta: 20, description: 'Veda konuşması moral patlattı.' },
    { removeWeakest: true, description: 'Emekli ayrıldı, slot açıldı.' },
  ),
  evt_sponsor: e(
    { scoreDelta: 120, description: 'Sponsor etkinliği puan getirdi.' },
    { moraleDelta: -5, description: 'Antrenman kaçırıldı.' },
  ),
  evt_antrenman_camp: e(
    { nextMatchBonus: 70, description: 'Kamp formu yükseldi.' },
    { moraleDelta: -6, description: 'Yorgunluk arttı.' },
  ),
  evt_kaleci_hata: e(
    { moraleDelta: -12, tempRatingDelta: -4, description: 'Kaleci özgüveni düştü — KL rating −4 (1 maç).' },
    { nextMatchBonus: 60, description: 'Ekstra kaleci antrenmanı.' },
  ),
  evt_penalti_antrenman: e(
    { nextMatchBonus: 90, description: 'Penaltı hazırlığı tamam.' },
    { moraleDelta: 5, description: 'Normal antrenman.' },
  ),
  evt_korner_taktik: e(
    { nextMatchBonus: 55, description: 'Korner taktikleri hazır.' },
    { moraleDelta: 4, description: 'Standart antrenman.' },
  ),
  evt_yagmur: e(
    { nextMatchBonus: 45, description: 'Yağmur futbolu tercih edildi.' },
    { nextMatchBonus: 45, description: 'Teknik oyun tercih edildi.' },
  ),
  evt_sicak_hava: e(
    { nextMatchBonus: 35, nextMatchRisk: 0.12, description: 'Yüksek tempo — küçük bonus, hafif risk.' },
    { moraleDelta: 6, description: 'Yavaş tempo, moral korundu.' },
  ),
  evt_soguk_hava: e(
    { moraleDelta: -4, description: 'Soğuk etkiledi.' },
    { nextMatchBonus: 35, description: 'Isınma programı uygulandı.' },
  ),
  evt_deplasman: e(
    { moraleDelta: -8, description: 'Yol yorgunluğu.' },
    { scoreDelta: 80, description: 'Erken gidiş, dinlenme bonusu.' },
  ),
  evt_derbi: e(
    { nextMatchBonus: 110, nextMatchRisk: 0.18, description: 'Derbi ateşi — dengeli risk/ödül.' },
    { moraleDelta: 8, description: 'Sakin kalındı.' },
  ),
  evt_social_media: e(
    { description: 'Sessiz kalındı.' },
    { moraleDelta: 15, description: 'Taraftarla etkileşim moral getirdi.' },
  ),
  evt_tv_program: e(
    { moraleDelta: 18, description: 'Medya ilgisi moral artırdı.' },
    { nextMatchBonus: 40, description: 'Odak antrenmanda kaldı.' },
  ),
  evt_ceza: e(
    { scoreDelta: -150, description: 'Para cezası skordan düşüldü.' },
    { moraleDelta: -5, description: 'İtiraz edildi, moral düştü.' },
  ),
  evt_bonus: e(
    { moraleDelta: 10, description: 'Prim dağıtıldı.' },
    { scoreDelta: 200, description: 'Prim biriktirildi.' },
  ),
  evt_doktor: e(
    { moraleDelta: 8, description: 'Sağlık kontrolü tamam.' },
    { nextMatchBonus: 25, nextMatchRisk: 0.08, description: 'Acele dönüş — küçük bonus, düşük risk.' },
  ),
  evt_fizyoterapist: e(
    { moraleDelta: 6, description: 'Fiziksel toparlanma.' },
    { nextMatchBonus: 30, description: 'Ekstra seans atlandı.' },
  ),
  evt_psikolog: e(
    { moraleDelta: 14, description: 'Mental destek alındı.' },
    { scoreDelta: 60, description: 'Seans ertelendi, antrenman.' },
  ),
  evt_aile: e(
    { moraleDelta: -10, description: 'Aile sorunu moral düşürdü.' },
    { removeWeakest: true, moraleDelta: 5, description: 'Oyuncu izin aldı.' },
  ),
  evt_dogum_gunu: e(
    { moraleDelta: 12, description: 'Kutlama moral getirdi.' },
    { nextMatchBonus: 25, description: 'Kutlama kısa tutuldu.' },
  ),
  evt_kupa: e(
    { moraleDelta: 10, description: 'Kupa heyecanı.' },
    { nextMatchBonus: 65, description: 'Kupa maçına hazırlık.' },
  ),
  evt_rakip_ispiyon: e(
    { nextMatchBonus: 75, description: 'Karşı takım analiz edildi.' },
    { moraleDelta: -3, description: 'İspiyon skandalı moral düşürdü.' },
  ),
  evt_hakem_korkusu: e(
    { moraleDelta: -6, description: 'Hakem korkusu yayıldı.' },
    { nextMatchBonus: 50, description: 'Hakem analizi yapıldı.' },
  ),
  evt_taraftar_koreografi: e(
    { moraleDelta: 16, description: 'Tribün desteği moral patlattı.' },
    { nextMatchBonus: 40, description: 'Odak maçta kaldı.' },
  ),
  evt_eksik_kadro: e(
    { nextMatchBonus: 45, nextMatchRisk: 0.2, description: 'Eksik kadroyla devam — zor maç, moral bonusu yok.' },
    { addYouth: true, description: 'Acil transfer yapıldı.' },
  ),
  evt_yedek_kaleci: e(
    { moraleDelta: -7, description: '1. kaleci sakat, moral düştü.' },
    { nextMatchBonus: 45, description: 'Yedek kaleci hazırlandı.' },
  ),
  evt_uzatma: e(
    { nextMatchBonus: 90, nextMatchRisk: 0.14, description: 'Uzatma taktikleri — orta risk.' },
    { moraleDelta: 5, description: 'Normal tempo.' },
  ),
  evt_ceza_sahasi: e(
    { nextMatchBonus: 60, description: 'Ceza sahası çalışması.' },
    { moraleDelta: 3, description: 'Hafif antrenman.' },
  ),
  evt_ofsayt: e(
    { nextMatchBonus: 55, description: 'Ofsayt tuzağı hazır.' },
    { moraleDelta: 4, description: 'Basit antrenman.' },
  ),
  evt_kontratak: e(
    { nextMatchBonus: 100, nextMatchRisk: 0.17, description: 'Kontra taktikleri — hızlı ödül, orta risk.' },
    { moraleDelta: 7, description: 'Dengeli hazırlık.' },
  ),
  evt_sampiyonluk_baskisi: e(
    { nextMatchRisk: 0.24, nextMatchBonus: 125, description: 'Baskı altında büyük risk — yine de ödüllü.' },
    { moraleDelta: 10, description: 'Baskı yönetildi.' },
  ),
  evt_menajer_krizi: e(
    { removeWeakest: true, description: 'Menajer oyuncuyu götürdü.' },
    { moraleDelta: 8, description: 'Kriz yönetildi.' },
  ),
  evt_tesis: e(
    { moraleDelta: 12, description: 'Yeni tesis moral getirdi.' },
    { scoreDelta: 100, description: 'Bütçe antrenmana aktarıldı.' },
  ),
  evt_havaalanı: e(
    { moraleDelta: -5, description: 'Gecikme moral düşürdü.' },
    { scoreDelta: 70, description: 'Özel uçak, dinlenme bonusu.' },
  ),
  evt_legend_ziyaret: e(
    { moraleDelta: 25, description: 'Efsane ziyareti moral patlattı.' },
    { scoreDelta: 80, description: 'Antrenman odaklı geçildi.' },
  ),
  evt_kirmizi_forma: e(
    { nextMatchBonus: 75, nextMatchRisk: 0.15, description: 'Agresif oyun planı — kontrollü risk.' },
    { moraleDelta: 6, description: 'Disiplinli oyun.' },
  ),
  evt_sessiz_stadyum: e(
    { moraleDelta: -8, description: 'Boş tribün moral düşürdü.' },
    { nextMatchBonus: 40, description: 'Kapalı antrenman.' },
  ),
};

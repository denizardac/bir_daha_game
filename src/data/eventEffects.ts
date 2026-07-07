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
    { removeWeakest: true, grantRerolls: 3, scoreDelta: 220, description: 'Yıldız yüksek bonservisle satıldı — büyük gelir + ekstra çek hakkı.' },
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
    { nextMatchBonus: 100, moraleDelta: -8, description: 'Yeni formasyona geçildi — rakibe uyum ama hazırlıksızlık morali düşürdü.' },
    { moraleDelta: 8, scoreDelta: 25, description: 'Sisteme sadık kalındı — takım rahat, küçük gelir.' },
  ),
  evt_saha: e(
    { conditionalBonus: { tags: ['GÜÇLÜ', 'HIZLI'], perTag: 18, base: 20, cap: 110 }, description: 'Direkt oyun — fiziksel oyuncular öne çıktı.' },
    { conditionalBonus: { tags: ['TEKNİK'], perTag: 26, base: 20, cap: 110 }, description: 'Teknik oyun — pas ustaları öne çıktı.' },
  ),
  evt_kaptan: e(
    { nextMatchBonus: 175, nextMatchRisk: 0.18, description: 'Kaptan oynatıldı — yüksek ödül, orta risk.' },
    { moraleDelta: 10, description: 'Kaptan dinlendirildi.' },
  ),
  evt_basin: e(
    { scoreDelta: 35, description: 'Sessiz kalındı — takım gürültüye aldırmadan odaklandı (+35 puan).' },
    { moraleDelta: 20, description: 'Basına cevap verildi.' },
  ),
  evt_taraftar: e(
    { nextMatchBonus: 90, nextMatchRisk: 0.2, description: 'Hücuma ağırlık — bonus ve kontrollü risk.' },
    { moraleDelta: 5, description: 'Savunmada kalındı.' },
  ),
  evt_sakatlik: e(
    { moraleDelta: -5, tempRatingDelta: -5, description: 'Sakat oyuncu iğneyle oynadı — rating -5 (1 maç), moral düştü.' },
    { removeWeakest: true, description: 'Sakat oyuncu kadrodan çıkarıldı, slot boşaldı.' },
  ),
  evt_yorgunluk: e(
    { moraleDelta: 6, scoreDelta: 10, description: 'Rotasyon yapıldı — takım dinlendi, moral toparladı.' },
    { nextMatchBonus: 70, nextMatchRisk: 0.22, moraleDelta: -6, description: 'Yorgun oyuncular zorlandı — kısa vadeli güç, yüksek maç riski.' },
  ),
  evt_zehir: e(
    { moraleDelta: -6, scoreDelta: 40, description: 'Etkilenenler dişini sıktı — moral düştü ama mücadele puanı.' },
    { moraleDelta: 8, nextMatchRisk: 0.12, description: 'Yedeklerle devam — moral korundu ama deneyimsiz kadro riski.' },
  ),
  evt_efsane_konusma: e(
    { moraleDelta: 30, description: 'Efsane dinlendi — soyunma odası ayağa kalktı, moral patladı.' },
    { scoreDelta: 50, description: 'Kısa teşekkür edildi, antrenmana dönüldü.' },
  ),
  evt_var: e(
    { scoreDelta: -60, moraleDelta: 6, description: 'Karar kabul edildi — golden olundu ama centilmenlik takımı sakin tuttu.' },
    { scoreDelta: 90, nextMatchRisk: 0.15, description: 'İtiraz kazandı — rakip golü iptal, ama hakemle gerginlik sonraki maça risk.' },
  ),
  evt_moral_boost: e(
    { moraleDelta: 15, description: 'Takım motive edildi.' },
    { nextMatchBonus: 50, description: 'Ekstra antrenman.' },
  ),
  evt_scout: e(
    { addYouth: true, description: 'Scout önerisi kabul edildi.' },
    { grantRerolls: 1, scoreDelta: 40, description: 'Scout beklerken alternatif isimler buldu — +1 çek hakkı, küçük gelir.' },
  ),
  evt_yildiz_sozlesme: e(
    { scoreDelta: -80, moraleDelta: 16, description: 'Prim ödendi — bütçe daraldı ama yıldız çok mutlu, moral yükseldi.' },
    { scoreDelta: 40, moraleDelta: -8, description: 'Pazarlıkla daha az ödendi — kasa korundu ama yıldız küstü.' },
  ),
  evt_diger_kulup: e(
    { removeWeakest: true, scoreDelta: 160, description: 'Oyuncu satıldı — kadro inceldi ama transfer geliri (+160 puan).' },
    { nextMatchBonus: 55, moraleDelta: 4, description: 'Oyuncu kalmaya ikna edildi — motive, sonraki maç +55.' },
  ),
  evt_acemi_hata: e(
    { nextMatchBonus: 50, moraleDelta: -6, description: 'Sert ceza — ders alındı, keskinlik arttı ama gençler gerildi.' },
    { moraleDelta: 10, description: 'Genç desteklendi — güven tazelendi, moral arttı.' },
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
    { scoreDelta: 120, moraleDelta: -8, description: 'Sponsor çekimi gelir getirdi ama antrenman bölündü.' },
    { moraleDelta: 14, nextMatchBonus: 20, description: 'Çekim reddedildi — takım antrenmana odaklandı.' },
  ),
  evt_antrenman_camp: e(
    { nextMatchBonus: 70, moraleDelta: -8, description: 'Sıkı kamp — form yükseldi ama yorgunluk morali düşürdü.' },
    { moraleDelta: 14, description: 'Hafif kamp — takım dinlendi, moral arttı.' },
  ),
  evt_kaleci_hata: e(
    { moraleDelta: -10, nextMatchBonus: 40, description: 'Sert eleştiri — kaleci toparlanmak için ekstra çalıştı ama moral düştü.' },
    { moraleDelta: 12, description: 'Kaleciye güven verildi — özgüven geri geldi, moral arttı.' },
  ),
  evt_penalti_antrenman: e(
    { nextMatchBonus: 85, moraleDelta: -5, description: 'Yoğun penaltı çalışması — hazır ama yorucu.' },
    { moraleDelta: 14, scoreDelta: 30, description: 'Keyifli seans — moral ve küçük puan.' },
  ),
  evt_korner_taktik: e(
    { nextMatchBonus: 55, moraleDelta: -4, description: 'Korner taktiği çalışıldı — hazır ama yorucu.' },
    { moraleDelta: 12, description: 'Rahat antrenman — moral arttı.' },
  ),
  evt_yagmur: e(
    { conditionalBonus: { tags: ['GÜÇLÜ', 'HIZLI'], perTag: 16, base: 15, cap: 100 }, description: 'Yağmur futbolu — fiziksel oyuncular zeminden faydalandı.' },
    { conditionalBonus: { tags: ['TEKNİK'], perTag: 24, base: 15, cap: 100 }, description: 'Teknik oyun — top kontrolü öne çıktı.' },
  ),
  evt_sicak_hava: e(
    { nextMatchBonus: 40, nextMatchRisk: 0.12, description: 'Yüksek tempo — bonus ama hafif sakatlık riski.' },
    { moraleDelta: 10, scoreDelta: 15, description: 'Yavaş tempo — moral korundu, küçük gelir.' },
  ),
  evt_soguk_hava: e(
    { scoreDelta: 45, moraleDelta: -4, description: 'Soğukta devam edildi — zorlu ama anlık odak puanı.' },
    { nextMatchBonus: 40, description: 'Isınma programı uygulandı — sonraki maça hazır.' },
  ),
  evt_deplasman: e(
    { nextMatchBonus: 50, moraleDelta: -6, description: 'Erken çıkıldı — yorucu ama sahaya erken alışma (+50).' },
    { scoreDelta: 40, moraleDelta: 8, description: 'Konforlu yolculuk — takım dinç, küçük gelir.' },
  ),
  evt_derbi: e(
    { nextMatchBonus: 110, nextMatchRisk: 0.18, description: 'Derbi ateşi — dengeli risk/ödül.' },
    { moraleDelta: 8, description: 'Sakin kalındı.' },
  ),
  evt_social_media: e(
    { scoreDelta: 25, description: 'Sessiz kalındı — dikkat dağılmadı, odak korundu (+25 puan).' },
    { moraleDelta: 15, description: 'Taraftarla etkileşim moral getirdi.' },
  ),
  evt_tv_program: e(
    { moraleDelta: 18, description: 'Medya ilgisi moral artırdı.' },
    { nextMatchBonus: 40, description: 'Odak antrenmanda kaldı.' },
  ),
  evt_ceza: e(
    { scoreDelta: -70, description: 'Ceza ödendi — puan kaybı ama mesele anında kapandı.' },
    { scoreDelta: -25, moraleDelta: -12, nextMatchRisk: 0.1, description: 'İtiraz edildi — daha ucuz ama süreç gerginlik ve maç riski getirdi.' },
  ),
  evt_bonus: e(
    { moraleDelta: 20, scoreDelta: 30, description: 'Prim dağıtıldı — moral patladı, küçük puan.' },
    { scoreDelta: 200, moraleDelta: -8, description: 'Prim biriktirildi — büyük puan ama oyuncular hayal kırıklığı.' },
  ),
  evt_doktor: e(
    { moraleDelta: 8, description: 'Sağlık kontrolü tamam.' },
    { nextMatchBonus: 25, nextMatchRisk: 0.08, description: 'Acele dönüş — küçük bonus, düşük risk.' },
  ),
  evt_fizyoterapist: e(
    { moraleDelta: 12, description: 'Fiziksel toparlanma — takım dinç, moral arttı.' },
    { nextMatchBonus: 35, moraleDelta: -4, description: 'Ekstra seans — keskinlik ama yorucu.' },
  ),
  evt_psikolog: e(
    { moraleDelta: 22, description: 'Mental destek alındı — takım kafaca güçlendi.' },
    { scoreDelta: 50, moraleDelta: -4, description: 'Seans ertelendi — antrenmana odak ama gerginlik sürdü.' },
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
    { moraleDelta: 16, scoreDelta: 20, description: 'Kupa heyecanı — moral yükseldi, küçük gelir.' },
    { nextMatchBonus: 65, moraleDelta: -5, description: 'Kupa maçına yoğun hazırlık — bonus ama yorucu.' },
  ),
  evt_rakip_ispiyon: e(
    { nextMatchBonus: 75, moraleDelta: -4, description: 'Rakip analizi — avantaj ama gizli toplantı yordu.' },
    { moraleDelta: 12, scoreDelta: 25, description: 'Dürüst kalındı — saygı kazanıldı, moral ve küçük puan.' },
  ),
  evt_hakem_korkusu: e(
    { moraleDelta: 8, description: 'Hakem konusu kapatıldı — takım rahatladı, moral arttı.' },
    { nextMatchBonus: 50, moraleDelta: -6, description: 'Hakem analizi — hazırlık ama tedirginlik yarattı.' },
  ),
  evt_taraftar_koreografi: e(
    { moraleDelta: 16, description: 'Tribün desteği moral patlattı.' },
    { nextMatchBonus: 40, description: 'Odak maçta kaldı.' },
  ),
  evt_eksik_kadro: e(
    { nextMatchBonus: 70, nextMatchRisk: 0.2, description: 'Eksik kadroyla direnildi — büyük bonus ama zor maç riski.' },
    { addYouth: true, description: 'Acil transfer yapıldı — kadroya taze oyuncu.' },
  ),
  evt_yedek_kaleci: e(
    { nextMatchBonus: 45, nextMatchRisk: 0.15, description: 'Sakat 1. kaleci oynadı — tecrübe avantajı ama sakatlık riski.' },
    { moraleDelta: 8, description: 'Yedek kaleciye güvenildi — güvenli tercih, takım sakin.' },
  ),
  evt_uzatma: e(
    { nextMatchBonus: 90, nextMatchRisk: 0.14, description: 'Uzatma taktikleri — orta risk.' },
    { moraleDelta: 5, description: 'Normal tempo.' },
  ),
  evt_ceza_sahasi: e(
    { nextMatchBonus: 60, moraleDelta: -4, description: 'Ceza sahası çalışması — keskinlik ama yorucu.' },
    { moraleDelta: 12, description: 'Hafif antrenman — moral arttı.' },
  ),
  evt_ofsayt: e(
    { conditionalBonus: { tags: ['HIZLI'], perTag: 18, base: 25, cap: 95 }, description: 'Ofsayt tuzağı — hızlı oyuncular tuzağı deldi.' },
    { moraleDelta: 16, description: 'Basit antrenman — takım rahatladı.' },
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
    { removeWeakest: true, scoreDelta: 120, description: 'Menajer oyuncuyu götürdü — kadro inceldi ama tazminat (+120 puan).' },
    { scoreDelta: 70, moraleDelta: -6, description: 'Kriz bastırıldı — kadro korundu ama belirsizlik moral düşürdü.' },
  ),
  evt_tesis: e(
    { moraleDelta: 16, scoreDelta: 20, description: 'Yeni tesis — moral yükseldi, küçük gelir.' },
    { scoreDelta: 60, grantTag: 'DAYANIKLI', moraleDelta: -6, description: 'Kondisyon merkezi — bir oyuncu DAYANIKLI oldu, +60 puan, sıkı program yordu.' },
  ),
  evt_havaalanı: e(
    { nextMatchBonus: 35, moraleDelta: -4, description: 'Beklerken otelde taktik çalışıldı — sıkıcı ama hazırlık (+35).' },
    { scoreDelta: 70, moraleDelta: 4, description: 'Özel uçak — konforlu yolculuk, dinlenme.' },
  ),
  evt_legend_ziyaret: e(
    { moraleDelta: 18, grantTag: 'MENTOR', description: 'Efsane bir oyuncuya akıl hocalığı yaptı — MENTOR kazandırdı, moral +18.' },
    { scoreDelta: 80, description: 'Antrenman odaklı geçildi.' },
  ),
  evt_kirmizi_forma: e(
    { nextMatchBonus: 75, nextMatchRisk: 0.15, description: 'Agresif oyun planı — kontrollü risk.' },
    { moraleDelta: 6, description: 'Disiplinli oyun.' },
  ),
  evt_sessiz_stadyum: e(
    { moraleDelta: 8, description: 'Takım kendi içinde motive oldu — moral korundu.' },
    { nextMatchBonus: 45, moraleDelta: -6, description: 'Kapalı sıkı antrenman — hazır ama moral düştü.' },
  ),
};

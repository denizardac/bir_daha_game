/** Rehberde gizli sinerjiler için tam koşul yerine kısa ipuçları */
export const SYNERGY_GUIDE_HINTS: Record<string, { teaser: string; tags?: string[] }> = {
  synergy_kontr_atiligi: { teaser: 'Hızlı oyuncuları çoğalt — kontra gücü artar.', tags: ['HIZLI'] },
  synergy_ruzgar_gibi: { teaser: '4+ hızlı oyuncu topla; gol çarpanı yükselir.', tags: ['HIZLI'] },
  synergy_kanatlar: { teaser: 'Sol ve sağ kanatta hızlı oyuncular gerekir.', tags: ['HIZLI', 'SLK', 'SÖK'] },
  synergy_topa_sahip: { teaser: 'Teknik oyuncuları bir araya getir.', tags: ['TEKNİK'] },
  synergy_mister_asist: { teaser: 'Asistçi tag\'li oyuncuları eşleştir.', tags: ['ASİSTÇİ'] },
  synergy_duran_top: { teaser: 'Duran top uzmanları aynı kadroda buluşmalı.', tags: ['SERBEST VURUŞ', 'PENALTI'] },
  synergy_akademi: { teaser: 'Mentor ile potansiyelli gençleri yan yana getir.', tags: ['MENTOR', 'POTANSİYEL'] },
  synergy_kaptan_modu: { teaser: 'Lider tag + yüksek moral birleşince güçlenir.', tags: ['LİDER'] },
  synergy_soyunma_odasi: { teaser: 'Kaptan, mentor ve soyunma odası tag\'leri birlikte.', tags: ['KAPİTAN', 'MENTOR', 'SOYUNMA ODASI'] },
  synergy_ev_sahibi: { teaser: 'Yerli oyuncu sayısını artır (5+).', tags: ['YERLİ'] },
  synergy_super_yabanci: { teaser: 'Tamamen yabancı yıldızlarla özel bir denge…', tags: ['YABANCI YILDIZ'] },
  synergy_karma_guc: { teaser: 'Yerli ve yabancı yıldızları dengeli tut (3+3).', tags: ['YERLİ', 'YABANCI YILDIZ'] },
  synergy_temiz_sayfa: { teaser: 'İyi kaleci + 2 stoper = demir savunma.', tags: ['KL', 'STP'] },
  synergy_uc_boyut: { teaser: 'Forvet ve kanatlarda finişör tag\'i aranır.', tags: ['FİNİŞÖR'] },
  synergy_saglam_orta: { teaser: 'Orta sahadan 2 oyuncu TEKNİK veya GÜÇLÜ.', tags: ['DOS', 'OS', 'OOS', 'TEKNİK', 'GÜÇLÜ'] },
  synergy_tanri_modu: { teaser: 'Kaptan + finişör + frikik, moral zirvede…', tags: ['KAPİTAN', 'FİNİŞÖR', 'SERBEST VURUŞ'] },
  synergy_firtina: { teaser: 'Hız, teknik ve asistçi tag\'lerinin fırtınası.', tags: ['HIZLI', 'TEKNİK', 'ASİSTÇİ'] },
  synergy_efsaneler: { teaser: 'Kadroda 3+ efsane kart topla.', tags: ['efsane'] },
  synergy_savasci_ruhu: { teaser: 'Savaşçı ruhlu oyuncu gerideyken parlar.', tags: ['SAVAŞÇI'] },
  synergy_altin_defans: { teaser: '2 güçlü stoper savunmayı kilitler.', tags: ['GÜÇLÜ', 'STP'] },
  synergy_yildiz_hucum: { teaser: 'Güçlü kanat ve forvet hattı kur.', tags: ['SF', 'SLK', 'SÖK'] },
  synergy_pas_motoru: { teaser: 'Asistçi ve teknik oyuncularla pas ağı.', tags: ['ASİSTÇİ', 'TEKNİK'] },
  synergy_demir_form: { teaser: 'Dayanıklı oyuncularla form kalkanı.', tags: ['DAYANIKLI'] },
  synergy_ucuz_kadro: { teaser: 'Gerileyen veteranlarla ucuz ama tecrübeli kadro.', tags: ['GERİLEYEN'] },
  synergy_rotasyon_ustasi: { teaser: 'Performans düşüşü + dayanıklı rotasyon.', tags: ['PERFORMANS DÜŞÜŞÜ', 'DAYANIKLI'] },
  synergy_tartismali_guc: { teaser: 'Tartışmalı karakter + liderlik dengesi.', tags: ['TARTIŞMALI', 'LİDER'] },
  synergy_soguk_kan: { teaser: 'Soğukkanlı oyuncularla baskı altında direnç.', tags: ['SOĞUKKANLI'] },
  synergy_yenisezon_patlama: { teaser: 'Yeni sezon gençleri + mentor patlaması.', tags: ['YENİ SEZON', 'MENTOR'] },
};

export function getSynergyGuideTeaser(id: string): string {
  return SYNERGY_GUIDE_HINTS[id]?.teaser ?? 'Run sırasında keşfedilince koşullar açılır.';
}

export function getSynergyGuideTags(id: string): string[] {
  return SYNERGY_GUIDE_HINTS[id]?.tags ?? [];
}

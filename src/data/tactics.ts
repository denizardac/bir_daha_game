import type { ActiveTactic, TacticCard } from '@/types';

export const TACTIC_CARDS: TacticCard[] = [
  { kind: 'tactic', id: 'tactic_433_kontr', name: '4-3-3 Kontra Atak', category: 'formasyon', description: 'Dengeli savunma · HIZLI oyuncular kontra bonusu', effectSummary: 'Savunma +6 · HIZLI +10' },
  { kind: 'tactic', id: 'tactic_442', name: '4-4-2 Klasik Denge', category: 'formasyon', description: 'Güvenli sistem — risk almadan oyna', effectSummary: 'Dengeli · her kadroya uygun' },
  { kind: 'tactic', id: 'tactic_352', name: '3-5-2 Yoğun Baskı', category: 'formasyon', description: 'Merkezi kalabalık tutar · hücum güçlü, arkası riskli', effectSummary: 'Hücum +24 · Savunma -2' },
  { kind: 'tactic', id: 'tactic_532', name: '5-3-2 Savunma Bloku', category: 'formasyon', description: 'Sağlam blok · gol yemez ama üretimi düşürür', effectSummary: 'Savunma +16 · Hücum -16' },
  { kind: 'tactic', id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', category: 'formasyon', description: 'TEKNİK oyunculara bonus · hafif hücum', effectSummary: 'TEKNİK +12 · Hücum +3' },
  { kind: 'tactic', id: 'tactic_343', name: '3-4-3 Tam Hücum', category: 'formasyon', description: 'Üçlü forvet baskısı · yüksek gol tehdidi, savunma riski', effectSummary: 'Hücum +18 · Savunma -18' },
  { kind: 'tactic', id: 'tactic_diamond', name: '4-1-2-1-2 Elmas', category: 'formasyon', description: 'Orta saha kontrolü · TEKNİK bonus, kanatlar sınırlı', effectSummary: 'TEKNİK +10 · Savunma -4' },
  { kind: 'tactic', id: 'tactic_4411', name: '4-4-1-1 İkinci Forvet', category: 'formasyon', description: 'Gölge forvet + golcü ikilisi · dengeli hücum', effectSummary: 'Hücum +7 · dengeli' },
  { kind: 'tactic', id: 'tactic_3412', name: '3-4-1-2 Çift Forvet', category: 'formasyon', description: 'İki santrafor + 10 numara · hücum güçlü, kanatlar riskli', effectSummary: 'Hücum +24 · Savunma -2' },
  { kind: 'tactic', id: 'tactic_451', name: '4-5-1 Yoğun Orta Saha', category: 'formasyon', description: 'Beş orta saha + tek forvet · savunma güvenli, gol kısır', effectSummary: 'Savunma +12 · Hücum -14' },
  { kind: 'tactic', id: 'tactic_yuksek_blok', name: 'Yüksek Press', category: 'sistem', description: 'Rakip yarı sahada baskı · topu kapıp hücum — arkaya koşu riski', effectSummary: 'Hücum +12 · HIZLI +8 · Savunma -8' },
  { kind: 'tactic', id: 'tactic_topla_oyn', name: 'Topla Oynama', category: 'sistem', description: 'TEKNİK oyuncu başına +8 puan/maç', effectSummary: 'TEKNİK ×8 puan/maç' },
  { kind: 'tactic', id: 'tactic_direkt', name: 'Direkt Futbol', category: 'sistem', description: 'HIZLI oyuncu başına +9 puan/maç', effectSummary: 'HIZLI ×9 puan/maç' },
  { kind: 'tactic', id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', category: 'sistem', description: 'Yorgunluk cezalarını engeller · dinç kadro moral +3/maç', effectSummary: 'Performans düşüşü yok · Moral +3/maç' },
  { kind: 'tactic', id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', category: 'sistem', description: 'Tek forvet FİNİŞÖR ise hücum +30%, değilse -15%', effectSummary: 'Tek forvet odaklı' },
  { kind: 'tactic', id: 'tactic_catenaccio', name: 'Alçak Blok (Catenaccio)', category: 'sistem', description: 'Geriye kapanıp kale kapatma · güvenli ama üretimi kısar', effectSummary: 'Savunma +18 · Hücum -16' },
  { kind: 'tactic', id: 'tactic_gegenpress', name: 'Gegenpress', category: 'sistem', description: 'Topu kaybedince anında geri kazan · hızlı kadro ister, arkası riskli', effectSummary: 'Hücum +12 · HIZLI +10 · Savunma -12' },
  { kind: 'tactic', id: 'tactic_tiki_taka', name: 'Tiki-Taka', category: 'sistem', description: 'Kısa pas hâkimiyeti · TEKNİK bonus, geçiş savunması riskli', effectSummary: 'TEKNİK +16 · Savunma -10' },
  { kind: 'tactic', id: 'tactic_park_bus', name: 'Otobüsü Çek (Park the Bus)', category: 'sistem', description: 'Tam savunma · gol yememeye oynar, hücum çok azalır', effectSummary: 'Savunma +22 · Hücum -24' },
  { kind: 'tactic', id: 'tactic_kanat_bindirme', name: 'Kanat Bindirmesi', category: 'sistem', description: 'Bekler ve kanatlar bindirir · HIZLI bonus, arkada boşluk', effectSummary: 'HIZLI +12 · Hücum +6 · Savunma -8' },
];

const TACTIC_EFFECTS: Record<string, ActiveTactic> = {
  tactic_433_kontr: { id: 'tactic_433_kontr', name: '4-3-3 Kontra Atak', description: 'Savunma +6, HIZLI +10', defenseMod: 6, fastBonus: 10 },
  tactic_442: { id: 'tactic_442', name: '4-4-2 Klasik Denge', description: 'Dengeli güvenli sistem' },
  tactic_352: { id: 'tactic_352', name: '3-5-2 Yoğun Baskı', description: 'Hücum +24, Savunma -2', attackMod: 24, defenseMod: -2 },
  tactic_532: { id: 'tactic_532', name: '5-3-2 Savunma Bloku', description: 'Savunma +16, Hücum -16', defenseMod: 16, attackMod: -16 },
  tactic_4231: { id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', description: 'TEKNİK +12, Hücum +3', technicalBonus: 12, attackMod: 3 },
  tactic_343: { id: 'tactic_343', name: '3-4-3 Tam Hücum', description: 'Hücum +18, Savunma -18', attackMod: 18, defenseMod: -18 },
  tactic_diamond: { id: 'tactic_diamond', name: '4-1-2-1-2 Elmas', description: 'TEKNİK +10, Savunma -4', technicalBonus: 10, defenseMod: -4 },
  tactic_4411: { id: 'tactic_4411', name: '4-4-1-1 İkinci Forvet', description: 'Hücum +7', attackMod: 7 },
  tactic_3412: { id: 'tactic_3412', name: '3-4-1-2 Çift Forvet', description: 'Hücum +24, Savunma -2', attackMod: 24, defenseMod: -2 },
  tactic_451: { id: 'tactic_451', name: '4-5-1 Yoğun Orta Saha', description: 'Savunma +12, Hücum -14', defenseMod: 12, attackMod: -14 },
  tactic_yuksek_blok: { id: 'tactic_yuksek_blok', name: 'Yüksek Press', description: 'Hücum +12, HIZLI +8, Savunma -8', attackMod: 12, fastBonus: 8, defenseMod: -8 },
  tactic_topla_oyn: { id: 'tactic_topla_oyn', name: 'Topla Oynama', description: 'TEKNİK bonus', technicalBonus: 8 },
  tactic_direkt: { id: 'tactic_direkt', name: 'Direkt Futbol', description: 'HIZLI bonus', fastBonus: 9 },
  tactic_rotasyon: { id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', description: 'Yorgunluk koruması, moral +3/maç', moralePerMatch: 3 },
  tactic_tekli_forvet: { id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', description: 'Tek forvet FİNİŞÖR koşullu' },
  tactic_catenaccio: { id: 'tactic_catenaccio', name: 'Alçak Blok (Catenaccio)', description: 'Savunma +18, Hücum -16', defenseMod: 18, attackMod: -16 },
  tactic_gegenpress: { id: 'tactic_gegenpress', name: 'Gegenpress', description: 'Hücum +12, HIZLI +10, Savunma -12', attackMod: 12, fastBonus: 10, defenseMod: -12 },
  tactic_tiki_taka: { id: 'tactic_tiki_taka', name: 'Tiki-Taka', description: 'TEKNİK +16, Savunma -10', technicalBonus: 16, defenseMod: -10 },
  tactic_park_bus: { id: 'tactic_park_bus', name: 'Otobüsü Çek (Park the Bus)', description: 'Savunma +22, Hücum -24', defenseMod: 22, attackMod: -24 },
  tactic_kanat_bindirme: { id: 'tactic_kanat_bindirme', name: 'Kanat Bindirmesi', description: 'HIZLI +12, Hücum +6, Savunma -8', fastBonus: 12, attackMod: 6, defenseMod: -8 },
};

export function getTacticEffect(id: string): ActiveTactic {
  return TACTIC_EFFECTS[id] ?? { id, name: 'Taktik', description: '' };
}

export function getTacticCard(id: string): TacticCard | undefined {
  return TACTIC_CARDS.find((t) => t.id === id);
}

export function getTacticCategory(id: string): 'formasyon' | 'sistem' | null {
  return getTacticCard(id)?.category ?? null;
}

export function cloneTactic(card: TacticCard): TacticCard {
  return { ...card };
}

import type { ActiveTactic, TacticCard } from '@/types';

export const TACTIC_CARDS: TacticCard[] = [
  { kind: 'tactic', id: 'tactic_433_kontr', name: '4-3-3 Kontra Atak', category: 'formasyon', description: 'Savunma güçlenir · HIZLI oyuncular ekstra bonus', effectSummary: 'Savunma +15 · HIZLI +20' },
  { kind: 'tactic', id: 'tactic_442', name: '4-4-2 Klasik Denge', category: 'formasyon', description: 'Güvenli sistem — risk almadan oyna', effectSummary: 'Dengeli · her kadroya uygun' },
  { kind: 'tactic', id: 'tactic_352', name: '3-5-2 Yoğun Baskı', category: 'formasyon', description: 'Hücum +20 · Savunma -15', effectSummary: 'Hücum +20 · Savunma -15' },
  { kind: 'tactic', id: 'tactic_532', name: '5-3-2 Savunma Bloku', category: 'formasyon', description: 'Savunma +30 · Gol ihtimali -25%', effectSummary: 'Savunma +30' },
  { kind: 'tactic', id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', category: 'formasyon', description: 'TEKNİK oyuncular maç başına bonus', effectSummary: 'TEKNİK +15' },
  { kind: 'tactic', id: 'tactic_343', name: '3-4-3 Tam Hücum', category: 'formasyon', description: 'Üçlü forvet baskısı · Hücum +25 · Savunma -20', effectSummary: 'Hücum +25 · Savunma -20' },
  { kind: 'tactic', id: 'tactic_diamond', name: '4-1-2-1-2 Elmas', category: 'formasyon', description: 'Orta saha kontrolü · TEKNİK +12 · kanat savunması zayıf', effectSummary: 'TEKNİK +12 · Savunma -8' },
  { kind: 'tactic', id: 'tactic_4411', name: '4-4-1-1 İkinci Forvet', category: 'formasyon', description: 'Gölge forvet + golcü ikilisi · dengeli hücum', effectSummary: 'Hücum +8 · dengeli' },
  { kind: 'tactic', id: 'tactic_3412', name: '3-4-1-2 Çift Forvet', category: 'formasyon', description: 'İki santrafor + 10 numara · Hücum +18 · kanat savunması zayıf', effectSummary: 'Hücum +18 · Savunma -12' },
  { kind: 'tactic', id: 'tactic_451', name: '4-5-1 Yoğun Orta Saha', category: 'formasyon', description: 'Beş orta saha + tek forvet · Savunma +20 · Hücum -12', effectSummary: 'Savunma +20 · Hücum -12' },
  { kind: 'tactic', id: 'tactic_yuksek_blok', name: 'Yüksek Press', category: 'sistem', description: 'Rakip yarı sahada baskı · top kazanıp hücuma döner', effectSummary: 'Savunma +18 · Hücum +12' },
  { kind: 'tactic', id: 'tactic_topla_oyn', name: 'Topla Oynama', category: 'sistem', description: 'TEKNİK oyuncu başına +8 puan/maç', effectSummary: 'TEKNİK ×8 puan/maç' },
  { kind: 'tactic', id: 'tactic_direkt', name: 'Direkt Futbol', category: 'sistem', description: 'HIZLI oyuncu başına +10 puan/maç', effectSummary: 'HIZLI ×10 puan/maç' },
  { kind: 'tactic', id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', category: 'sistem', description: 'Yorgunluk cezalarını engeller · dinç kadro moral +4/maç', effectSummary: 'Performans düşüşü yok · Moral +4/maç' },
  { kind: 'tactic', id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', category: 'sistem', description: 'Tek forvet FİNİŞÖR ise hücum +30%, değilse -15%', effectSummary: 'Tek forvet odaklı' },
  { kind: 'tactic', id: 'tactic_catenaccio', name: 'Alçak Blok (Catenaccio)', category: 'sistem', description: 'Geriye kapanıp kale kapatma · Savunma +30 · Hücum -18', effectSummary: 'Savunma +30 · Hücum -18' },
  { kind: 'tactic', id: 'tactic_gegenpress', name: 'Gegenpress', category: 'sistem', description: 'Topu kaybedince anında geri kazan · Hücum +14 · HIZLI +12 · yüksek savunma riski', effectSummary: 'Hücum +14 · HIZLI +12 · Savunma -10' },
  { kind: 'tactic', id: 'tactic_tiki_taka', name: 'Tiki-Taka', category: 'sistem', description: 'Kısa pas hâkimiyeti · TEKNİK +20 · savunma açığı riski', effectSummary: 'TEKNİK +20 · Savunma -12' },
  { kind: 'tactic', id: 'tactic_park_bus', name: 'Otobüsü Çek (Park the Bus)', category: 'sistem', description: 'Tam savunma · Savunma +40 · hücum neredeyse durur', effectSummary: 'Savunma +40 · Hücum -32' },
  { kind: 'tactic', id: 'tactic_kanat_bindirme', name: 'Kanat Bindirmesi', category: 'sistem', description: 'Bekler ve kanatlar bindirir · HIZLI +16 · Hücum +8 · hafif savunma riski', effectSummary: 'HIZLI +16 · Hücum +8 · Savunma -6' },
];

const TACTIC_EFFECTS: Record<string, ActiveTactic> = {
  tactic_433_kontr: { id: 'tactic_433_kontr', name: '4-3-3 Kontra Atak', description: 'Savunma +15, HIZLI +20', defenseMod: 15, fastBonus: 20 },
  tactic_442: { id: 'tactic_442', name: '4-4-2 Klasik Denge', description: 'Dengeli güvenli sistem' },
  tactic_352: { id: 'tactic_352', name: '3-5-2 Yoğun Baskı', description: 'Hücum +20', attackMod: 20, defenseMod: -15 },
  tactic_532: { id: 'tactic_532', name: '5-3-2 Savunma Bloku', description: 'Savunma +30', defenseMod: 30, attackMod: -25 },
  tactic_4231: { id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', description: 'TEKNİK +15', technicalBonus: 15 },
  tactic_343: { id: 'tactic_343', name: '3-4-3 Tam Hücum', description: 'Hücum +25', attackMod: 25, defenseMod: -20 },
  tactic_diamond: { id: 'tactic_diamond', name: '4-1-2-1-2 Elmas', description: 'TEKNİK +12', technicalBonus: 12, defenseMod: -8 },
  tactic_4411: { id: 'tactic_4411', name: '4-4-1-1 İkinci Forvet', description: 'Hücum +8', attackMod: 8 },
  tactic_3412: { id: 'tactic_3412', name: '3-4-1-2 Çift Forvet', description: 'Hücum +18', attackMod: 18, defenseMod: -12 },
  tactic_451: { id: 'tactic_451', name: '4-5-1 Yoğun Orta Saha', description: 'Savunma +20', defenseMod: 20, attackMod: -12 },
  tactic_yuksek_blok: { id: 'tactic_yuksek_blok', name: 'Yüksek Press', description: 'Savunma +18, Hücum +12', defenseMod: 18, attackMod: 12 },
  tactic_topla_oyn: { id: 'tactic_topla_oyn', name: 'Topla Oynama', description: 'TEKNİK bonus', technicalBonus: 8 },
  tactic_direkt: { id: 'tactic_direkt', name: 'Direkt Futbol', description: 'HIZLI bonus', fastBonus: 10 },
  tactic_rotasyon: { id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', description: 'Yorgunluk koruması, moral +4/maç', moralePerMatch: 4 },
  tactic_tekli_forvet: { id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', description: 'Tek forvet FİNİŞÖR koşullu' },
  tactic_catenaccio: { id: 'tactic_catenaccio', name: 'Alçak Blok (Catenaccio)', description: 'Savunma +30', defenseMod: 30, attackMod: -18 },
  tactic_gegenpress: { id: 'tactic_gegenpress', name: 'Gegenpress', description: 'Hücum +14, HIZLI +12, Savunma -10', attackMod: 14, fastBonus: 12, defenseMod: -10 },
  tactic_tiki_taka: { id: 'tactic_tiki_taka', name: 'Tiki-Taka', description: 'TEKNİK +20, Savunma -12', technicalBonus: 20, defenseMod: -12 },
  tactic_park_bus: { id: 'tactic_park_bus', name: 'Otobüsü Çek (Park the Bus)', description: 'Savunma +40, Hücum -32', defenseMod: 40, attackMod: -32 },
  tactic_kanat_bindirme: { id: 'tactic_kanat_bindirme', name: 'Kanat Bindirmesi', description: 'HIZLI +16, Hücum +8, Savunma -6', fastBonus: 16, attackMod: 8, defenseMod: -6 },
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

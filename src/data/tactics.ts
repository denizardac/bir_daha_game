import type { ActiveTactic, TacticCard } from '@/types';

export const TACTIC_CARDS: TacticCard[] = [
  { kind: 'tactic', id: 'tactic_433_kontr', name: '4-3-3 Kontra Atak', category: 'formasyon', description: 'Savunma güçlenir · HIZLI oyuncular ekstra bonus', effectSummary: 'Savunma +15 · HIZLI +20' },
  { kind: 'tactic', id: 'tactic_442', name: '4-4-2 Klasik Denge', category: 'formasyon', description: 'Güvenli sistem — risk almadan oyna', effectSummary: 'Dengeli · her kadroya uygun' },
  { kind: 'tactic', id: 'tactic_352', name: '3-5-2 Yoğun Baskı', category: 'formasyon', description: 'Hücum +20 · Savunma -15', effectSummary: 'Hücum +20 · Savunma -15' },
  { kind: 'tactic', id: 'tactic_532', name: '5-3-2 Savunma Bloku', category: 'formasyon', description: 'Savunma +30 · Gol ihtimali -25%', effectSummary: 'Savunma +30' },
  { kind: 'tactic', id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', category: 'formasyon', description: 'TEKNİK oyuncular maç başına bonus', effectSummary: 'TEKNİK +15' },
  { kind: 'tactic', id: 'tactic_yuksek_blok', name: 'Yüksek Press', category: 'sistem', description: 'Rakip yarı sahada baskı · Gol yeme azalır', effectSummary: 'Savunma +20' },
  { kind: 'tactic', id: 'tactic_topla_oyn', name: 'Topla Oynama', category: 'sistem', description: 'TEKNİK oyuncu başına +8 puan/maç', effectSummary: 'TEKNİK ×8 puan/maç' },
  { kind: 'tactic', id: 'tactic_direkt', name: 'Direkt Futbol', category: 'sistem', description: 'HIZLI oyuncu başına +10 puan/maç', effectSummary: 'HIZLI ×10 puan/maç' },
  { kind: 'tactic', id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', category: 'sistem', description: 'Yorgunluk cezalarını engeller', effectSummary: 'Performans düşüşü yok' },
  { kind: 'tactic', id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', category: 'sistem', description: 'Tek forvet FİNİŞÖR ise hücum +30%, değilse -15%', effectSummary: 'Tek forvet odaklı' },
];

const TACTIC_EFFECTS: Record<string, ActiveTactic> = {
  tactic_433_kontr: { id: 'tactic_433_kontr', name: '4-3-3 Kontra Atak', description: 'Savunma +15, HIZLI +20', defenseMod: 15, fastBonus: 20 },
  tactic_442: { id: 'tactic_442', name: '4-4-2 Klasik Denge', description: 'Dengeli güvenli sistem' },
  tactic_352: { id: 'tactic_352', name: '3-5-2 Yoğun Baskı', description: 'Hücum +20', attackMod: 20, defenseMod: -15 },
  tactic_532: { id: 'tactic_532', name: '5-3-2 Savunma Bloku', description: 'Savunma +30', defenseMod: 30, attackMod: -25 },
  tactic_4231: { id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', description: 'TEKNİK +15', technicalBonus: 15 },
  tactic_yuksek_blok: { id: 'tactic_yuksek_blok', name: 'Yüksek Press', description: 'Gol yeme -20%', defenseMod: 20 },
  tactic_topla_oyn: { id: 'tactic_topla_oyn', name: 'Topla Oynama', description: 'TEKNİK bonus', technicalBonus: 8 },
  tactic_direkt: { id: 'tactic_direkt', name: 'Direkt Futbol', description: 'HIZLI bonus', fastBonus: 10 },
  tactic_rotasyon: { id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', description: 'Yorgunluk koruması' },
  tactic_tekli_forvet: { id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', description: 'Tek forvet FİNİŞÖR koşullu' },
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

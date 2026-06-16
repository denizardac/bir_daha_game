import { getStartingEleven } from '@/engine/lineupPreview';
import type { ActiveTactic, MatchContext, PlayerCard, SynergyDefinition } from '@/types';

function effectiveSquad(squad: PlayerCard[], activeTactics?: ActiveTactic[]): PlayerCard[] {
  if (!activeTactics?.length) return squad;
  const starters = getStartingEleven(squad, activeTactics);
  return starters.length ? starters : squad;
}

function countTag(squad: PlayerCard[], tag: string): number {
  return squad.reduce((n, p) => n + (p.tags.includes(tag as never) ? 1 : 0), 0);
}

function countRarity(squad: PlayerCard[], rarity: string): number {
  return squad.filter((p) => p.rarity === rarity).length;
}

function hasPosTag(squad: PlayerCard[], pos: string, tag: string): boolean {
  return squad.some((p) => p.position === pos && p.tags.includes(tag as never));
}

function countMidfieldWithTrait(squad: PlayerCard[], tags: string[]): number {
  const mids = new Set(['DOS', 'OS', 'OOS']);
  return squad.filter(
    (p) => mids.has(p.position) && tags.some((t) => p.tags.includes(t as never)),
  ).length;
}

export const SYNERGIES: SynergyDefinition[] = [
  {
    id: 'synergy_kontr_atiligi', name: 'HIZLI KONTRA', icon: '⚡', hidden: false,
    description: '3+ HIZLI — her gol +55 puan',
    check: (s) => countTag(s, 'HIZLI') >= 3, perGoalBonus: 55,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'HIZLI');
      if (n >= 3 || countTag(s, 'HIZLI') >= 3) return null;
      return { current: n, required: 3, icon: '⚡' };
    },
  },
  {
    id: 'synergy_ruzgar_gibi', name: 'EXPRESS HIZ', icon: '🏃', hidden: true,
    description: '4+ HIZLI — gol çarpanı ×1.1',
    check: (s) => countTag(s, 'HIZLI') >= 4, perGoalBonus: 25, goalMultiplier: 1.1,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'HIZLI');
      if (n >= 4) return null;
      return { current: n, required: 4, icon: '🏃' };
    },
  },
  {
    id: 'synergy_kanatlar', name: 'ÇİFT KANAT', icon: '🦅', hidden: true,
    description: 'Sol + Sağ Kanat HIZLI — gol ×1.22, gol başına +20',
    check: (s) => hasPosTag(s, 'SLK', 'HIZLI') && hasPosTag(s, 'SÖK', 'HIZLI'), goalMultiplier: 1.22, perGoalBonus: 20,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (hasPosTag(combined, 'SLK', 'HIZLI') ? 1 : 0) + (hasPosTag(combined, 'SÖK', 'HIZLI') ? 1 : 0);
      if (have >= 2) return null;
      return { current: have, required: 2, icon: '🦅', note: 'SLK + SÖK ikisi de HIZLI olmalı' };
    },
  },
  {
    id: 'synergy_topa_sahip', name: 'PAS USTASI', icon: '🎯', hidden: false,
    description: '3+ TEKNİK — +12 puan/round',
    check: (s) => countTag(s, 'TEKNİK') >= 3, perRoundBonus: 12,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'TEKNİK');
      if (n >= 3) return null;
      return { current: n, required: 3, icon: '🎯' };
    },
  },
  {
    id: 'synergy_mister_asist', name: 'MİSTER ASİST', icon: '🤝', hidden: false,
    description: '2+ ASİSTÇİ — gol başına +25',
    check: (s) => countTag(s, 'ASİSTÇİ') >= 2, perGoalBonus: 25,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'ASİSTÇİ');
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🤝' };
    },
  },
  {
    id: 'synergy_duran_top', name: 'SET PİECE', icon: '🥅', hidden: true,
    description: 'Serbest vuruş + penaltı — gol başına +50',
    check: (s) => countTag(s, 'SERBEST VURUŞ') >= 1 && countTag(s, 'PENALTI') >= 1, perGoalBonus: 50,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const fk = countTag(combined, 'SERBEST VURUŞ') >= 1;
      const pen = countTag(combined, 'PENALTI') >= 1;
      if (fk && pen) return null;
      return { current: (fk ? 1 : 0) + (pen ? 1 : 0), required: 2, icon: '🥅', note: 'SERBEST VURUŞ + PENALTI gerekiyor' };
    },
  },
  {
    id: 'synergy_akademi', name: 'GENÇ YETENEK', icon: '📚', hidden: false,
    description: 'MENTOR + POTANSİYEL — +30 puan/round',
    check: (s) => countTag(s, 'MENTOR') >= 1 && countTag(s, 'POTANSİYEL') >= 1, perRoundBonus: 30,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const m = countTag(combined, 'MENTOR') >= 1;
      const p = countTag(combined, 'POTANSİYEL') >= 1;
      if (m && p) return null;
      return { current: (m ? 1 : 0) + (p ? 1 : 0), required: 2, icon: '📚' };
    },
  },
  {
    id: 'synergy_kaptan_modu', name: 'LİDER YÜRÜYÜŞÜ', icon: '👑', hidden: false,
    description: 'LİDER + Moral ≥80 — galibiyet +150',
    check: (s, morale) => countTag(s, 'LİDER') >= 1 && morale >= 80, perWinBonus: 150,
    getProgress: (s, c) => {
      if (countTag(c ? [...s, c] : s, 'LİDER') >= 1) return null;
      return { current: countTag(s, 'LİDER'), required: 1, icon: '👑', note: 'ayrıca moral 80+ gerekiyor' };
    },
  },
  {
    id: 'synergy_soyunma_odasi', name: 'TAKIM RUHU', icon: '🎤', hidden: true,
    description: 'Kaptan + soyunma odası + mentor — moral tabanı 70, +20/round, galibiyet +60',
    check: (s) => countTag(s, 'KAPİTAN') >= 1 && countTag(s, 'SOYUNMA ODASI') >= 1 && countTag(s, 'MENTOR') >= 1,
    minMorale: 70, perMatchMorale: 5, perRoundBonus: 20, perWinBonus: 60,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (countTag(combined, 'KAPİTAN') >= 1 ? 1 : 0) + (countTag(combined, 'SOYUNMA ODASI') >= 1 ? 1 : 0) + (countTag(combined, 'MENTOR') >= 1 ? 1 : 0);
      if (have >= 3) return null;
      return { current: have, required: 3, icon: '🎤', note: 'KAPİTAN + SOYUNMA ODASI + MENTOR' };
    },
  },
  {
    id: 'synergy_ev_sahibi', name: 'YERLİ KADRO', icon: '🏠', hidden: false,
    description: '5+ YERLİ — galibiyet +100, moral +20',
    check: (s) => countTag(s, 'YERLİ') >= 5, perWinBonus: 100, perMatchMorale: 20,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'YERLİ');
      if (n >= 5) return null;
      return { current: n, required: 5, icon: '🏠' };
    },
  },
  {
    id: 'synergy_super_yabanci', name: 'YILDIZLAR GECE', icon: '🌍', hidden: true,
    description: '3+ yabancı yıldız, 0 yerli — rating ×1.15',
    check: (s) => countTag(s, 'YABANCI YILDIZ') >= 3 && countTag(s, 'YERLİ') === 0,
    ratingMultiplier: 1.15, perRoundBonus: 12,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const stars = countTag(combined, 'YABANCI YILDIZ');
      const locals = countTag(combined, 'YERLİ');
      if (stars >= 3 && locals === 0) return null;
      return { current: Math.min(stars, 3), required: 3, icon: '🌍', note: locals > 0 ? `⚠ kadroda 0 yerli olmalı (şu an ${locals})` : 'kadroda 0 yerli olmalı' };
    },
  },
  {
    id: 'synergy_karma_guc', name: 'KARMA DENGE', icon: '⚖️', hidden: true,
    description: '3 yerli + 3 yabancı yıldız — galibiyet +70',
    check: (s) => countTag(s, 'YERLİ') >= 3 && countTag(s, 'YABANCI YILDIZ') >= 3, perWinBonus: 70,
  },
  {
    id: 'synergy_temiz_sayfa', name: 'DEMİR KALE', icon: '🧱', hidden: false,
    description: 'Kaleci ≥75 + 2 stoper — gol yeme azalır',
    check: (s) => {
      const gk = s.find((p) => p.position === 'KL');
      return !!gk && gk.currentRating >= 75 && s.filter((p) => p.position === 'STP').length >= 2;
    },
    cleanSheetDefenseBonus: 0.22,
  },
  {
    id: 'synergy_uc_boyut', name: 'ÜÇLÜ HÜCUM', icon: '🔺', hidden: false,
    description: 'Hücum hattında (SF/kanat) 2+ FİNİŞÖR — gol ×1.3',
    check: (s) => s.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') && p.tags.includes('FİNİŞÖR')).length >= 2,
    goalMultiplier: 1.3,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = combined.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') && p.tags.includes('FİNİŞÖR')).length;
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🔺', note: 'forvet/kanatta FİNİŞÖR topla' };
    },
  },
  {
    id: 'synergy_saglam_orta', name: 'ORTA DUVAR', icon: '🧱', hidden: false,
    description: '2+ orta saha TEKNİK/GÜÇLÜ — +18/round, gol yeme azalır',
    check: (s) => countMidfieldWithTrait(s, ['TEKNİK', 'GÜÇLÜ']) >= 2,
    cleanSheetDefenseBonus: 0.12, perRoundBonus: 18,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = countMidfieldWithTrait(combined, ['TEKNİK', 'GÜÇLÜ']);
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🧱', note: 'orta sahada TEKNİK/GÜÇLÜ' };
    },
  },
  {
    id: 'synergy_tanri_modu', name: 'ZİRVE GÜN', icon: '✨', hidden: true,
    description: 'Kaptan + finişör + frikik, moral ≥90 — puan ×1.75',
    check: (s, morale) =>
      countTag(s, 'KAPİTAN') >= 1 && countTag(s, 'FİNİŞÖR') >= 1 &&
      countTag(s, 'SERBEST VURUŞ') >= 1 && morale >= 90,
    scoreMultiplier: 1.75,
  },
  {
    id: 'synergy_firtina', name: 'KARMA FIRTINA', icon: '🌪️', hidden: true,
    description: '4 HIZLI + 2 TEKNİK + 1 ASİSTÇİ — galibiyet +130',
    check: (s) => countTag(s, 'HIZLI') >= 4 && countTag(s, 'TEKNİK') >= 2 && countTag(s, 'ASİSTÇİ') >= 1,
    perWinBonus: 130, goalMultiplier: 1.15,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (countTag(combined, 'HIZLI') >= 4 ? 1 : 0) + (countTag(combined, 'TEKNİK') >= 2 ? 1 : 0) + (countTag(combined, 'ASİSTÇİ') >= 1 ? 1 : 0);
      if (have >= 3) return null;
      return { current: have, required: 3, icon: '🌪️', note: '4 HIZLI · 2 TEKNİK · 1 ASİSTÇİ' };
    },
  },
  {
    id: 'synergy_efsaneler', name: 'EFSANE 11', icon: '🏆', hidden: true,
    description: '3+ efsane kart — galibiyet +180, moral tabanı 75',
    check: (s) => countRarity(s, 'efsane') >= 3, perWinBonus: 180, minMorale: 75,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = countRarity(combined, 'efsane');
      if (n >= 3) return null;
      return { current: n, required: 3, icon: '🏆', note: 'efsane kart topla (round 9+ şans artar)' };
    },
  },
  {
    id: 'synergy_savasci_ruhu', name: 'GERİDEN GEL', icon: '⚔️', hidden: true,
    description: '1+ SAVAŞÇI, maçta gerideyken — gol başına +45',
    check: (s, _, ctx) => countTag(s, 'SAVAŞÇI') >= 1 && !!ctx?.behindInMatch,
    perGoalBonus: 45,
  },
  {
    id: 'synergy_altin_defans', name: 'ÇELİK STOP', icon: '🔒', hidden: true,
    description: '2 GÜÇLÜ stoper — savunma bonusu, +12/round',
    check: (s) => s.filter((p) => p.position === 'STP' && p.tags.includes('GÜÇLÜ')).length >= 2,
    cleanSheetDefenseBonus: 0.15, perRoundBonus: 12,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = combined.filter((p) => p.position === 'STP' && p.tags.includes('GÜÇLÜ')).length;
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🔒', note: 'GÜÇLÜ stoper topla' };
    },
  },
  {
    id: 'synergy_yildiz_hucum', name: 'YILDIZ HATT', icon: '⭐', hidden: true,
    description: 'Hücumda 2+ GÜÇLÜ/EFSANE kart (rarity) — gol başına +40',
    check: (s) =>
      s.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') &&
        (p.rarity === 'güçlü' || p.rarity === 'efsane')).length >= 2,
    perGoalBonus: 40,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = combined.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') &&
        (p.rarity === 'güçlü' || p.rarity === 'efsane')).length;
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '⭐', note: 'hücumda yüksek nadirlikli kart' };
    },
  },
  {
    id: 'synergy_pas_motoru', name: 'PAS AĞI', icon: '🔗', hidden: true,
    description: '2+ ASİSTÇİ + 2+ TEKNİK — +22/round',
    check: (s) => countTag(s, 'ASİSTÇİ') >= 2 && countTag(s, 'TEKNİK') >= 2,
    perRoundBonus: 22,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (countTag(combined, 'ASİSTÇİ') >= 2 ? 1 : 0) + (countTag(combined, 'TEKNİK') >= 2 ? 1 : 0);
      if (have >= 2) return null;
      return { current: have, required: 2, icon: '🔗', note: '2 ASİSTÇİ + 2 TEKNİK' };
    },
  },
  {
    id: 'synergy_demir_form', name: 'DEMİR FORM', icon: '🛡️', hidden: false,
    description: '2+ DAYANIKLI — yorgunluk etkisine direnç, +10/round',
    check: (s) => countTag(s, 'DAYANIKLI') >= 2, perRoundBonus: 10,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'DAYANIKLI');
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🛡️' };
    },
  },
  {
    id: 'synergy_ucuz_kadro', name: 'UCUZ KADRO', icon: '📉', hidden: true,
    description: '3+ GERİLEYEN — galibiyet +90 (ucuz ama tecrübeli)',
    check: (s) => countTag(s, 'GERİLEYEN') >= 3, perWinBonus: 90, perRoundBonus: 10,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = countTag(combined, 'GERİLEYEN');
      if (n >= 3) return null;
      // İpucu: niş sinerji — fark edilmesi için kasıtlı "kötü" kart toplama ipucu
      if (n === 0) return null;
      return { current: n, required: 3, icon: '📉', note: 'GERİLEYEN kartları topla (dezavantajı ödüle çevir)' };
    },
  },
  {
    id: 'synergy_rotasyon_ustasi', name: 'ROTASYON USTASI', icon: '🔄', hidden: true,
    description: '2+ PERFORMANS DÜŞÜŞÜ + 1 DAYANIKLI — +28/round',
    check: (s) => countTag(s, 'PERFORMANS DÜŞÜŞÜ') >= 2 && countTag(s, 'DAYANIKLI') >= 1,
    perRoundBonus: 28,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (countTag(combined, 'PERFORMANS DÜŞÜŞÜ') >= 2 ? 1 : 0) + (countTag(combined, 'DAYANIKLI') >= 1 ? 1 : 0);
      if (have >= 2) return null;
      if (countTag(combined, 'PERFORMANS DÜŞÜŞÜ') === 0 && countTag(combined, 'DAYANIKLI') === 0) return null;
      return { current: have, required: 2, icon: '🔄', note: '2 PERFORMANS DÜŞÜŞÜ + 1 DAYANIKLI' };
    },
  },
  {
    id: 'synergy_tartismali_guc', name: 'TARTIŞMALI GÜÇ', icon: '💥', hidden: true,
    description: 'TARTIŞMALI + LİDER — galibiyet +90',
    check: (s) => countTag(s, 'TARTIŞMALI') >= 1 && countTag(s, 'LİDER') >= 1, perWinBonus: 90,
  },
  {
    id: 'synergy_soguk_kan', name: 'SOĞUK KAN', icon: '🧊', hidden: true,
    description: '2+ SOĞUKKANLI — moral tabanı 55, +8/round',
    check: (s) => countTag(s, 'SOĞUKKANLI') >= 2, minMorale: 55, perRoundBonus: 8,
  },
  {
    id: 'synergy_yenisezon_patlama', name: 'YENİ SEZON PATLAMASI', icon: '🌱', hidden: true,
    description: '2+ YENİ SEZON + 1 MENTOR — +20/round',
    check: (s) => countTag(s, 'YENİ SEZON') >= 2 && countTag(s, 'MENTOR') >= 1, perRoundBonus: 20,
  },
  {
    id: 'synergy_imza_kadrosu', name: 'İMZA KADROSU', icon: '✒️', hidden: true,
    description: '2+ imza kartı (efsane ikon) — gol ×1.2, galibiyet +120',
    check: (s) => s.filter((p) => p.signature).length >= 2, goalMultiplier: 1.2, perWinBonus: 120,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = combined.filter((p) => p.signature).length;
      if (n >= 2) return null;
      if (n === 0) return null;
      return { current: n, required: 2, icon: '✒️', note: 'imza (ikon) kartları topla' };
    },
  },
];

export function getActiveSynergies(
  squad: PlayerCard[],
  morale: number,
  ctx?: MatchContext,
) {
  const lineup = effectiveSquad(squad, ctx?.activeTactics);
  return SYNERGIES.filter((s) => s.check(lineup, morale, ctx));
}

export function getSynergyProgressForCard(synergy: SynergyDefinition, squad: PlayerCard[], candidate?: PlayerCard) {
  return synergy.getProgress?.(squad, candidate) ?? null;
}

export function getSynergyById(id: string) {
  return SYNERGIES.find((s) => s.id === id);
}

export const TOTAL_SYNERGIES = SYNERGIES.length;

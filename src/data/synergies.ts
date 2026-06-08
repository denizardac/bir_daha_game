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
    description: 'Sol + Sağ Kanat HIZLI — gol ×1.12',
    check: (s) => hasPosTag(s, 'SLK', 'HIZLI') && hasPosTag(s, 'SÖK', 'HIZLI'), goalMultiplier: 1.12,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (hasPosTag(combined, 'SLK', 'HIZLI') ? 1 : 0) + (hasPosTag(combined, 'SÖK', 'HIZLI') ? 1 : 0);
      if (have >= 2) return null;
      return { current: have, required: 2, icon: '🦅' };
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
      return { current: countTag(s, 'LİDER'), required: 1, icon: '👑' };
    },
  },
  {
    id: 'synergy_soyunma_odasi', name: 'TAKIM RUHU', icon: '🎤', hidden: true,
    description: 'Kaptan + soyunma odası + mentor — moral tabanı 70',
    check: (s) => countTag(s, 'KAPİTAN') >= 1 && countTag(s, 'SOYUNMA ODASI') >= 1 && countTag(s, 'MENTOR') >= 1,
    minMorale: 70, perMatchMorale: 5,
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
    description: 'Forvet + Sol Kanat + Sağ Kanat FİNİŞÖR — gol ×1.3',
    check: (s) => hasPosTag(s, 'SF', 'FİNİŞÖR') && hasPosTag(s, 'SLK', 'FİNİŞÖR') && hasPosTag(s, 'SÖK', 'FİNİŞÖR'),
    goalMultiplier: 1.3,
  },
  {
    id: 'synergy_saglam_orta', name: 'ORTA DUVAR', icon: '🧱', hidden: false,
    description: '2+ orta saha TEKNİK/GÜÇLÜ — orta saha kilitlenir',
    check: (s) => countMidfieldWithTrait(s, ['TEKNİK', 'GÜÇLÜ']) >= 2,
    cleanSheetDefenseBonus: 0.12, perRoundBonus: 18,
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
  },
  {
    id: 'synergy_efsaneler', name: 'EFSANE 11', icon: '🏆', hidden: true,
    description: '3+ efsane kart — galibiyet +180, moral tabanı 75',
    check: (s) => countRarity(s, 'efsane') >= 3, perWinBonus: 180, minMorale: 75,
  },
  {
    id: 'synergy_savasci_ruhu', name: 'GERİDEN GEL', icon: '⚔️', hidden: true,
    description: '1+ SAVAŞÇI, maçta gerideyken — gol başına +45',
    check: (s, _, ctx) => countTag(s, 'SAVAŞÇI') >= 1 && !!ctx?.behindInMatch,
    perGoalBonus: 45,
  },
  {
    id: 'synergy_altin_defans', name: 'ÇELİK STOP', icon: '🔒', hidden: true,
    description: '2 GÜÇLÜ stoper — savunma bonusu',
    check: (s) => s.filter((p) => p.position === 'STP' && p.tags.includes('GÜÇLÜ')).length >= 2,
    cleanSheetDefenseBonus: 0.15, perRoundBonus: 12,
  },
  {
    id: 'synergy_yildiz_hucum', name: 'YILDIZ HATT', icon: '⭐', hidden: true,
    description: '2+ güçlü kanat/forvet — gol başına +40',
    check: (s) =>
      s.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') &&
        (p.rarity === 'güçlü' || p.rarity === 'efsane')).length >= 2,
    perGoalBonus: 40,
  },
  {
    id: 'synergy_pas_motoru', name: 'PAS AĞI', icon: '🔗', hidden: true,
    description: '2+ ASİSTÇİ + 2+ TEKNİK — +22/round',
    check: (s) => countTag(s, 'ASİSTÇİ') >= 2 && countTag(s, 'TEKNİK') >= 2,
    perRoundBonus: 22,
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
    description: '3+ GERİLEYEN — galibiyet +65 (ucuz ama tecrübeli)',
    check: (s) => countTag(s, 'GERİLEYEN') >= 3, perWinBonus: 65,
  },
  {
    id: 'synergy_rotasyon_ustasi', name: 'ROTASYON USTASI', icon: '🔄', hidden: true,
    description: '2+ PERFORMANS DÜŞÜŞÜ + 1 DAYANIKLI — +14/round',
    check: (s) => countTag(s, 'PERFORMANS DÜŞÜŞÜ') >= 2 && countTag(s, 'DAYANIKLI') >= 1,
    perRoundBonus: 14,
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

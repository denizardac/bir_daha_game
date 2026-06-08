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

export const SYNERGIES: SynergyDefinition[] = [
  {
    id: 'synergy_kontr_atiligi', name: 'HIZLI KONTRA', icon: '⚡', hidden: false,
    description: '3+ HIZLI oyuncu — her gol +80 puan',
    check: (s) => countTag(s, 'HIZLI') >= 3, perGoalBonus: 80,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'HIZLI');
      if (n >= 3 || countTag(s, 'HIZLI') >= 3) return null;
      return { current: n, required: 3, icon: '⚡' };
    },
  },
  {
    id: 'synergy_ruzgar_gibi', name: 'EXPRESS HIZ', icon: '🏃', hidden: true,
    description: '5+ HIZLI — gol çarpanı artar',
    check: (s) => countTag(s, 'HIZLI') >= 5, perGoalBonus: 40, goalMultiplier: 1.2,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'HIZLI');
      if (n >= 5) return null;
      return { current: n, required: 5, icon: '🏃' };
    },
  },
  {
    id: 'synergy_kanatlar', name: 'ÇİFT KANAT', icon: '🦅', hidden: true,
    description: 'Sol + Sağ Kanat HIZLI — kanat golleri güçlenir',
    check: (s) => hasPosTag(s, 'SLK', 'HIZLI') && hasPosTag(s, 'SÖK', 'HIZLI'), goalMultiplier: 1.15,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (hasPosTag(combined, 'SLK', 'HIZLI') ? 1 : 0) + (hasPosTag(combined, 'SÖK', 'HIZLI') ? 1 : 0);
      if (have >= 2) return null;
      return { current: have, required: 2, icon: '🦅' };
    },
  },
  {
    id: 'synergy_topa_sahip', name: 'PAS USTASI', icon: '🎯', hidden: false,
    description: '4+ TEKNİK — pasif +10 puan/round',
    check: (s) => countTag(s, 'TEKNİK') >= 4, perRoundBonus: 10,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'TEKNİK');
      if (n >= 4) return null;
      return { current: n, required: 4, icon: '🎯' };
    },
  },
  {
    id: 'synergy_mister_asist', name: 'MİSTER ASİST', icon: '🤝', hidden: false,
    description: '2+ ASİSTÇİ — gol başına ekstra puan',
    check: (s) => countTag(s, 'ASİSTÇİ') >= 2, perGoalBonus: 25,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'ASİSTÇİ');
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🤝' };
    },
  },
  {
    id: 'synergy_duran_top', name: 'SET PİECE', icon: '🥅', hidden: true,
    description: 'Serbest vuruş + penaltı uzmanı — duran top bonusu',
    check: (s) => countTag(s, 'SERBEST VURUŞ') >= 1 && countTag(s, 'PENALTI') >= 1, perGoalBonus: 60,
  },
  {
    id: 'synergy_akademi', name: 'GENÇ YETENEK', icon: '📚', hidden: false,
    description: 'MENTOR + POTANSİYEL — gelişim hızlanır',
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
    description: '7+ YERLİ — galibiyet +100, moral +20',
    check: (s) => countTag(s, 'YERLİ') >= 7, perWinBonus: 100, perMatchMorale: 20,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'YERLİ');
      if (n >= 7) return null;
      return { current: n, required: 7, icon: '🏠' };
    },
  },
  {
    id: 'synergy_super_yabanci', name: 'YILDIZLAR GECE', icon: '🌍', hidden: true,
    description: '3+ yabancı yıldız, 0 yerli — rating ×1.2',
    check: (s) => countTag(s, 'YABANCI YILDIZ') >= 3 && countTag(s, 'YERLİ') === 0,
    ratingMultiplier: 1.2, perRoundBonus: 15,
  },
  {
    id: 'synergy_karma_guc', name: 'KARMA DENGE', icon: '⚖️', hidden: true,
    description: '4 yerli + 4 yabancı yıldız — dengeli bonus',
    check: (s) => countTag(s, 'YERLİ') >= 4 && countTag(s, 'YABANCI YILDIZ') >= 4, perWinBonus: 80,
  },
  {
    id: 'synergy_temiz_sayfa', name: 'DEMİR KALE', icon: '🧱', hidden: false,
    description: 'Güçlü kaleci + 3 stoper — gol yeme azalır',
    check: (s) => {
      const gk = s.find((p) => p.position === 'KL');
      return !!gk && gk.currentRating >= 82 && s.filter((p) => p.position === 'STP').length >= 3;
    },
    cleanSheetDefenseBonus: 0.3,
  },
  {
    id: 'synergy_uc_boyut', name: 'ÜÇLÜ HÜCUM', icon: '🔺', hidden: false,
    description: 'Forvet + Sol Kanat + Sağ Kanat FİNİŞÖR — gol ×1.3',
    check: (s) => hasPosTag(s, 'SF', 'FİNİŞÖR') && hasPosTag(s, 'SLK', 'FİNİŞÖR') && hasPosTag(s, 'SÖK', 'FİNİŞÖR'),
    goalMultiplier: 1.3,
  },
  {
    id: 'synergy_saglam_orta', name: 'ORTA DUVAR', icon: '🧱', hidden: false,
    description: 'Def. Orta + Of. Orta TEKNİK/GÜÇLÜ — orta saha kilitlenir',
    check: (s) => {
      const dos = s.find((p) => p.position === 'DOS');
      const oos = s.find((p) => p.position === 'OOS');
      const ok = (p?: PlayerCard) => !!(p && (p.tags.includes('TEKNİK') || p.tags.includes('GÜÇLÜ')));
      return ok(dos) && ok(oos);
    },
    cleanSheetDefenseBonus: 0.15, perRoundBonus: 20,
  },
  {
    id: 'synergy_tanri_modu', name: 'ZİRVE GÜN', icon: '✨', hidden: true,
    description: 'Kaptan + finişör + frikik, moral 100 — puan ×3',
    check: (s, morale) =>
      countTag(s, 'KAPİTAN') >= 1 && countTag(s, 'FİNİŞÖR') >= 1 &&
      countTag(s, 'SERBEST VURUŞ') >= 1 && morale >= 100,
    scoreMultiplier: 3,
  },
  {
    id: 'synergy_firtina', name: 'KARMA FIRTINA', icon: '🌪️', hidden: true,
    description: '5 HIZLI + 3 TEKNİK + asistçi — stil bağımsız güç',
    check: (s) => countTag(s, 'HIZLI') >= 5 && countTag(s, 'TEKNİK') >= 3 && countTag(s, 'ASİSTÇİ') >= 1,
    perWinBonus: 200, goalMultiplier: 1.25,
  },
  {
    id: 'synergy_efsaneler', name: 'EFSANE 11', icon: '🏆', hidden: true,
    description: '4+ efsane kart — moral sabit, galibiyet +200',
    check: (s) => countRarity(s, 'efsane') >= 4, perWinBonus: 200, minMorale: 80,
  },
  {
    id: 'synergy_savasci_ruhu', name: 'GERİDEN GEL', icon: '⚔️', hidden: true,
    description: '2+ SAVAŞÇI, maçta gerideyken — performans artar',
    check: (s, _, ctx) => countTag(s, 'SAVAŞÇI') >= 2 && !!ctx?.behindInMatch,
    perGoalBonus: 50,
  },
  {
    id: 'synergy_altin_defans', name: 'ÇELİK STOP', icon: '🔒', hidden: true,
    description: '3 GÜÇLÜ stoper — savunma bonusu',
    check: (s) => s.filter((p) => p.position === 'STP' && p.tags.includes('GÜÇLÜ')).length >= 3,
    cleanSheetDefenseBonus: 0.2, perRoundBonus: 15,
  },
  {
    id: 'synergy_yildiz_hucum', name: 'YILDIZ HATT', icon: '⭐', hidden: true,
    description: '2+ güçlü kanat/forvet — gol bonusu',
    check: (s) =>
      s.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') &&
        (p.rarity === 'güçlü' || p.rarity === 'efsane')).length >= 2,
    perGoalBonus: 45,
  },
  {
    id: 'synergy_pas_motoru', name: 'PAS AĞI', icon: '🔗', hidden: true,
    description: '3+ ASİSTÇİ + 2+ TEKNİK — takım oyunu',
    check: (s) => countTag(s, 'ASİSTÇİ') >= 3 && countTag(s, 'TEKNİK') >= 2,
    perRoundBonus: 25,
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

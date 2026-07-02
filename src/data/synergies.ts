import { getStartingEleven } from '@/engine/lineupPreview';
import type { ActiveTactic, MatchContext, PlayerCard, SynergyDefinition, SynergyProgress } from '@/types';

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

function tagProgressNote(parts: Array<{ label: string; current: number; required: number }>): string {
  return parts
    .map(({ label, current, required }) => `${label} ${Math.min(current, required)}/${required}`)
    .join(' · ');
}

/** 4 HIZLI + 2 TEKNİK + 1 ASİSTÇİ — parça parça ilerleme */
export function getKarmaFirtinaProgress(squad: PlayerCard[]): SynergyProgress | null {
  const hizli = countTag(squad, 'HIZLI');
  const teknik = countTag(squad, 'TEKNİK');
  const asist = countTag(squad, 'ASİSTÇİ');
  const current = Math.min(hizli, 4) + Math.min(teknik, 2) + Math.min(asist, 1);
  const required = 7;
  if (current >= required) return null;
  return {
    current,
    required,
    icon: '🌪️',
    note: `HIZLI ${Math.min(hizli, 4)}/4 · TEKNİK ${Math.min(teknik, 2)}/2 · ASİSTÇİ ${Math.min(asist, 1)}/1`,
  };
}

export const SYNERGIES: SynergyDefinition[] = [
  {
    id: 'synergy_kontr_atiligi', name: 'HIZLI KONTRA', icon: '⚡', hidden: false,
    description: '3 HIZLI oyuncu aynı anda sahadaysa kontralar daha tehlikeli olur.',
    check: (s) => countTag(s, 'HIZLI') >= 3, perGoalBonus: 45,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'HIZLI');
      if (n >= 3 || countTag(s, 'HIZLI') >= 3) return null;
      return { current: n, required: 3, icon: '⚡' };
    },
  },
  {
    id: 'synergy_ruzgar_gibi', name: 'EXPRESS HIZ', icon: '🏃', hidden: true,
    description: '4 HIZLI oyuncuyla rakip savunma sürekli arkaya koşmak zorunda kalır.',
    check: (s) => countTag(s, 'HIZLI') >= 4, perGoalBonus: 20, goalMultiplier: 1.08,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'HIZLI');
      if (n >= 4) return null;
      return { current: n, required: 4, icon: '🏃' };
    },
  },
  {
    id: 'synergy_kanatlar', name: 'ÇİFT KANAT', icon: '🦅', hidden: true,
    description: 'İki kanatta da HIZLI oyuncu varsa oyun genişler ve savunma iki yana açılır.',
    check: (s) => hasPosTag(s, 'SLK', 'HIZLI') && hasPosTag(s, 'SÖK', 'HIZLI'), goalMultiplier: 1.14, perGoalBonus: 20,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const have = (hasPosTag(combined, 'SLK', 'HIZLI') ? 1 : 0) + (hasPosTag(combined, 'SÖK', 'HIZLI') ? 1 : 0);
      if (have >= 2) return null;
      return { current: have, required: 2, icon: '🦅', note: 'SLK + SÖK ikisi de HIZLI olmalı' };
    },
  },
  {
    id: 'synergy_topa_sahip', name: 'PAS USTASI', icon: '🎯', hidden: false,
    description: '3 TEKNİK oyuncu pas ritmini kurar; top sende kaldıkça skor istikrarı artar.',
    check: (s) => countTag(s, 'TEKNİK') >= 3, perRoundBonus: 18,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'TEKNİK');
      if (n >= 3) return null;
      return { current: n, required: 3, icon: '🎯' };
    },
  },
  {
    id: 'synergy_mister_asist', name: 'MİSTER ASİST', icon: '🤝', hidden: false,
    description: '2 ASİSTÇİ oyuncu gol pozisyonlarını daha kaliteli hazırlar.',
    check: (s) => countTag(s, 'ASİSTÇİ') >= 2, perGoalBonus: 30,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'ASİSTÇİ');
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🤝' };
    },
  },
  {
    id: 'synergy_duran_top', name: 'SET PİECE', icon: '🥅', hidden: true,
    description: 'SERBEST VURUŞ ve PENALTI uzmanı olan kadro duran topları gerçek tehdide çevirir.',
    check: (s) => countTag(s, 'SERBEST VURUŞ') >= 1 && countTag(s, 'PENALTI') >= 1, perGoalBonus: 45,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const fk = countTag(combined, 'SERBEST VURUŞ');
      const pen = countTag(combined, 'PENALTI');
      if (fk >= 1 && pen >= 1) return null;
      return {
        current: (fk >= 1 ? 1 : 0) + (pen >= 1 ? 1 : 0),
        required: 2,
        icon: '🥅',
        note: tagProgressNote([
          { label: 'SERBEST VURUŞ', current: fk, required: 1 },
          { label: 'PENALTI', current: pen, required: 1 },
        ]),
      };
    },
  },
  {
    id: 'synergy_akademi', name: 'GENÇ YETENEK', icon: '📚', hidden: false,
    description: 'MENTOR, POTANSİYEL oyuncunun gelişimini hızlandırır ve genç planını ödüllendirir.',
    check: (s) => countTag(s, 'MENTOR') >= 1 && countTag(s, 'POTANSİYEL') >= 1, perRoundBonus: 35,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const m = countTag(combined, 'MENTOR');
      const p = countTag(combined, 'POTANSİYEL');
      if (m >= 1 && p >= 1) return null;
      return {
        current: (m >= 1 ? 1 : 0) + (p >= 1 ? 1 : 0),
        required: 2,
        icon: '📚',
        note: tagProgressNote([
          { label: 'MENTOR', current: m, required: 1 },
          { label: 'POTANSİYEL', current: p, required: 1 },
        ]),
      };
    },
  },
  {
    id: 'synergy_kaptan_modu', name: 'LİDER YÜRÜYÜŞÜ', icon: '👑', hidden: false,
    description: 'LİDER yüksek moralli takımı sahada diri tutar; galibiyetler daha değerli olur.',
    check: (s, morale) => countTag(s, 'LİDER') >= 1 && morale >= 80, perWinBonus: 110,
    getProgress: (s, c) => {
      if (countTag(c ? [...s, c] : s, 'LİDER') >= 1) return null;
      return { current: countTag(s, 'LİDER'), required: 1, icon: '👑', note: 'ayrıca moral 80+ gerekiyor' };
    },
  },
  {
    id: 'synergy_soyunma_odasi', name: 'TAKIM RUHU', icon: '🎤', hidden: true,
    description: 'KAPİTAN, SOYUNMA ODASI ve MENTOR birlikteyse takımın morali kolay dağılmaz.',
    check: (s) => countTag(s, 'KAPİTAN') >= 1 && countTag(s, 'SOYUNMA ODASI') >= 1 && countTag(s, 'MENTOR') >= 1,
    minMorale: 68, perMatchMorale: 4, perRoundBonus: 20, perWinBonus: 50,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const captain = countTag(combined, 'KAPİTAN');
      const room = countTag(combined, 'SOYUNMA ODASI');
      const mentor = countTag(combined, 'MENTOR');
      const have = (captain >= 1 ? 1 : 0) + (room >= 1 ? 1 : 0) + (mentor >= 1 ? 1 : 0);
      if (have >= 3) return null;
      return {
        current: have,
        required: 3,
        icon: '🎤',
        note: tagProgressNote([
          { label: 'KAPİTAN', current: captain, required: 1 },
          { label: 'SOYUNMA ODASI', current: room, required: 1 },
          { label: 'MENTOR', current: mentor, required: 1 },
        ]),
      };
    },
  },
  {
    id: 'synergy_ev_sahibi', name: 'YERLİ KADRO', icon: '🏠', hidden: false,
    description: '5 YERLİ oyuncu aynı ilk 11’deyse takım kimyası ve tribün bağı güçlenir.',
    check: (s) => countTag(s, 'YERLİ') >= 5, perWinBonus: 80, perMatchMorale: 15,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'YERLİ');
      if (n >= 5) return null;
      return { current: n, required: 5, icon: '🏠' };
    },
  },
  {
    id: 'synergy_super_yabanci', name: 'YILDIZLAR GECE', icon: '🌍', hidden: true,
    description: 'Tamamen YABANCI YILDIZ ağırlıklı kadro bireysel kaliteyle maçları çözer.',
    check: (s) => countTag(s, 'YABANCI YILDIZ') >= 3 && countTag(s, 'YERLİ') === 0,
    ratingMultiplier: 1.08, perRoundBonus: 20,
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
    description: 'YERLİ omurga ve YABANCI YILDIZ kalitesi dengelenirse kadro daha güvenilir olur.',
    check: (s) => countTag(s, 'YERLİ') >= 3 && countTag(s, 'YABANCI YILDIZ') >= 3, perWinBonus: 90,
  },
  {
    id: 'synergy_temiz_sayfa', name: 'DEMİR KALE', icon: '🧱', hidden: false,
    description: 'Güvenilir kaleci ve iki stoperle savunma hattı daha zor dağılır.',
    check: (s) => {
      const gk = s.find((p) => p.position === 'KL');
      return !!gk && gk.currentRating >= 75 && s.filter((p) => p.position === 'STP').length >= 2;
    },
    cleanSheetDefenseBonus: 0.18,
  },
  {
    id: 'synergy_uc_boyut', name: 'ÜÇLÜ HÜCUM', icon: '🔺', hidden: false,
    description: 'Hücum hattında 2 FİNİŞÖR varsa yarım pozisyonlar bile gole dönebilir.',
    check: (s) => s.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') && p.tags.includes('FİNİŞÖR')).length >= 2,
    goalMultiplier: 1.22,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = combined.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') && p.tags.includes('FİNİŞÖR')).length;
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🔺', note: 'forvet/kanatta FİNİŞÖR topla' };
    },
  },
  {
    id: 'synergy_saglam_orta', name: 'ORTA DUVAR', icon: '🧱', hidden: false,
    description: 'Orta sahada TEKNİK/GÜÇLÜ oyuncular varsa merkez daha kolay geçilmez.',
    check: (s) => countMidfieldWithTrait(s, ['TEKNİK', 'GÜÇLÜ']) >= 2,
    cleanSheetDefenseBonus: 0.1, perRoundBonus: 22,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = countMidfieldWithTrait(combined, ['TEKNİK', 'GÜÇLÜ']);
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🧱', note: 'orta sahada TEKNİK/GÜÇLÜ' };
    },
  },
  {
    id: 'synergy_tanri_modu', name: 'ZİRVE GÜN', icon: '✨', hidden: true,
    description: 'KAPİTAN, FİNİŞÖR ve frikik tehdidi yüksek moralle birleşirse özel maç gecesi yaşanır.',
    check: (s, morale) =>
      countTag(s, 'KAPİTAN') >= 1 && countTag(s, 'FİNİŞÖR') >= 1 &&
      countTag(s, 'SERBEST VURUŞ') >= 1 && morale >= 90,
    scoreMultiplier: 1.35,
  },
  {
    id: 'synergy_firtina', name: 'KARMA FIRTINA', icon: '🌪️', hidden: true,
    description: 'HIZLI, TEKNİK ve ASİSTÇİ oyuncular birlikteyse hücum planı fırtınaya dönüşür.',
    check: (s) => countTag(s, 'HIZLI') >= 4 && countTag(s, 'TEKNİK') >= 2 && countTag(s, 'ASİSTÇİ') >= 1,
    perWinBonus: 120, goalMultiplier: 1.1,
    getProgress: (s, c) => getKarmaFirtinaProgress(c ? [...s, c] : s),
  },
  {
    id: 'synergy_efsaneler', name: 'EFSANE 11', icon: '🏆', hidden: true,
    description: '3 efsane kart aynı sahadaysa takımın yıldız ağırlığı maça damga vurur.',
    check: (s) => countRarity(s, 'efsane') >= 3, perWinBonus: 150, minMorale: 72,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = countRarity(combined, 'efsane');
      if (n >= 3) return null;
      return { current: n, required: 3, icon: '🏆', note: 'efsane kart topla (round 9+ şans artar)' };
    },
  },
  {
    id: 'synergy_savasci_ruhu', name: 'GERİDEN GEL', icon: '⚔️', hidden: true,
    description: 'SAVAŞÇI oyuncular geriye düşülen maçlarda takımı oyunda tutar.',
    check: (s, _, ctx) => countTag(s, 'SAVAŞÇI') >= 1 && !!ctx?.behindInMatch,
    perGoalBonus: 55,
  },
  {
    id: 'synergy_altin_defans', name: 'ÇELİK STOP', icon: '🔒', hidden: true,
    description: '2 GÜÇLÜ stoper rakip forvetleri yıpratır ve savunma güvenini artırır.',
    check: (s) => s.filter((p) => p.position === 'STP' && p.tags.includes('GÜÇLÜ')).length >= 2,
    cleanSheetDefenseBonus: 0.12, perRoundBonus: 18,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const n = combined.filter((p) => p.position === 'STP' && p.tags.includes('GÜÇLÜ')).length;
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🔒', note: 'GÜÇLÜ stoper topla' };
    },
  },
  {
    id: 'synergy_yildiz_hucum', name: 'YILDIZ HATT', icon: '⭐', hidden: true,
    description: 'Hücum hattında yüksek nadirlikli oyuncular varsa yıldız kalitesi fark yaratır.',
    check: (s) =>
      s.filter((p) => (p.position === 'SF' || p.position === 'SLK' || p.position === 'SÖK') &&
        (p.rarity === 'güçlü' || p.rarity === 'efsane')).length >= 2,
    perGoalBonus: 35,
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
    description: 'ASİSTÇİ ve TEKNİK oyuncular birlikte pas ağını kurar.',
    check: (s) => countTag(s, 'ASİSTÇİ') >= 2 && countTag(s, 'TEKNİK') >= 2,
    perRoundBonus: 32,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const assist = countTag(combined, 'ASİSTÇİ');
      const technical = countTag(combined, 'TEKNİK');
      const have = (assist >= 2 ? 1 : 0) + (technical >= 2 ? 1 : 0);
      if (have >= 2) return null;
      return {
        current: have,
        required: 2,
        icon: '🔗',
        note: tagProgressNote([
          { label: 'ASİSTÇİ', current: assist, required: 2 },
          { label: 'TEKNİK', current: technical, required: 2 },
        ]),
      };
    },
  },
  {
    id: 'synergy_demir_form', name: 'DEMİR FORM', icon: '🛡️', hidden: false,
    description: '2 DAYANIKLI oyuncu uzun run’da kadronun temposunu ayakta tutar.',
    check: (s) => countTag(s, 'DAYANIKLI') >= 2, perRoundBonus: 16,
    getProgress: (s, c) => {
      const n = countTag(c ? [...s, c] : s, 'DAYANIKLI');
      if (n >= 2) return null;
      return { current: n, required: 2, icon: '🛡️' };
    },
  },
  {
    id: 'synergy_ucuz_kadro', name: 'UCUZ KADRO', icon: '📉', hidden: true,
    description: 'GERİLEYEN veteranlar risklidir; doğru kurulursa tecrübeleri hâlâ maç kazandırır.',
    check: (s) => countTag(s, 'GERİLEYEN') >= 3, perWinBonus: 120, perRoundBonus: 12,
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
    description: 'PERFORMANS DÜŞÜŞÜ yaşayan oyuncular DAYANIKLI destekle daha verimli rotasyona girer.',
    check: (s) => countTag(s, 'PERFORMANS DÜŞÜŞÜ') >= 2 && countTag(s, 'DAYANIKLI') >= 1,
    perRoundBonus: 36,
    getProgress: (s, c) => {
      const combined = c ? [...s, c] : s;
      const slump = countTag(combined, 'PERFORMANS DÜŞÜŞÜ');
      const durable = countTag(combined, 'DAYANIKLI');
      const have = (slump >= 2 ? 1 : 0) + (durable >= 1 ? 1 : 0);
      if (have >= 2) return null;
      if (slump === 0 && durable === 0) return null;
      return {
        current: have,
        required: 2,
        icon: '🔄',
        note: tagProgressNote([
          { label: 'PERFORMANS DÜŞÜŞÜ', current: slump, required: 2 },
          { label: 'DAYANIKLI', current: durable, required: 1 },
        ]),
      };
    },
  },
  {
    id: 'synergy_tartismali_guc', name: 'TARTIŞMALI GÜÇ', icon: '💥', hidden: true,
    description: 'TARTIŞMALI oyuncu, yanında LİDER varsa sorun değil silaha dönüşür.',
    check: (s) => countTag(s, 'TARTIŞMALI') >= 1 && countTag(s, 'LİDER') >= 1, perWinBonus: 110,
  },
  {
    id: 'synergy_soguk_kan', name: 'SOĞUK KAN', icon: '🧊', hidden: true,
    description: '2 SOĞUKKANLI oyuncu kötü gidişte takımın paniklemesini engeller.',
    check: (s) => countTag(s, 'SOĞUKKANLI') >= 2, minMorale: 55, perRoundBonus: 14,
  },
  {
    id: 'synergy_yenisezon_patlama', name: 'YENİ SEZON PATLAMASI', icon: '🌱', hidden: true,
    description: 'YENİ SEZON oyuncuları MENTOR ile daha çabuk oyuna alışır.',
    check: (s) => countTag(s, 'YENİ SEZON') >= 2 && countTag(s, 'MENTOR') >= 1, perRoundBonus: 28,
  },
  {
    id: 'synergy_imza_kadrosu', name: 'İMZA KADROSU', icon: '✒️', hidden: true,
    description: '2 imza kartı aynı kadrodaysa özel yetenekler maçın yönünü değiştirebilir.',
    check: (s) => s.filter((p) => p.signature).length >= 2, goalMultiplier: 1.12, perWinBonus: 110,
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

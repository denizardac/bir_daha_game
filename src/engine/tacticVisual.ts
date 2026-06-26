import { getTacticEffect } from '@/data/tactics';
import { FORMATION_SLOT_COUNTS } from '@/data/formations';
import {
  countFastWidePlayers,
  hasSingleFinisherForward,
  isGegenpressReady,
  isHighPressReady,
} from '@/engine/tacticRules';
import type { PlayerCard, TacticCard } from '@/types';
import type { Tag } from '@/types';

export type FormationDot = { x: number; y: number; role?: 'gk' | 'field' };

const FORMATIONS: Record<string, FormationDot[]> = {
  '442': [
    { x: 50, y: 90, role: 'gk' },
    { x: 18, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 82, y: 72 },
    { x: 18, y: 48 }, { x: 38, y: 48 }, { x: 62, y: 48 }, { x: 82, y: 48 },
    { x: 38, y: 22 }, { x: 62, y: 22 },
  ],
  '433': [
    { x: 50, y: 90, role: 'gk' },
    { x: 18, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 82, y: 72 },
    { x: 28, y: 48 }, { x: 50, y: 48 }, { x: 72, y: 48 },
    { x: 22, y: 22 }, { x: 50, y: 18 }, { x: 78, y: 22 },
  ],
  '352': [
    { x: 50, y: 90, role: 'gk' },
    { x: 28, y: 72 }, { x: 50, y: 72 }, { x: 72, y: 72 },
    { x: 12, y: 52 }, { x: 30, y: 48 }, { x: 50, y: 44 }, { x: 70, y: 48 }, { x: 88, y: 52 },
    { x: 38, y: 22 }, { x: 62, y: 22 },
  ],
  '532': [
    { x: 50, y: 90, role: 'gk' },
    { x: 12, y: 72 }, { x: 30, y: 72 }, { x: 50, y: 72 }, { x: 70, y: 72 }, { x: 88, y: 72 },
    { x: 30, y: 48 }, { x: 50, y: 48 }, { x: 70, y: 48 },
    { x: 38, y: 22 }, { x: 62, y: 22 },
  ],
  '4231': [
    { x: 50, y: 90, role: 'gk' },
    { x: 18, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 82, y: 72 },
    { x: 38, y: 56 }, { x: 62, y: 56 },
    { x: 22, y: 36 }, { x: 50, y: 32 }, { x: 78, y: 36 },
    { x: 50, y: 16 },
  ],
  '343': [
    { x: 50, y: 90, role: 'gk' },
    { x: 28, y: 72 }, { x: 50, y: 72 }, { x: 72, y: 72 },
    { x: 12, y: 50 }, { x: 38, y: 52 }, { x: 62, y: 52 }, { x: 88, y: 50 },
    { x: 25, y: 22 }, { x: 50, y: 18 }, { x: 75, y: 22 },
  ],
  'diamond': [
    { x: 50, y: 90, role: 'gk' },
    { x: 16, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 84, y: 72 },
    { x: 50, y: 58 },
    { x: 32, y: 44 }, { x: 68, y: 44 },
    { x: 50, y: 30 },
    { x: 38, y: 14 }, { x: 62, y: 14 },
  ],
  '4411': [
    { x: 50, y: 90, role: 'gk' },
    { x: 18, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 82, y: 72 },
    { x: 16, y: 50 }, { x: 40, y: 50 }, { x: 60, y: 50 }, { x: 84, y: 50 },
    { x: 50, y: 30 },
    { x: 50, y: 14 },
  ],
  '3412': [
    { x: 50, y: 90, role: 'gk' },
    { x: 30, y: 74 }, { x: 50, y: 74 }, { x: 70, y: 74 },
    { x: 12, y: 52 }, { x: 40, y: 52 }, { x: 60, y: 52 }, { x: 88, y: 52 },
    { x: 50, y: 32 },
    { x: 38, y: 14 }, { x: 62, y: 14 },
  ],
  '451': [
    { x: 50, y: 90, role: 'gk' },
    { x: 18, y: 72 }, { x: 38, y: 72 }, { x: 62, y: 72 }, { x: 82, y: 72 },
    { x: 14, y: 48 }, { x: 33, y: 50 }, { x: 50, y: 48 }, { x: 67, y: 50 }, { x: 86, y: 48 },
    { x: 50, y: 20 },
  ],
};

export function getFormationKey(id: string): string | null {
  if (id.includes('4231')) return '4231';
  if (id.includes('4411')) return '4411';
  if (id.includes('3412')) return '3412';
  if (id.includes('451')) return '451';
  if (id.includes('442')) return '442';
  if (id.includes('433')) return '433';
  if (id.includes('352')) return '352';
  if (id.includes('532')) return '532';
  if (id.includes('343')) return '343';
  if (id.includes('diamond')) return 'diamond';
  return null;
}

export function getFormationDots(tacticId: string): FormationDot[] | null {
  const key = getFormationKey(tacticId);
  return key ? FORMATIONS[key] ?? null : null;
}

export function getFormationDotsByKey(key: string): FormationDot[] | null {
  return FORMATIONS[key] ?? null;
}

if (import.meta.env?.DEV) {
  for (const key of Object.keys(FORMATIONS)) {
    const dots = FORMATIONS[key]?.length ?? 0;
    const slots = FORMATION_SLOT_COUNTS[key] ?? 0;
    if (dots !== slots) {
      console.warn(`[formations] ${key}: görsel ${dots} slot, motor ${slots} slot`);
    }
  }
}

export function getTacticHeroCopy(card: TacticCard): { title: string; lines: string[] } {
  if (card.category === 'formasyon') {
    return {
      title: 'Formasyon Kartı',
      lines: [
        'Kadro dizilişini değiştirir',
        'Hücum ve savunma dengesini etkiler',
        'Oyuncu eklemez — maçlarda aktif kalır',
      ],
    };
  }
  return {
    title: 'Sistem Kartı',
    lines: [
      'Oyun felsefesi belirler',
      'Tag\'lere göre maç bonusu verir',
      'Oyuncu eklemez — maçlarda aktif kalır',
    ],
  };
}

function relevantTagsForTactic(id: string): Tag[] {
  const fx = getTacticEffect(id);
  const tags: Tag[] = [];
  if (id === 'tactic_yuksek_blok') return ['HIZLI', 'SAVAŞÇI'];
  if (id === 'tactic_gegenpress') return ['HIZLI', 'SAVAŞÇI', 'GÜÇLÜ'];
  if (fx.fastBonus) tags.push('HIZLI');
  if (fx.technicalBonus) tags.push('TEKNİK');
  if (id === 'tactic_tekli_forvet') tags.push('FİNİŞÖR');
  return tags;
}

export function getTacticBeneficiaryPlayers(card: TacticCard, squad: PlayerCard[], limit = 4): {
  players: PlayerCard[];
  tag: Tag | null;
  label: string;
  reason: string;
  scope: 'players' | 'team';
} {
  const tags = relevantTagsForTactic(card.id);
  const tag = tags[0] ?? null;

  if (card.id === 'tactic_tekli_forvet') {
    const sfPlayers = squad.filter((p) => p.position === 'SF');
    const finisherSf = sfPlayers.filter((p) => p.tags.includes('FİNİŞÖR'));
    if (hasSingleFinisherForward(squad)) {
      return {
        players: finisherSf.slice(0, limit),
        tag: 'FİNİŞÖR',
        label: 'Tek forvet FİNİŞÖR — plan hazır',
        reason: 'Tek forvet + FİNİŞÖR şartını sağlıyor',
        scope: 'players',
      };
    }
    return {
      players: finisherSf.slice(0, limit),
      tag: 'FİNİŞÖR',
      label: sfPlayers.length !== 1
        ? `${sfPlayers.length} forvet var — tek forvet şartı sağlanmıyor`
        : 'Forvet FİNİŞÖR değil — sistem kısır kalır',
      reason: 'Sadece tek forvet FİNİŞÖR ise pozitif çalışır',
      scope: finisherSf.length ? 'players' : 'team',
    };
  }

  if (card.id === 'tactic_yuksek_blok') {
    const players = squad.filter((p) => p.tags.includes('HIZLI') || p.tags.includes('SAVAŞÇI'));
    return {
      players: players.slice(0, limit),
      tag: null,
      label: isHighPressReady(squad) ? 'Baskı profili hazır' : 'Baskı profili eksik',
      reason: 'HIZLI veya SAVAŞÇI oyuncular önde baskıyı taşır',
      scope: players.length ? 'players' : 'team',
    };
  }

  if (card.id === 'tactic_gegenpress') {
    const players = squad.filter((p) => p.tags.includes('HIZLI') || p.tags.includes('SAVAŞÇI') || p.tags.includes('GÜÇLÜ'));
    return {
      players: players.slice(0, limit),
      tag: null,
      label: isGegenpressReady(squad) ? 'Pres kombosu hazır' : 'Pres kombosu eksik',
      reason: 'HIZLI oyuncular ve fiziksel presçiler birlikte gerekir',
      scope: players.length ? 'players' : 'team',
    };
  }

  if (card.id === 'tactic_kanat_bindirme') {
    const wide = new Set(['SLB', 'SÖB', 'SLK', 'SÖK']);
    const players = squad.filter((p) => wide.has(p.position) && p.tags.includes('HIZLI'));
    return {
      players: players.slice(0, limit),
      tag: 'HIZLI',
      label: countFastWidePlayers(squad) > 0 ? `${players.length} HIZLI kanat/bek etkilenir` : 'HIZLI kanat/bek yok',
      reason: 'Sadece bek ve kanattaki HIZLI oyuncular planı taşır',
      scope: players.length ? 'players' : 'team',
    };
  }

  if (tag) {
    const players = squad.filter((p) => p.tags.includes(tag));
    return {
      players: players.slice(0, limit),
      tag,
      label: players.length
        ? `${players.length} ${tag} oyuncu bu sistemden yararlanır`
        : `Kadroda ${tag} yok — bonus şimdilik pasif`,
      reason: `${tag} tag'ine göre etkilenir`,
      scope: players.length ? 'players' : 'team',
    };
  }

  if (card.id === 'tactic_rotasyon') {
    const tired = squad.filter((p) => p.tags.includes('GERİLEYEN') || p.tags.includes('PERFORMANS DÜŞÜŞÜ'));
    return {
      players: tired.slice(0, limit),
      tag: null,
      label: tired.length
        ? `${tired.length} yorgun oyuncu korunur — performans düşüşü yok`
        : 'Kadro rotasyonu aktif — yorgunluk cezası engellenir',
      reason: 'GERİLEYEN / PERFORMANS DÜŞÜŞÜ tagleri hedeflenir',
      scope: tired.length ? 'players' : 'team',
    };
  }

  if (card.category === 'formasyon') {
    const fx = getTacticEffect(card.id);
    if ((fx.defenseMod ?? 0) > 10) {
      const defs = squad.filter((p) => ['KL', 'STP', 'SLB', 'SÖB', 'DOS'].includes(p.position));
      return { players: defs.slice(0, limit), tag: null, label: 'Savunma hattı güçlenir', reason: 'Kaleci, savunma ve DOS rolleri öncelikli etkilenir', scope: 'players' };
    }
    if ((fx.attackMod ?? 0) > 10) {
      const atk = squad.filter((p) => ['SLK', 'SÖK', 'OOS', 'SF'].includes(p.position));
      return { players: atk.slice(0, limit), tag: null, label: 'Hücum hattı öne çıkar', reason: 'Kanat, OOS ve forvet rolleri öncelikli etkilenir', scope: 'players' };
    }
  }

  return {
    players: [],
    tag: null,
    label: 'Dengeli etki — tüm kadroya yayılır',
    reason: 'Belirli oyuncu/tag hedefi yok; takım geneli mod uygulanır',
    scope: 'team',
  };
}

export function getSystemBoardVariant(id: string): 'press' | 'possession' | 'direct' | 'rotate' | 'block' | 'default' {
  if (id.includes('topla')) return 'possession';
  if (id.includes('direkt')) return 'direct';
  if (id.includes('rotasyon')) return 'rotate';
  if (id.includes('blok')) return 'block';
  if (id.includes('352')) return 'press';
  return 'default';
}

import { getActiveSynergies } from '@/data/synergies';
import type { ActiveTactic, MatchEvent, OpponentStyle, PlayerCard } from '@/types';

const OPPONENT_TIPS: Record<OpponentStyle, string> = {
  savunmacı: 'Savunmacı rakip — sabırlı oyna, HIZLI kanatlara güven.',
  saldırgan: 'Saldırgan rakip — savunma hattın kritik, clean sheet bonusu değerli.',
  dengeli: 'Dengeli rakip — tag sinerjilerin maçın kaderini belirler.',
};

const GENERIC_TIPS = [
  'FİNİŞÖR tag\'li oyuncular gol potansiyelini artırır.',
  '3+ HIZLI oyuncu — Kontra Ateşi sinerjisine yaklaş.',
  'Moral 80+ iken LİDER YÜRÜYÜŞÜ sinerjisi açılabilir (LİDER tag).',
  'Clean sheet galibiyette +100 bonus puan.',
  'Seri galibiyet çarpanı 3+ maçta devreye girer.',
  'Eksik kadro (11\'den az) maç gücünü düşürür.',
];

export function getOpponentStyleTip(style: OpponentStyle): string {
  return OPPONENT_TIPS[style];
}

export function getMatchMomentum(goalsFor: number, goalsAgainst: number, minute: number): number {
  const base = 50 + (goalsFor - goalsAgainst) * 18;
  const time = Math.min(minute / 90, 1) * 8;
  return Math.max(8, Math.min(92, base + (goalsFor > goalsAgainst ? time : goalsFor < goalsAgainst ? -time : 0)));
}

export function getLiveCommentary(ev: MatchEvent): string {
  switch (ev.type) {
    case 'goal_for':
      return ev.assistName
        ? `⚽ GOOOOL! ${ev.playerName} — asist ${ev.assistName}!`
        : `⚽ GOOOOL! ${ev.playerName} fileleri havalandırdı!`;
    case 'goal_against':
      return `😤 Rakip golü — ${ev.playerName} ${ev.minute}'`;
    case 'yellow_for':
      return `🟨 Sarı kart — ${ev.playerName}, dikkat!`;
    case 'red_for':
      return `🟥 Kırmızı kart — ${ev.playerName}! (Cezalı değil, sadece maç içi)`;
    case 'yellow_against':
      return `🟨 Rakip sarı gördü — ${ev.playerName}`;
    default:
      return ev.playerName;
  }
}

export function getContextualMatchTip(
  squad: PlayerCard[],
  morale: number,
  opponentRating: number,
  squadAvg: number,
  activeTactics: ActiveTactic[],
  minute: number,
  opponentStyle: OpponentStyle,
): string {
  if (minute < 15) return getOpponentStyleTip(opponentStyle);
  if (squad.length < 11) return `${11 - squad.length} eksik oyuncu — tam kadro maç gücünü yükseltir.`;
  if (morale < 40) return `Moral ${morale} — galibiyet zor, MENTOR/LİDER tag\'leri moral kaldırır.`;
  if (squadAvg + 5 < opponentRating) return `Rakip (${opponentRating}) ortalamanın (${squadAvg}) üstünde — sürpriz lazım.`;
  const synergies = getActiveSynergies(squad, morale, { activeTactics });
  if (synergies.length >= 2) return `${synergies.length} aktif sinerji — ${synergies[0]!.name} ateşte!`;
  if (activeTactics.some((t) => t.fastBonus)) {
    const fast = squad.filter((p) => p.tags.includes('HIZLI')).length;
    if (fast >= 2) return `${fast} HIZLI oyuncu taktik bonusunu besliyor.`;
  }
  return GENERIC_TIPS[minute % GENERIC_TIPS.length]!;
}

export function getSquadSnapshotLines(squad: PlayerCard[], limit = 4): { name: string; rating: number; pos: string }[] {
  return [...squad]
    .sort((a, b) => b.currentRating - a.currentRating)
    .slice(0, limit)
    .map((p) => ({ name: p.name, rating: p.currentRating, pos: p.position }));
}

import type { ActiveTactic, GamePhase, PlayerCard } from '@/types';
import type { ManualLineup } from '@/engine/lineupPreview';

export type DebugCodeSource = {
  seed: string;
  round: number;
  phase?: GamePhase;
  squad: PlayerCard[];
  activeTactics?: ActiveTactic[];
  manualLineup?: ManualLineup;
  incomingPlayerId?: string | null;
  outgoingPlayerId?: string | null;
};

export type DebugCodePayload = {
  v: 1;
  seed: string;
  round: number;
  phase?: GamePhase;
  squad: Array<Pick<PlayerCard, 'id' | 'name' | 'position' | 'currentRating' | 'tags'>>;
  tactics: string[];
  manual: ManualLineup;
  incoming: string | null;
  outgoing: string | null;
};

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** Kişisel isim/skor içermeyen, seed tabanlı yeniden üretim kodu. */
export function createDebugCode(source: DebugCodeSource): string {
  const payload: DebugCodePayload = {
    v: 1,
    seed: source.seed,
    round: source.round,
    phase: source.phase,
    squad: source.squad.map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      currentRating: player.currentRating,
      tags: [...player.tags],
    })),
    tactics: source.activeTactics?.map((tactic) => tactic.id) ?? [],
    manual: { ...(source.manualLineup ?? {}) },
    incoming: source.incomingPlayerId ?? null,
    outgoing: source.outgoingPlayerId ?? null,
  };
  return `BD1.${toBase64Url(JSON.stringify(payload))}`;
}

export function parseDebugCode(code: string): DebugCodePayload | null {
  if (!code.startsWith('BD1.')) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(code.slice(4))) as DebugCodePayload;
    return parsed?.v === 1 && typeof parsed.seed === 'string' && Array.isArray(parsed.squad)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

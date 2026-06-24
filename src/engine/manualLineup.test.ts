import { describe, expect, it } from 'vitest';
import { assignSquadToFormation, getStartingEleven, reconcileManualLineup, resolveLineupDrop } from '@/engine/lineupPreview';
import { selectDepartingPlayer } from '@/engine/squadLogic';
import type { PlayerCard } from '@/types';

function p(overrides: Partial<PlayerCard> & Pick<PlayerCard, 'id' | 'name' | 'position'>): PlayerCard {
  return { kind: 'player', rating: 70, currentRating: 70, rarity: 'iyi', tags: [], ...overrides };
}

// 4-4-2 slot index: 0 KL, 1 SLB, 2 STP, 3 STP, 4 SGB, 5 SLK, 6 DOS, 7 OS, 8 SGK, 9 SF, 10 SF
const gk = p({ id: 'gk', name: 'Kaleci', position: 'KL', currentRating: 80, rating: 80 });
const stpA = p({ id: 'a', name: 'Stoper A', position: 'STP', currentRating: 80, rating: 80 });
const stpB = p({ id: 'b', name: 'Stoper B', position: 'STP', currentRating: 75, rating: 75 });
const stpC = p({ id: 'c', name: 'Stoper C', position: 'STP', currentRating: 70, rating: 70 });
const squad = [gk, stpA, stpB, stpC];

// İki STP, iki STP slotu (2,3). Otomatik: guclu 'a' slot 2, 'b' slot 3.
const twoStp = [gk, stpA, stpB];

describe('manuel dizilis override', () => {
  it('pin yoksa otomatik: guclu STP slot 2de', () => {
    const auto = assignSquadToFormation(twoStp, '442');
    expect(auto[2]?.player?.id).toBe('a');
    expect(auto[3]?.player?.id).toBe('b');
  });

  it('pin oyuncuyu o slota sabitler (guclu a slot 2yi alamaz, b kalir)', () => {
    const lineup = assignSquadToFormation(twoStp, '442', { 2: 'b' });
    expect(lineup[2]?.player?.id).toBe('b'); // pin'lenen
    expect(lineup[3]?.player?.id).toBe('a'); // a slot 3e kayar
  });

  it('getStartingEleven pinlenen oyuncuyu icerir', () => {
    const xi = getStartingEleven(twoStp, [], { 2: 'b' });
    expect(xi.map((pl) => pl.id)).toContain('b');
  });

  it('gecersiz pin (kadroda olmayan oyuncu) yok sayilir → otomatik', () => {
    const lineup = assignSquadToFormation(twoStp, '442', { 2: 'ghost' });
    expect(lineup[2]?.player?.id).toBe('a');
  });
});

describe('reconcileManualLineup', () => {
  it('kadroda olmayan oyuncunun pinini atar', () => {
    expect(reconcileManualLineup({ 2: 'gone' }, squad, '442')).toEqual({});
  });

  it('gecerli pini korur', () => {
    expect(reconcileManualLineup({ 2: 'c' }, squad, '442')).toEqual({ 2: 'c' });
  });

  it('mevki-uyumsuz pini atar (SF, STP slotuna konamaz)', () => {
    const sf = p({ id: 'sf', name: 'Forvet', position: 'SF', currentRating: 78, rating: 78 });
    expect(reconcileManualLineup({ 2: 'sf' }, [...squad, sf], '442')).toEqual({});
  });

  it('ayni oyuncuyu iki slota pinlemeyi tekillestirir', () => {
    const out = reconcileManualLineup({ 2: 'c', 3: 'c' }, squad, '442');
    expect(Object.values(out)).toEqual(['c']);
  });

  it('bos override aynen bos doner', () => {
    expect(reconcileManualLineup({}, squad, '442')).toEqual({});
  });
});

describe('resolveLineupDrop (surukle-birak takas matematigi)', () => {
  // 442: slot 1 SLB (bos), slot 2/3 STP (a/b). STP, SLB oynayabilir (flex).
  const lineup = assignSquadToFormation(twoStp, '442');

  it('slot -> bos slot: oyuncuyu tasir (eski slot otomatige kalir)', () => {
    const next = resolveLineupDrop({}, lineup, [], { playerId: 'a', from: 2 }, { kind: 'slot', index: 1 });
    expect(next).toEqual({ 1: 'a' });
  });

  it('slot -> dolu slot: takas (iki pin)', () => {
    const next = resolveLineupDrop({}, lineup, [], { playerId: 'a', from: 2 }, { kind: 'slot', index: 3 });
    expect(next).toEqual({ 3: 'a', 2: 'b' });
  });

  it('uyumsuz slota birakma iptal (STP, SF slotuna konamaz)', () => {
    const next = resolveLineupDrop({}, lineup, [], { playerId: 'a', from: 2 }, { kind: 'slot', index: 9 });
    expect(next).toBeNull();
  });

  it('ayni slota birakma iptal', () => {
    const next = resolveLineupDrop({}, lineup, [], { playerId: 'a', from: 2 }, { kind: 'slot', index: 2 });
    expect(next).toBeNull();
  });

  it('yedek -> bos slot: pinler', () => {
    const next = resolveLineupDrop({}, lineup, [stpC], { playerId: 'c', from: 'bench' }, { kind: 'slot', index: 1 });
    expect(next).toEqual({ 1: 'c' });
  });

  it('yedek -> dolu slot: pinler (starter dusurur)', () => {
    const next = resolveLineupDrop({}, lineup, [stpC], { playerId: 'c', from: 'bench' }, { kind: 'slot', index: 2 });
    expect(next).toEqual({ 2: 'c' });
  });

  it('starter -> yedek: en guclu uygun yedekle takas', () => {
    const next = resolveLineupDrop({}, lineup, [stpC], { playerId: 'a', from: 2 }, { kind: 'bench' });
    expect(next).toEqual({ 2: 'c' });
  });
});

describe('selectDepartingPlayer override-aware (yedege dusme)', () => {
  // 2 kaleci, 1 KL slotu → biri yedek. Diğerleri sahada.
  const g1 = p({ id: 'g1', name: 'KL Bir', position: 'KL', currentRating: 75, rating: 75 });
  const g2 = p({ id: 'g2', name: 'KL Iki', position: 'KL', currentRating: 70, rating: 70 });
  const a = p({ id: 'a', name: 'STP A', position: 'STP', currentRating: 80, rating: 80 });
  const b = p({ id: 'b', name: 'STP B', position: 'STP', currentRating: 78, rating: 78 });
  const sq = [g1, g2, a, b];

  it('otomatik: yedek kalan (zayif) kaleci duser', () => {
    expect(selectDepartingPlayer(sq, 50).id).toBe('g2');
  });

  it('manuel: zayif kaleci pinlenince guclu kaleci yedektedir ve o duser', () => {
    // slot 0 (KL) -> g2 pin: g2 sahada, g1 yedekte. Kayipta yedek g1 duser.
    expect(selectDepartingPlayer(sq, 50, [], { 0: 'g2' }).id).toBe('g1');
  });
});

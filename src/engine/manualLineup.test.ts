import { describe, expect, it } from 'vitest';
import { assignSquadToFormation, getStartingEleven, reconcileManualLineup } from '@/engine/lineupPreview';
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

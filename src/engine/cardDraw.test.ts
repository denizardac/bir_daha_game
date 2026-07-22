import { describe, expect, it } from 'vitest';
import { drawOffers, drawTargetedScoutOffers, drawTacticCategoryOffers, getPlayerPoolForAccess, getScoutImprovementScore, rerollSinglePlayerOffer } from '@/engine/cardDraw';
import { PLAYER_POOL, clonePlayer, getStartingSquad } from '@/data/players';
import { isPlayerCard } from '@/types';

function nameLc(s: string) {
  return s.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase();
}

describe('drawOffers', () => {
  it('keeps Daily Seed independent from personal unlocks and gates them in Free Mode', () => {
    const dailyLocked = getPlayerPoolForAccess({ isDailySeed: true, unlockedPlayerIds: [] }).map((p) => p.id);
    const dailyUnlocked = getPlayerPoolForAccess({
      isDailySeed: true,
      unlockedPlayerIds: ['legend_01', 'player_geri_donuscu'],
    }).map((p) => p.id);
    expect(dailyUnlocked).toEqual(dailyLocked);
    expect(dailyLocked).toContain('legend_01');
    expect(dailyLocked).not.toContain('player_geri_donuscu');

    const freeLocked = getPlayerPoolForAccess({ isDailySeed: false, unlockedPlayerIds: [] }).map((p) => p.id);
    const freeUnlocked = getPlayerPoolForAccess({
      isDailySeed: false,
      unlockedPlayerIds: ['legend_01', 'player_geri_donuscu'],
    }).map((p) => p.id);
    expect(freeLocked).not.toContain('legend_01');
    expect(freeLocked).not.toContain('player_geri_donuscu');
    expect(freeUnlocked).toContain('legend_01');
    expect(freeUnlocked).toContain('player_geri_donuscu');
  });

  it('puts the queued unlocked player into a Free Mode offer without duplicating the squad', () => {
    const access = {
      isDailySeed: false,
      unlockedPlayerIds: ['legend_01'],
      guaranteedPlayerId: 'legend_01',
    };
    const offers = drawOffers('guarantee-seed', 1, 0, [], [], false, 0, 'normal', 'players', access);
    expect(offers.map((card) => card.id)).toContain('legend_01');

    const guaranteed = PLAYER_POOL.find((player) => player.id === 'legend_01')!;
    const blocked = drawOffers('guarantee-seed', 2, 0, [guaranteed], [], false, 0, 'normal', 'players', access);
    expect(blocked.map((card) => card.id)).not.toContain('legend_01');
  });

  it('Kriz Kontratı teklifinde 78+ toparlanma profili ve gerekli kaleci seçeneğini korur', () => {
    const offers = drawOffers(
      'crisis-seed', 7, 2, [], [], true, 0, 'normal', 'players',
      { isDailySeed: false, unlockedPlayerIds: [], guaranteeRecoveryPlayer: true },
    ).filter(isPlayerCard);
    const recoveryTags = new Set(['POTANSİYEL', 'MENTOR', 'LİDER', 'KAPİTAN', 'DAYANIKLI']);
    expect(offers.some((player) => player.position === 'KL')).toBe(true);
    expect(offers.some((player) => player.currentRating >= 78 && player.tags.some((tag) => recoveryTags.has(tag)))).toBe(true);
  });

  it('Hedefli Scout en az bir Sinerji ilerleten benzersiz teklif üretir', () => {
    const squad = [PLAYER_POOL.find((player) => player.tags.includes('HIZLI') && player.position !== 'KL')!];
    const offers = drawTargetedScoutOffers(
      'scout-seed', 5, 0, squad, [], false, 1,
      { isDailySeed: false, unlockedPlayerIds: [] },
    ).filter(isPlayerCard);
    expect(offers).toHaveLength(3);
    expect(new Set(offers.map((player) => player.name.toLocaleLowerCase('tr-TR'))).size).toBe(3);
    expect(offers.some((player) => getScoutImprovementScore(squad, player) > 0)).toBe(true);
  });

  it('returns 3 offers for normal round', () => {
    const offers = drawOffers('test-seed-1', 2, 0, [], [], false, 0);
    expect(offers).toHaveLength(3);
    expect(offers.every((c) => c.kind === 'player' || c.kind === 'tactic' || c.kind === 'training')).toBe(true);
  });

  it('keeps every opening player offer inside the safe 65-78 rating band', () => {
    for (let index = 0; index < 500; index++) {
      const seed = `opening-safe-band-${index}`;
      const offers = drawOffers(seed, 1, 0, getStartingSquad(seed, true), [], false, 0).filter(isPlayerCard);
      expect(offers).toHaveLength(3);
      expect(offers.every((player) => player.currentRating >= 65 && player.currentRating <= 78)).toBe(true);
    }
  });

  it('is deterministic for same seed and round', () => {
    const squad = [{ id: 'p1', name: 'Deniz Acar', position: 'OS' as const }];
    const a = drawOffers('stable-seed', 5, 1, squad, [], false, 0);
    const b = drawOffers('stable-seed', 5, 1, squad, [], false, 0);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
  });

  it('changes player offers across different seeds', () => {
    const squad = [{ id: 'p1', name: 'Deniz Acar', position: 'OS' as const }];
    const a = drawOffers('daily-seed-a', 5, 1, squad, [], false, 0).map((c) => c.id);
    const b = drawOffers('daily-seed-b', 5, 1, squad, [], false, 0).map((c) => c.id);
    expect(a).not.toEqual(b);
  });

  it('boosts rarity on reroll index', () => {
    const base = drawOffers('reroll-seed', 6, 0, [], [], false, 0).filter(isPlayerCard);
    const boosted = drawOffers('reroll-seed', 6, 0, [], [], false, 2).filter(isPlayerCard);
    const avg = (cards: typeof base) =>
      cards.reduce((s, c) => s + c.rating, 0) / Math.max(cards.length, 1);
    expect(avg(boosted)).toBeGreaterThanOrEqual(avg(base) - 5);
  });

  it('never offers a player already in the squad', () => {
    const squad = PLAYER_POOL.slice(20, 31).map((p) => clonePlayer(p));
    const squadNames = new Set(squad.map((p) => nameLc(p.name)));
    for (let round = 2; round <= 14; round++) {
      if (round % 3 === 0) continue; // taktik turu
      for (let s = 0; s < 25; s++) {
        const offers = drawOffers(`squad-dup-${s}`, round, 1, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
        for (const o of offers) expect(squadNames.has(nameLc(o.name))).toBe(false);
      }
    }
  });

  it('reroll never duplicates the squad or an adjacent offer', () => {
    const squad = PLAYER_POOL.slice(20, 31).map((p) => clonePlayer(p));
    const squadNames = new Set(squad.map((p) => nameLc(p.name)));
    for (let round = 2; round <= 14; round++) {
      if (round % 3 === 0) continue;
      for (let s = 0; s < 25; s++) {
        const seed = `reroll-dup-${s}`;
        const offers = drawOffers(seed, round, 1, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
        for (let slot = 0; slot < offers.length; slot++) {
          for (let ri = 1; ri <= 4; ri++) {
            const others = offers.filter((_, i) => i !== slot);
            const rep = rerollSinglePlayerOffer(seed, round, 1, squad, others, slot, ri, false);
            expect(squadNames.has(nameLc(rep.name))).toBe(false);
            expect(others.some((o) => nameLc(o.name) === nameLc(rep.name))).toBe(false);
          }
        }
      }
    }
  });

  it('sequential rerolls on the same slot never repeat the immediately previous result', () => {
    const squad = PLAYER_POOL.slice(20, 31).map((p) => clonePlayer(p));
    for (let round = 2; round <= 14; round++) {
      if (round % 3 === 0) continue;
      for (let s = 0; s < 15; s++) {
        const seed = `reroll-seq-${s}`;
        let offers = drawOffers(seed, round, 1, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
        const slot = 0;
        let prevName = nameLc(offers[slot]!.name);
        for (let ri = 1; ri <= 5; ri++) {
          // Same accumulation the store uses: ALL current offers — including the
          // slot's own previous result — are excluded from the next reroll.
          const rep = rerollSinglePlayerOffer(seed, round, 1, squad, offers, slot, ri, false);
          expect(nameLc(rep.name)).not.toBe(prevName);
          prevName = nameLc(rep.name);
          offers = [...offers.slice(0, slot), rep, ...offers.slice(slot + 1)];
        }
      }
    }
  });

  it('single reroll avoids low-floor offers when the pool has better options', () => {
    const squad = PLAYER_POOL.slice(20, 26).map((p) => clonePlayer(p));
    for (let s = 0; s < 30; s++) {
      const seed = `reroll-floor-${s}`;
      const offers = drawOffers(seed, 7, 0, squad, [], false, 0, 'normal', 'players').filter(isPlayerCard);
      const replacement = rerollSinglePlayerOffer(seed, 7, 0, squad, offers.slice(1), 0, 2, false);
      expect(replacement.currentRating).toBeGreaterThanOrEqual(70);
    }
  });

  it.each([1, 12])('single reroll draws from a broad player pool in round %s', (round) => {
    const sampleSize = 400;
    const initialNames = new Set<string>();
    const rerolledNames = new Set<string>();
    let initialRatingTotal = 0;
    let rerolledRatingTotal = 0;

    for (let index = 0; index < sampleSize; index++) {
      const seed = `reroll-variety-${round}-${index}`;
      const offers = drawOffers(seed, round, 0, [], [], false, 0, 'normal', 'players').filter(isPlayerCard);
      const current = offers[0]!;
      const replacement = rerollSinglePlayerOffer(seed, round, 0, [], offers, 0, 1, false);
      initialNames.add(nameLc(current.name));
      rerolledNames.add(nameLc(replacement.name));
      initialRatingTotal += current.currentRating;
      rerolledRatingTotal += replacement.currentRating;
    }

    expect(rerolledNames.size).toBeGreaterThanOrEqual(Math.floor(initialNames.size * 0.6));
    expect(rerolledRatingTotal / sampleSize).toBeGreaterThanOrEqual(initialRatingTotal / sampleSize);
  });

  it('tactic category reroll excludes cards already shown in that category', () => {
    const current = ['tactic_433_kontr', 'tactic_442'];
    const fresh = drawTacticCategoryOffers('tactic-reroll-seed', 3, [], 'formasyon', 1, current);
    expect(fresh).toHaveLength(2);
    expect(fresh.some((c) => current.includes(c.id))).toBe(false);
  });

  it('does not offer the already-active default 4-4-2 on the first tactic day', () => {
    for (let index = 0; index < 100; index++) {
      const seed = `first-tactic-day-${index}`;
      const initial = drawOffers(seed, 3, 0, [], [], false, 0, 'normal', 'tacticBonus');
      const rerolled = drawTacticCategoryOffers(seed, 3, [], 'formasyon', 1);

      expect(initial.some((card) => card.id === 'tactic_442')).toBe(false);
      expect(rerolled.some((card) => card.id === 'tactic_442')).toBe(false);
    }
  });

  it('keeps 4-4-2 available after the first tactic day', () => {
    const laterOffers = Array.from({ length: 100 }, (_, index) =>
      drawOffers(`later-tactic-day-${index}`, 6, 0, [], [], false, 0, 'normal', 'tacticBonus'),
    ).flat();

    expect(laterOffers.some((card) => card.id === 'tactic_442')).toBe(true);
  });
});

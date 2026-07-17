import { describe, expect, it } from 'vitest';
import { rollGoals, simulateMatch, type MatchSimulationInput } from '@/engine/matchSimulation';
import { getStartingSquad } from '@/data/players';
import { TACTIC_CARDS, getTacticEffect } from '@/data/tactics';
import { drawOffers } from '@/engine/cardDraw';
import { applyPlayerToSquad, assignSquadToFormation } from '@/engine/lineupPreview';
import type { ActiveTactic, PlayerCard, Position, Tag } from '@/types';
import { isPlayerCard } from '@/types';
import { getDailySeed } from '@/engine/seed';

function ratedPlayer(id: string, position: Position, rating = 75): PlayerCard {
  return {
    kind: 'player', id, name: id, position, rating, currentRating: rating, rarity: 'iyi', tags: [],
  };
}

function full442Squad(): PlayerCard[] {
  return [
    ratedPlayer('gk', 'KL'),
    ratedPlayer('lb', 'SLB'),
    ratedPlayer('cb1', 'STP'),
    ratedPlayer('cb2', 'STP'),
    ratedPlayer('rb', 'SÖB'),
    ratedPlayer('lw', 'SLK'),
    ratedPlayer('dm', 'DOS'),
    ratedPlayer('cm', 'OS'),
    ratedPlayer('rw', 'SÖK'),
    ratedPlayer('st1', 'SF'),
    ratedPlayer('st2', 'SF'),
  ];
}

function effectiveComposite(result: ReturnType<typeof match>): number {
  return Math.sqrt(result.forecast!.teamAttack * result.forecast!.teamDefense);
}

function squadForFormation(formationKey: string): PlayerCard[] {
  return assignSquadToFormation([], formationKey).map((slot, index) => (
    ratedPlayer(`${formationKey}-${index}`, slot.slot.preferred[0]!, 75)
  ));
}

function withTags(squad: PlayerCard[], assignments: Tag[][]): PlayerCard[] {
  return squad.map((player, index) => ({ ...player, tags: assignments[index] ?? [] }));
}

function match(
  seed: string,
  round: number,
  squad: PlayerCard[],
  morale: number,
  options: Omit<MatchSimulationInput, 'seed' | 'round' | 'squad' | 'morale'> = {},
) {
  return simulateMatch({ seed, round, squad, morale, ...options });
}

describe('rollGoals', () => {
  it('returns non-negative integers', () => {
    let rng = 0.5;
    const next = () => { rng = (rng * 1.7 + 0.13) % 1; return rng; };
    for (let i = 0; i < 20; i++) {
      const g = rollGoals(next, 1 + i * 0.1);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(6);
    }
  });
});

describe('simulateMatch', () => {
  it('aynı maç koşullarında daha güçlü takım daha kötü sonuç alamaz', () => {
    const outcomeRank = { loss: 0, draw: 1, win: 2 } as const;
    const regressions: string[] = [];

    for (let i = 0; i < 5_000; i++) {
      const seed = `monotonic-${i}`;
      const base = getStartingSquad(seed, true);
      const elite = base.map((player) => ({ ...player, rating: 99, currentRating: 99 }));
      const regularMatch = match(seed, 2, base, 68);
      const eliteMatch = match(seed, 2, elite, 68);
      if (outcomeRank[eliteMatch.outcome] < outcomeRank[regularMatch.outcome]) regressions.push(seed);
    }

    expect(regressions).toEqual([]);
  }, 15_000);

  it('hesapladığı gerçek maç olasılıklarını sonuçla birlikte döndürür', () => {
    const seed = 'forecast-strength-check';
    const base = getStartingSquad(seed, true);
    const elite = base.map((player) => ({ ...player, rating: 99, currentRating: 99 }));
    const regularMatch = match(seed, 7, base, 68);
    const eliteMatch = match(seed, 7, elite, 68);
    const regularForecast = (regularMatch as typeof regularMatch & {
      forecast?: { winProbability: number; drawProbability: number; lossProbability: number };
    }).forecast;
    const eliteForecast = (eliteMatch as typeof eliteMatch & {
      forecast?: { winProbability: number; drawProbability: number; lossProbability: number };
    }).forecast;

    expect(regularForecast).toBeDefined();
    expect(eliteForecast).toBeDefined();
    expect(
      regularForecast!.winProbability + regularForecast!.drawProbability + regularForecast!.lossProbability,
    ).toBeCloseTo(1, 10);
    expect(eliteForecast!.winProbability).toBeGreaterThan(regularForecast!.winProbability);
    expect(eliteForecast!.lossProbability).toBeLessThan(regularForecast!.lossProbability);
  });

  it('ikincil mevki cezasını tüm takıma değil ilgili oyunculara uygular', () => {
    const squad = full442Squad();
    const tactics = [getTacticEffect('tactic_442')];
    const ideal = match('position-fit', 7, squad, 70, { activeTactics: tactics });
    const flex = match(
      'position-fit',
      7,
      squad,
      70,
      { activeTactics: tactics, manualLineup: { 1: 'cb1', 2: 'lb' } },
    );
    const attackRatio = flex.forecast!.teamAttack / ideal.forecast!.teamAttack;
    const defenseRatio = flex.forecast!.teamDefense / ideal.forecast!.teamDefense;

    expect(attackRatio).toBeLessThan(1);
    expect(defenseRatio).toBeLessThan(1);
    expect(attackRatio).toBeGreaterThan(0.975);
    expect(defenseRatio).toBeGreaterThan(0.975);
  });

  it('Catenaccio hücumdan feragat ederken savunmayı gerçekten güçlendirir', () => {
    const squad = full442Squad();
    const neutral = match('catenaccio-balance', 7, squad, 70);
    const catenaccio = match(
      'catenaccio-balance', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_catenaccio')] },
    );

    expect(catenaccio.forecast!.teamAttack).toBeLessThan(neutral.forecast!.teamAttack);
    expect(catenaccio.forecast!.teamDefense).toBeGreaterThan(neutral.forecast!.teamDefense);
    expect(catenaccio.forecast!.lossProbability).toBeLessThanOrEqual(neutral.forecast!.lossProbability);
  });

  it('Yüksek Press uygun oyuncu profiliyle maç gücüne dönüşür', () => {
    const squad = full442Squad().map((player, index) => index < 3
      ? { ...player, tags: [index === 0 ? 'SAVAŞÇI' : 'HIZLI'] as PlayerCard['tags'] }
      : player);
    const neutral = match('high-press-ready', 7, squad, 70);
    const pressing = match(
      'high-press-ready', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_yuksek_blok')] },
    );

    expect(pressing.forecast!.teamAttack).toBeGreaterThan(neutral.forecast!.teamAttack);
    expect(pressing.forecast!.winProbability).toBeGreaterThan(neutral.forecast!.winProbability);
  });

  it('Topla Oynama teknik kadronun hücum ve savunma kontrolünü artırır', () => {
    const squad = full442Squad().map((player, index) => index < 4
      ? { ...player, tags: ['TEKNİK'] as PlayerCard['tags'] }
      : player);
    const neutral = match('possession-ready', 7, squad, 70);
    const possession = match(
      'possession-ready', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_topla_oyn')] },
    );

    expect(possession.forecast!.teamAttack).toBeGreaterThan(neutral.forecast!.teamAttack);
    expect(possession.forecast!.teamDefense).toBeGreaterThan(neutral.forecast!.teamDefense);
  });

  it('Direkt Futbol hızlı kadronun hücum gücünü artırır', () => {
    const squad = full442Squad().map((player, index) => index < 3
      ? { ...player, tags: ['HIZLI'] as PlayerCard['tags'] }
      : player);
    const neutral = match('direct-ready', 7, squad, 70);
    const direct = match(
      'direct-ready', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_direkt')] },
    );

    expect(direct.forecast!.teamAttack).toBeGreaterThan(neutral.forecast!.teamAttack);
  });

  it('Tiki-Taka yeterli teknik profilde geçiş riskini telafi edip kontrol sağlar', () => {
    const squad = full442Squad().map((player, index) => index < 5
      ? { ...player, tags: ['TEKNİK'] as PlayerCard['tags'] }
      : player);
    const neutral = match('tiki-ready', 7, squad, 70);
    const tikiTaka = match(
      'tiki-ready', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_tiki_taka')] },
    );

    expect(tikiTaka.forecast!.teamAttack).toBeGreaterThan(neutral.forecast!.teamAttack);
    expect(tikiTaka.forecast!.teamDefense).toBeGreaterThan(neutral.forecast!.teamDefense);
  });

  it('Kanat Bindirmesi hızlı geniş oyuncularla hücum avantajı üretir', () => {
    const squad = full442Squad().map((player) => ['lb', 'lw', 'rb', 'rw'].includes(player.id)
      ? { ...player, tags: ['HIZLI'] as PlayerCard['tags'] }
      : player);
    const neutral = match('wide-ready', 7, squad, 70);
    const overlaps = match(
      'wide-ready', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_kanat_bindirme')] },
    );

    expect(overlaps.forecast!.teamAttack).toBeGreaterThan(neutral.forecast!.teamAttack);
  });

  it('formasyonun hücum-savunma takası gerçek maç gücüne yansır', () => {
    const squad = full442Squad();
    const attacking = match(
      'formation-tradeoff', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_343')] },
    );
    const defensive = match(
      'formation-tradeoff', 7, squad, 70, { activeTactics: [getTacticEffect('tactic_532')] },
    );

    expect(attacking.forecast!.teamAttack).toBeGreaterThan(defensive.forecast!.teamAttack);
    expect(attacking.forecast!.teamDefense).toBeLessThan(defensive.forecast!.teamDefense);
  });

  it('bütün formasyonların ideal kadrodaki net maç gücünü dar bir denge bandında tutar', () => {
    const formationKeys: Record<string, string> = {
      tactic_433_kontr: '433', tactic_442: '442', tactic_352: '352', tactic_532: '532',
      tactic_4231: '4231', tactic_343: '343', tactic_diamond: 'diamond', tactic_4411: '4411',
      tactic_3412: '3412', tactic_451: '451',
    };

    for (const [tacticId, formationKey] of Object.entries(formationKeys)) {
      const squad = squadForFormation(formationKey);
      const tactic = getTacticEffect(tacticId);
      const neutralFormation: ActiveTactic = { ...tactic, attackMod: 0, defenseMod: 0 };
      const neutral = match(`formation-balance-${formationKey}`, 7, squad, 70, {
        activeTactics: [neutralFormation],
      });
      const active = match(`formation-balance-${formationKey}`, 7, squad, 70, {
        activeTactics: [tactic],
      });
      const ratio = effectiveComposite(active) / effectiveComposite(neutral);

      expect(ratio, tacticId).toBeGreaterThanOrEqual(0.99);
      expect(ratio, tacticId).toBeLessThanOrEqual(1.03);
    }
  });

  it('hazır kadroda bütün oyun sistemlerini benzer net güç bandında tutar', () => {
    const base = full442Squad();
    const readySquads: Record<string, PlayerCard[]> = {
      tactic_yuksek_blok: withTags(base, [['SAVAŞÇI'], ['HIZLI'], ['HIZLI']]),
      tactic_topla_oyn: withTags(base, [['TEKNİK'], ['TEKNİK'], ['TEKNİK'], ['TEKNİK']]),
      tactic_direkt: withTags(base, [['HIZLI'], ['HIZLI'], ['HIZLI']]),
      tactic_rotasyon: base,
      tactic_tekli_forvet: withTags(base.slice(0, 10), [[], [], [], [], [], [], [], [], [], ['FİNİŞÖR']]),
      tactic_catenaccio: base,
      tactic_gegenpress: withTags(base, [['HIZLI', 'SAVAŞÇI'], ['HIZLI', 'GÜÇLÜ']]),
      tactic_tiki_taka: withTags(base, [['TEKNİK'], ['TEKNİK'], ['TEKNİK'], ['TEKNİK'], ['TEKNİK']]),
      tactic_park_bus: base,
      tactic_kanat_bindirme: base.map((player) => ['lb', 'lw', 'rb', 'rw'].includes(player.id)
        ? { ...player, tags: ['HIZLI'] as Tag[] }
        : player),
    };

    for (const card of TACTIC_CARDS.filter((candidate) => candidate.category === 'sistem')) {
      const squad = readySquads[card.id]!;
      const neutral = match(`system-balance-${card.id}`, 7, squad, 70);
      const active = match(`system-balance-${card.id}`, 7, squad, 70, {
        activeTactics: [getTacticEffect(card.id)],
      });
      const ratio = effectiveComposite(active) / effectiveComposite(neutral);

      expect(ratio, card.id).toBeGreaterThanOrEqual(0.995);
      expect(ratio, card.id).toBeLessThanOrEqual(1.055);
    }
  });

  it('maç etkili hücum ve savunma sinerjilerini olasılıklara katar', () => {
    const base = full442Squad().map((player) => player.id === 'st1'
      ? { ...player, tags: ['FİNİŞÖR'] as PlayerCard['tags'] }
      : player);
    const tripleAttack = base.map((player) => player.id === 'st2'
      ? { ...player, tags: ['FİNİŞÖR'] as PlayerCard['tags'] }
      : player);
    const attackWithoutSynergy = match('synergy-attack', 7, base, 70);
    const attackWithSynergy = match('synergy-attack', 7, tripleAttack, 70);
    expect(
      attackWithSynergy.forecast!.teamAttack / attackWithoutSynergy.forecast!.teamAttack,
    ).toBeGreaterThan(1.15);

    const withoutIronWall = full442Squad().map((player) => {
      if (player.id === 'gk') return { ...player, rating: 74, currentRating: 74 };
      if (player.id === 'st1') return { ...player, rating: 76, currentRating: 76 };
      return player;
    });
    const withIronWall = full442Squad();
    const defenseWithoutSynergy = match('synergy-defense', 7, withoutIronWall, 70);
    const defenseWithSynergy = match('synergy-defense', 7, withIronWall, 70);
    expect(
      defenseWithSynergy.forecast!.teamDefense / defenseWithoutSynergy.forecast!.teamDefense,
    ).toBeGreaterThan(1.05);
  });

  it('ikinci maçta ölçülü mağlubiyet riski bırakır ve elit kadroyu büyük ölçüde korur', () => {
    const sampleSize = 2_000;
    let baseLosses = 0;
    let eliteLosses = 0;
    let eliteHeavyLosses = 0;

    for (let i = 0; i < sampleSize; i++) {
      const seed = `round-two-balance-${i}`;
      const base = getStartingSquad(seed, true);
      const elite = base.map((player) => ({ ...player, rating: 99, currentRating: 99 }));
      const regularMatch = match(seed, 2, base, 68);
      const eliteMatch = match(seed, 2, elite, 68);
      if (regularMatch.outcome === 'loss') baseLosses += 1;
      if (eliteMatch.outcome === 'loss') eliteLosses += 1;
      if (eliteMatch.goalsAgainst - eliteMatch.goalsFor >= 2) eliteHeavyLosses += 1;
    }

    expect(baseLosses / sampleSize).toBeGreaterThanOrEqual(0.08);
    expect(baseLosses / sampleSize).toBeLessThanOrEqual(0.18);
    expect(eliteLosses / sampleSize).toBeLessThanOrEqual(0.02);
    expect(eliteHeavyLosses / sampleSize).toBeLessThanOrEqual(0.005);
  });

  it('gelecek 365 günlük Ranked seed içinde ikinci maçı bütün seçimlerde ağır mağlubiyete kilitlemez', () => {
    const forcedHeavyLossSeeds: string[] = [];

    for (let day = 0; day < 365; day++) {
      const seed = getDailySeed(new Date(Date.UTC(2026, 6, 17 + day, 9)));
      const startingSquad = getStartingSquad(seed, true);
      const firstOffers = drawOffers(
        seed, 1, 0, startingSquad, [], false, 0, 'normal', 'players',
        { isDailySeed: true, unlockedPlayerIds: [] },
      ).filter(isPlayerCard);
      const matches = firstOffers.flatMap((firstPick) => {
        const afterFirstPick = applyPlayerToSquad(startingSquad, firstPick, 11, 50);
        return drawOffers(
          seed, 2, 0, afterFirstPick, [], false, 0, 'normal', 'players',
          { isDailySeed: true, unlockedPlayerIds: [] },
        ).filter(isPlayerCard).map((secondPick) => match(
          seed,
          2,
          applyPlayerToSquad(afterFirstPick, secondPick, 11, 60),
          60,
        ));
      });

      if (matches.length > 0 && matches.every((result) => result.goalsAgainst - result.goalsFor >= 2)) {
        forcedHeavyLossSeeds.push(seed);
      }
    }

    expect(forcedHeavyLossSeeds).toEqual([]);
  });

  it('eşit koşullarda farklı seedler galibiyet, beraberlik ve mağlubiyet üretebilir', () => {
    const squad = full442Squad();
    const outcomes = new Set(
      Array.from({ length: 500 }, (_, index) => match(`variance-${index}`, 7, squad, 70).outcome),
    );

    expect(outcomes).toEqual(new Set(['win', 'draw', 'loss']));
  });

  it('üretilen skor tabelası sonuç türüyle her zaman tutarlıdır', () => {
    const squad = full442Squad();
    for (let index = 0; index < 2_000; index++) {
      const result = match(`score-consistency-${index}`, 7, squad, 70);
      const comparison = Math.sign(result.goalsFor - result.goalsAgainst);
      expect(comparison).toBe(result.outcome === 'win' ? 1 : result.outcome === 'loss' ? -1 : 0);
    }
  });

  it('is deterministic for same seed and round', () => {
    const squad = getStartingSquad();
    const a = match('test-seed-qa', 3, squad, 55);
    const b = match('test-seed-qa', 3, squad, 55);
    expect(a.goalsFor).toBe(b.goalsFor);
    expect(a.goalsAgainst).toBe(b.goalsAgainst);
    expect(a.outcome).toBe(b.outcome);
  });

  it('protects round 1 from loss when no prior losses', () => {
    const squad = getStartingSquad();
    const m = match('any-seed', 1, squad, 50);
    expect(m.outcome).toBe('win');
  });

  it('aggressive opponents yield higher-scoring matches than defensive (subtle style effect)', () => {
    const squad = getStartingSquad();
    const buckets: Record<string, { goals: number; n: number }> = {
      saldırgan: { goals: 0, n: 0 },
      dengeli: { goals: 0, n: 0 },
      savunmacı: { goals: 0, n: 0 },
    };
    // Round 1 galibiyet koruması dışında kal (round 5-10), deterministik sabit seed'ler
    for (let i = 0; i < 400; i++) {
      const round = 5 + (i % 6);
      const m = match(`style-test-${i}`, round, squad, 60);
      const b = buckets[m.opponent.style];
      if (b) { b.goals += m.goalsFor + m.goalsAgainst; b.n += 1; }
    }
    const avg = (s: string) => buckets[s]!.goals / Math.max(buckets[s]!.n, 1);
    // Saldırgan açık maç → savunmacıdan daha çok toplam gol; dengeli ~ortada
    expect(avg('saldırgan')).toBeGreaterThan(avg('savunmacı'));
  });
});

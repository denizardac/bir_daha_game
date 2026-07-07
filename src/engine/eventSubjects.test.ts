import { describe, expect, it } from 'vitest';
import { getEventSubjects, pickEventRatingTarget, pickEventRemovalTarget } from '@/engine/eventSubjects';
import type { PlayerCard } from '@/types';

function p(
  overrides: Partial<PlayerCard> & Pick<PlayerCard, 'id' | 'name' | 'position'>,
): PlayerCard {
  return {
    kind: 'player',
    rating: 70,
    currentRating: 70,
    rarity: 'iyi',
    tags: [],
    ...overrides,
  };
}

describe('getEventSubjects', () => {
  const squad = [
    p({ id: 'gk', name: 'Kaleci', position: 'KL', currentRating: 70, rating: 70 }),
    p({ id: 'cap', name: 'Kaptan Demir', position: 'STP', currentRating: 78, rating: 78, tags: ['KAPİTAN', 'LİDER'] }),
    p({ id: 'star', name: 'Yıldız', position: 'SF', currentRating: 82, rating: 82 }),
    p({ id: 'mid', name: 'Orta', position: 'OS', currentRating: 68, rating: 68 }),
    p({ id: 'youth', name: 'Genç', position: 'OOS', currentRating: 62, rating: 62, tags: ['POTANSİYEL'] }),
    p({ id: 'weak', name: 'Zayıf', position: 'SLB', currentRating: 58, rating: 58 }),
  ];

  it('emeklilik — kaptanı gösterir', () => {
    const subjects = getEventSubjects('evt_emekli', squad, [], { seed: 's', round: 4 });
    expect(subjects).toHaveLength(1);
    expect(subjects[0]!.player.name).toBe('Kaptan Demir');
    expect(subjects[0]!.label).toMatch(/Emekli/);
  });

  it('transfer — yıldızı gösterir', () => {
    const subjects = getEventSubjects('evt_transfer_teklif', squad, [], { seed: 's', round: 4 });
    expect(subjects[0]!.player.name).toBe('Yıldız');
  });

  it('genç yetenek — gelen oyuncu kartı', () => {
    const subjects = getEventSubjects('evt_genc_yetenek', squad, [], { seed: 'test-seed', round: 4 });
    expect(subjects[0]!.incoming).toBe(true);
    expect(subjects[0]!.player.name).toBeTruthy();
  });

  it('kavga — iki oyuncu', () => {
    const fightSquad = [
      ...squad,
      p({ id: 't2', name: 'Tartışkan', position: 'DOS', currentRating: 71, rating: 71, tags: ['TARTIŞMALI'] }),
    ];
    const subjects = getEventSubjects('evt_kavga', fightSquad, [], { seed: 's', round: 4 });
    expect(subjects.length).toBeGreaterThanOrEqual(2);
  });

  it('sakatlık — gösterilen özne, A rating hedefi ve B çıkış hedefi aynı oyuncu', () => {
    const subjects = getEventSubjects('evt_sakatlik', squad, [], { seed: 's', round: 4 });
    const shown = subjects[0]!.player;
    const removalTarget = pickEventRemovalTarget('evt_sakatlik', 'B', squad, []);
    const ratingTarget = pickEventRatingTarget('evt_sakatlik', 'A', squad, []);
    expect(removalTarget?.id).toBe(shown.id);
    expect(ratingTarget?.id).toBe(shown.id);
    expect(shown.position).not.toBe('KL');
  });

  it('acemi hata — genç oyuncu', () => {
    const subjects = getEventSubjects('evt_acemi_hata', squad, [], { seed: 's', round: 4 });
    expect(subjects[0]!.player.name).toBe('Genç');
  });
});

describe('pickEventRemovalTarget — emeklilik kaptan', () => {
  it('B seçeneğinde kaptanı çıkarır', () => {
    const squad = [
      p({ id: 'cap', name: 'Veteran', position: 'STP', currentRating: 80, rating: 80, tags: ['KAPİTAN'] }),
      p({ id: 'other', name: 'Diğer', position: 'OS', currentRating: 70, rating: 70 }),
    ];
    const target = pickEventRemovalTarget('evt_emekli', 'B', squad, []);
    expect(target?.name).toBe('Veteran');
  });
});

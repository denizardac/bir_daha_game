import { describe, expect, it } from 'vitest';
import {
  buildMonthlyLegendCard,
  createMonthlyLegendRecord,
  getPreviousMonthKey,
  normalizeMonthlyLegendRecord,
  sanitizeChampionName,
  selectMonthlyChampion,
} from '@/engine/monthlyLegend';
import { getPlayerPoolForAccess } from '@/engine/cardDraw';
import { migratePersistedRecord } from '@/utils/storage';
import type { LeaderboardEntry } from '@/types';

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    id: 'champion',
    seed: 'valid-seed',
    displayName: 'Deniz',
    totalScore: 12_000,
    roundsCompleted: 15,
    timestamp: 100,
    flawless: false,
    integrityDigest: '0123456789abcdef',
    ...overrides,
  };
}

describe('Ayın Efsanesi', () => {
  it('ocak ayında önceki yılın aralık ayını kaynak alır', () => {
    expect(getPreviousMonthKey('2027-01')).toBe('2026-12');
    expect(getPreviousMonthKey('2026-07')).toBe('2026-06');
  });

  it('doğrulanmamış kaydı atar ve eşit skoru deterministik kurallarla çözer', () => {
    const champion = selectMonthlyChampion([
      entry({ id: 'unsigned', totalScore: 99_000, integrityDigest: undefined }),
      entry({ id: 'late', timestamp: 200 }),
      entry({ id: 'early', timestamp: 50 }),
    ]);
    expect(champion?.id).toBe('early');
  });

  it('isimde markup, kontrol karakteri ve uygunsuz ifadeyi güvenli ada çevirir', () => {
    expect(sanitizeChampionName('  <b>Şampiyon\u0000  Deniz</b>  ')).toBe('Şampiyon Deniz');
    expect(sanitizeChampionName('amk_kral')).toBe('Ayın Şampiyonu');
    expect(sanitizeChampionName('A')).toBe('Ayın Şampiyonu');
  });

  it('aynı ay ve şampiyondan her cihaz için aynı dengeli kartı üretir', () => {
    const record = createMonthlyLegendRecord(entry(), '2026-07', 123);
    const first = buildMonthlyLegendCard(record, '2026-07');
    const second = buildMonthlyLegendCard({ ...record }, '2026-07');
    expect(first).toEqual(second);
    expect(first?.id).toBe('monthly_legend_2026-07');
    expect(first?.name).toBe('Deniz — Ayın Efsanesi');
    expect(first?.currentRating).toBeGreaterThanOrEqual(88);
    expect(first?.currentRating).toBeLessThanOrEqual(91);
    expect(first?.tags).toHaveLength(3);
  });

  it('eski veya bozuk cache kart üretmez', () => {
    const record = createMonthlyLegendRecord(entry(), '2026-06');
    expect(buildMonthlyLegendCard(record, '2026-07')).toBeNull();
    expect(normalizeMonthlyLegendRecord({ ...record, sourceMonthKey: '2026-01' })).toBeNull();
    expect(migratePersistedRecord({ saveVersion: 5 }).monthlyLegend).toBeNull();
  });

  it('global kartı Günlük Seed ve Serbest Mod havuzuna aynı profil ile ekler', () => {
    const card = buildMonthlyLegendCard(createMonthlyLegendRecord(entry(), '2026-07'), '2026-07')!;
    const daily = getPlayerPoolForAccess({ isDailySeed: true, unlockedPlayerIds: [], globalPlayers: [card] });
    const free = getPlayerPoolForAccess({ isDailySeed: false, unlockedPlayerIds: [], globalPlayers: [card] });
    expect(daily.find((player) => player.id === card.id)).toEqual(card);
    expect(free.find((player) => player.id === card.id)).toEqual(card);
  });
});

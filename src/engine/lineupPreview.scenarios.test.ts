import { describe, expect, it } from 'vitest';
import { getStartingSquad } from '@/data/players';
import { getPlayerPickSummary } from '@/engine/contextPreview';
import {
  assignSquadToFormation,
  canDisplaceStarter,
  getBenchExplanations,
  getPositionHints,
  getSquadLineupSummary,
  isIllegalCentralMidWingSlot,
  slotAcceptsPlayer,
  WING_SLOT_LABELS,
} from '@/engine/lineupPreview';
import { slotFitIndex } from '@/data/positionFlexibility';
import type { PlayerCard, Position } from '@/types';

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

function slotOf(squad: PlayerCard[], playerId: string, formation = '442') {
  return assignSquadToFormation(squad, formation).find((s) => s.player?.id === playerId)?.slot.label;
}

function assertCentralMidNeverOnWing(player: PlayerCard, formation: string, squad: PlayerCard[]) {
  const label = slotOf(squad, player.id, formation);
  if (label) expect(isIllegalCentralMidWingSlot(player, label)).toBe(false);
}

/** 442 tam kadro iskeleti — orta saha + defans dolu, kanat boş senaryoları için */
function base442Ten(): PlayerCard[] {
  const gk = p({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
  const defs: Array<[string, Position, number]> = [
    ['slb', 'SLB', 65],
    ['stp1', 'STP', 66],
    ['stp2', 'STP', 64],
    ['sgb', 'SÖB', 65],
    ['dos', 'DOS', 68],
    ['weak', 'OS', 58],
    ['oos', 'OOS', 67],
    ['slk', 'SLK', 66],
    ['sf', 'SF', 70],
  ];
  return [gk, ...defs.map(([id, pos, r]) => p({ id, name: id, position: pos, currentRating: r, rating: r }))];
}

describe('lineup scenarios — mevki × formasyon (18+ koşul)', () => {
  it('01 — OS asla SĞK/SLK slotuna yazılmaz (442)', () => {
    const incoming = p({ id: 'efe', name: 'Efe Polat', position: 'OS', currentRating: 76, rating: 76 });
    const squad = [...base442Ten(), p({ id: 'sgk', name: 'Kanat', position: 'SÖK', currentRating: 67, rating: 67 }), incoming];
    assertCentralMidNeverOnWing(incoming, '442', squad);
    expect(slotOf(squad, 'efe', '442')).not.toBe('SĞK');
    expect(slotOf(squad, 'efe', '442')).not.toBe('SLK');
  });

  it('02 — DOS asla SĞK/SLK slotuna yazılmaz (442)', () => {
    const incoming = p({ id: 'nik', name: 'Nikolai Kane', position: 'DOS', currentRating: 66, rating: 66 });
    const squad = [...base442Ten(), incoming];
    assertCentralMidNeverOnWing(incoming, '442', squad);
    expect(['SĞK', 'SLK']).not.toContain(slotOf(squad, 'nik', '442'));
  });

  it('03 — OS 433\'te zayıf OS\'u düşürüp OS slotuna girer', () => {
    const squad = base442Ten();
    const umut = p({ id: 'umut', name: 'Umut Sarı', position: 'OS', currentRating: 64, rating: 64 });
    const lineup = assignSquadToFormation([...squad, umut], '433');
    expect(lineup.find((s) => s.player?.id === 'umut')?.slot.label).toBe('OS');
    expect(lineup.some((s) => s.player?.id === 'weak')).toBe(false);
  });

  it('04 — DOS orta saha slotuna girer, kanata değil (442)', () => {
    const squad = base442Ten().filter((x) => x.id !== 'dos');
    const dos = p({ id: 'newdos', name: 'DOS', position: 'DOS', currentRating: 72, rating: 72 });
    const lineup = assignSquadToFormation([...squad, dos], '442');
    const slot = lineup.find((s) => s.player?.id === 'newdos');
    expect(slot?.slot.zone).toBe('orta');
    expect(WING_SLOT_LABELS.has(slot?.slot.label ?? '')).toBe(false);
  });

  it('05 — OOS kanat slotuna gidebilir (ikincil mevki)', () => {
    const gk = p({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
    const filled = ['slb', 'stp1', 'stp2', 'sgb', 'dos', 'os1', 'os2', 'slk', 'sf'].map((id, i) =>
      p({
        id,
        name: id,
        position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'OS', 'OS', 'SLK', 'SF'] as const)[i]!,
        currentRating: 65 + i,
        rating: 65 + i,
      }),
    );
    const oos = p({ id: 'o', name: 'OOS', position: 'OOS', currentRating: 74, rating: 74 });
    const lineup = assignSquadToFormation([gk, ...filled, oos], '442');
    const slot = lineup.find((s) => s.player?.id === 'o');
    expect(slot?.slot.label === 'SĞK' || slot?.slot.zone === 'orta').toBe(true);
  });

  it('06 — SÖK oyuncu SĞK slotunu alır', () => {
    const squad = base442Ten().filter((x) => x.id !== 'sgk');
    const wing = p({ id: 'w', name: 'Kanat', position: 'SÖK', currentRating: 71, rating: 71 });
    expect(slotOf([...squad, wing], 'w', '442')).toBe('SĞK');
  });

  it('07 — SLK oyuncu SLK slotunu alır', () => {
    const squad = base442Ten().filter((x) => x.id !== 'slk');
    const wing = p({ id: 'w', name: 'Sol', position: 'SLK', currentRating: 71, rating: 71 });
    expect(slotOf([...squad, wing], 'w', '442')).toBe('SLK');
  });

  it('08 — SF oyuncu forvet slotuna gider', () => {
    const squad = base442Ten().filter((x) => x.id !== 'sf');
    const sf = p({ id: 'f', name: 'Forvet', position: 'SF', currentRating: 72, rating: 72 });
    expect(slotOf([...squad, sf], 'f', '442')).toBe('SF');
  });

  it('09 — KL yalnızca kale slotunda', () => {
    const squad = base442Ten().filter((x) => x.id !== 'gk');
    const kl = p({ id: 'k2', name: 'Yedek KL', position: 'KL', currentRating: 68, rating: 68 });
    expect(slotOf([...squad, kl], 'k2', '442')).toBe('KL');
  });

  it('10 — STP stoper slotuna girer', () => {
    const squad = base442Ten().filter((x) => !['stp1', 'stp2'].includes(x.id));
    const stp = p({ id: 'st', name: 'Stoper', position: 'STP', currentRating: 75, rating: 75 });
    expect(slotOf([...squad, stp], 'st', '442')).toBe('STP');
  });

  it('11 — SLB sol bek slotuna girer', () => {
    const squad = base442Ten().filter((x) => x.id !== 'slb');
    const slb = p({ id: 'lb', name: 'Bek', position: 'SLB', currentRating: 68, rating: 68 });
    expect(slotOf([...squad, slb], 'lb', '442')).toBe('SLB');
  });

  it('12 — SÖB sağ bek (SĞB) slotuna girer', () => {
    const squad = base442Ten().filter((x) => x.id !== 'sgb');
    const sob = p({ id: 'rb', name: 'Sağ', position: 'SÖB', currentRating: 68, rating: 68 });
    expect(slotOf([...squad, sob], 'rb', '442')).toBe('SĞB');
  });

  it('13 — önizleme: OS metni SĞK içermez, OS slotunu söyler', () => {
    const squad = base442Ten();
    const umut = p({ id: 'umut', name: 'Umut Sarı', position: 'OS', currentRating: 64, rating: 64 });
    const summary = getPlayerPickSummary(umut, squad, 11, 50, []);
    expect(summary.text).not.toMatch(/SĞK|SLK|Sağ Kanat|Sol Kanat/);
    expect(summary.text).toMatch(/OS slotuna girer/);
  });

  it('14 — önizleme: DOS kanat boşken yedek veya orta saha', () => {
    const squad = base442Ten().filter((x) => x.id !== 'dos');
    const dos = p({ id: 'd', name: 'DOS', position: 'DOS', currentRating: 66, rating: 66 });
    const summary = getPlayerPickSummary(dos, squad, 11, 50, []);
    expect(summary.text).not.toContain('SĞK');
    expect(summary.text).toMatch(/DOS slotuna girer|OS slotuna girer \(DOS oynar\)|Yedek olarak kalır/);
  });

  it('15 — 4231 formasyonunda OS kanata gitmez', () => {
    const gk = p({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
    const mids = ['dos', 'os', 'oos', 'slk', 'sf'].map((id, i) =>
      p({
        id,
        name: id,
        position: (['DOS', 'OS', 'OOS', 'SLK', 'SF'] as const)[i]!,
        currentRating: 60 + i,
        rating: 60 + i,
      }),
    );
    const defs = ['slb', 'stp1', 'stp2', 'sgb'].map((id, i) =>
      p({
        id,
        name: id,
        position: (['SLB', 'STP', 'STP', 'SÖB'] as const)[i]!,
        currentRating: 64,
        rating: 64,
      }),
    );
    const incoming = p({ id: 'os2', name: 'OS2', position: 'OS', currentRating: 72, rating: 72 });
    const squad = [gk, ...defs, ...mids, incoming];
    assertCentralMidNeverOnWing(incoming, '4231', squad);
  });

  it('16 — 352 formasyonunda DOS orta sahada kalır', () => {
    const gk = p({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
    const squad = [
      gk,
      ...['stp1', 'stp2', 'stp3', 'slb', 'sgb', 'os', 'oos', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['STP', 'STP', 'STP', 'SLB', 'SÖB', 'OS', 'OOS', 'SF', 'SF'] as const)[i]!,
          currentRating: 62 + i,
          rating: 62 + i,
        }),
      ),
      p({ id: 'd', name: 'DOS', position: 'DOS', currentRating: 70, rating: 70 }),
    ];
    const slot = slotOf(squad, 'd', '352');
    expect(slot).toBe('DOS');
  });

  it('17 — 532 formasyonunda OS orta sahada', () => {
    const gk = p({ id: 'gk', name: 'KL', position: 'KL', currentRating: 70, rating: 70 });
    const squad = [
      gk,
      ...['slb', 'stp1', 'stp2', 'stp3', 'sgb', 'dos', 'oos', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'STP', 'SÖB', 'DOS', 'OOS', 'SF', 'SF'] as const)[i]!,
          currentRating: 62 + i,
          rating: 62 + i,
        }),
      ),
      p({ id: 'o', name: 'OS', position: 'OS', currentRating: 71, rating: 71 }),
    ];
    expect(slotOf(squad, 'o', '532')).toBe('OS');
  });

  it('18 — slotAcceptsPlayer OS için SĞK false', () => {
    const os = p({ id: 'x', name: 'X', position: 'OS', currentRating: 70, rating: 70 });
    expect(slotAcceptsPlayer(os, { label: 'SĞK', preferred: ['SÖK'], zone: 'hucum' })).toBe(false);
    expect(slotAcceptsPlayer(os, { label: 'OS', preferred: ['OS', 'OOS', 'DOS'], zone: 'orta' })).toBe(true);
  });

  it('19 — 200 rastgele seed: OS/DOS hiç kanatta değil', () => {
    let osWing = 0;
    let dosWing = 0;
    for (let i = 0; i < 200; i++) {
      const squad8 = getStartingSquad(`pos-seed-${i}`, false);
      const squad = [...squad8, p({ id: `fill-${i}`, name: 'F', position: 'STP', currentRating: 65, rating: 65 })];
      for (const pos of ['OS', 'DOS'] as const) {
        const card = p({ id: `c-${i}-${pos}`, name: 'Test', position: pos, currentRating: 72, rating: 72 });
        const label = slotOf([...squad, card], `c-${i}-${pos}`, '442');
        if (label && WING_SLOT_LABELS.has(label)) {
          if (pos === 'OS') osWing++;
          else dosWing++;
        }
      }
    }
    expect(osWing).toBe(0);
    expect(dosWing).toBe(0);
  });

  it('20 — mevki ipuçları: OS için Sağ Kanat yok', () => {
    const squad = base442Ten();
    const os = p({ id: 'o', name: 'OS', position: 'OS', currentRating: 64, rating: 64 });
    const hints = getPositionHints(os, squad, [], 11, 50);
    const joined = hints.map((h) => h.text).join(' ');
    expect(joined).not.toMatch(/Sağ Kanat|SĞK/);
  });

  it('21 — Bolt Demir tipi OS teklifleri OS/DOS slot gösterir', () => {
    const squad = base442Ten();
    const bolt = p({ id: 'bolt', name: 'Bolt Demir', position: 'OS', currentRating: 73, rating: 73, tags: ['FİNİŞÖR'] });
    const summary = getPlayerPickSummary(bolt, squad, 11, 50, []);
    expect(summary.text).toMatch(/OS slotuna girer|Yedek olarak kalır/);
    expect(summary.text).not.toContain('SĞK');
  });

  it('22 — Gökhan OOS kanat veya orta; OS/DOS kanat değil', () => {
    const squad = base442Ten();
    const oos = p({ id: 'g', name: 'Gökhan', position: 'OOS', currentRating: 77, rating: 77 });
    const label = slotOf([...squad, oos], 'g', '442');
    expect(label === 'SĞK' || label === 'OOS' || label === 'OS' || label === 'DOS').toBe(true);

    const sinan = p({ id: 's', name: 'Sinan', position: 'DOS', currentRating: 68, rating: 68 });
    const sinanLabel = slotOf([...squad, sinan], 's', '442');
    if (sinanLabel) expect(WING_SLOT_LABELS.has(sinanLabel)).toBe(false);
  });
});

function gk(r = 70) {
  return p({ id: 'gk', name: 'KL', position: 'KL', currentRating: r, rating: r });
}

/** Kullanıcı raporu: 77 OOS tam kadro → OS; kısmi kadro → OS (SĞK değil) */
describe('lineup scenarios — 50 koşul (regresyon paketi)', () => {
  it('23 — 77 OOS tam 11/11: OS slotuna girer, 62 OS yedek', () => {
    const squad = [
      gk(88),
      ...['slb', 'stp1', 'stp2', 'sgb'].map((id, i) =>
        p({ id, name: id, position: (['SLB', 'STP', 'STP', 'SÖB'] as const)[i]!, currentRating: 63 + i, rating: 63 + i }),
      ),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 66, rating: 66 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 70, rating: 70 }),
      p({ id: 'os62', name: 'Zayıf OS', position: 'OS', currentRating: 62, rating: 62 }),
      p({ id: 'oos74', name: 'SĞK OOS', position: 'OOS', currentRating: 74, rating: 74 }),
      p({ id: 'new', name: '77 OOS', position: 'OOS', currentRating: 77, rating: 77 }),
    ];
    expect(slotOf(squad, 'new', '442')).toBe('OS');
    expect(slotOf(squad, 'oos74', '442')).toBe('SĞK');
    expect(slotOf(squad, 'os62', '442')).toBeUndefined();
  });

  it('24 — 77 OOS kısmi kadro: OS upgrade, SĞK kanat doldurma önceliği yok', () => {
    const partial = [
      gk(88),
      p({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 65, rating: 65 }),
      p({ id: 'stp1', name: 'STP1', position: 'STP', currentRating: 66, rating: 66 }),
      p({ id: 'stp2', name: 'STP2', position: 'STP', currentRating: 64, rating: 64 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 68, rating: 68 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 66, rating: 66 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 70, rating: 70 }),
      p({ id: 'oos74', name: 'SĞK OOS', position: 'OOS', currentRating: 74, rating: 74 }),
      p({ id: 'new', name: '77 OOS', position: 'OOS', currentRating: 77, rating: 77 }),
    ];
    expect(slotOf(partial, 'new', '442')).toBe('OS');
    expect(slotOf(partial, 'oos74', '442')).toBe('SĞK');
  });

  it('25 — 77 OOS önizleme tam kadro: OS metni', () => {
    const squad = [
      gk(88),
      p({ id: 'os62', name: 'OS', position: 'OS', currentRating: 62, rating: 62 }),
      p({ id: 'oos74', name: 'OOS', position: 'OOS', currentRating: 74, rating: 74 }),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'slk', 'sf'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'SLK', 'SF'] as const)[i]!,
          currentRating: 65 + i,
          rating: 65 + i,
        }),
      ),
    ];
    const incoming = p({ id: 'g', name: 'Gökhan', position: 'OOS', currentRating: 77, rating: 77 });
    const summary = getPlayerPickSummary(incoming, squad, 11, 50, []);
    expect(summary.text).toMatch(/OS slotuna girer/);
    expect(summary.text).not.toContain('SĞK');
  });

  it('26 — 77 OOS önizleme kısmi kadro: OS metni (SĞK değil)', () => {
    const squad = [
      gk(88),
      p({ id: 'oos74', name: 'OOS', position: 'OOS', currentRating: 74, rating: 74 }),
      ...['slb', 'stp1', 'stp2', 'dos', 'slk', 'sf'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'DOS', 'SLK', 'SF'] as const)[i]!,
          currentRating: 65 + i,
          rating: 65 + i,
        }),
      ),
    ];
    const incoming = p({ id: 'g', name: 'Gökhan', position: 'OOS', currentRating: 77, rating: 77 });
    const summary = getPlayerPickSummary(incoming, squad, 11, 50, []);
    expect(summary.text).toMatch(/OS slotuna girer/);
    expect(summary.text).not.toContain('SĞK');
  });

  it('27 — OOS +1 rating ile OS slotunu alabilir', () => {
    const os = p({ id: 'os', name: 'OS', position: 'OS', currentRating: 59, rating: 59 });
    const oos = p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 67, rating: 67 });
    const osSlot = { label: 'OS', preferred: ['OS', 'OOS', 'DOS'] as const, zone: 'orta' as const };
    expect(canDisplaceStarter(oos, os, { ...osSlot, preferred: [...osSlot.preferred] })).toBe(true);
  });

  it('28 — DOS 66 zayıf OS 59 yerine OS slotuna girer', () => {
    const squad = [
      gk(70),
      p({ id: 'slb', name: 'SLB', position: 'SLB', currentRating: 65, rating: 65 }),
      p({ id: 'stp1', name: 'STP1', position: 'STP', currentRating: 66, rating: 66 }),
      p({ id: 'stp2', name: 'STP2', position: 'STP', currentRating: 64, rating: 64 }),
      p({ id: 'sgb', name: 'SGB', position: 'SÖB', currentRating: 65, rating: 65 }),
      p({ id: 'dos', name: 'DOS', position: 'DOS', currentRating: 70, rating: 70 }),
      p({ id: 'weak', name: 'Zayıf OS', position: 'OS', currentRating: 59, rating: 59 }),
      p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 67, rating: 67 }),
      p({ id: 'slk', name: 'SLK', position: 'SLK', currentRating: 66, rating: 66 }),
      p({ id: 'sf', name: 'SF', position: 'SF', currentRating: 68, rating: 68 }),
      p({ id: 'nik', name: 'Nikolai Kane', position: 'DOS', currentRating: 66, rating: 66 }),
    ];
    expect(slotOf(squad, 'nik', '442')).toBe('OS');
    expect(slotOf(squad, 'weak', '442')).toBeUndefined();
  });

  it('29 — Adeyemi SF oynayamaz (fit 99)', () => {
    const ade = p({ id: 'ade', name: 'Adeyemi', position: 'OOS', currentRating: 74, rating: 74 });
    expect(slotFitIndex(ade, ['SF'])).toBe(99);
  });

  it('30 — Hakan DOS boş OS varken orta sahaya girer', () => {
    const squad = [
      gk(88),
      p({ id: 'celik', name: 'Çelik', position: 'STP', currentRating: 63, rating: 63 }),
      p({ id: 'koc', name: 'Koç', position: 'STP', currentRating: 61, rating: 61 }),
      p({ id: 'ade', name: 'Adeyemi', position: 'OOS', currentRating: 74, rating: 74 }),
      p({ id: 'hak', name: 'Hakan', position: 'DOS', currentRating: 61, rating: 61 }),
      p({ id: 'riza', name: 'Rıza', position: 'SLK', currentRating: 60, rating: 60 }),
      p({ id: 'can', name: 'Arslan', position: 'KL', currentRating: 62, rating: 62 }),
    ];
    const lineup = assignSquadToFormation(squad, '442');
    const hak = lineup.find((s) => s.player?.id === 'hak');
    expect(hak?.slot.zone).toBe('orta');
    expect(lineup.find((s) => s.player?.id === 'ade')?.slot.label).not.toBe('SF');
  });

  it('31 — bench açıklaması: orta saha dolu mesajı', () => {
    const squad = [
      gk(88),
      p({ id: 'slb', name: 'Sol', position: 'SLB', currentRating: 63, rating: 63 }),
      p({ id: 'sgb', name: 'Sağ', position: 'SÖB', currentRating: 63, rating: 63 }),
      p({ id: 'celik', name: 'Çelik', position: 'STP', currentRating: 63, rating: 63 }),
      p({ id: 'koc', name: 'Koç', position: 'STP', currentRating: 61, rating: 61 }),
      p({ id: 'ade', name: 'Adeyemi', position: 'OOS', currentRating: 74, rating: 74 }),
      p({ id: 'acar', name: 'Acar', position: 'OS', currentRating: 62, rating: 62 }),
      p({ id: 'nik', name: 'Nikolai', position: 'DOS', currentRating: 65, rating: 65 }),
      p({ id: 'hak', name: 'Hakan', position: 'DOS', currentRating: 61, rating: 61 }),
      p({ id: 'riza', name: 'Rıza', position: 'SLK', currentRating: 60, rating: 60 }),
      p({ id: 'sf', name: 'Forvet', position: 'SF', currentRating: 68, rating: 68 }),
    ];
    const bench = getBenchExplanations(squad, []);
    const hakan = bench.find((b) => b.player.id === 'hak');
    expect(hakan?.reason).toMatch(/Orta saha dolu|yedek/i);
  });

  it('32 — OS asla kanatta kalmaz (100 seed)', () => {
    for (let i = 0; i < 100; i++) {
      const squad = [
        gk(),
        ...Array.from({ length: 8 }, (_, j) =>
          p({
            id: `p${i}_${j}`,
            name: `P${j}`,
            position: (['STP', 'SLB', 'SÖB', 'DOS', 'OOS', 'SLK', 'SÖK', 'SF'] as const)[j % 8]!,
            currentRating: 60 + j,
            rating: 60 + j,
          }),
        ),
        p({ id: `os${i}`, name: 'OS', position: 'OS', currentRating: 70 + (i % 5), rating: 70 + (i % 5) }),
      ];
      const label = slotOf(squad, `os${i}`, '442');
      if (label) expect(WING_SLOT_LABELS.has(label)).toBe(false);
    }
  });

  it('33 — DOS asla kanatta kalmaz (100 seed)', () => {
    for (let i = 0; i < 100; i++) {
      const squad = [
        gk(),
        ...Array.from({ length: 8 }, (_, j) =>
          p({
            id: `p${i}_${j}`,
            name: `P${j}`,
            position: (['STP', 'SLB', 'SÖB', 'OS', 'OOS', 'SLK', 'SÖK', 'SF'] as const)[j % 8]!,
            currentRating: 60 + j,
            rating: 60 + j,
          }),
        ),
        p({ id: `dos${i}`, name: 'DOS', position: 'DOS', currentRating: 68 + (i % 4), rating: 68 + (i % 4) }),
      ];
      const label = slotOf(squad, `dos${i}`, '442');
      if (label) expect(WING_SLOT_LABELS.has(label)).toBe(false);
    }
  });

  it('34 — 433 OS zayıf OS düşürür', () => {
    const squad = base442Ten();
    const strong = p({ id: 's', name: 'OS', position: 'OS', currentRating: 72, rating: 72 });
    const lineup = assignSquadToFormation([...squad, strong], '433');
    expect(lineup.find((x) => x.player?.id === 's')?.slot.label).toBe('OS');
    expect(lineup.some((x) => x.player?.id === 'weak')).toBe(false);
  });

  it('35 — 4231 OS merkezde kalır', () => {
    const squad = [
      gk(),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos1', 'dos2', 'slk', 'oos', 'sf'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'DOS', 'SLK', 'OOS', 'SF'] as const)[i]!,
          currentRating: 64 + i,
          rating: 64 + i,
        }),
      ),
      p({ id: 'os', name: 'OS', position: 'OS', currentRating: 71, rating: 71 }),
    ];
    const slot = slotOf(squad, 'os', '4231');
    expect(slot === 'OOS' || slot === 'OS' || slot === 'DOS').toBe(true);
  });

  it('36 — 352 DOS merkezde', () => {
    const squad = [
      gk(),
      ...['stp1', 'stp2', 'stp3', 'slb', 'sgb', 'os', 'oos', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['STP', 'STP', 'STP', 'SLB', 'SÖB', 'OS', 'OOS', 'SF', 'SF'] as const)[i]!,
          currentRating: 62 + i,
          rating: 62 + i,
        }),
      ),
      p({ id: 'd', name: 'DOS', position: 'DOS', currentRating: 70, rating: 70 }),
    ];
    expect(slotOf(squad, 'd', '352')).toBe('DOS');
  });

  it('37 — 532 OS merkezde', () => {
    const squad = [
      gk(),
      ...['slb', 'stp1', 'stp2', 'stp3', 'sgb', 'dos', 'oos', 'sf1', 'sf2'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'STP', 'SÖB', 'DOS', 'OOS', 'SF', 'SF'] as const)[i]!,
          currentRating: 62 + i,
          rating: 62 + i,
        }),
      ),
      p({ id: 'o', name: 'OS', position: 'OS', currentRating: 71, rating: 71 }),
    ];
    expect(slotOf(squad, 'o', '532')).toBe('OS');
  });

  it('38 — KL sahada oynayamaz', () => {
    const squad = base442Ten().filter((x) => x.id !== 'gk');
    const kl = p({ id: 'k', name: 'KL', position: 'KL', currentRating: 65, rating: 65 });
    const lineup = assignSquadToFormation([...squad, kl], '442');
    for (const slot of lineup) {
      if (slot.player?.position === 'KL') expect(slot.slot.zone).toBe('kaleci');
    }
  });

  it('39 — en güçlü KL kaleye', () => {
    const squad = [
      p({ id: 'k1', name: 'KL1', position: 'KL', currentRating: 60, rating: 60 }),
      p({ id: 'k2', name: 'KL2', position: 'KL', currentRating: 75, rating: 75 }),
      ...base442Ten().filter((x) => x.id !== 'gk'),
    ];
    expect(slotOf(squad, 'k2', '442')).toBe('KL');
  });

  it('40 — OOS orta doluysa kanada gider', () => {
    const squad = [
      gk(),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'os', 'slk', 'sf'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'OS', 'SLK', 'SF'] as const)[i]!,
          currentRating: 65 + i,
          rating: 65 + i,
        }),
      ),
      p({ id: 'o', name: 'OOS', position: 'OOS', currentRating: 72, rating: 72 }),
    ];
    expect(slotOf(squad, 'o', '442')).toBe('SĞK');
  });

  it('41 — güçlü OS zayıf OS düşürür (442)', () => {
    const squad = base442Ten();
    const strong = p({ id: 's', name: 'OS', position: 'OS', currentRating: 72, rating: 72 });
    const lineup = assignSquadToFormation([...squad, strong], '442');
    expect(lineup.find((x) => x.player?.id === 's')?.slot.label).toBe('OS');
    expect(lineup.some((x) => x.player?.id === 'weak')).toBe(false);
  });

  it('42 — güçlü DOS zayıf DOS düşürür', () => {
    const squad = base442Ten();
    const strong = p({ id: 's', name: 'DOS', position: 'DOS', currentRating: 75, rating: 75 });
    const lineup = assignSquadToFormation([...squad, strong], '442');
    expect(lineup.find((x) => x.player?.id === 's')?.slot.zone).toBe('orta');
  });

  it('43 — SF çift slot doldurma', () => {
    const squad = [
      gk(),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'os', 'oos', 'slk', 'sgk'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'OS', 'OOS', 'SLK', 'SÖK'] as const)[i]!,
          currentRating: 64 + i,
          rating: 64 + i,
        }),
      ),
      p({ id: 'sf1', name: 'SF1', position: 'SF', currentRating: 70, rating: 70 }),
      p({ id: 'sf2', name: 'SF2', position: 'SF', currentRating: 68, rating: 68 }),
    ];
    const lineup = assignSquadToFormation(squad, '442');
    const sfCount = lineup.filter((s) => s.slot.label === 'SF' && s.player).length;
    expect(sfCount).toBe(2);
  });

  it('44 — 7 kişilik kadro: orta saha öncelikli', () => {
    const squad = getStartingSquad();
    const lineup = assignSquadToFormation(squad, '442');
    const filled = lineup.filter((s) => s.player).length;
    expect(filled).toBe(7);
    const mids = lineup.filter((s) => s.player && s.slot.zone === 'orta');
    expect(mids.length).toBeGreaterThanOrEqual(2);
  });

  it('45 — 8 kişilik kadro OS/DOS kanatta değil', () => {
    const squad = [...getStartingSquad(), p({ id: 'x', name: 'X', position: 'STP', currentRating: 65, rating: 65 })];
    const lineup = assignSquadToFormation(squad, '442');
    for (const slot of lineup) {
      if (!slot.player) continue;
      if (slot.player.position === 'OS' || slot.player.position === 'DOS') {
        expect(WING_SLOT_LABELS.has(slot.slot.label)).toBe(false);
      }
    }
  });

  it('46 — getSquadLineupSummary: 10 oyuncu sahada', () => {
    const squad = base442Ten();
    const summary = getSquadLineupSummary(squad, []);
    const onPitch = summary.lineup.filter((s) => s.player).map((s) => s.player!.id);
    const missing = squad.filter((pl) => !onPitch.includes(pl.id)).map((pl) => pl.id);
    expect(missing).toEqual([]);
    expect(summary.filled).toBe(10);
  });

  it('47 — 11 kişi: en fazla 1 uyumsuz yedek', () => {
    const squad = [...base442Ten(), p({ id: 'x', name: 'X', position: 'STP', currentRating: 80, rating: 80 })];
    const summary = getSquadLineupSummary(squad, []);
    expect(summary.bench).toBeLessThanOrEqual(1);
    expect(summary.filled).toBeGreaterThanOrEqual(10);
  });

  it('48 — Bolt Demir OS 442 OS slotu', () => {
    const squad = base442Ten();
    const bolt = p({ id: 'bolt', name: 'Bolt Demir', position: 'OS', currentRating: 73, rating: 73 });
    expect(slotOf([...squad, bolt], 'bolt', '442')).toBe('OS');
  });

  it('49 — Sinan Kurt DOS kanata gitmez', () => {
    const squad = base442Ten();
    const sinan = p({ id: 'sinan', name: 'Sinan Kurt', position: 'DOS', currentRating: 68, rating: 68 });
    const label = slotOf([...squad, sinan], 'sinan', '442');
    if (label) expect(WING_SLOT_LABELS.has(label)).toBe(false);
  });

  it('50 — Umut Sarı OS 433 OS slotu', () => {
    const squad = base442Ten();
    const umut = p({ id: 'umut', name: 'Umut Sarı', position: 'OS', currentRating: 64, rating: 64 });
    expect(slotOf([...squad, umut], 'umut', '433')).toBe('OS');
  });

  it('51 — çift OOS: biri kanat biri orta', () => {
    const squad = [
      gk(),
      ...['slb', 'stp1', 'stp2', 'sgb', 'dos', 'os', 'slk', 'sf'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'SÖB', 'DOS', 'OS', 'SLK', 'SF'] as const)[i]!,
          currentRating: 65 + i,
          rating: 65 + i,
        }),
      ),
      p({ id: 'o1', name: 'OOS1', position: 'OOS', currentRating: 75, rating: 75 }),
      p({ id: 'o2', name: 'OOS2', position: 'OOS', currentRating: 70, rating: 70 }),
    ];
    const lineup = assignSquadToFormation(squad, '442');
    const oosOnPitch = lineup.filter((s) => s.player?.position === 'OOS');
    expect(oosOnPitch.length).toBeGreaterThanOrEqual(1);
    expect(oosOnPitch.some((s) => WING_SLOT_LABELS.has(s.slot.label) || s.slot.zone === 'orta')).toBe(true);
    const o2 = lineup.find((s) => s.player?.id === 'o2');
    if (o2) expect(WING_SLOT_LABELS.has(o2.slot.label) || o2.slot.zone === 'orta').toBe(true);
  });

  it('53 — 78 OOS boş SĞK varken DOS yerine kanada gider', () => {
    const base = [
      p({ id: 'kl', name: 'Taş', position: 'KL', currentRating: 74, rating: 74 }),
      p({ id: 'stp1', name: 'Kaya', position: 'STP', currentRating: 74, rating: 74 }),
      p({ id: 'stp2', name: 'Işık', position: 'STP', currentRating: 69, rating: 69 }),
      p({ id: 'slk', name: 'Karaca', position: 'SLK', currentRating: 67, rating: 67 }),
      p({ id: 'dos', name: 'Weak', position: 'DOS', currentRating: 58, rating: 58 }),
      p({ id: 'oos1', name: 'Demir', position: 'OOS', currentRating: 74, rating: 74 }),
      p({ id: 'oos2', name: 'Aktaş', position: 'OOS', currentRating: 69, rating: 69 }),
      p({ id: 'sf', name: 'Kane', position: 'SF', currentRating: 74, rating: 74 }),
    ];
    const incoming = p({
      id: 'yigit',
      name: 'Yiğit Arslan',
      position: 'OOS',
      currentRating: 78,
      rating: 78,
      tags: ['YERLİ', 'HIZLI'],
    });
    const summary = getPlayerPickSummary(incoming, base, 11, 50, []);
    expect(summary.text).toMatch(/SĞK( \(OOS\))? slotuna girer/);
    expect(summary.text).not.toMatch(/DOS slotuna girer/);
    const after = [...base, incoming];
    expect(slotOf(after, 'yigit', '442')).toBe('SĞK');
    expect(slotOf(after, 'oos1', '442')).toBe('OS');
  });

  it('52 — önizleme kısmi: 77 OOS OS öncelik', () => {
    const squad = [
      gk(88),
      p({ id: 'oos', name: 'OOS', position: 'OOS', currentRating: 74, rating: 74 }),
      ...['slb', 'stp1', 'stp2', 'dos', 'slk', 'sf'].map((id, i) =>
        p({
          id,
          name: id,
          position: (['SLB', 'STP', 'STP', 'DOS', 'SLK', 'SF'] as const)[i]!,
          currentRating: 65 + i,
          rating: 65 + i,
        }),
      ),
    ];
    const incoming = p({ id: 'n', name: 'New', position: 'OOS', currentRating: 77, rating: 77 });
    expect(getPlayerPickSummary(incoming, squad, 11, 50, []).text).toMatch(/OS slotuna girer/);
  });
});

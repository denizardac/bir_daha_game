import { describe, expect, it } from 'vitest';
import { getStartingSquad } from '@/data/players';
import { getPlayerPickSummary } from '@/engine/contextPreview';
import {
  assignSquadToFormation,
  getPositionHints,
  isIllegalCentralMidWingSlot,
  slotAcceptsPlayer,
  WING_SLOT_LABELS,
} from '@/engine/lineupPreview';
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
    const squad = base442Ten();
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

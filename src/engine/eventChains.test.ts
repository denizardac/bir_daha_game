import { describe, expect, it } from 'vitest';
import { getChainWeightMultiplier, getEventDrawWeight, type EventDrawContext } from '@/engine/eventDraw';

const baseCtx: EventDrawContext = {
  streak: 1,
  morale: 60,
  lossesCount: 0,
  squadSize: 9,
  maxSquadSize: 11,
  round: 8,
};

describe('zincirleme olaylar (pastChoices)', () => {
  it('yıldız satıldıysa sözleşme krizi bir daha çıkmaz', () => {
    expect(getChainWeightMultiplier('evt_yildiz_sozlesme', { evt_transfer_teklif: 'A' })).toBe(0);
    expect(getEventDrawWeight('evt_yildiz_sozlesme', {
      ...baseCtx,
      pastChoices: { evt_transfer_teklif: 'A' },
    })).toBe(0);
  });

  it('prim biriktirildiyse yıldız sözleşme krizi olasılığı artar', () => {
    const plain = getEventDrawWeight('evt_yildiz_sozlesme', baseCtx);
    const chained = getEventDrawWeight('evt_yildiz_sozlesme', {
      ...baseCtx,
      pastChoices: { evt_bonus: 'B' },
    });
    expect(chained).toBeGreaterThan(plain);
  });

  it('kavgada ikisi de tutulduysa psikolog olayı öne çıkar', () => {
    const ctx = { ...baseCtx, morale: 40, streak: 0, lossesCount: 1 };
    const plain = getEventDrawWeight('evt_psikolog', ctx);
    const chained = getEventDrawWeight('evt_psikolog', { ...ctx, pastChoices: { evt_kavga: 'B' } });
    expect(chained).toBeGreaterThan(plain);
  });

  it('iğneyle oynatma sonrası sağlık olayları öne çıkar', () => {
    const plain = getEventDrawWeight('evt_doktor', baseCtx);
    const chained = getEventDrawWeight('evt_doktor', { ...baseCtx, pastChoices: { evt_sakatlik: 'A' } });
    expect(chained).toBeGreaterThan(plain);
  });

  it('pastChoices verilmezse ağırlıklar değişmez', () => {
    expect(getEventDrawWeight('evt_doktor', baseCtx))
      .toBe(getEventDrawWeight('evt_doktor', { ...baseCtx, pastChoices: {} }));
  });
});

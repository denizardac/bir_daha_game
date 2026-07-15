import { describe, expect, it } from 'vitest';
import { drawEvent, getEventDrawWeight, getEventPoolForAccess, isEventEligible } from '@/engine/eventDraw';

const winStreakCtx = {
  streak: 5,
  morale: 72,
  lossesCount: 1,
  squadSize: 11,
  maxSquadSize: 11,
  round: 12,
};

const losingCtx = {
  streak: 0,
  morale: 38,
  lossesCount: 3,
  squadSize: 10,
  maxSquadSize: 11,
  round: 8,
};

describe('eventDraw — bağlama göre ağırlık', () => {
  it('keeps Daily Seed independent from personal events and gates them in Free Mode', () => {
    const dailyLocked = getEventPoolForAccess({ isDailySeed: true, unlockedEventIds: [] }).map((event) => event.id);
    const dailyUnlocked = getEventPoolForAccess({
      isDailySeed: true,
      unlockedEventIds: ['evt_unlock_efsane_dokunusu'],
    }).map((event) => event.id);
    expect(dailyUnlocked).toEqual(dailyLocked);
    expect(dailyLocked).not.toContain('evt_unlock_efsane_dokunusu');

    const freeLocked = getEventPoolForAccess({ isDailySeed: false, unlockedEventIds: [] }).map((event) => event.id);
    const freeUnlocked = getEventPoolForAccess({
      isDailySeed: false,
      unlockedEventIds: ['evt_unlock_efsane_dokunusu'],
    }).map((event) => event.id);
    expect(freeLocked).not.toContain('evt_unlock_efsane_dokunusu');
    expect(freeUnlocked).toContain('evt_unlock_efsane_dokunusu');
  });

  it('galibiyet serisinde spor psikoloğu çıkmaz', () => {
    expect(getEventDrawWeight('evt_psikolog', winStreakCtx)).toBe(0);
    expect(isEventEligible('evt_psikolog', winStreakCtx)).toBe(false);
  });

  it('galibiyet serisinde basın eleştirisi çıkmaz', () => {
    expect(getEventDrawWeight('evt_basin', winStreakCtx)).toBe(0);
  });

  it('galibiyet serisinde prim / koreografi / şampiyonluk baskısı ağırlıklı', () => {
    expect(getEventDrawWeight('evt_bonus', winStreakCtx)).toBeGreaterThan(1);
    expect(getEventDrawWeight('evt_taraftar_koreografi', winStreakCtx)).toBeGreaterThan(1);
    expect(getEventDrawWeight('evt_sampiyonluk_baskisi', winStreakCtx)).toBeGreaterThan(1);
  });

  it('düşük moral + seri yokken psikolog uygun', () => {
    expect(getEventDrawWeight('evt_psikolog', losingCtx)).toBeGreaterThan(0);
    expect(getEventDrawWeight('evt_basin', losingCtx)).toBeGreaterThan(1);
  });

  it('drawEvent 20 denemede seri 5 iken psikolog gelmez', () => {
    for (let i = 0; i < 20; i++) {
      const event = drawEvent(`seed-${i}`, 12, [], winStreakCtx);
      expect(event.id).not.toBe('evt_psikolog');
      expect(event.id).not.toBe('evt_basin');
    }
  });
});

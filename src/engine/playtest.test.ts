import { describe, expect, it } from 'vitest';
import { runPlaytestBatch, simulateFullRun } from '@/engine/playtest';

describe('playtest batch', () => {
  it('completes runs without throwing', () => {
    const summary = runPlaytestBatch(5, 'qa-batch');
    expect(summary.runs).toBe(5);
    expect(summary.avgScore).toBeGreaterThan(0);
    expect(summary.maxScore).toBeGreaterThanOrEqual(summary.minScore);
  });

  it('single run stays within squad bounds', () => {
    const run = simulateFullRun('qa-single');
    expect(run.finalSquadSize).toBeGreaterThanOrEqual(4);
    expect(run.finalSquadSize).toBeLessThanOrEqual(11);
  });
});

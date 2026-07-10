import { describe, expect, it } from 'vitest';
import {
  buildChallengeUrl,
  isChallengeSeedDaily,
  parseChallengeFromSearch,
  stripChallengeParams,
} from '@/engine/challenge';

describe('meydan okuma linki', () => {
  it('kurulan link geri çözülür (round-trip)', () => {
    const url = buildChallengeUrl('https://birdaha.tech/', {
      seed: '2026-07-07-kale-123-bir-daha-v1',
      score: 12345,
      by: 'Deniz',
    });
    const parsed = parseChallengeFromSearch(new URL(url).search);
    expect(parsed).toEqual({ seed: '2026-07-07-kale-123-bir-daha-v1', score: 12345, by: 'Deniz' });
  });

  it('mevcut sorgu ve hash temizlenir', () => {
    const url = buildChallengeUrl('https://birdaha.tech/?eski=1#bolum', {
      seed: 'free-123-abc',
      score: 500,
      by: 'X',
    });
    expect(url).not.toContain('eski');
    expect(url).not.toContain('#bolum');
  });

  it('seed yoksa veya çok kısaysa null', () => {
    expect(parseChallengeFromSearch('')).toBeNull();
    expect(parseChallengeFromSearch('?score=100')).toBeNull();
    expect(parseChallengeFromSearch('?seed=ab')).toBeNull();
  });

  it('bozuk skor 0 sayılır, negatif ve aşırı değer kırpılır', () => {
    expect(parseChallengeFromSearch('?seed=free-abc-1&score=abc')?.score).toBe(0);
    expect(parseChallengeFromSearch('?seed=free-abc-1&score=-50')?.score).toBe(0);
    expect(parseChallengeFromSearch('?seed=free-abc-1&score=99999999')?.score).toBe(500_000);
  });

  it('isim yoksa varsayılan, uzunsa kırpılır', () => {
    expect(parseChallengeFromSearch('?seed=free-abc-1')?.by).toBe('Bir rakip');
    const long = parseChallengeFromSearch(`?seed=free-abc-1&by=${'a'.repeat(50)}`);
    expect(long!.by.length).toBe(18);
  });

  it('günlük seed ayrımı', () => {
    expect(isChallengeSeedDaily('bugun-seed', 'bugun-seed')).toBe(true);
    expect(isChallengeSeedDaily('eski-seed', 'bugun-seed')).toBe(false);
  });

  it('adres çubuğu temizlenirken diğer parametreler korunur', () => {
    const cleaned = stripChallengeParams('https://birdaha.tech/?seed=abc-def&score=5&by=X&utm=ig');
    expect(cleaned).toContain('utm=ig');
    expect(cleaned).not.toContain('seed');
    expect(cleaned).not.toContain('score');
  });
});

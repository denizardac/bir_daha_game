import type { Tag } from '@/types';

/** Aynı oyuncuda birlikte bulunmaması gereken nitelik grupları */
export const TAG_EXCLUSION_GROUPS: Tag[][] = [
  ['KISA', 'UZUN'],
  ['PİK DÖNEM', 'GERİLEYEN'],
  ['POTANSİYEL', 'GERİLEYEN'],
  ['YENİ SEZON', 'GERİLEYEN'],
  ['YENİ SEZON', 'PİK DÖNEM'],
  // Genç yetenek (gelişecek) ile tecrübeli mentor/zirve aynı oyuncuda olmaz
  ['POTANSİYEL', 'MENTOR'],
  ['YENİ SEZON', 'MENTOR'],
  ['POTANSİYEL', 'PİK DÖNEM'],
];

const conflictPeers = new Map<Tag, Set<Tag>>();

for (const group of TAG_EXCLUSION_GROUPS) {
  for (const tag of group) {
    if (!conflictPeers.has(tag)) conflictPeers.set(tag, new Set());
    for (const peer of group) {
      if (peer !== tag) conflictPeers.get(tag)!.add(peer);
    }
  }
}

export function tagConflictsWith(candidate: Tag, existing: readonly Tag[]): boolean {
  const peers = conflictPeers.get(candidate);
  if (!peers) return false;
  return existing.some((t) => peers.has(t));
}

export function canAddTag(candidate: Tag, existing: readonly Tag[]): boolean {
  return !existing.includes(candidate) && !tagConflictsWith(candidate, existing);
}

export function filterCompatibleTags(pool: readonly Tag[], existing: readonly Tag[]): Tag[] {
  return pool.filter((t) => canAddTag(t, existing));
}

/** Çelişen niteliklerden sonrakini atar; ilk görülen korunur */
export function sanitizeTags(tags: readonly Tag[]): Tag[] {
  const out: Tag[] = [];
  for (const tag of tags) {
    if (!out.includes(tag) && canAddTag(tag, out)) out.push(tag);
  }
  return out;
}

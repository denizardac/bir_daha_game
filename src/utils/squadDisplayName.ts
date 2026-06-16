/** Kadro listesi: D. Arda · D. E. Çelik — ön ad(lar) baş harfi, soyad tam */
export function formatSquadListName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  if (parts.length === 2) {
    const initial = parts[0]![0]?.toUpperCase() ?? '';
    return `${initial}. ${parts[1]}`;
  }
  const surname = parts[parts.length - 1]!;
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p[0]?.toUpperCase() ?? ''}.`)
    .join(' ');
  return `${initials} ${surname}`;
}

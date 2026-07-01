function stripNickname(name: string): string {
  return name
    .replace(/\s+["“”][^"“”]+["“”]/g, '')
    .replace(/\s+'[^']+'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Kadro listesi: Lucas "Kale" Yılmaz → L. Yılmaz; Deniz Efe Çelik → D. E. Çelik */
export function formatSquadListName(name: string): string {
  const clean = stripNickname(name);
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return name;
  if (parts.length === 2) {
    const initial = parts[0]![0]?.toLocaleUpperCase('tr-TR') ?? '';
    return `${initial}. ${parts[1]}`;
  }
  const surname = parts[parts.length - 1]!;
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p[0]?.toLocaleUpperCase('tr-TR') ?? ''}.`)
    .join(' ');
  return `${initials} ${surname}`;
}

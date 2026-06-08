/** Tutarlı sayı gösterimi — floating point artefaktlarını önler */
export function formatStat(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatStatDisplay(value: number, decimals = 1): string {
  return formatStat(value, decimals).toFixed(decimals);
}

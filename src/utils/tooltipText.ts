export function formatTooltipSentence(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';

  const sentence = clean[0]!.toLocaleUpperCase('tr-TR') + clean.slice(1);
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

export function joinTooltipLines(lines: Array<string | null | undefined>): string {
  return lines
    .map((line) => (line ? formatTooltipSentence(line) : ''))
    .filter(Boolean)
    .join('\n');
}

import { runPlaytestBatch } from '../src/engine/playtest';
import { SYNERGIES } from '../src/data/synergies';
import { TACTIC_CARDS } from '../src/data/tactics';

const RUNS = Number(process.env.QA_RUNS ?? 40);
// Deterministik seed → CI'da tekrarlanabilir sonuç (eşik kontrolü güvenilir olsun)
const BASE_SEED = process.env.QA_SEED ?? 'qa-ci';

// Denge eşikleri (env ile geçersiz kılınabilir). Bantlar geniş; amaç katastrofik
// regresyonları (0 puan, milyonluk patlama, hiç galibiyet yok) yakalamak.
const MIN_AVG = Number(process.env.QA_MIN_AVG ?? 1500);
const MAX_AVG = Number(process.env.QA_MAX_AVG ?? 60000);
const MIN_AVG_WINS = Number(process.env.QA_MIN_WINS ?? 1);

const summary = runPlaytestBatch(RUNS, BASE_SEED);

console.log('=== Bir Daha QA Playtest ===');
console.log(`Runs: ${summary.runs} (seed: ${BASE_SEED})`);
console.log(`Avg score: ${summary.avgScore} (min ${summary.minScore}, max ${summary.maxScore})`);
console.log(`Avg W/D/L: ${summary.avgWins} / ${summary.avgDraws} / ${summary.avgLosses}`);
console.log(`Avg final morale: ${summary.avgMorale}`);
console.log(`Finale: ulaşma %${summary.finaleReachedRate} · finale galibiyeti %${summary.finaleWinRate}`);
console.log('');

// --- Denge telemetrisi: hangi sinerji/taktik oyunda hiç görünmüyor? ---
const synergyRows = Object.entries(summary.synergyUsage).sort((a, b) => b[1] - a[1]);
const unusedSynergies = SYNERGIES.filter((s) => !(s.id in summary.synergyUsage)).map((s) => s.name);
console.log(`Sinerji (run başına ort. aktivasyon, ilk 5): ${synergyRows.slice(0, 5).map(([id, n]) => `${SYNERGIES.find((s) => s.id === id)?.name ?? id}=${n}`).join(' · ') || 'yok'}`);
console.log(`Hiç aktive olmayan sinerji (${unusedSynergies.length}): ${unusedSynergies.join(', ') || '—'}`);
const tacticRows = Object.entries(summary.tacticUsage).sort((a, b) => b[1] - a[1]);
const unusedTactics = TACTIC_CARDS.filter((t) => !(t.id in summary.tacticUsage)).map((t) => t.name);
console.log(`Taktik (kaç run'da aktifti, ilk 5): ${tacticRows.slice(0, 5).map(([id, n]) => `${TACTIC_CARDS.find((t) => t.id === id)?.name ?? id}=${n}`).join(' · ') || 'yok'}`);
console.log(`Hiç seçilmeyen taktik (${unusedTactics.length}): ${unusedTactics.join(', ') || '—'}`);
console.log('Not: otomatik oyuncu en yüksek ratingi seçer — insan oyuncuda tag/sinerji hedefli seçimle dağılım farklıdır.');
console.log('');

const failures: string[] = [];
if (summary.runs !== RUNS) failures.push(`Çalıştırılan run sayısı beklenenden farklı (${summary.runs} != ${RUNS})`);
if (summary.minScore < 0) failures.push(`Negatif skor üretildi (min ${summary.minScore})`);
if (summary.avgScore < MIN_AVG) failures.push(`Ortalama skor çok düşük (${summary.avgScore} < ${MIN_AVG}) — denge kırılmış olabilir`);
if (summary.avgScore > MAX_AVG) failures.push(`Ortalama skor çok yüksek (${summary.avgScore} > ${MAX_AVG}) — puan patlaması olabilir`);
if (summary.avgWins < MIN_AVG_WINS) failures.push(`Ortalama galibiyet çok düşük (${summary.avgWins} < ${MIN_AVG_WINS})`);

if (failures.length) {
  console.error('❌ QA eşik kontrolü BAŞARISIZ:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('✅ QA eşik kontrolü geçti.');
console.log('Manuel kontrol: mobil viewport (390×844), PWA install, 1 tam run hissi.');

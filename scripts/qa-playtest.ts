import { runPlaytestBatch } from '../src/engine/playtest';

const RUNS = Number(process.env.QA_RUNS ?? 40);

const summary = runPlaytestBatch(RUNS);

console.log('=== Bir Daha QA Playtest ===');
console.log(`Runs: ${summary.runs}`);
console.log(`Avg score: ${summary.avgScore} (min ${summary.minScore}, max ${summary.maxScore})`);
console.log(`Avg W/D/L: ${summary.avgWins} / — / ${summary.avgLosses}`);
console.log(`Avg final morale: ${summary.avgMorale}`);
console.log('');
console.log('Manuel kontrol: mobil viewport (390×844), timer ayarı, PWA install, 1 tam run hissi.');

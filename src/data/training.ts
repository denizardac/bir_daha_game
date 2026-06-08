import { createRng } from '@/engine/seed';
import type { Tag, TrainingCard } from '@/types';

/** Antrenmanda verilebilecek pozitif nitelikler */
export const TRAINING_TAGS: Tag[] = [
  'HIZLI',
  'GÜÇLÜ',
  'DAYANIKLI',
  'TEKNİK',
  'FİNİŞÖR',
  'ASİSTÇİ',
  'SAVAŞÇI',
  'SOĞUKKANLI',
  'LİDER',
  'MENTOR',
];

export const MAX_PLAYER_TAGS = 5;

export function createTrainingCard(seed: string, round: number, rerollIndex = 0): TrainingCard {
  const rng = createRng(seed, 'training-card', round, rerollIndex);
  const pool = [...TRAINING_TAGS];
  const offeredTags: Tag[] = [];

  while (offeredTags.length < 3 && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    offeredTags.push(pool.splice(idx, 1)[0]!);
  }

  return {
    kind: 'training',
    id: `training-r${round}-${rerollIndex}`,
    name: 'Özel Antrenman',
    description: 'Kadrodan bir oyuncu seç, nitelik ekle — maç yok, +35 puan',
    offeredTags,
  };
}

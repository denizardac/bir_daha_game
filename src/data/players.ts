import { createRng } from '@/engine/seed';
import type { PlayerCard, Position, Rarity, Tag } from '@/types';

type PlayerTemplate = {
  name: string;
  rating: number;
  position: Position;
  rarity: Rarity;
  tags: Tag[];
};

function makePlayer(template: PlayerTemplate, id: string, isStarter = false): PlayerCard {
  const ceiling = template.tags.includes('POTANSİYEL')
    ? template.rating + 15
    : template.rating;
  return {
    kind: 'player' as const,
    id,
    name: template.name,
    rating: template.rating,
    currentRating: template.rating,
    position: template.position,
    rarity: template.rarity,
    tags: template.tags,
    potentialCeiling: ceiling,
    isStarter,
  };
}

const POOL: PlayerTemplate[] = [
  // Kaleci
  { name: 'Emre Yıldız', rating: 62, position: 'KL', rarity: 'normal', tags: [] },
  { name: 'Can Arslan', rating: 71, position: 'KL', rarity: 'iyi', tags: ['DAYANIKLI'] },
  { name: 'Marcus Silva', rating: 84, position: 'KL', rarity: 'güçlü', tags: ['DAYANIKLI'] },
  { name: 'Oğuz Demir', rating: 88, position: 'KL', rarity: 'efsane', tags: ['DAYANIKLI', 'PENALTI'] },
  { name: 'Fırat Güneş', rating: 73, position: 'KL', rarity: 'iyi', tags: ['SERBEST VURUŞ'] },

  // Stoper
  { name: 'Burak Koç', rating: 61, position: 'STP', rarity: 'normal', tags: ['GÜÇLÜ'] },
  { name: 'Kerem Aydın', rating: 63, position: 'STP', rarity: 'normal', tags: [] },
  { name: 'Mert Çelik', rating: 60, position: 'STP', rarity: 'normal', tags: [] },
  { name: 'Tolga Şahin', rating: 72, position: 'STP', rarity: 'iyi', tags: ['GÜÇLÜ', 'YERLİ'] },
  { name: 'Diego Ramos', rating: 79, position: 'STP', rarity: 'iyi', tags: ['GÜÇLÜ'] },
  { name: 'Serkan Öztürk', rating: 83, position: 'STP', rarity: 'güçlü', tags: ['GÜÇLÜ', 'LİDER'] },
  { name: 'Ahmet Kaya', rating: 86, position: 'STP', rarity: 'güçlü', tags: ['DAYANIKLI', 'YERLİ'] },

  // Orta saha
  { name: 'Deniz Acar', rating: 62, position: 'OS', rarity: 'normal', tags: [] },
  { name: 'Barış Güneş', rating: 64, position: 'OS', rarity: 'normal', tags: ['YERLİ'] },
  { name: 'Luca Moretti', rating: 74, position: 'OS', rarity: 'iyi', tags: ['TEKNİK'] },
  { name: 'Efe Polat', rating: 76, position: 'OS', rarity: 'iyi', tags: ['TEKNİK', 'YERLİ'] },
  { name: 'James Okonkwo', rating: 81, position: 'OS', rarity: 'güçlü', tags: ['TEKNİK', 'ASİSTÇİ', 'YABANCI YILDIZ'] },
  { name: 'Antoine Dubois', rating: 83, position: 'SF', rarity: 'güçlü', tags: ['FİNİŞÖR', 'YABANCI YILDIZ', 'SERBEST VURUŞ'] },
  { name: 'Pedro Alves', rating: 80, position: 'SÖK', rarity: 'güçlü', tags: ['HIZLI', 'YABANCI YILDIZ', 'PENALTI'] },
  { name: 'Onur Tekin', rating: 85, position: 'OS', rarity: 'güçlü', tags: ['TEKNİK', 'LİDER', 'KAPİTAN'] },
  { name: 'İbrahim Koç', rating: 79, position: 'DOS', rarity: 'iyi', tags: ['SOYUNMA ODASI', 'LİDER'] },

  // Defansif orta saha
  { name: 'Hakan Yılmaz', rating: 61, position: 'DOS', rarity: 'normal', tags: [] },
  { name: 'Volkan Erdoğan', rating: 68, position: 'DOS', rarity: 'normal', tags: ['GÜÇLÜ'] },
  { name: 'Mateo Fernández', rating: 77, position: 'DOS', rarity: 'iyi', tags: ['TEKNİK'] },
  { name: 'Cem Özkan', rating: 80, position: 'DOS', rarity: 'güçlü', tags: ['GÜÇLÜ', 'YERLİ'] },

  // Kanatlar
  { name: 'Ali Rıza', rating: 60, position: 'SLK', rarity: 'normal', tags: [] },
  { name: 'Yusuf Karaca', rating: 65, position: 'SLK', rarity: 'normal', tags: ['HIZLI'] },
  { name: 'Kaan Bulut', rating: 73, position: 'SLK', rarity: 'iyi', tags: ['HIZLI', 'YERLİ'] },
  { name: 'Rafael Costa', rating: 82, position: 'SLK', rarity: 'güçlü', tags: ['HIZLI', 'FİNİŞÖR'] },
  { name: 'Emirhan Doğan', rating: 67, position: 'SÖK', rarity: 'iyi', tags: ['HIZLI'] },
  { name: 'Tyler Brooks', rating: 78, position: 'SÖK', rarity: 'iyi', tags: ['HIZLI', 'ASİSTÇİ'] },
  { name: 'Arda Güleroğlu', rating: 84, position: 'SÖK', rarity: 'güçlü', tags: ['HIZLI', 'TEKNİK'] },

  // Forvet
  { name: 'Selim Uçar', rating: 63, position: 'SF', rarity: 'normal', tags: ['FİNİŞÖR'] },
  { name: 'Berk Aktaş', rating: 70, position: 'SF', rarity: 'iyi', tags: ['FİNİŞÖR'] },
  { name: 'Isaac Mensah', rating: 75, position: 'SF', rarity: 'iyi', tags: ['POTANSİYEL', 'HIZLI'] },
  { name: 'Murat Eren', rating: 79, position: 'SF', rarity: 'iyi', tags: ['FİNİŞÖR', 'YERLİ'] },
  { name: 'Victor Kane', rating: 86, position: 'SF', rarity: 'güçlü', tags: ['FİNİŞÖR', 'GÜÇLÜ'] },
  { name: 'Enes Yıldırım', rating: 90, position: 'SF', rarity: 'efsane', tags: ['FİNİŞÖR', 'HIZLI'] },

  // Yerli gençler
  { name: 'Umut Sarı', rating: 64, position: 'OS', rarity: 'normal', tags: ['YERLİ', 'POTANSİYEL'] },
  { name: 'Furkan Işık', rating: 66, position: 'STP', rarity: 'normal', tags: ['YERLİ'] },
  { name: 'Gökhan Taş', rating: 67, position: 'SLK', rarity: 'normal', tags: ['YERLİ'] },
  { name: 'Sinan Kurt', rating: 68, position: 'DOS', rarity: 'normal', tags: ['YERLİ'] },
  { name: 'Okan Vural', rating: 69, position: 'SÖK', rarity: 'normal', tags: ['YERLİ'] },
  { name: 'Levent Aksoy', rating: 70, position: 'SF', rarity: 'iyi', tags: ['YERLİ'] },
  { name: 'Tuncay Bilgin', rating: 71, position: 'OS', rarity: 'iyi', tags: ['YERLİ', 'TEKNİK'] },
  { name: 'Rıza Çetin', rating: 72, position: 'STP', rarity: 'iyi', tags: ['YERLİ', 'GÜÇLÜ'] },

  // Mentor & lider
  { name: 'Vedat Özer', rating: 74, position: 'OS', rarity: 'iyi', tags: ['MENTOR', 'LİDER'] },
  { name: 'Hasan Demirci', rating: 76, position: 'DOS', rarity: 'iyi', tags: ['MENTOR', 'YERLİ'] },
  { name: 'Carlos Mendes', rating: 82, position: 'OS', rarity: 'güçlü', tags: ['MENTOR', 'TEKNİK'] },
  { name: 'Kadir Yalçın', rating: 80, position: 'STP', rarity: 'güçlü', tags: ['LİDER', 'YERLİ'] },

  // Hızlı oyuncular
  { name: 'Speedy Jones', rating: 77, position: 'SLK', rarity: 'iyi', tags: ['HIZLI'] },
  { name: 'Flash Özdemir', rating: 78, position: 'SÖK', rarity: 'iyi', tags: ['HIZLI'] },
  { name: 'Bolt Adeyemi', rating: 83, position: 'SF', rarity: 'güçlü', tags: ['HIZLI', 'FİNİŞÖR'] },
  { name: 'Wind Çakır', rating: 75, position: 'SLK', rarity: 'iyi', tags: ['HIZLI'] },

  // Efsane
  { name: 'Legend Petrović', rating: 91, position: 'OS', rarity: 'efsane', tags: ['TEKNİK', 'LİDER'] },
  { name: 'Star Nakamura', rating: 89, position: 'SF', rarity: 'efsane', tags: ['FİNİŞÖR', 'TEKNİK'] },

  // Ofansif orta saha
  { name: 'Kaan Öztürk', rating: 66, position: 'OOS', rarity: 'normal', tags: ['TEKNİK'] },
  { name: 'Bruno Santos', rating: 75, position: 'OOS', rarity: 'iyi', tags: ['TEKNİK', 'ASİSTÇİ'] },
  { name: 'Yiğit Arslan', rating: 78, position: 'OOS', rarity: 'iyi', tags: ['YERLİ', 'HIZLI'] },
  { name: 'Nico Berg', rating: 84, position: 'OOS', rarity: 'güçlü', tags: ['FİNİŞÖR', 'TEKNİK'] },
  { name: 'Maestro Silva', rating: 88, position: 'OOS', rarity: 'efsane', tags: ['TEKNİK', 'ASİSTÇİ'] },

  // Bekler
  { name: 'Serkan Yıldız', rating: 64, position: 'SLB', rarity: 'normal', tags: ['YERLİ'] },
  { name: 'Patrick Cole', rating: 73, position: 'SLB', rarity: 'iyi', tags: ['HIZLI'] },
  { name: 'Uğur Tekin', rating: 77, position: 'SLB', rarity: 'iyi', tags: ['GÜÇLÜ', 'YERLİ'] },
  { name: 'Marco Dias', rating: 69, position: 'SÖB', rarity: 'normal', tags: ['HIZLI'] },
  { name: 'Kerim Sağ', rating: 74, position: 'SÖB', rarity: 'iyi', tags: ['TEKNİK'] },
  { name: 'Luis Ortega', rating: 81, position: 'SÖB', rarity: 'güçlü', tags: ['HIZLI', 'ASİSTÇİ'] },
];

function hashMix(n: number, salt: number): number {
  let x = Math.imul(n + 1, 2654435761) ^ salt;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x ^= x >>> 15;
  return Math.abs(x);
}

function ratingFromIndex(i: number): number {
  const spread = hashMix(i, 41) % 32;
  const jitter = (hashMix(i, 97) % 5) - 2;
  return Math.min(91, Math.max(60, 60 + spread + jitter));
}

function rarityFromRating(rating: number): Rarity {
  if (rating >= 87) return 'efsane';
  if (rating >= 80) return 'güçlü';
  if (rating >= 70) return 'iyi';
  return 'normal';
}

const PROC_POSITIONS: Position[] = [
  'KL', 'STP', 'SLB', 'SÖB', 'STP', 'DOS', 'OS', 'OOS', 'OOS', 'SLK', 'SÖK', 'SF',
];

const PROC_POSITIVE_TAGS: Tag[][] = [
  [],
  ['YERLİ'],
  ['HIZLI'],
  ['TEKNİK'],
  ['FİNİŞÖR'],
  ['GÜÇLÜ'],
  ['DAYANIKLI'],
  ['POTANSİYEL'],
  ['MENTOR'],
  ['YERLİ', 'HIZLI'],
  ['TEKNİK', 'ASİSTÇİ'],
  ['SOĞUKKANLI'],
  ['ASİSTÇİ', 'TEKNİK'],
  ['YERLİ', 'GÜÇLÜ'],
  ['HIZLI', 'FİNİŞÖR'],
  ['LİDER'],
  ['KAPİTAN'],
  ['SERBEST VURUŞ'],
  ['PENALTI'],
  ['SOYUNMA ODASI'],
  ['YABANCI YILDIZ'],
];

const PROC_LATE_NEGATIVE: Tag[] = ['GERİLEYEN', 'SAKATLIK RİSKİ', 'PERFORMANS DÜŞÜŞÜ', 'TARTIŞMALI'];

function proceduralTags(i: number, rating: number): Tag[] {
  const base = [...PROC_POSITIVE_TAGS[hashMix(i, 13) % PROC_POSITIVE_TAGS.length]!];
  if (rating >= 74 && i >= 35 && hashMix(i, 71) % 100 < 16) {
    const neg = PROC_LATE_NEGATIVE[hashMix(i, 19) % PROC_LATE_NEGATIVE.length]!;
    if (!base.includes(neg)) base.push(neg);
  }
  return base;
}

function generateExtraPlayers(): PlayerCard[] {
  const first = [
    'Emre', 'Can', 'Burak', 'Deniz', 'Kaan', 'Arda', 'Oğuz', 'Selim', 'Mert', 'Tolga',
    'Barış', 'Efe', 'Hakan', 'Volkan', 'Umut', 'Furkan', 'Gökhan', 'Sinan', 'Levent', 'Tuncay',
    'Marco', 'Luca', 'Victor', 'James', 'Tyler', 'Diego', 'Carlos', 'Rafael', 'Bolt', 'Flash',
    'Nikolai', 'Sven', 'Amir', 'João', 'Pierre', 'Kenji', 'Omar', 'Felix', 'Ivan', 'Noah',
  ];
  const last = [
    'Yılmaz', 'Demir', 'Kaya', 'Acar', 'Koç', 'Şahin', 'Polat', 'Taş', 'Kurt', 'Aktaş',
    'Silva', 'Costa', 'Brooks', 'Ramos', 'Mensah', 'Kane', 'Moretti', 'Fernández', 'Okonkwo', 'Adeyemi',
    'Novak', 'Larsen', 'Haddad', 'Santos', 'Dupont', 'Tanaka', 'Hassan', 'Müller', 'Petrov', 'Reed',
  ];
  const out: PlayerCard[] = [];
  for (let i = 0; i < 80; i++) {
    const rating = ratingFromIndex(i);
    const pos = PROC_POSITIONS[i % PROC_POSITIONS.length]!;
    const fi = hashMix(i, 3) % first.length;
    const li = (hashMix(i, 7) + Math.floor(i / first.length)) % last.length;
    const suffix = hashMix(i, 59) % 100 < 12 ? ` ${String.fromCharCode(65 + (i % 26))}.` : '';
    out.push(makePlayer({
      name: `${first[fi]} ${last[li]}${suffix}`,
      rating,
      position: pos,
      rarity: rarityFromRating(rating),
      tags: proceduralTags(i, rating),
    }, `gen_${String(i + 1).padStart(3, '0')}`));
  }
  return out;
}

export const PLAYER_POOL: PlayerCard[] = [
  ...POOL.map((p, i) => makePlayer(p, `player_${String(i + 1).padStart(3, '0')}`)),
  ...generateExtraPlayers(),
];

const DAILY_START_SQUAD: PlayerTemplate[] = [
  { name: 'Can Arslan', rating: 62, position: 'KL', rarity: 'normal', tags: [] },
  { name: 'Burak Koç', rating: 61, position: 'STP', rarity: 'normal', tags: ['GÜÇLÜ'] },
  { name: 'Kerem Aydın', rating: 60, position: 'STP', rarity: 'normal', tags: [] },
  { name: 'Mert Çelik', rating: 63, position: 'STP', rarity: 'normal', tags: [] },
  { name: 'Deniz Acar', rating: 62, position: 'OS', rarity: 'normal', tags: [] },
  { name: 'Hakan Yılmaz', rating: 61, position: 'DOS', rarity: 'normal', tags: [] },
  { name: 'Ali Rıza', rating: 60, position: 'SLK', rarity: 'normal', tags: [] },
];

const BAD_START_TAGS: Tag[] = ['GERİLEYEN', 'SAKATLIK RİSKİ', 'PERFORMANS DÜŞÜŞÜ', 'TARTIŞMALI'];

const FREE_START_SIZE = 7;

function pickFreeStartTrait(rng: () => number, template: PlayerTemplate): Tag[] {
  if (rng() > 0.38) return [];
  if (template.tags.length) return [template.tags[Math.floor(rng() * template.tags.length)]!];
  const pool: Tag[] = template.position === 'KL'
    ? ['DAYANIKLI', 'SOĞUKKANLI']
    : template.position === 'STP'
      ? ['GÜÇLÜ', 'DAYANIKLI', 'YERLİ']
      : ['HIZLI', 'YERLİ', 'TEKNİK', 'ASİSTÇİ'];
  return [pool[Math.floor(rng() * pool.length)]!];
}

function cloneFreeStarter(template: PlayerCard, rng: () => number, id: string): PlayerCard {
  const rating = Math.max(56, Math.min(74, template.rating + Math.floor(rng() * 7) - 3));
  const tags = pickFreeStartTrait(rng, {
    name: template.name,
    rating: template.rating,
    position: template.position,
    rarity: template.rarity,
    tags: template.tags,
  });
  return makePlayer({
    name: template.name,
    rating,
    position: template.position,
    rarity: rarityFromRating(rating),
    tags: tags.length ? tags : template.tags.slice(0, 1),
  }, id, true);
}

export function getStartingSquad(seed?: string, isDaily = true): PlayerCard[] {
  if (isDaily) {
    return DAILY_START_SQUAD.map((p, i) => makePlayer(p, `start_${i}`, true));
  }

  const rng = createRng(seed ?? 'free', 'start-squad');
  const usedNames = new Set<string>();
  const pool = PLAYER_POOL.filter((p) => !p.tags.some((t) => BAD_START_TAGS.includes(t)));
  const squad: PlayerCard[] = [];

  const gks = pool.filter((p) => p.position === 'KL');
  if (gks.length) {
    const gk = gks[Math.floor(rng() * gks.length)]!;
    usedNames.add(gk.name);
    squad.push(cloneFreeStarter(gk, rng, 'start_kl_0'));
  }

  while (squad.length < FREE_START_SIZE) {
    const available = pool.filter((p) => !usedNames.has(p.name));
    if (!available.length) break;
    const pick = available[Math.floor(rng() * available.length)]!;
    usedNames.add(pick.name);
    squad.push(cloneFreeStarter(pick, rng, `start_${squad.length}`));
  }

  return squad;
}

export function clonePlayer(player: PlayerCard): PlayerCard {
  return { ...player, tags: [...player.tags], isStarter: player.isStarter };
}

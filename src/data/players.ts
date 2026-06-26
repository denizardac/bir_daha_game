import { pickFreeStartTraitForPosition, pickTagsForPosition } from '@/data/positionTraitPools';
import { createRng } from '@/engine/seed';
import type { PlayerCard, Position, Rarity, Tag } from '@/types';

type PlayerTemplate = {
  name: string;
  rating: number;
  position: Position;
  rarity: Rarity;
  tags: Tag[];
  signature?: boolean;
  signatureColor?: string;
  signatureQuote?: string;
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
    ...(template.signature ? { signature: true } : {}),
    ...(template.signatureColor ? { signatureColor: template.signatureColor } : {}),
    ...(template.signatureQuote ? { signatureQuote: template.signatureQuote } : {}),
  };
}

const POOL: PlayerTemplate[] = [
  // Kaleci
  { name: 'Emre Yıldız', rating: 62, position: 'KL', rarity: 'normal', tags: [] },
  { name: 'Can Arslan', rating: 71, position: 'KL', rarity: 'iyi', tags: ['DAYANIKLI'] },
  { name: 'Marcus Silva', rating: 84, position: 'KL', rarity: 'güçlü', tags: ['DAYANIKLI'] },
  { name: 'Oğuz Demir', rating: 88, position: 'KL', rarity: 'efsane', tags: ['DAYANIKLI', 'PENALTI'], signature: true, signatureColor: '#f59e0b', signatureQuote: 'Bu kale benim evim — kimse içeri giremez.' },
  { name: 'Fırat Güneş', rating: 73, position: 'KL', rarity: 'iyi', tags: ['SERBEST VURUŞ'] },

  // Stoper
  { name: 'Burak Koç', rating: 61, position: 'STP', rarity: 'normal', tags: ['GÜÇLÜ'] },
  { name: 'Kerem Aydın', rating: 63, position: 'STP', rarity: 'normal', tags: [] },
  { name: 'Mert Çelik', rating: 60, position: 'STP', rarity: 'normal', tags: [] },
  { name: 'Tolga Şahin', rating: 72, position: 'STP', rarity: 'iyi', tags: ['GÜÇLÜ', 'YERLİ'] },
  { name: 'Diego Ramos', rating: 79, position: 'STP', rarity: 'iyi', tags: ['GÜÇLÜ'] },
  { name: 'Serkan Öztürk', rating: 83, position: 'STP', rarity: 'güçlü', tags: ['GÜÇLÜ', 'LİDER'] },
  { name: 'Ahmet Söyüncüoğlu', rating: 86, position: 'STP', rarity: 'güçlü', tags: ['DAYANIKLI', 'YERLİ'] },

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
  { name: 'Enes Yıldırım', rating: 90, position: 'SF', rarity: 'efsane', tags: ['FİNİŞÖR', 'HIZLI'], signature: true, signatureColor: '#ef4444', signatureQuote: 'Kale gördüğüm an gerisi içgüdü.' },

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
  { name: 'Legend Petrović', rating: 91, position: 'OS', rarity: 'efsane', tags: ['TEKNİK', 'LİDER'], signature: true, signatureColor: '#22d3ee', signatureQuote: 'Oyunu okurum; koşmama gerek kalmaz.' },
  { name: 'Star Nakamura', rating: 89, position: 'SF', rarity: 'efsane', tags: ['FİNİŞÖR', 'TEKNİK'], signature: true, signatureColor: '#e879f9', signatureQuote: 'Sahne benim, ışıkları açın.' },

  // Ofansif orta saha
  { name: 'Kaan Öztürk', rating: 66, position: 'OOS', rarity: 'normal', tags: ['TEKNİK'] },
  { name: 'Bruno Santos', rating: 75, position: 'OOS', rarity: 'iyi', tags: ['TEKNİK', 'ASİSTÇİ'] },
  { name: 'Yiğit Arslan', rating: 78, position: 'OOS', rarity: 'iyi', tags: ['YERLİ', 'HIZLI'] },
  { name: 'Nico Berg', rating: 84, position: 'OOS', rarity: 'güçlü', tags: ['FİNİŞÖR', 'TEKNİK'] },
  { name: 'Maestro Silva', rating: 88, position: 'OOS', rarity: 'efsane', tags: ['TEKNİK', 'ASİSTÇİ'], signature: true, signatureColor: '#a855f7', signatureQuote: 'Pas bir cümledir; ben şiir yazarım.' },

  // Bekler
  { name: 'Serkan Yıldız', rating: 64, position: 'SLB', rarity: 'normal', tags: ['YERLİ'] },
  { name: 'Patrick Cole', rating: 73, position: 'SLB', rarity: 'iyi', tags: ['HIZLI'] },
  { name: 'Uğur Tekin', rating: 77, position: 'SLB', rarity: 'iyi', tags: ['GÜÇLÜ', 'YERLİ'] },
  { name: 'Marco Dias', rating: 69, position: 'SÖB', rarity: 'normal', tags: ['HIZLI'] },
  { name: 'Kerim Sağ', rating: 74, position: 'SÖB', rarity: 'iyi', tags: ['TEKNİK'] },
  { name: 'Luis Ortega', rating: 81, position: 'SÖB', rarity: 'güçlü', tags: ['HIZLI', 'ASİSTÇİ'] },

  // SAVAŞÇI / ölü tag havuzu — mevkiye uygun
  { name: 'Cem Vural', rating: 71, position: 'DOS', rarity: 'iyi', tags: ['SAVAŞÇI', 'GÜÇLÜ'] },
  { name: 'Onur Bek', rating: 69, position: 'STP', rarity: 'normal', tags: ['SAVAŞÇI', 'DAYANIKLI'] },
  { name: 'Halil Uzun', rating: 76, position: 'STP', rarity: 'iyi', tags: ['UZUN', 'GÜÇLÜ'] },
  { name: 'Emre Kısa', rating: 68, position: 'SF', rarity: 'normal', tags: ['KISA', 'FİNİŞÖR'] },
  { name: 'Vedat Peak', rating: 84, position: 'OS', rarity: 'güçlü', tags: ['PİK DÖNEM', 'TEKNİK'] },
  { name: 'Kaan Yeni', rating: 64, position: 'SLK', rarity: 'normal', tags: ['YENİ SEZON', 'YERLİ'] },
  { name: 'Volkan Kart', rating: 73, position: 'DOS', rarity: 'iyi', tags: ['KIRMIZI KART', 'SAVAŞÇI'] },
  { name: 'Murat Risk', rating: 77, position: 'SF', rarity: 'iyi', tags: ['SAKATLIK RİSKİ', 'FİNİŞÖR'] },
  { name: 'Selim Soğuk', rating: 72, position: 'KL', rarity: 'iyi', tags: ['SOĞUKKANLI', 'DAYANIKLI'] },

  // --- Genişletme kadrosu (v2) — havuz çeşitliliği + eksik tag/mevki doldurma ---
  // Kaleci
  { name: 'Berkay Aslan', rating: 80, position: 'KL', rarity: 'güçlü', tags: ['DAYANIKLI', 'LİDER'] },
  { name: 'Diallo Konaté', rating: 87, position: 'KL', rarity: 'efsane', tags: ['DAYANIKLI', 'SOĞUKKANLI'] },
  // Stoper
  { name: 'Nuri Şen', rating: 76, position: 'STP', rarity: 'iyi', tags: ['GÜÇLÜ', 'DAYANIKLI'] },
  { name: 'Viktor Novak', rating: 88, position: 'STP', rarity: 'efsane', tags: ['GÜÇLÜ', 'LİDER', 'KAPİTAN'], signature: true, signatureColor: '#38bdf8', signatureQuote: 'Arkamdan geçmek? Önce benden geç.' },
  { name: 'Emir Toprak', rating: 67, position: 'STP', rarity: 'normal', tags: ['SAVAŞÇI'] },
  // Bekler
  { name: 'Caner Yıldız', rating: 78, position: 'SLB', rarity: 'iyi', tags: ['HIZLI', 'DAYANIKLI'] },
  { name: 'Bruno Reis', rating: 83, position: 'SLB', rarity: 'güçlü', tags: ['HIZLI', 'ASİSTÇİ'] },
  { name: 'Doğan Acar', rating: 75, position: 'SÖB', rarity: 'iyi', tags: ['GÜÇLÜ', 'YERLİ'] },
  { name: 'Mason Hill', rating: 82, position: 'SÖB', rarity: 'güçlü', tags: ['HIZLI', 'TEKNİK'] },
  // Defansif orta saha
  { name: 'Sergio Bravo', rating: 85, position: 'DOS', rarity: 'güçlü', tags: ['GÜÇLÜ', 'LİDER'] },
  { name: 'Tarık Demir', rating: 70, position: 'DOS', rarity: 'iyi', tags: ['SAVAŞÇI', 'YERLİ'] },
  // Orta saha
  { name: 'Andrea Pirloni', rating: 89, position: 'OS', rarity: 'efsane', tags: ['TEKNİK', 'ASİSTÇİ', 'SOYUNMA ODASI'] },
  { name: 'Kenan Ural', rating: 73, position: 'OS', rarity: 'iyi', tags: ['TEKNİK', 'YENİ SEZON'] },
  // Ofansif orta saha
  { name: 'Reza Karimi', rating: 81, position: 'OOS', rarity: 'güçlü', tags: ['TEKNİK', 'HIZLI'] },
  { name: 'Metehan Can', rating: 69, position: 'OOS', rarity: 'normal', tags: ['YERLİ', 'POTANSİYEL'] },
  // Kanatlar
  { name: 'Diego Luz', rating: 87, position: 'SLK', rarity: 'efsane', tags: ['HIZLI', 'FİNİŞÖR', 'ASİSTÇİ'], signature: true, signatureColor: '#f97316', signatureQuote: 'Kanat benim otobanım — limit yok.' },
  { name: 'Berkan Yel', rating: 71, position: 'SLK', rarity: 'iyi', tags: ['HIZLI', 'YERLİ'] },
  { name: 'Kwame Asante', rating: 84, position: 'SÖK', rarity: 'güçlü', tags: ['HIZLI', 'FİNİŞÖR'] },
  { name: 'Sefa Ok', rating: 66, position: 'SÖK', rarity: 'normal', tags: ['HIZLI', 'YENİ SEZON'] },
  // Forvet
  { name: 'Mauro Bianchi', rating: 88, position: 'SF', rarity: 'efsane', tags: ['FİNİŞÖR', 'SOĞUKKANLI', 'PENALTI'], signature: true, signatureColor: '#fbbf24', signatureQuote: 'Penaltı mı? O zaten gol demek.' },
  { name: 'Cenk Yaman', rating: 77, position: 'SF', rarity: 'iyi', tags: ['FİNİŞÖR', 'YERLİ'] },
  { name: 'Goran Petrović', rating: 82, position: 'SF', rarity: 'güçlü', tags: ['FİNİŞÖR', 'GÜÇLÜ'] },
  { name: 'Yiğithan Er', rating: 65, position: 'SF', rarity: 'normal', tags: ['POTANSİYEL', 'YERLİ'] },
  { name: 'Lukas Brandt', rating: 79, position: 'SF', rarity: 'iyi', tags: ['FİNİŞÖR', 'DAYANIKLI'] },

  // --- Anahtar tag dengesi (v3) — KAPİTAN / SOYUNMA ODASI / SERBEST VURUŞ / PENALTI havuzunu doldur ---
  // KAPİTAN (artık 5 oyuncu): Onur Tekin, Viktor Novak + aşağıdakiler
  { name: 'Tuna Reis', rating: 80, position: 'DOS', rarity: 'güçlü', tags: ['KAPİTAN', 'LİDER', 'SAVAŞÇI'] },
  { name: 'Çağan Yüce', rating: 78, position: 'OS', rarity: 'iyi', tags: ['KAPİTAN', 'SOYUNMA ODASI'] },
  { name: 'Eren Soylu', rating: 83, position: 'STP', rarity: 'güçlü', tags: ['KAPİTAN', 'GÜÇLÜ', 'SOYUNMA ODASI'] },
  // SOYUNMA ODASI (artık 5): İbrahim Koç, Andrea Pirloni + Çağan, Eren + Murat
  { name: 'Murat Aksu', rating: 75, position: 'SÖB', rarity: 'iyi', tags: ['SOYUNMA ODASI', 'MENTOR'] },
  // SERBEST VURUŞ (artık 5): Fırat Güneş, Antoine Dubois, Pedro Alves + Sancar, Bora
  { name: 'Sancar Ok', rating: 79, position: 'OOS', rarity: 'iyi', tags: ['SERBEST VURUŞ', 'TEKNİK'] },
  { name: 'Bora Şahin', rating: 81, position: 'SF', rarity: 'güçlü', tags: ['SERBEST VURUŞ', 'PENALTI', 'FİNİŞÖR'] },
  // PENALTI (artık 5): Oğuz Demir, Pedro Alves, Mauro Bianchi + Bora + Kayra
  { name: 'Kayra Demir', rating: 74, position: 'OOS', rarity: 'iyi', tags: ['PENALTI', 'TEKNİK'] },
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

function proceduralTags(i: number, rating: number, position: Position): Tag[] {
  let state = hashMix(i, 13);
  const rng = () => {
    state = Math.imul(state ^ (state >>> 15), 0x2c1b3c6d);
    return (state >>> 0) / 0xffffffff;
  };
  return pickTagsForPosition(position, rating, rng, 2);
}

/** Mevkiye göre tematik lakaplar — prosedürel kartlara kimlik kazandırır (isim tekrarını kırar) */
const NICKNAMES_BY_ROLE: Partial<Record<Position, string[]>> = {
  KL: ['Wall', 'Kale', 'Duvar'],
  STP: ['Tank', 'Kaya', 'Duvar', 'Patron'],
  SLB: ['Roket', 'Express', 'Turbo'],
  SÖB: ['Roket', 'Express', 'Turbo'],
  DOS: ['Süpürge', 'Motor', 'Çelik'],
  OS: ['Maestro', 'Beyin', 'Usta'],
  OOS: ['Sihirbaz', 'Maestro', 'No.10'],
  SLK: ['Flash', 'Şimşek', 'Kasırga'],
  SÖK: ['Flash', 'Şimşek', 'Kasırga'],
  SF: ['Golcü', 'Avcı', 'Nişancı', 'Top'],
};

function pickNickname(i: number, pos: Position, rating: number): string | null {
  const pool = NICKNAMES_BY_ROLE[pos];
  if (!pool || !pool.length) return null;
  // Yüksek ratingli kartlara daha sık lakap (kimlik hissi); ortalama ~%30
  const chance = rating >= 82 ? 55 : rating >= 74 ? 35 : 22;
  if (hashMix(i, 71) % 100 >= chance) return null;
  return pool[hashMix(i, 89) % pool.length]!;
}

/**
 * Gerçek oyunculardan esinlenen, abartılmış "varyant" soyisimler — kimlik
 * hissi ve mizah katar (ör. Arda Güler → Güleroğulları). Üretici bazı kartlara
 * bunları atayarak isim çeşitliliğini artırır. Hiçbiri birebir gerçek isim değil.
 */
const VARIANT_LAST = [
  'Güleroğulları', 'Söyüncüoğlu', 'Çalhanlıoğlu', 'Yılmazcan', 'Demiralpaslan',
  'Kökçüoğlu', 'Ünderoğlu', 'Akgündüzhan', 'Tadıcıoğlu', 'Kabakçılar',
  'Yıldızhanlı', 'Aktürkoğlu', 'Kahveciler', 'Müldüroğlu', 'Özcanlar',
  'Sarıaslanoğlu', 'Bardakçıoğlu', 'Karaoğulları', 'Toprakhan', 'Şenoğulları',
  'Kadıoğulları', 'Yazıcıoğlu', 'Demirören', 'Kuyucuoğlu', 'Çakıroğulları',
  'Bayraktaroğlu', 'Şahinkaya', 'Yağmurdereli', 'Özbayraktar', 'Tosunzade',
  'Kılıçarslan', 'Erdoğdular', 'Güneşoğulları', 'Aydoğanlar', 'Karabulutoğlu',
];

function generateExtraPlayers(): PlayerCard[] {
  const first = [
    'Emre', 'Can', 'Burak', 'Deniz', 'Kaan', 'Arda', 'Oğuz', 'Selim', 'Mert', 'Tolga',
    'Barış', 'Efe', 'Hakan', 'Volkan', 'Umut', 'Furkan', 'Gökhan', 'Sinan', 'Levent', 'Tuncay',
    'Yusuf', 'Eren', 'Berke', 'Mehmet', 'Ali', 'Ahmet', 'Doruk', 'Çağrı', 'Onur', 'Kerem',
    'Atakan', 'Yiğit', 'Halil', 'İsmail', 'Bora', 'Cenk', 'Sarp', 'Tunç', 'Poyraz', 'Alperen',
    'Marco', 'Luca', 'Victor', 'James', 'Tyler', 'Diego', 'Carlos', 'Rafael', 'Bolt', 'Flash',
    'Nikolai', 'Sven', 'Amir', 'João', 'Pierre', 'Kenji', 'Omar', 'Felix', 'Ivan', 'Noah',
    'Mateo', 'Lucas', 'Hugo', 'Leon', 'Mads', 'Youssef', 'Dimitri', 'Andrés', 'Marek', 'Sergei',
    'Kai', 'Bruno', 'Aleksander', 'Giorgio', 'Tariq', 'Emeka', 'Hiro', 'Rúben', 'Mohammed', 'Stefan',
    'Berkay', 'Tunahan', 'Emircan', 'Kuzey', 'Ege', 'Demir', 'Yaman', 'Toprak', 'Aras', 'Kayra',
    'Mauro', 'Diogo', 'Nuno', 'Karim', 'Ousmane', 'Vinícius', 'Lautaro', 'Federico', 'Matthijs', 'Joško',
  ];
  const last = [
    'Yılmaz', 'Demir', 'Kaya', 'Acar', 'Koç', 'Şahin', 'Polat', 'Taş', 'Kurt', 'Aktaş',
    'Aydın', 'Çelik', 'Arslan', 'Doğan', 'Yıldız', 'Öztürk', 'Erdem', 'Bulut', 'Korkmaz', 'Güneş',
    'Silva', 'Costa', 'Brooks', 'Ramos', 'Mensah', 'Kane', 'Moretti', 'Fernández', 'Okonkwo', 'Adeyemi',
    'Novak', 'Larsen', 'Haddad', 'Santos', 'Dupont', 'Tanaka', 'Hassan', 'Müller', 'Petrov', 'Reed',
    'Vidović', 'Andersson', 'Lindholm', 'Bianchi', 'Conti', 'Nowak', 'Sørensen', 'Diallo', 'Traoré', 'Bekele',
    'Schmidt', 'Almeida', 'Pereira', 'Marchetti', 'Kovač', 'Vasilev', 'Nakamura', 'Park', 'Rahman', 'Oliveira',
    'Aydoğan', 'Şimşek', 'Yavuz', 'Aslantürk', 'Çakır', 'Toprak', 'Güler', 'Eren', 'Sönmez', 'Karadağ',
    'Mbappi', 'Haalund', 'Rodrigues', 'Bellinger', 'Sakaroğlu', 'Fodenli', 'Wirtsel', 'Musyala', 'Gündoğdu', 'Vinicius',
  ];
  const out: PlayerCard[] = [];
  const COUNT = 150;
  for (let i = 0; i < COUNT; i++) {
    const rating = ratingFromIndex(i);
    const pos = PROC_POSITIONS[i % PROC_POSITIONS.length]!;
    const fi = hashMix(i, 3) % first.length;
    // Bazı kartlara (≈%18) gerçek-oyuncu-varyantı soyisim ver; geri kalanı normal havuzdan
    const useVariant = hashMix(i, 31) % 100 < 18;
    const li = useVariant
      ? hashMix(i, 7) % VARIANT_LAST.length
      : (hashMix(i, 7) + Math.floor(i / first.length)) % last.length;
    const surname = useVariant ? VARIANT_LAST[li]! : last[li]!;
    const nick = pickNickname(i, pos, rating);
    let name = `${first[fi]} ${surname}`;
    if (nick) {
      name = `${first[fi]} "${nick}" ${surname}`;
    } else if (!useVariant && hashMix(i, 59) % 100 < 12) {
      name = `${name} ${String.fromCharCode(65 + (i % 26))}.`;
    }
    out.push(makePlayer({
      name,
      rating,
      position: pos,
      rarity: rarityFromRating(rating),
      tags: proceduralTags(i, rating, pos),
    }, `gen_${String(i + 1).padStart(3, '0')}`));
  }
  return out;
}

export const PLAYER_POOL: PlayerCard[] = [
  ...POOL.map((p, i) => makePlayer(p, `player_${String(i + 1).padStart(3, '0')}`)),
  ...generateExtraPlayers(),
];

const DAILY_START_SQUAD: PlayerTemplate[] = [
  { name: 'Cenk Arslan', rating: 62, position: 'KL', rarity: 'normal', tags: [] },
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
  if (template.tags.length && rng() <= 0.38) {
    return [template.tags[Math.floor(rng() * template.tags.length)]!];
  }
  return pickFreeStartTraitForPosition(template.position, rng);
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
    tags,
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
    const hasGk = squad.some((p) => p.position === 'KL');
    const available = pool.filter((p) => {
      if (usedNames.has(p.name)) return false;
      if (hasGk && p.position === 'KL') return false;
      return true;
    });
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

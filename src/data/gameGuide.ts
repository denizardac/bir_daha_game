import type { Position, Rarity } from '@/types';
import { POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';

export type GuideSectionId = 'genel' | 'oyuncular' | 'tagler' | 'taktikler' | 'sinerjiler' | 'olaylar';

export const GUIDE_SECTIONS: { id: GuideSectionId; label: string; icon: string }[] = [
  { id: 'genel', label: 'Genel Bakış', icon: '⚽' },
  { id: 'oyuncular', label: 'Oyuncular', icon: '👤' },
  { id: 'tagler', label: 'Tag\'ler', icon: '🏷️' },
  { id: 'taktikler', label: 'Taktikler', icon: '📋' },
  { id: 'sinerjiler', label: 'Sinerjiler', icon: '⚡' },
  { id: 'olaylar', label: 'Olaylar', icon: '🎭' },
];

export const GUIDE_OVERVIEW = [
  {
    title: 'Run yapısı',
    text: '15 round sürer. 7 oyuncuyla başlarsın, kart seçerek kadroyu 11\'e tamamlarsın. Kadro 6\'ya düşerse run biter.',
  },
  {
    title: 'Her round',
    text: '3 karttan birini seç → maç otomatik oynanır → galibiyet puan getirir, mağlubiyette en zayıf oyuncu gider.',
  },
  {
    title: 'Moral',
    text: 'Moral maç gücünü doğrudan etkiler. Düşük moralde performans düşer; olay kartları ve sinerjiler moral değiştirebilir.',
  },
  {
    title: 'Günlük seed',
    text: 'Günlük modda herkes aynı kart havuzunu görür — skorlar leaderboard\'da kıyaslanır. Serbest mod rastgele seed kullanır.',
  },
  {
    title: 'Taktik slotları',
    text: 'Formasyon ve oyun sistemi ayrı slotlardır. İkisi aynı anda aktif kalabilir; yeni taktik aynı kategoridekini değiştirir.',
  },
  {
    title: 'Skor',
    text: 'Gol, galibiyet, sinerji bonusları ve taktik etkileri toplam skoru oluşturur. Namağlup bitirirsen ekstra rozet kazanırsın.',
  },
];

export const GUIDE_PLAYER_RULES = [
  'Oyuncu kartı seçince kadroya eklenir — rating ve tag\'ler kalıcıdır.',
  'Kadro doluysa (11/11) en düşük rating\'li oyuncunun yerine geçer.',
  'Her oyuncunun bir mevkisi ve 1–2 tag\'i vardır; tag\'ler sinerji sayacına girer.',
  'Başlangıç kadrosundaki oyuncular "Başlangıç" rozeti taşır.',
];

export const GUIDE_POSITION_EXPLANATION =
  'Mevki oyuncunun rolünü gösterir. Kadroya eklersin; saha dizilişine tek tek yerleştirmezsin. Aynı mevkiden birden fazla oyuncu olabilir (ör. 3 stoper). Sol paneldeki diziliş önizlemesi, aktif formasyona göre otomatik yerleştirme gösterir — zorunluluk değil, rehberdir.';

export type GuidePositionZone = {
  id: 'kaleci' | 'savunma' | 'orta' | 'hucum';
  label: string;
  desc: string;
  positions: Position[];
};

export const GUIDE_POSITION_ZONES: GuidePositionZone[] = [
  {
    id: 'kaleci',
    label: 'Kaleci',
    desc: 'Tek kaleci slotu — genelde 1 oyuncu yeterli.',
    positions: ['KL'],
  },
  {
    id: 'savunma',
    label: 'Savunma',
    desc: 'Stoper ve bekler — DEMİR KALE sinerjisi için stoper sayısı önemli.',
    positions: ['STP', 'SLB', 'SÖB'],
  },
  {
    id: 'orta',
    label: 'Orta saha',
    desc: 'Defansif, merkez ve ofansif orta — ORTA DUVAR sinerjisi DOS + OOS ile açılır.',
    positions: ['DOS', 'OS', 'OOS'],
  },
  {
    id: 'hucum',
    label: 'Hücum',
    desc: 'Kanatlar ve santrafor — kanat + forvet FİNİŞÖR kombinasyonları güçlüdür.',
    positions: ['SLK', 'SÖK', 'SF'],
  },
];

export const GUIDE_RARITIES: { rarity: Rarity; label: string; desc: string }[] = [
  { rarity: 'normal', label: 'Normal', desc: 'Standart güç — erken round\'larda sık görülür.' },
  { rarity: 'iyi', label: 'İyi', desc: 'Ortalamanın üstü — dengeli seçim.' },
  { rarity: 'güçlü', label: 'Güçlü', desc: 'Yüksek rating — geç oyun için değerli.' },
  { rarity: 'efsane', label: 'Efsane', desc: 'Nadir ve güçlü — genelde özel tag\'lerle gelir.' },
];

export const GUIDE_POSITIONS: { pos: Position; zone: string }[] = [
  { pos: 'KL', zone: 'Kaleci' },
  { pos: 'STP', zone: 'Savunma' },
  { pos: 'SLB', zone: 'Savunma' },
  { pos: 'SÖB', zone: 'Savunma' },
  { pos: 'DOS', zone: 'Orta saha' },
  { pos: 'OS', zone: 'Orta saha' },
  { pos: 'OOS', zone: 'Orta saha' },
  { pos: 'SLK', zone: 'Hücum' },
  { pos: 'SÖK', zone: 'Hücum' },
  { pos: 'SF', zone: 'Hücum' },
];

export function formatGuidePosition(pos: Position) {
  return `${POSITION_BADGE[pos]} · ${POSITION_LABELS[pos]}`;
}

export const GUIDE_EVENT_INFO = {
  rounds: 'Round 4, 8, 11 ve 14\'te olay kartı gelir. İki seçenek sunulur; ikisi de geçerli sonuç verir.',
  categories: [
    { name: 'Transfer', desc: 'Oyuncu al/sat, genç yetenek, kadro değişimi' },
    { name: 'Taktik', desc: 'Formasyon baskısı, saha koşulları, sistem değişikliği' },
    { name: 'Moral', desc: 'Kaptan, soyunma odası, takım ruhu kararları' },
    { name: 'Özel', desc: 'Sürpriz bonuslar, efsane ziyaretleri, sezon olayları' },
  ],
};

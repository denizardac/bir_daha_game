import type { ActiveTactic, TacticCard } from '@/types';

export const TACTIC_CARDS: TacticCard[] = [
  { kind: 'tactic', id: 'tactic_433_kontr', name: '4-3-3 Geniş Oyun', category: 'formasyon', description: 'Kanatları ve forvet hattını öne çıkarır; arkada kontrollü risk bırakır.', effectSummary: 'Kanatlı hücum · açık alan riski' },
  { kind: 'tactic', id: 'tactic_442', name: '4-4-2 Klasik Denge', category: 'formasyon', description: 'Her kadroya uyan güvenli taban. Ne çok açılır ne de tamamen kapanır.', effectSummary: 'Güvenli denge · stabil başlangıç' },
  { kind: 'tactic', id: 'tactic_352', name: '3-5-2 Yoğun Baskı', category: 'formasyon', description: 'Merkezi kalabalık tutar, çift forvetle baskıyı artırır; kanat arkası risklidir.', effectSummary: 'Merkez baskısı · kanat riski' },
  { kind: 'tactic', id: 'tactic_532', name: '5-3-2 Savunma Bloku', category: 'formasyon', description: 'Zayıf kadroyu hayatta tutar. Gol bulmak zorlaşır ama savunma daha sağlamdır.', effectSummary: 'Derin blok · üretim düşer' },
  { kind: 'tactic', id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', category: 'formasyon', description: 'OOS ve merkez oyuncularını düzenli kullanır; iki yönlü ve dengeli bir yapı verir.', effectSummary: 'Modern denge · merkez bağlantısı' },
  { kind: 'tactic', id: 'tactic_343', name: '3-4-3 Tam Hücum', category: 'formasyon', description: 'En patlayıcı formasyon. Çok gol arar, savunmada ciddi boşluk bırakır.', effectSummary: 'Tam saldırı · ağır savunma riski' },
  { kind: 'tactic', id: 'tactic_diamond', name: '4-1-2-1-2 Elmas', category: 'formasyon', description: 'Merkez oyuncuları güçlü kadrolarda pas kanalı açar; kanat genişliği kadroya bağlıdır.', effectSummary: 'Merkez oyunu · kanatsız yapı' },
  { kind: 'tactic', id: 'tactic_4411', name: '4-4-1-1 İkinci Forvet', category: 'formasyon', description: 'Gölge forvetle hücumu destekler. Dengeli ama tamamen risksiz değildir.', effectSummary: 'İkinci forvet · kontrollü risk' },
  { kind: 'tactic', id: 'tactic_3412', name: '3-4-1-2 Çift Forvet', category: 'formasyon', description: 'İki forvet ve 10 numara ile agresif oynar; 3-4-3 kadar kontrolsüz değildir.', effectSummary: 'Çift forvet · agresif merkez' },
  { kind: 'tactic', id: 'tactic_451', name: '4-5-1 Yoğun Orta Saha', category: 'formasyon', description: 'Orta sahayı kilitler. Güvenli oynatır ama tek forvetle gol bulmak sabır ister.', effectSummary: 'Kalabalık merkez · güvenli oyun' },
  { kind: 'tactic', id: 'tactic_yuksek_blok', name: 'Yüksek Press', category: 'sistem', description: 'HIZLI veya SAVAŞÇI oyuncularla önde baskı kurar. Bu profil yoksa arkada boşluk verir.', effectSummary: 'Agresif baskı · profil ister' },
  { kind: 'tactic', id: 'tactic_topla_oyn', name: 'Topla Oynama', category: 'sistem', description: 'TEKNİK oyuncular skoru istikrarlı büyütür. Çok teknik kadro beraberliği bile değerli tutar.', effectSummary: 'Teknik pas ekonomisi' },
  { kind: 'tactic', id: 'tactic_direkt', name: 'Direkt Futbol', category: 'sistem', description: 'HIZLI oyuncularla hızlı çıkış arar. Yeterince hız varsa ilk darbeyi ödüllendirir.', effectSummary: 'Hızlı çıkış · ilk darbe' },
  { kind: 'tactic', id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', category: 'sistem', description: 'Geniş kadroyu diri tutar, düşüş yaşayan oyuncuları korur ve her maç moral taşır.', effectSummary: 'Geniş kadro · yorgunluk koruması' },
  { kind: 'tactic', id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', category: 'sistem', description: 'Tek santrafor FİNİŞÖR ise tüm hücum ona akar. Şart tutmazsa sistem kısırlaşır.', effectSummary: 'Bitirici santrafor şartı' },
  { kind: 'tactic', id: 'tactic_catenaccio', name: 'Alçak Blok (Catenaccio)', category: 'sistem', description: 'Kale kapatmaya oynar. Gol yemeden biten maçları ekstra değerli yapar.', effectSummary: 'Gol yememe planı · hücum kısılır' },
  { kind: 'tactic', id: 'tactic_gegenpress', name: 'Gegenpress', category: 'sistem', description: 'HIZLI oyuncular ve fiziksel presçilerle topu hemen geri ister. Kadro uymazsa savunma çizgisi kırılır.', effectSummary: 'Zor kombo · yüksek ödül' },
  { kind: 'tactic', id: 'tactic_tiki_taka', name: 'Tiki-Taka', category: 'sistem', description: 'TEKNİK oyuncularla pas ağı kurar. Çok teknik kadro galibiyetleri büyütür.', effectSummary: 'Teknik kontrol · geçiş riski' },
  { kind: 'tactic', id: 'tactic_park_bus', name: 'Otobüsü Çek (Park the Bus)', category: 'sistem', description: 'Zayıf kadroyu maçta tutar. Hücum azalır ama gol yememek büyük ödül getirir.', effectSummary: 'Tam kapanma · temiz maç avı' },
  { kind: 'tactic', id: 'tactic_kanat_bindirme', name: 'Kanat Bindirmesi', category: 'sistem', description: 'HIZLI bek ve kanatlar bindirirse skor üretir. Kanat profili yoksa arkada açık verir.', effectSummary: 'Hızlı kanat/bek planı' },
];

const TACTIC_EFFECTS: Record<string, ActiveTactic> = {
  tactic_433_kontr: { id: 'tactic_433_kontr', name: '4-3-3 Geniş Oyun', description: 'Kanatlı hücum, arkada kontrollü risk', attackMod: 9, defenseMod: -4 },
  tactic_442: { id: 'tactic_442', name: '4-4-2 Klasik Denge', description: 'Güvenli ve stabil başlangıç', attackMod: 3, defenseMod: 3 },
  tactic_352: { id: 'tactic_352', name: '3-5-2 Yoğun Baskı', description: 'Merkez baskısı, kanat riski', attackMod: 13, defenseMod: -8 },
  tactic_532: { id: 'tactic_532', name: '5-3-2 Savunma Bloku', description: 'Derin blok, düşük üretim', defenseMod: 18, attackMod: -13 },
  tactic_4231: { id: 'tactic_4231', name: '4-2-3-1 Modern Oyun', description: 'Dengeli merkez bağlantısı', attackMod: 6, defenseMod: 2 },
  tactic_343: { id: 'tactic_343', name: '3-4-3 Tam Hücum', description: 'En patlayıcı hücum, ağır savunma riski', attackMod: 22, defenseMod: -18 },
  tactic_diamond: { id: 'tactic_diamond', name: '4-1-2-1-2 Elmas', description: 'Merkez oyunu, kanatsız yapı', attackMod: 7, defenseMod: 1 },
  tactic_4411: { id: 'tactic_4411', name: '4-4-1-1 İkinci Forvet', description: 'Kontrollü hücum riski', attackMod: 8, defenseMod: -3 },
  tactic_3412: { id: 'tactic_3412', name: '3-4-1-2 Çift Forvet', description: 'Agresif merkez hücumu', attackMod: 15, defenseMod: -11 },
  tactic_451: { id: 'tactic_451', name: '4-5-1 Yoğun Orta Saha', description: 'Kalabalık merkez, güvenli oyun', defenseMod: 15, attackMod: -10 },
  tactic_yuksek_blok: { id: 'tactic_yuksek_blok', name: 'Yüksek Press', description: 'Agresif baskı, profil ister', perWinBonus: 180, perGoalBonus: 30 },
  tactic_topla_oyn: { id: 'tactic_topla_oyn', name: 'Topla Oynama', description: 'Teknik pas ekonomisi', technicalBonus: 14, drawBonus: 120 },
  tactic_direkt: { id: 'tactic_direkt', name: 'Direkt Futbol', description: 'Hızlı çıkış ve ilk darbe', fastBonus: 15, firstGoalBonus: 150 },
  tactic_rotasyon: { id: 'tactic_rotasyon', name: 'Kadro Rotasyonu', description: 'Yorgunluk koruması ve geniş kadro', moralePerMatch: 3, squadSizeBonus: 80, squadSizeThreshold: 10 },
  tactic_tekli_forvet: { id: 'tactic_tekli_forvet', name: 'Tek Forvet Sistemi', description: 'Bitirici santrafor şartı', perGoalBonus: 60 },
  tactic_catenaccio: { id: 'tactic_catenaccio', name: 'Alçak Blok (Catenaccio)', description: 'Gol yememe planı', attackMod: -6, cleanSheetWinBonus: 220, cleanSheetDrawBonus: 100 },
  tactic_gegenpress: { id: 'tactic_gegenpress', name: 'Gegenpress', description: 'Zor pres kombosu', perGoalBonus: 45 },
  tactic_tiki_taka: { id: 'tactic_tiki_taka', name: 'Tiki-Taka', description: 'Teknik kontrol, geçiş riski', technicalBonus: 16, defenseMod: -4, perWinBonus: 250 },
  tactic_park_bus: { id: 'tactic_park_bus', name: 'Otobüsü Çek (Park the Bus)', description: 'Tam kapanma, temiz maç avı', defenseMod: 10, attackMod: -12, cleanSheetWinBonus: 260, cleanSheetDrawBonus: 120 },
  tactic_kanat_bindirme: { id: 'tactic_kanat_bindirme', name: 'Kanat Bindirmesi', description: 'Hızlı kanat ve bek planı', fastBonus: 18 },
};

export function getTacticEffect(id: string): ActiveTactic {
  return TACTIC_EFFECTS[id] ?? { id, name: 'Taktik', description: '' };
}

export function getTacticCard(id: string): TacticCard | undefined {
  return TACTIC_CARDS.find((t) => t.id === id);
}

export function getTacticCategory(id: string): 'formasyon' | 'sistem' | null {
  return getTacticCard(id)?.category ?? null;
}

export function cloneTactic(card: TacticCard): TacticCard {
  return { ...card };
}

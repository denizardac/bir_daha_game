export type Position = 'KL' | 'STP' | 'SLB' | 'SÖB' | 'DOS' | 'OS' | 'SLK' | 'SÖK' | 'OOS' | 'SF';

export type Rarity = 'normal' | 'iyi' | 'güçlü' | 'efsane';

export type Tag =
  | 'HIZLI'
  | 'GÜÇLÜ'
  | 'DAYANIKLI'
  | 'KISA'
  | 'UZUN'
  | 'TEKNİK'
  | 'FİNİŞÖR'
  | 'ASİSTÇİ'
  | 'SERBEST VURUŞ'
  | 'PENALTI'
  | 'LİDER'
  | 'MENTOR'
  | 'KAPİTAN'
  | 'SAVAŞÇI'
  | 'SOĞUKKANLI'
  | 'YERLİ'
  | 'YABANCI YILDIZ'
  | 'SOYUNMA ODASI'
  | 'TARTIŞMALI'
  | 'POTANSİYEL'
  | 'PİK DÖNEM'
  | 'GERİLEYEN'
  | 'YENİ SEZON'
  | 'SAKATLIK RİSKİ'
  | 'KIRMIZI KART'
  | 'PERFORMANS DÜŞÜŞÜ';

export type CardKind = 'player' | 'tactic';

export type GamePhase = 'cardSelect' | 'match' | 'event' | 'loss' | 'runEnd';

export type Screen = 'menu' | 'game' | 'synergies' | 'leaderboard' | 'hallOfFame' | 'settings' | 'gameGuide' | 'collection';

export type MatchOutcome = 'win' | 'draw' | 'loss';

export type OpponentStyle = 'saldırgan' | 'dengeli' | 'savunmacı';

export interface PlayerCard {
  kind: 'player';
  id: string;
  name: string;
  rating: number;
  currentRating: number;
  position: Position;
  /** Boş dizi = yalnızca ana mevki; tanımsız = pozisyon varsayılan flex listesi */
  flexPositions?: Position[];
  rarity: Rarity;
  tags: Tag[];
  potentialCeiling?: number;
  matchesPlayed?: number;
  warriorProtected?: boolean;
  isStarter?: boolean;
  /** Olay / maç sonrası geçici rating düşüşü (bir sonraki maç) */
  tempRatingMod?: number;
  /** Sessiz teklif yükseltmesi — oyuncu kartında gösterilir */
  offerBoosted?: boolean;
  /** İkonik imza kartı — özel portre rengi, alıntı, koleksiyon hedefi */
  signature?: boolean;
  /** İmza kartı portre/rozet rengi (CSS rengi) */
  signatureColor?: string;
  /** İmza kartının özel sözü (kart detayında gösterilir) */
  signatureQuote?: string;
}

export interface TacticCard {
  kind: 'tactic';
  id: string;
  name: string;
  category: 'formasyon' | 'sistem';
  description: string;
  effectSummary: string;
}

export interface TrainingCard {
  kind: 'training';
  id: string;
  name: string;
  description: string;
  offeredTags: Tag[];
}

export interface SkipCard {
  kind: 'skip';
  id: string;
  name: string;
  description: string;
}

/** Olay kartı kararının roundHistory'de temsili (skor doğrulaması için) */
export interface EventResultCard {
  kind: 'event';
  id: string;
  name: string;
  description: string;
}

export type GameCard = PlayerCard | TacticCard | TrainingCard | SkipCard | EventResultCard;

export type MatchEventType =
  | 'goal_for'
  | 'goal_against'
  | 'yellow_for'
  | 'red_for'
  | 'yellow_against';

export interface MatchEvent {
  minute: number;
  type: MatchEventType;
  playerName: string;
  assistName?: string;
}

export interface ActiveTactic {
  id: string;
  name: string;
  description: string;
  attackMod?: number;
  defenseMod?: number;
  fastBonus?: number;
  technicalBonus?: number;
  moralePerMatch?: number;
}

export interface EventChoice {
  label: string;
  description: string;
}

export interface EventCard {
  id: string;
  category: 'transfer' | 'taktik' | 'moral' | 'fiziksel' | 'ozel';
  icon: string;
  title: string;
  description: string;
  optionA: EventChoice;
  optionB: EventChoice;
}

export interface OpponentProfile {
  name: string;
  rating: number;
  style: OpponentStyle;
}

export interface MatchHighlight {
  text: string;
  points: number;
}

export interface MatchResult {
  outcome: MatchOutcome;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheet: boolean;
  opponent: OpponentProfile;
  highlights: MatchHighlight[];
  activeSynergies: string[];
  newlyDiscoveredSynergies: string[];
  roundPoints: number;
  wowMoment?: string;
  events: MatchEvent[];
}

export interface RoundResult {
  round: number;
  cardsShown: GameCard[];
  cardSelected: GameCard;
  matchResult: MatchResult | null;
  pointsEarned: number;
  eventChoice?: 'A' | 'B';
  isTacticBonus?: boolean;
  /** Bu girdi bir olay kararına ait (maç değil) — round sayımından hariç tutulur */
  isEvent?: boolean;
}

export interface SynergyProgress {
  current: number;
  required: number;
  icon: string;
  /** Ek koşul ipucu (ör. "moral 80 gerekiyor", "0 yerli gerekiyor") */
  note?: string;
}

export interface SynergyDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  hidden: boolean;
  check: (squad: PlayerCard[], morale: number, ctx?: MatchContext) => boolean;
  getProgress?: (squad: PlayerCard[], candidate?: PlayerCard) => SynergyProgress | null;
  perGoalBonus?: number;
  perWinBonus?: number;
  perRoundBonus?: number;
  perMatchMorale?: number;
  cleanSheetDefenseBonus?: number;
  scoreMultiplier?: number;
  goalMultiplier?: number;
  ratingMultiplier?: number;
  minMorale?: number;
}

export interface MatchContext {
  activeTactics: ActiveTactic[];
  behindInMatch?: boolean;
}

export interface EgoBestDecision {
  round: number;
  cardName: string;
  rarePercent: number;
  pointsGained: number;
  synergyActivated?: string;
}

export interface EgoWorstMistake {
  round: number;
  description: string;
  pointsLost: number;
}

export interface RunEndAnalysis {
  rank: number;
  totalPlayers: number;
  rankPercent: number;
  bestDecision: EgoBestDecision | null;
  worstMistake: EgoWorstMistake | null;
  synergyStats: Array<{ id: string; name: string; icon: string; activations: number; points: number }>;
  nearRivalBefore?: { name: string; score: number; gap: number };
  nearRivalAfter?: { name: string; score: number; gap: number };
  badges: string[];
}

export interface GameState {
  seed: string;
  isDailySeed: boolean;
  round: number;
  maxRounds: number;
  squad: PlayerCard[];
  maxSquadSize: number;
  morale: number;
  score: number;
  streak: number;
  phase: GamePhase;
  roundHistory: RoundResult[];
  currentOffers: GameCard[];
  currentMatch: MatchResult | null;
  currentEvent: EventCard | null;
  activeTactics: ActiveTactic[];
  lastLossPlayer: PlayerCard | null;
  discoveredSynergies: string[];
  lossesCount: number;
  dangerMode: boolean;
  isFirstRun: boolean;
  timerSeconds: number;
  eventResolvedThisRound: boolean;
  flawless: boolean;
  runEndAnalysis: RunEndAnalysis | null;
  extraDrawUsed: boolean;
  extraDrawAvailable: boolean;
  rerollsRemaining: number;
  /** Bu round'da kaç kez reroll yapıldı — seed çeşitliliği için */
  offersRerollIndex: number;
  recoveryGuaranteed: boolean;
  displayName: string;
  /**
   * Manuel ilk 11 override'ı: formasyon slot index'i → oyuncu id.
   * Boş = saf otomatik yerleşim (varsayılan davranış). Pin'lenen oyuncular
   * o slota sabitlenir; kalan slotlar otomatik doldurulur. Formasyon değişince
   * veya oyuncu kadrodan çıkınca ilgili pin'ler temizlenir (reconcile).
   */
  manualLineup: Record<number, string>;
}

export interface LeaderboardEntry {
  id: string;
  seed: string;
  displayName: string;
  totalScore: number;
  roundsCompleted: number;
  timestamp: number;
  flawless?: boolean;
  weekKey?: string;
  /** İstemci tarafı bütünlük özeti (sunucu doğrulaması için hazırlık) */
  integrityDigest?: string;
}

export interface HallOfFameEntry {
  id: string;
  displayName: string;
  totalScore: number;
  roundsCompleted: number;
  flawless: boolean;
  timestamp: number;
  monthKey: string;
}

export interface PersistedData {
  anonymousId: string;
  /** Son run'da kullanılan isim — yeni run modalında öneri olarak gösterilir */
  lastPlayerName: string;
  currentRun: Partial<GameState> | null;
  todayScore: number;
  todaySeed: string;
  discoveredSynergies: string[];
  synergyFirstDiscovery: Record<string, number>;
  allTimeBest: number;
  isFirstRun: boolean;
  dailyLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  allTimeLeaderboard: LeaderboardEntry[];
  flawlessLeaderboard: LeaderboardEntry[];
  dailyStreak: number;
  lastPlayedDate: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  cardTimerEnabled: boolean;
  tutorialCompleted: boolean;
  totalRuns: number;
  seasonKey: string;
  hallOfFame: HallOfFameEntry[];
  seasonArchive: Record<string, HallOfFameEntry[]>;
  /** Koleksiyon: hiç görülmüş olay id'leri */
  seenEvents: string[];
  /** Koleksiyon: hiç kadroya katılmış efsane kart isimleri */
  collectedLegends: string[];
}

export const RARITY_COLORS: Record<Rarity, string> = {
  normal: '#6b7280',
  iyi: '#e5e7eb',
  güçlü: '#fbbf24',
  efsane: '#ef4444',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  normal: 'Normal',
  iyi: 'İyi',
  güçlü: 'Güçlü',
  efsane: 'Efsane',
};

export function isPlayerCard(card: GameCard): card is PlayerCard {
  return card.kind === 'player';
}

export function isTacticCard(card: GameCard): card is TacticCard {
  return card.kind === 'tactic';
}

export function isTrainingCard(card: GameCard): card is TrainingCard {
  return card.kind === 'training';
}

export function isSkipCard(card: GameCard): card is SkipCard {
  return card.kind === 'skip';
}

export function isEventCard(card: GameCard): card is EventResultCard {
  return card.kind === 'event';
}

import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Circle,
  CircleDot,
  CircleHelp,
  ClipboardList,
  Crown,
  Dice5,
  Dumbbell,
  Flame,
  Globe2,
  Handshake,
  Heart,
  HeartCrack,
  Home,
  Info,
  Landmark,
  Leaf,
  MapPin,
  Medal,
  Mic2,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Star,
  Sword,
  Tags,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type GameIconName =
  | 'activity'
  | 'archive'
  | 'arrow-left'
  | 'arrow-right'
  | 'ball'
  | 'book'
  | 'chart'
  | 'crown'
  | 'dice'
  | 'flame'
  | 'globe'
  | 'handshake'
  | 'heart'
  | 'heart-crack'
  | 'help'
  | 'home'
  | 'info'
  | 'landmark'
  | 'leaf'
  | 'map-pin'
  | 'medal'
  | 'mic'
  | 'play'
  | 'refresh'
  | 'settings'
  | 'shield'
  | 'sparkles'
  | 'star'
  | 'sword'
  | 'tags'
  | 'tactic'
  | 'target'
  | 'training'
  | 'trend-down'
  | 'trend-up'
  | 'trophy'
  | 'users'
  | 'zap';

const iconMap: Record<GameIconName, LucideIcon> = {
  activity: Activity,
  archive: Archive,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  ball: CircleDot,
  book: BookOpen,
  chart: BarChart3,
  crown: Crown,
  dice: Dice5,
  flame: Flame,
  globe: Globe2,
  handshake: Handshake,
  heart: Heart,
  'heart-crack': HeartCrack,
  help: CircleHelp,
  home: Home,
  info: Info,
  landmark: Landmark,
  leaf: Leaf,
  'map-pin': MapPin,
  medal: Medal,
  mic: Mic2,
  play: Play,
  refresh: RefreshCw,
  settings: Settings,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  sword: Sword,
  tags: Tags,
  tactic: ClipboardList,
  target: Target,
  training: Dumbbell,
  'trend-down': TrendingDown,
  'trend-up': TrendingUp,
  trophy: Trophy,
  users: Users,
  zap: Zap,
};

const legacyIconMap: Record<string, GameIconName> = {
  '⚽': 'ball',
  '🏆': 'trophy',
  '🌍': 'globe',
  '🔥': 'flame',
  '🎲': 'dice',
  '📖': 'book',
  '🗃️': 'archive',
  '🏛️': 'landmark',
  '⚡': 'zap',
  '⚙️': 'settings',
  '❤️': 'heart',
  '💔': 'heart-crack',
  '🏋️': 'training',
  '🏋️‍♂️': 'training',
  '🔄': 'refresh',
  '🏷️': 'tags',
  '📋': 'tactic',
  '🎭': 'sparkles',
  '📍': 'map-pin',
  '🛡️': 'shield',
  '🎯': 'target',
  '🤝': 'handshake',
  '👑': 'crown',
  '🏠': 'home',
  '🎤': 'mic',
  '📈': 'trend-up',
  '📉': 'trend-down',
  '🌱': 'leaf',
  '⭐': 'star',
  '✨': 'sparkles',
  '💪': 'activity',
  '⚔️': 'sword',
  '🎖️': 'medal',
  '💡': 'info',
  '🔟': 'target',
};

function resolveIcon(name?: GameIconName, legacyIcon?: string) {
  if (name) return iconMap[name];
  if (legacyIcon && legacyIconMap[legacyIcon]) return iconMap[legacyIconMap[legacyIcon]];
  return Circle;
}

export function GameIcon({
  name,
  legacyIcon,
  className = '',
  size = 18,
  strokeWidth = 2.2,
  'aria-hidden': ariaHidden = true,
}: {
  name?: GameIconName;
  legacyIcon?: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  'aria-hidden'?: boolean;
}) {
  const Icon = resolveIcon(name, legacyIcon);
  return <Icon className={`game-icon ${className}`} size={size} strokeWidth={strokeWidth} aria-hidden={ariaHidden} />;
}

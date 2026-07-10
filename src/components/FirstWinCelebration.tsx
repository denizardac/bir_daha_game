import { motion } from 'framer-motion';
import { UiIcon } from '@/components/UiIcon';

interface Props {
  compact?: boolean;
}

export function FirstWinCelebration({ compact }: Props) {
  if (compact) {
    return (
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="match-bonus-chip match-bonus-chip--gold"
      >
        <UiIcon name="trophy" /> İlk galibiyet +200
      </motion.span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      className="first-win-celebration"
      aria-live="polite"
    >
      <motion.span
        className="first-win-celebration-icon"
        animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
        transition={{ duration: 0.8, repeat: 2 }}
      >
        <UiIcon name="trophy" />
      </motion.span>
      <p className="first-win-celebration-title">İLK GALİBİYET!</p>
      <p className="first-win-celebration-sub">+200 puan bonus · Moral +10</p>
      <div className="first-win-confetti" aria-hidden>
        {(['circle-dot', 'sparkles', 'star', 'medal', 'circle-dot'] as const).map((c, i) => (
          <motion.span
            key={i}
            className="first-win-confetti-piece"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-20, -60], x: (i - 2) * 28 }}
            transition={{ duration: 1.2, delay: i * 0.08 }}
          >
            <UiIcon name={c} />
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

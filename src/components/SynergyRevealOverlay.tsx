import { motion, AnimatePresence } from 'framer-motion';
import { getSynergyById } from '@/data/synergies';
import { getSynergyBenefitText } from '@/engine/squadInsights';
import { useGameStore } from '@/store/gameStore';
import { UiIcon } from '@/components/UiIcon';
import { iconForSynergy } from '@/utils/gameIcons';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

const SPARKLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: 10 + (i * 7) % 80,
  delay: i * 0.08,
}));

export function SynergyRevealOverlay() {
  const ids = useGameStore((s) => s.pendingSynergyReveal);
  const dismiss = useGameStore((s) => s.dismissSynergyReveal);
  useBodyScrollLock(ids.length > 0);

  if (!ids.length) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="synergy-reveal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label="Yeni sinerji keşfedildi"
      >
        <div className="synergy-reveal-burst" aria-hidden>
          {SPARKLES.map((s) => (
            <motion.span
              key={s.id}
              className="synergy-reveal-sparkle"
              style={{ left: `${s.x}%` }}
              initial={{ opacity: 0, y: 40, scale: 0.2 }}
              animate={{ opacity: [0, 1, 0], y: -120, scale: [0.2, 1.2, 0.4] }}
              transition={{ duration: 1.4, delay: s.delay, ease: 'easeOut' }}
            />
          ))}
        </div>
        <motion.div
          className="synergy-reveal-card"
          initial={{ scale: 0.7, y: 40, opacity: 0, rotate: -2 }}
          animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <motion.p
            className="synergy-reveal-kicker"
            initial={{ letterSpacing: '0.4em', opacity: 0 }}
            animate={{ letterSpacing: '0.12em', opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <UiIcon name="sparkles" /> Sinerji açıldı
          </motion.p>
          {ids.map((id, idx) => {
            const synergy = getSynergyById(id);
            if (!synergy) return null;
            return (
              <motion.div
                key={id}
                className="synergy-reveal-item"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.12 }}
              >
                <motion.span
                  className="synergy-reveal-icon"
                  aria-hidden
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 6, -4, 0] }}
                  transition={{ duration: 0.9, delay: 0.2 }}
                >
                  <UiIcon name={iconForSynergy(synergy.icon)} />
                </motion.span>
                <div>
                  <p className="synergy-reveal-name">{synergy.name}</p>
                  <p className="synergy-reveal-why">Neden: {synergy.description}</p>
                  <p className="synergy-reveal-desc">{getSynergyBenefitText(synergy)}</p>
                  <p className="synergy-reveal-reward">Keşif bonusu · +200 puan</p>
                </div>
              </motion.div>
            );
          })}
          <button type="button" className="btn-primary synergy-reveal-btn" onClick={dismiss}>
            Harika — devam
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

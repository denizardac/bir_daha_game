import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { savePartial, loadPersisted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const STEPS = [
  {
    id: 'pick',
    round: 1,
    phase: 'cardSelect' as const,
    title: 'Kart seç, maç oynanır',
    body: '3 oyuncu teklifinden birini seç. Seçimden sonra maç otomatik oynanır; galibiyet puan, mağlubiyet oyuncu kaybı demek.',
    highlight: 'Ortadaki 3 karttan birine dokun.',
  },
  {
    id: 'synergy',
    round: 2,
    phase: 'cardSelect' as const,
    title: 'Tag\'ler sinerji açar',
    body: 'Aynı nitelikler (HIZLI, TEKNİK…) bir araya gelince sağ panelde sinerji ilerlemesi görünür. Tamamlanınca maç bonusu alırsın.',
    highlight: 'Sağ paneldeki sinerji çubuklarını izle.',
  },
  {
    id: 'event',
    round: 4,
    phase: 'event' as const,
    title: 'Olay kartı — iki seçenek',
    body: 'Round 4, 8, 11 ve 14\'te olay gelir. İkisi de geçerli; kadro ve moraline göre seç. Maç oynanmaz.',
    highlight: 'A veya B seçeneğine tıkla.',
  },
];

export function TutorialCoach() {
  const round = useGameStore((s) => s.round);
  const phase = useGameStore((s) => s.phase);
  const isFirstRun = useGameStore((s) => s.isFirstRun);
  const persisted = loadPersisted();
  const [dismissedSteps, setDismissedSteps] = useState<Set<string>>(() => new Set());
  const modalRef = useRef<HTMLDivElement>(null);

  const step = STEPS.find((s) => s.round === round && s.phase === phase);
  const visible = isFirstRun && !persisted.tutorialCompleted && !!step && !dismissedSteps.has(step.id);

  const dismiss = () => {
    if (!step) return;
    setDismissedSteps((prev) => new Set(prev).add(step.id));
    if (round >= 4) savePartial({ tutorialCompleted: true, isFirstRun: false });
  };

  useFocusTrap(modalRef, visible, dismiss);

  if (!visible || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="tutorial-coach-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={dismiss}
        aria-hidden
      />
      <motion.div
        ref={modalRef}
        className="tutorial-coach"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12 }}
        role="dialog"
        aria-modal="true"
        aria-label="Öğretici"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tutorial-coach-glow" aria-hidden />
        <p className="tutorial-coach-kicker">Round {round} · İpucu</p>
        <p className="tutorial-coach-title">{step.title}</p>
        <p className="tutorial-coach-body">{step.body}</p>
        <p className="tutorial-coach-highlight">
          <span className="tutorial-coach-highlight-dot" aria-hidden />
          {step.highlight}
        </p>
        <button type="button" className="tutorial-coach-btn" onClick={dismiss}>
          {round >= 4 ? 'Anladım' : 'Devam'}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

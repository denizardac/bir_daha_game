import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { savePartial, loadPersisted } from '@/utils/storage';
import { useGameStore } from '@/store/gameStore';
import { UiIcon } from '@/components/UiIcon';

type TutorialStep = {
  id: string;
  phase: 'cardSelect' | 'match' | 'event';
  round?: number;
  minRound?: number;
  target?: string;
  title: string;
  body: string;
  highlight: string;
  final?: boolean;
  when?: (state: ReturnType<typeof useGameStore.getState>) => boolean;
};

type Rect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

const STEPS: TutorialStep[] = [
  {
    id: 'lineup',
    round: 1,
    phase: 'cardSelect',
    target: 'lineup',
    title: 'Kadro 7 kişiyle başlar',
    body: 'İlk 11 paneli sahaya kimlerin çıktığını gösterir. Boş slotlar zamanla dolacak; takımın 11 kişiye yaklaştıkça daha güçlü oynar.',
    highlight: 'Maç kaybedersen kadrodan bir oyuncu ayrılır. Yeni katılan oyuncu ilk maçında kaybedersen hemen gitmez; bir maç koruması vardır.',
  },
  {
    id: 'pick-mode',
    round: 1,
    phase: 'cardSelect',
    target: 'pick-mode',
    title: 'Bu turda iki yol var',
    body: 'Oyuncu Kartı yeni bir aday alır ve maça götürür. Antrenman ise kadrodaki bir oyuncuya kalıcı tag kazandırır.',
    highlight: 'Oyuncu seçmek kadroyu büyütür; antrenman sinerji açmak ve eksik tag tamamlamak için kullanılır.',
  },
  {
    id: 'cards',
    round: 1,
    phase: 'cardSelect',
    target: 'cards',
    title: 'Kartı seç, dizilişi kontrol et',
    body: 'Kartlardaki özet, oyuncunun kadroya ne kattığını gösterir. Seçtikten sonra İlk 11 editörü açılır; maçı onaylamadan önce dizilişi kontrol edebilirsin.',
    highlight: 'Tagler sinerjileri açar. Yakın sinerji varsa aynı tagi tamamlayan oyuncu çoğu zaman en değerli seçimdir.',
  },
  {
    id: 'training',
    minRound: 1,
    phase: 'cardSelect',
    target: 'pick-mode',
    title: 'Antrenman yeni oyuncu değildir',
    body: 'Antrenmanda önce kadrodan bir oyuncu, sonra eklenecek tag seçilir. Bu seçim oyuncuyu kalıcı geliştirir.',
    highlight: 'Eksik bir TEKNİK, DAYANIKLI veya HIZLI tagi bazen yeni oyuncudan daha çok sinerji açabilir.',
    when: (state) => Boolean(state.trainingFlow),
  },
  {
    id: 'match',
    round: 2,
    phase: 'match',
    title: 'Maç sonucu ne değiştirdi?',
    body: 'Maç bitince skor, moral değişimi, kazandığın puan ve sıradaki adım görünür.',
    highlight: 'Galibiyet puan ve moral getirir. Mağlubiyet puan vermez, moral düşürür ve bir oyuncu ayrılır.',
  },
  {
    id: 'event',
    round: 4,
    phase: 'event',
    title: 'Olay kartı: iki seçenek',
    body: 'Round 4, 8, 11 ve 14 olay roundudur. Maç oynanmaz; kadro, moral veya skor üzerinde karar verirsin.',
    highlight: 'İki seçenek de geçerli olabilir. Riskli seçim daha yüksek ödül ya da daha sert bedel getirebilir.',
    final: true,
  },
];

function matchesStep(step: TutorialStep, state: ReturnType<typeof useGameStore.getState>): boolean {
  if (step.phase !== state.phase) return false;
  if (step.round !== undefined && step.round !== state.round) return false;
  if (step.minRound !== undefined && state.round < step.minRound) return false;
  if (step.when && !step.when(state)) return false;
  return true;
}

function getTooltipStyle(rect: Rect | null): CSSProperties {
  if (!rect) return {};
  const gap = 14;
  const width = Math.min(390, window.innerWidth - 24);
  const canUseSide = window.innerWidth >= 820;
  let left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left));
  let top = Math.min(window.innerHeight - 220, rect.top + rect.height + gap);

  if (canUseSide) {
    const rightSpace = window.innerWidth - (rect.left + rect.width);
    const useRight = rightSpace >= width + gap;
    left = useRight ? rect.left + rect.width + gap : Math.max(12, rect.left - width - gap);
    top = Math.max(12, Math.min(window.innerHeight - 240, rect.top + rect.height / 2 - 110));
  }

  return { left, top, width };
}

function getHighlightStyle(rect: Rect | null): CSSProperties {
  if (!rect) return { display: 'none' };
  return {
    left: Math.max(8, rect.left - 6),
    top: Math.max(8, rect.top - 6),
    width: Math.min(window.innerWidth - 16, rect.width + 12),
    height: rect.height + 12,
  };
}

export function TutorialCoach() {
  const state = useGameStore();
  const persisted = loadPersisted();
  const [dismissedSteps, setDismissedSteps] = useState<Set<string>>(() => new Set());
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const step = STEPS.find((candidate) => matchesStep(candidate, state) && !dismissedSteps.has(candidate.id));
  const visible = state.isFirstRun && !persisted.tutorialCompleted && Boolean(step);

  useEffect(() => {
    if (!visible || !step?.target) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector<HTMLElement>(`[data-tutorial-target="${step.target}"]`);
      if (!el) {
        setTargetRect(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setTargetRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    };

    updateRect();
    const raf = window.requestAnimationFrame(updateRect);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [visible, step?.target]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skipAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  const dismiss = () => {
    if (!step) return;
    setDismissedSteps((prev) => new Set(prev).add(step.id));
    if (step.final) savePartial({ tutorialCompleted: true, isFirstRun: false });
  };

  const skipAll = () => {
    savePartial({ tutorialCompleted: true, isFirstRun: false });
    setDismissedSteps(new Set(STEPS.map((s) => s.id)));
  };

  if (!visible || !step) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="tutorial-coach-highlight-ring"
        style={getHighlightStyle(targetRect)}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: targetRect ? 1 : 0, scale: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden
      />
      <motion.div
        ref={bubbleRef}
        className={`tutorial-coach ${targetRect ? 'tutorial-coach--anchored' : ''}`}
        style={getTooltipStyle(targetRect)}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        role="dialog"
        aria-label="Öğretici"
      >
        <div className="tutorial-coach-glow" aria-hidden />
        <div className="tutorial-coach-head">
          <p className="tutorial-coach-kicker">Round {state.round} · İpucu</p>
          <button type="button" className="tutorial-coach-skip" onClick={skipAll}>
            Tümünü geç
          </button>
        </div>
        <p className="tutorial-coach-title">{step.title}</p>
        <p className="tutorial-coach-body">{step.body}</p>
        <p className="tutorial-coach-highlight">
          <UiIcon name="sparkles" className="tutorial-coach-highlight-icon" />
          {step.highlight}
        </p>
        <button type="button" className="tutorial-coach-btn" onClick={dismiss}>
          {step.final ? 'Anladım' : 'Devam'}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

import { AnimatePresence, motion } from 'framer-motion';
import type { Milestone } from '@/engine/milestones';
import { useGameStore } from '@/store/gameStore';

const EPIC_IDS = new Set(['ilk_galibiyet', 'serit_5', 'namaglup', 'dayanma']);

export function MilestoneToastStack() {
  const milestones = useGameStore((s) => s.pendingMilestones);
  const dismissMilestone = useGameStore((s) => s.dismissMilestone);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {milestones.map((m) => (
          <MilestoneToast key={m.id} milestone={m} onDone={() => dismissMilestone(m.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function MilestoneToast({ milestone, onDone }: { milestone: Milestone; onDone: () => void }) {
  const epic = EPIC_IDS.has(milestone.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: -32, scale: 0.85 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: epic ? [0.85, 1.08, 1] : 1,
      }}
      exit={{ opacity: 0, y: -16, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: epic ? 320 : 400, damping: epic ? 22 : 28 }}
      onAnimationComplete={() => setTimeout(onDone, epic ? 4200 : 3200)}
      className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-xl ${
        epic
          ? 'milestone-toast--epic gold-glow border-amber-300/70 bg-gradient-to-r from-amber-950/95 to-neutral-950/95'
          : 'border-amber-400/60 bg-neutral-950/95'
      }`}
    >
      <motion.span
        className="text-3xl"
        animate={epic ? { scale: [1, 1.3, 1], rotate: [0, -12, 12, 0] } : undefined}
        transition={{ duration: 0.7, repeat: epic ? 2 : 0 }}
      >
        {milestone.icon}
      </motion.span>
      <div>
        <p className={`text-sm font-extrabold uppercase tracking-wide ${epic ? 'text-amber-200' : 'text-amber-300'}`}>
          {milestone.title}
        </p>
        <p className="text-sm text-neutral-300">{milestone.subtitle}</p>
      </div>
      {epic && (
        <div className="milestone-toast-sparkles" aria-hidden>
          ✨
        </div>
      )}
    </motion.div>
  );
}

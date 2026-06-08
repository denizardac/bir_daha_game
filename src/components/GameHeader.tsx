import { useState } from 'react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { MatchHistoryStrip } from '@/components/MatchHistoryStrip';
import { formatScore } from '@/engine/scoring';
import { useGameStore } from '@/store/gameStore';

interface Props {
  round: number;
  maxRounds: number;
  score: number;
  streak: number;
  timerSeconds?: number;
  showTimer?: boolean;
}

export function GameHeader({ round, maxRounds, score, streak, timerSeconds = 20, showTimer }: Props) {
  const exitToMenu = useGameStore((s) => s.exitToMenu);
  const resetRun = useGameStore((s) => s.resetRun);
  const [modal, setModal] = useState<'exit' | 'reset' | null>(null);

  const pct = (timerSeconds / 20) * 100;
  const timerClass = timerSeconds <= 5 ? 'bg-red-500' : timerSeconds <= 10 ? 'bg-amber-400' : 'bg-white';

  return (
    <>
      <header className="game-top-header flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button type="button" className="game-header-menu-btn" onClick={() => setModal('exit')}>
            <span className="game-header-menu-btn-icon" aria-hidden>←</span>
            Menü
          </button>
          <button type="button" className="btn-secondary game-header-reset-btn text-sm text-red-400" onClick={() => setModal('reset')}>Sıfırla</button>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-3 text-base font-bold">
          <span className="game-header-stat rounded-lg bg-neutral-900 px-3 py-1">Round {round}/{maxRounds}</span>
          <span className="game-header-stat">Skor {formatScore(score)}</span>
          <span className="game-header-stat text-amber-400">Seri {streak}</span>
          <MatchHistoryStrip />
        </div>
        {showTimer && (
          <div className="w-24 text-right">
            <span className={`text-3xl font-extrabold tabular-nums ${timerSeconds <= 5 ? 'text-red-400' : timerSeconds <= 10 ? 'text-amber-400' : ''}`}>
              {timerSeconds}s
            </span>
            <div className="timer-bar"><div className={`timer-fill ${timerClass}`} style={{ width: `${pct}%` }} /></div>
          </div>
        )}
      </header>

      {modal === 'exit' && (
        <ConfirmModal
          title="Menüye Dön"
          message="Run kaydedilir — istediğin zaman devam edebilirsin."
          confirmLabel="Menüye Git"
          menu
          onConfirm={() => { exitToMenu(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === 'reset' && (
        <ConfirmModal title="Sıfırla" message="Aynı seed ile baştan başlarsın." confirmLabel="Sıfırla" danger onConfirm={() => { resetRun(); setModal(null); }} onCancel={() => setModal(null)} />
      )}
    </>
  );
}

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useFeedback } from '@/components/FeedbackCenter';
import { UiIcon } from '@/components/UiIcon';
import { formatScore } from '@/engine/scoring';
import { useGameStore } from '@/store/gameStore';
import { isTacticBonusRound, isFinaleRound } from '@/engine/roundFlow';
import { isEventRound } from '@/data/events';
import type { RoundResult } from '@/types';

interface Props {
  round: number;
  maxRounds: number;
  score: number;
  streak: number;
  timerSeconds?: number;
  showTimer?: boolean;
  trackRecord?: RoundResult[];
}

function RoundProgressStrip({ round, maxRounds }: { round: number; maxRounds: number }) {
  return (
    <div className="round-progress-strip" aria-label={`Round ${round}/${maxRounds}`}>
      {Array.from({ length: maxRounds }, (_, i) => {
        const r = i + 1;
        const finale = isFinaleRound(r, maxRounds);
        const tactic = isTacticBonusRound(r, maxRounds);
        const event = isEventRound(r);
        const done = r < round;
        const current = r === round;

        let bg: string;
        if (finale) {
          bg = done || current
            ? 'linear-gradient(90deg,#a07d2c,#e8b53e)'
            : 'linear-gradient(90deg,#3d2a08,#5a3d10)';
        } else if (current) {
          bg = event ? '#a855f7' : '#2dd4bf';
        } else if (done) {
          bg = '#2d4a43';
        } else if (tactic) {
          bg = '#1e3f3a';
        } else if (event) {
          bg = '#34264a';
        } else {
          bg = '#15211d';
        }

        const style: CSSProperties = {
          flex: finale ? 1.5 : 1,
          height: 4,
          borderRadius: 99,
          background: bg,
          transition: 'background 0.3s',
        };

        if (current) {
          style.boxShadow = `0 0 9px ${event ? 'rgba(168,85,247,.6)' : finale ? 'rgba(232,181,62,.5)' : 'rgba(45,212,191,.6)'}`;
        }

        const title = finale
          ? 'Şampiyonluk maçı'
          : tactic
            ? 'Taktik turu'
            : event
              ? 'Olay turu'
              : `Round ${r}`;

        return <div key={r} style={style} title={title} aria-label={title} />;
      })}
    </div>
  );
}

function TrackRecord({ history }: { history: RoundResult[] }) {
  const matches = history
    .filter((item) => item.matchResult)
    .slice(-8)
    .map((item) => item.matchResult!.outcome);

  if (matches.length === 0) {
    return <span className="game-header-record-empty">-</span>;
  }

  return (
    <span className="game-header-record" aria-label={`Form: ${matches.join(', ')}`}>
      {matches.map((outcome, index) => {
        const label = outcome === 'win' ? 'G' : outcome === 'draw' ? 'B' : 'M';
        return (
          <span key={`${outcome}-${index}`} className={`game-header-record-pill game-header-record-pill--${outcome}`}>
            {label}
          </span>
        );
      })}
    </span>
  );
}

export function GameHeader({ round, maxRounds, score, streak, timerSeconds = 20, showTimer, trackRecord }: Props) {
  const { openFeedback } = useFeedback();
  const exitToMenu = useGameStore((s) => s.exitToMenu);
  const resetRun = useGameStore((s) => s.resetRun);
  const [modal, setModal] = useState<'exit' | 'reset' | null>(null);
  const finale = isFinaleRound(round, maxRounds);

  const pct = (timerSeconds / 20) * 100;
  const timerClass = timerSeconds <= 5 ? 'bg-red-500' : timerSeconds <= 10 ? 'bg-amber-400' : 'bg-white';

  return (
    <>
      <header className="game-top-header flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <button type="button" className="game-header-menu-btn" onClick={() => setModal('exit')}>
            <span className="game-header-menu-btn-icon" aria-hidden>←</span>
            MENÜ
          </button>
          <button type="button" className="game-header-reset-btn game-header-reset-btn--danger" onClick={() => setModal('reset')}>SIFIRLA</button>
          <button type="button" className="game-header-feedback-btn" onClick={openFeedback} title="Hata, öneri veya görüş bildir" aria-label="Hata, öneri veya görüş bildir">
            <UiIcon name="message" />
            <span>BİLDİR</span>
          </button>
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-center gap-4">
          <div className="game-header-stat-stack">
            <span className="game-header-stat-label">ROUND</span>
            <span className="game-header-stat-big">{String(round).padStart(2, '0')}<span className="game-header-stat-denom">/{maxRounds}</span></span>
          </div>
          {finale && (
            <span className="game-header-finale-pill" aria-label="Şampiyonluk maçı">
              <UiIcon name="trophy" />
              Final
            </span>
          )}
          <span className="game-header-score">
            <span className="game-header-score-label">SKOR</span>
            <span className="game-header-score-value">{formatScore(score)}</span>
          </span>
          <div className="game-header-stat-stack">
            <span className="game-header-stat-label">{trackRecord ? 'FORM' : 'SERİ'}</span>
            {trackRecord ? <TrackRecord history={trackRecord} /> : <span className="game-header-stat-big">{streak}</span>}
          </div>
        </div>
        <RoundProgressStrip round={round} maxRounds={maxRounds} />
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

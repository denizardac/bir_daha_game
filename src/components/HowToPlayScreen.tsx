import { HOW_TO_STEPS } from '@/data/howToPlay';
import { useGameStore } from '@/store/gameStore';

export function HowToPlayScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="game-shell flex h-dvh max-h-dvh items-center justify-center overflow-hidden p-6">
      <div className="w-full max-w-3xl text-center">
        <button type="button" className="btn-secondary mb-4" onClick={() => setScreen('menu')}>← Ana Menü</button>
        <div className="menu-howto-steps menu-howto-steps--large">
          {HOW_TO_STEPS.map((step, i) => (
            <div key={step.title} className="menu-howto-step">
              <div className="menu-howto-bubble">
                <span className="menu-howto-emoji">{step.icon}</span>
                <span className="menu-howto-num">{i + 1}</span>
              </div>
              <p className="menu-howto-title">{step.title}</p>
              <p className="menu-howto-text">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

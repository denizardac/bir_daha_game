import { MENU_BITE_TIPS } from '@/data/biteTips';
import { useGameStore } from '@/store/gameStore';

export function MenuBiteTipsWidget() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <aside className="menu-bite-panel">
      <div className="menu-widget menu-widget--bite">
        <div className="menu-widget-head">
          <span className="menu-widget-icon">💡</span>
          <h2 className="menu-widget-title">Bilmen gerekenler</h2>
        </div>

        <ul className="menu-bite-list--panel">
          {MENU_BITE_TIPS.map((tip) => (
            <li key={tip.title} className="menu-bite-item">
              <span className="menu-bite-icon" aria-hidden>{tip.icon}</span>
              <div className="menu-bite-body">
                <p className="menu-bite-label">{tip.title}</p>
                <p className="menu-bite-text">{tip.text}</p>
              </div>
            </li>
          ))}
          <li className="menu-bite-guide-row">
            <button
              type="button"
              className="menu-bite-guide-btn"
              onClick={() => setScreen('gameGuide')}
            >
              <span>Detaylı oyun rehberi</span>
              <span className="menu-howto-detail-arrow" aria-hidden>→</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

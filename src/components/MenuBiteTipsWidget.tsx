import { MENU_BITE_TIPS } from '@/data/biteTips';
import { useGameStore } from '@/store/gameStore';
import { GameIcon } from '@/components/GameIcon';

export function MenuBiteTipsWidget() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <aside className="menu-bite-panel">
      <div className="menu-widget menu-widget--bite">
        <div className="menu-widget-head">
          <span className="menu-widget-icon"><GameIcon name="info" size={18} /></span>
          <h2 className="menu-widget-title">Bilmen gerekenler</h2>
        </div>

        <ul className="menu-bite-list--panel">
          {MENU_BITE_TIPS.map((tip) => (
            <li key={tip.title} className="menu-bite-item">
              <span className="menu-bite-icon" aria-hidden><GameIcon legacyIcon={tip.icon} size={18} /></span>
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
              <span className="menu-howto-detail-arrow" aria-hidden><GameIcon name="arrow-right" size={16} /></span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

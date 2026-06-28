import { MENU_BITE_TIPS } from '@/data/biteTips';
import { useGameStore } from '@/store/gameStore';
import { UiIcon, type UiIconName } from '@/components/UiIcon';

const TIP_ICONS: Record<string, UiIconName> = {
  "Tag'ler": 'tag',
  Sinerjiler: 'zap',
  Taktikler: 'clipboard',
  Olaylar: 'sparkles',
  Mevkiler: 'circle-dot',
};

export function MenuBiteTipsWidget() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <aside className="menu-bite-panel">
      <div className="menu-widget menu-widget--bite">
        <div className="menu-widget-head">
          <UiIcon name="lightbulb" className="menu-widget-icon" />
          <h2 className="menu-widget-title">Bilmen gerekenler</h2>
        </div>

        <ul className="menu-bite-list--panel">
          {MENU_BITE_TIPS.map((tip) => (
            <li key={tip.title} className="menu-bite-item">
              <UiIcon name={TIP_ICONS[tip.title] ?? 'info'} className="menu-bite-icon" />
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
              <UiIcon name="arrow-right" className="menu-howto-detail-arrow" />
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}

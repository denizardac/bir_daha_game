import { HOW_TO_STEPS } from '@/data/howToPlay';

export function MenuHowToWidget() {
  return (
    <div className="menu-widget menu-widget--howto">
      <div className="menu-widget-head">
        <span className="menu-widget-icon">📖</span>
        <h2 className="menu-widget-title">Nasıl Oynanır?</h2>
      </div>

      <div className="menu-howto-grid">
        {HOW_TO_STEPS.map((step, i) => (
          <div key={step.title} className="menu-howto-item">
            <div className="menu-howto-item-icon">
              <span>{step.icon}</span>
              <span className="menu-howto-item-num">{i + 1}</span>
            </div>
            <div className="menu-howto-item-body">
              <p className="menu-howto-item-title">{step.title}</p>
              <p className="menu-howto-item-text">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

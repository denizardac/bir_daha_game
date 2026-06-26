import { SYNERGIES, TOTAL_SYNERGIES } from '@/data/synergies';
import { getSynergyGuideTags, getSynergyGuideTeaser } from '@/data/synergyGuideHints';
import { getSynergyBenefitText } from '@/engine/squadInsights';
import { getPersistedStats, useGameStore } from '@/store/gameStore';

export function SynergiesScreen() {
  const discovered = getPersistedStats().discoveredSynergies;
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className="game-shell page-screen">
      <div className="page-screen-inner page-screen-inner--wide">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>
          ← Ana Menü
        </button>

        <header className="page-screen-header">
          <h1>Sinerjiler</h1>
          <p>Keşfedilen: {discovered.length}/{TOTAL_SYNERGIES} — tag ve mevki kombinasyonlarıyla maç bonusu kazan.</p>
        </header>

        <div className="synergies-catalog">
          {SYNERGIES.map((s) => {
            const ok = discovered.includes(s.id);
            return (
              <article
                key={s.id}
                className={`synergies-catalog-item ${ok ? 'synergies-catalog-item--open' : 'synergies-catalog-item--locked'}`}
              >
                <span className="synergies-catalog-icon" aria-hidden>{ok ? s.icon : '🔒'}</span>
                <div className="synergies-catalog-body">
                  <h2>{ok ? s.name : (s.hidden ? 'Gizli sinerji' : '???')}</h2>
                  {ok ? (
                    <>
                      <p>{s.description}</p>
                      <span className="synergies-catalog-reward">{getSynergyBenefitText(s)}</span>
                    </>
                  ) : (
                    <>
                      <p className="synergies-catalog-teaser">
                        <span className="synergies-catalog-hint-label">İpucu</span>
                        {getSynergyGuideTeaser(s.id)}
                      </p>
                      {getSynergyGuideTags(s.id).length > 0 && (
                        <div className="synergies-catalog-tag-hints">
                          {getSynergyGuideTags(s.id).map((tag) => (
                            <span key={tag} className="synergies-catalog-tag-hint">{tag}</span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { SYNERGIES, TOTAL_SYNERGIES } from '@/data/synergies';
import { getSynergyGuideTags, getSynergyGuideTeaser } from '@/data/synergyGuideHints';
import { getSynergyBenefitText } from '@/engine/squadInsights';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { UiIcon } from '@/components/UiIcon';
import { iconForSynergy } from '@/utils/gameIcons';

export function SynergiesScreen() {
  const discovered = getPersistedStats().discoveredSynergies;
  const setScreen = useGameStore((s) => s.setScreen);
  const progress = Math.round((discovered.length / TOTAL_SYNERGIES) * 100);

  return (
    <div className="game-shell page-screen">
      <div className="page-screen-inner page-screen-inner--wide">
        <button type="button" className="btn-secondary page-screen-back" onClick={() => setScreen('menu')}>
          ← Ana Menü
        </button>

        <header className="page-screen-header">
          <span className="page-screen-eyebrow">Taktik laboratuvarı</span>
          <h1>Sinerjiler</h1>
          <p>Doğru tag ve mevki kombinasyonlarını kur, maç bonuslarını aç.</p>
        </header>

        <div className="synergies-progress-panel">
          <div className="synergies-progress-copy">
            <span>Keşif ilerlemesi</span>
            <strong>{discovered.length}<small> / {TOTAL_SYNERGIES}</small></strong>
          </div>
          <div className="synergies-progress-track" aria-label={`Sinerji keşif ilerlemesi yüzde ${progress}`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>{discovered.length === TOTAL_SYNERGIES ? 'Tüm sinerjiler keşfedildi.' : `${TOTAL_SYNERGIES - discovered.length} kombinasyon keşfedilmeyi bekliyor.`}</p>
        </div>

        <div className="synergies-catalog">
          {SYNERGIES.map((s) => {
            const ok = discovered.includes(s.id);
            return (
              <article
                key={s.id}
                className={`synergies-catalog-item ${ok ? 'synergies-catalog-item--open' : 'synergies-catalog-item--locked'}`}
              >
                <span className="synergies-catalog-icon" aria-hidden><UiIcon name={ok ? iconForSynergy(s.icon) : 'lock'} /></span>
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

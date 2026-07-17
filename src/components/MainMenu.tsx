import { lazy, Suspense, useEffect, useState } from 'react';
import { fetchTodayRunStartCount, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { formatDailyDate } from '@/engine/seed';
import { formatScore } from '@/engine/scoring';
import { getTodayKey } from '@/engine/leaderboard';
import { getDailyStreakBonus } from '@/engine/dailyStreak';
import { getWeeklyModifier } from '@/engine/weeklyModifier';
import { getSeasonLabel } from '@/engine/hallOfFame';
import { buildMonthlyLegendCard } from '@/engine/monthlyLegend';
import { isChallengeSeedDaily } from '@/engine/challenge';
import { getVerifiedChampionTitle } from '@/engine/seasonTitles';
import { getClosestUnlockStatuses, getUnlockStatuses } from '@/engine/unlocks';
import { StartRunModal } from '@/components/StartRunModal';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { getAnonymousId, loadPersisted } from '@/utils/storage';
import { POSITION_BADGE, POSITION_LABELS } from '@/utils/positionStyle';
import { iconForTag } from '@/utils/gameIcons';

const MenuBiteTipsWidget = lazy(() => import('@/components/MenuBiteTipsWidget')
  .then((module) => ({ default: module.MenuBiteTipsWidget })));
const MenuLeaderboardWidget = lazy(() => import('@/components/MenuLeaderboardWidget')
  .then((module) => ({ default: module.MenuLeaderboardWidget })));

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function MainMenu() {
  const startRun = useGameStore((s) => s.startRun);
  const continueRun = useGameStore((s) => s.continueRun);
  const abandonRun = useGameStore((s) => s.abandonRun);
  const setScreen = useGameStore((s) => s.setScreen);
  const showContinuePrompt = useGameStore((s) => s.showContinuePrompt);
  const pendingChallenge = useGameStore((s) => s.pendingChallenge);
  const setChallenge = useGameStore((s) => s.setChallenge);
  const newContentUnlocks = useGameStore((s) => s.newContentUnlocks);
  const acknowledgeContentUnlocks = useGameStore((s) => s.acknowledgeContentUnlocks);
  const monthlyLegendRecord = useGameStore((s) => s.monthlyLegend);
  const [stats] = useState(() => getPersistedStats());
  const [playerId] = useState(() => getAnonymousId());
  const seasonTitle = getVerifiedChampionTitle(monthlyLegendRecord, playerId);
  const closestUnlocks = getClosestUnlockStatuses(stats.unlocks, 1);
  const activeMechanics = getUnlockStatuses(stats.unlocks)
    .filter((status) => status.unlocked && status.unlock.reward.kind === 'mechanic');
  const monthlyLegendCard = buildMonthlyLegendCard(monthlyLegendRecord);

  const [startPrompt, setStartPrompt] = useState<{ daily: boolean; afterAbandon?: boolean; seed?: string; rivalScore?: number } | null>(null);
  const [installTipVisible, setInstallTipVisible] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [menuDialog, setMenuDialog] = useState<'help' | 'score' | null>(null);
  const [abandonConfirmVisible, setAbandonConfirmVisible] = useState(false);

  const openStart = (daily: boolean, afterAbandon = false) => {
    setStartPrompt({ daily, afterAbandon });
  };

  const acceptChallenge = () => {
    if (!pendingChallenge) return;
    setStartPrompt({
      daily: isChallengeSeedDaily(pendingChallenge.seed),
      afterAbandon: showContinuePrompt,
      seed: pendingChallenge.seed,
      rivalScore: pendingChallenge.score,
    });
  };

  const confirmStart = (name: string) => {
    if (!startPrompt) return;
    if (startPrompt.afterAbandon) abandonRun();
    startRun(startPrompt.daily, name, startPrompt.seed);
    setStartPrompt(null);
  };

  const [savedRun] = useState(() => loadPersisted().currentRun);

  const localTodayRuns = stats.todayRunsDate === getTodayKey() ? stats.todayRuns : 0;
  const remoteLeaderboardEnabled = isRemoteLeaderboardEnabled();
  const [remoteTodayRuns, setRemoteTodayRuns] = useState<number | null>(null);
  const [remoteTodayRunsLoaded, setRemoteTodayRunsLoaded] = useState(!remoteLeaderboardEnabled);
  useEffect(() => {
    if (!remoteLeaderboardEnabled) return;
    let cancelled = false;
    const loadRemoteCounts = async () => {
      const todayCount = await fetchTodayRunStartCount();
      if (cancelled) return;
      setRemoteTodayRuns(todayCount);
      setRemoteTodayRunsLoaded(true);
    };

    let cancelScheduledLoad: () => void;
    const idleApi = window as unknown as {
      requestIdleCallback?: Window['requestIdleCallback'];
      cancelIdleCallback?: Window['cancelIdleCallback'];
    };
    if (idleApi.requestIdleCallback && idleApi.cancelIdleCallback) {
      const idleId = idleApi.requestIdleCallback(() => void loadRemoteCounts(), { timeout: 2_000 });
      cancelScheduledLoad = () => idleApi.cancelIdleCallback!(idleId);
    } else {
      const timeoutId = globalThis.setTimeout(() => void loadRemoteCounts(), 1);
      cancelScheduledLoad = () => globalThis.clearTimeout(timeoutId);
    }

    return () => {
      cancelled = true;
      cancelScheduledLoad();
    };
  }, [remoteLeaderboardEnabled]);
  const todayRuns = remoteLeaderboardEnabled && !remoteTodayRunsLoaded
    ? null
    : remoteTodayRuns ?? localTodayRuns;

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;
    if (standalone || localStorage.getItem('bir-daha-install-tip-dismissed') === '1') return;

    setInstallTipVisible(true);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      setInstallTipVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const confirmAbandonRun = () => {
    abandonRun();
    setAbandonConfirmVisible(false);
  };

  const handlePlayClick = (daily: boolean) => {
    if (showContinuePrompt) {
      openStart(daily, true);
      return;
    }
    openStart(daily);
  };

  const dismissInstallTip = () => {
    localStorage.setItem('bir-daha-install-tip-dismissed', '1');
    setInstallTipVisible(false);
  };

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      dismissInstallTip();
      return;
    }
    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === 'accepted') dismissInstallTip();
  };

  const quickLinks: { icon: UiIconName; label: string; screen: 'gameGuide' | 'collection' | 'hallOfFame' | 'synergies' | 'settings' }[] = [
    { icon: 'book-open', label: 'Rehber', screen: 'gameGuide' },
    { icon: 'archive', label: 'Koleksiyon', screen: 'collection' },
    { icon: 'trophy', label: 'Sezon', screen: 'hallOfFame' },
    { icon: 'zap', label: 'Sinerjiler', screen: 'synergies' },
    { icon: 'settings', label: 'Ayarlar', screen: 'settings' },
  ];

  const summaryStats: { icon: UiIconName; label: string; value: string; sub: string; hot?: boolean }[] = [
    { icon: 'medal', label: 'Bugünkü Skor', value: formatScore(stats.todayScore), sub: 'Ranked kişisel en iyi' },
    { icon: 'flame', label: 'Günlük Seri', value: `${stats.dailyStreak} gün`, sub: 'Ranked devamlılığı', hot: stats.dailyStreak > 1 },
    { icon: 'globe', label: 'Bugün', value: todayRuns === null ? '…' : formatScore(todayRuns), sub: 'Ranked run başladı' },
  ];

  return (
    <div className="menu-shell pitch-bg">
      <div className="menu-pitch-deco" aria-hidden>
        <div className="menu-pitch-circle" />
        <div className="menu-pitch-line menu-pitch-line--mid" />
        <div className="menu-pitch-line menu-pitch-line--box" />
      </div>

      <div className="menu-dashboard">
        <header className="menu-top">
          <div className="menu-brand">
            <p className="menu-hero-badge">Futbol Roguelite</p>
            <h1 className="menu-hero-title">
              <UiIcon name="circle-dot" className="menu-hero-ball" />
              Bir Daha
            </h1>
            <p className="menu-hero-tagline">Aynı seed. Farklı sen.</p>
            {(seasonTitle || (stats.dailyStreak > 1 && getDailyStreakBonus(stats.dailyStreak).label)) && (
              <div className="menu-brand-chips">
                {seasonTitle && (
                  <span className="menu-chip menu-chip--title" title={`Skor: ${formatScore(seasonTitle.score)}`}>
                    <UiIcon name={seasonTitle.icon} />
                    {seasonTitle.label}
                  </span>
                )}
                {stats.dailyStreak > 1 && getDailyStreakBonus(stats.dailyStreak).label && (
                  <span className="menu-chip menu-chip--streak" title={getDailyStreakBonus(stats.dailyStreak).label ?? undefined}>
                    <UiIcon name="flame" />
                    {stats.dailyStreak} gün serisi
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="menu-top-right">
            <div className="menu-top-actions" aria-label="Kısa yollar">
              <button type="button" className="menu-icon-action" onClick={() => setMenuDialog('help')} aria-label="Bilmen gerekenleri aç">
                <UiIcon name="info" />
                <span>Bilgi</span>
              </button>
              <button type="button" className="menu-icon-action" onClick={() => setMenuDialog('score')} aria-label="Skor tablosunu aç">
                <UiIcon name="chart" />
                <span>Skor</span>
              </button>
            </div>

            <div className="menu-top-stats">
              {summaryStats.map((item) => (
                <div key={item.label} className={`menu-stat-card ${item.hot ? 'menu-stat-card--gold' : ''}`}>
                  <div className="menu-stat-icon-row">
                    <UiIcon name={item.icon} className="menu-stat-icon" />
                    <span className="menu-stat-label">{item.label}</span>
                  </div>
                  <p className={`menu-stat-value ${item.label === 'Seed' ? '' : 'menu-stat-value--big'} ${item.hot ? 'menu-stat-value--gold' : ''}`}>
                    {item.value}
                  </p>
                  <p className="menu-stat-sub">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="menu-main">
          <div className="menu-body menu-body--simple">
            <section className="menu-play-panel">
              <div className="menu-stadium-horizon" aria-hidden="true" />
              <div className="menu-play-panel-inner">
                {showContinuePrompt ? (
                  <div className="menu-resume-stage">
                    <div className="menu-resume-copy">
                      <span className="menu-ranked-kicker">
                        <UiIcon name={savedRun?.isDailySeed === false ? 'dice' : 'trophy'} />
                        {savedRun?.isDailySeed === false ? 'Serbest Mod' : 'Günlük Ranked'} · Devam ediyor
                      </span>
                      <strong>Round {savedRun?.round ?? '?'}’ye dön</strong>
                      <p>Kadron ve kararların kayıtlı. Tek dokunuşla kaldığın yerden devam et.</p>
                    </div>
                    <div className="menu-resume-ticket" aria-label="Devam eden run özeti">
                      <div><span>Round</span><strong>{savedRun?.round ?? '?'}</strong></div>
                      <div><span>Skor</span><strong>{formatScore(savedRun?.score ?? 0)}</strong></div>
                      <div><span>Mod</span><strong>{savedRun?.isDailySeed === false ? 'Serbest' : 'Ranked'}</strong></div>
                    </div>
                    <div className="menu-resume-actions">
                      <button type="button" className="btn-primary menu-resume-primary" onClick={continueRun}>
                        <UiIcon name="play" /> Run’a devam et
                      </button>
                      <button type="button" className="btn-secondary menu-resume-abandon" onClick={() => setAbandonConfirmVisible(true)}>
                        <UiIcon name="door" /> Mevcut runı terk et
                      </button>
                    </div>
                    {abandonConfirmVisible && (
                      <div className="menu-resume-abandon-confirm" role="alert">
                        <div>
                          <strong>Bu runın ilerlemesi silinecek.</strong>
                          <span>Ardından yeni run seçebileceğin normal ana menü açılır.</span>
                        </div>
                        <button type="button" className="btn-secondary" onClick={() => setAbandonConfirmVisible(false)}>Vazgeç</button>
                        <button type="button" className="menu-resume-abandon-final" onClick={confirmAbandonRun}>Evet, runı terk et</button>
                      </div>
                    )}
                  </div>
                ) : (
                <>
                <div className="menu-play-content">
                  <div className="menu-kickoff-stage">
                    <div className="menu-next-action">
                      <span className="menu-ranked-kicker"><UiIcon name="trophy" /> Günlük Ranked · {formatDailyDate()}</span>
                      <strong>Bugünün fikstürü hazır.</strong>
                      <p>Aynı seed, 15 round. Ranked’de herkese karşı yarış veya kendi futbol hikâyeni serbestçe kur.</p>
                    </div>

                    <div className="menu-play-actions" aria-label="Oyun modunu seç">
                      <button type="button" className="btn-primary menu-play-btn" data-mark="R" aria-label="Ranked Run başlat" onClick={() => handlePlayClick(true)}>
                        <span className="menu-ranked-tunnel" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                        </span>
                        <span className="menu-ranked-sheen" aria-hidden="true" />
                        <span className="menu-mode-head">
                          <span className="menu-play-btn-kicker"><UiIcon name="trophy" /> Tünelden sahaya</span>
                          <span className="menu-mode-length">15 round</span>
                        </span>
                        <span className="menu-mode-main">
                          <span className="menu-play-btn-label">Ranked Run</span>
                          <span className="menu-mode-go">Sahaya çık <UiIcon name="arrow-right" /></span>
                        </span>
                        <span className="menu-mode-facts" aria-hidden="true">
                          <span><strong>Aynı seed</strong><small>Herkese karşı</small></span>
                          <span><strong>3 liste</strong><small>Gün · Hafta · Sezon</small></span>
                        </span>
                      </button>
                      <button type="button" className="btn-secondary menu-play-btn menu-play-btn--free" data-mark="∞" aria-label="Serbest Run başlat" onClick={() => handlePlayClick(false)}>
                        <span className="menu-mode-head">
                          <span className="menu-play-btn-kicker"><UiIcon name="dice" /> Serbest mod</span>
                          <span className="menu-mode-length">15 round</span>
                        </span>
                        <span className="menu-mode-main">
                          <span className="menu-play-btn-label">Serbest Run</span>
                          <span className="menu-mode-go">Başlat <UiIcon name="arrow-right" /></span>
                        </span>
                        <span className="menu-mode-facts" aria-hidden="true">
                          <span><strong>Rastgele seed</strong><small>Her run yeni</small></span>
                          <span><strong>Unlock havuzu</strong><small>Ödüller açık</small></span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {pendingChallenge && (
                    <div
                      className="menu-challenge"
                      role="status"
                      aria-label={`${pendingChallenge.by} sana meydan okuyor`}
                    >
                      <span className="menu-challenge-badge">MEYDAN OKUMA</span>
                      <div className="menu-challenge-body">
                        <p className="menu-challenge-title">
                          <strong>{pendingChallenge.by}</strong> sana meydan okuyor
                          {pendingChallenge.score > 0 && (
                            <span className="menu-challenge-score">{formatScore(pendingChallenge.score)}</span>
                          )}
                        </p>
                        <p className="menu-challenge-mode">
                          {isChallengeSeedDaily(pendingChallenge.seed)
                            ? 'Bugünün günlük seed’i — skorun günlük sıralamaya yazılır'
                            : 'Bugünün seed’i değil — serbest mod olarak oynanır'}
                        </p>
                      </div>
                      <button type="button" className="btn-primary menu-challenge-cta" onClick={acceptChallenge}>
                        <UiIcon name="play" />
                        Kabul et
                      </button>
                      <button
                        type="button"
                        className="menu-challenge-dismiss"
                        onClick={() => setChallenge(null)}
                        aria-label="Meydan okumayı kapat"
                      >
                        <UiIcon name="x" />
                      </button>
                    </div>
                  )}

                  {(() => {
                    const mod = getWeeklyModifier();
                    return (
                      <p className="menu-weekly-mod" title={mod.description}>
                        <UiIcon name={mod.icon} className="menu-weekly-mod-icon" />
                        <strong>{mod.name}</strong>
                        <span className="menu-weekly-mod-desc">{mod.description}</span>
                      </p>
                    );
                  })()}

                  {newContentUnlocks.length > 0 && (
                    <div className="menu-new-unlocks" role="status" aria-label="Yeni açılan içerikler">
                      <div>
                        <span><UiIcon name="sparkles" /> YENİ İÇERİK</span>
                        <strong>{newContentUnlocks.map((unlock) => unlock.reward.name).join(' · ')}</strong>
                        <small>Oyuncu ve olay ödülleri ilk Serbest Mod runında garanti edilir.</small>
                      </div>
                      <button type="button" className="btn-secondary" onClick={acknowledgeContentUnlocks}>Gördüm</button>
                    </div>
                  )}

                  <div className="menu-support-grid">
                  <section className="menu-unlock-panel" aria-label="Kalıcı ilerleme hedefleri">
                    <div className="menu-unlock-panel-head">
                      <div>
                        <span><UiIcon name="target" /> Kalıcı ilerleme</span>
                        <strong>Sıradaki açılım</strong>
                      </div>
                      <button type="button" onClick={() => setScreen('collection')}>Koleksiyon <UiIcon name="arrow-right" /></button>
                    </div>
                    {closestUnlocks.length > 0 ? (
                      <div className="menu-unlock-targets">
                        {closestUnlocks.map((status) => (
                          <div key={status.unlock.id} className="menu-unlock-target">
                            <div className="menu-unlock-target-main">
                              <span className="menu-unlock-emblem"><UiIcon name="target" /></span>
                              <div className="menu-unlock-copy">
                                <span>Hedef · {status.unlock.name}</span>
                                <strong>{status.unlock.reward.name}</strong>
                                <small>Bir sonraki kalıcı ödül</small>
                              </div>
                              <div className="menu-unlock-percent" aria-label={`Yüzde ${status.percent} tamamlandı`}>
                                <strong>{status.percent}</strong>
                                <span>%</span>
                                <small>tamam</small>
                              </div>
                            </div>
                            <div className="menu-unlock-progress-row">
                              <small>{formatScore(status.current)}</small>
                              <div className="menu-unlock-mini-bar" aria-label={`${status.unlock.name} yüzde ${status.percent}`}>
                                <span style={{ width: `${status.percent}%` }} />
                              </div>
                              <small>{formatScore(status.unlock.target)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="menu-unlock-complete"><UiIcon name="trophy" /> Tüm kalıcı içerikler açıldı.</p>
                    )}
                    {activeMechanics.length > 0 && (
                      <div className="menu-active-mechanics">
                        <span>Serbest Mod mekanikleri</span>
                        {activeMechanics.map((status) => (
                          <strong key={status.unlock.id}><UiIcon name="check" /> {status.unlock.reward.name}</strong>
                        ))}
                      </div>
                    )}
                  </section>

                  {monthlyLegendCard && monthlyLegendRecord && (
                    <aside
                      className="menu-monthly-legend"
                      role="status"
                      aria-label={`${monthlyLegendRecord.displayName}, ${monthlyLegendCard.currentRating} reytingli Ayın Efsanesi`}
                    >
                      <div className="menu-champion-top">
                        <span><UiIcon name="trophy" /> {getSeasonLabel(monthlyLegendRecord.sourceMonthKey)} global şampiyonu</span>
                        <small>Ayın Efsanesi</small>
                      </div>
                      <div className="menu-champion-player">
                        <div className="menu-champion-rating">
                          <strong>{monthlyLegendCard.currentRating}</strong>
                          <span>{POSITION_BADGE[monthlyLegendCard.position]}</span>
                        </div>
                        <div className="menu-champion-identity">
                          <small>Şampiyon kartı</small>
                          <strong>{monthlyLegendRecord.displayName}</strong>
                          <span>{POSITION_LABELS[monthlyLegendCard.position]}</span>
                        </div>
                        <span className="menu-champion-shirt"><UiIcon name="shirt" /></span>
                      </div>
                      <div className="menu-champion-foot">
                        <div className="menu-champion-traits">
                          {monthlyLegendCard.tags.slice(0, 2).map((tag) => (
                            <span key={tag}><UiIcon name={iconForTag(tag)} />{tag}</span>
                          ))}
                        </div>
                        <span className="menu-champion-score">{formatScore(monthlyLegendRecord.totalScore)} puan</span>
                      </div>
                    </aside>
                  )}
                  </div>
                </div>
                </>
                )}
              </div>
            </section>

            {installTipVisible && (
              <div className="menu-install-tip" role="status">
                <div className="menu-install-tip-copy">
                  <p>Telefona ekle</p>
                  <span>{installPromptEvent ? 'Tam ekran uygulama gibi açılır.' : 'iPhone: Paylaş, sonra Ana Ekrana Ekle.'}</span>
                </div>
                <button type="button" className="menu-install-tip-action" onClick={handleInstallClick}>
                  {installPromptEvent ? 'Ekle' : 'Tamam'}
                </button>
                <button type="button" className="menu-install-tip-close" aria-label="Kapat" onClick={dismissInstallTip}>
                  <UiIcon name="x" />
                </button>
              </div>
            )}
          </div>

          <footer className="menu-footer">
            {quickLinks.map((link) => (
              <button
                key={link.screen}
                type="button"
                className="menu-footer-tile"
                onClick={() => setScreen(link.screen)}
              >
                <UiIcon name={link.icon} className="menu-footer-icon" />
                <span className="menu-footer-label">{link.label}</span>
              </button>
            ))}
          </footer>
        </div>
      </div>

      {menuDialog && (
          <div
            className="menu-dialog-backdrop"
            onClick={() => setMenuDialog(null)}
          >
            <div
              className={`menu-dialog menu-dialog--${menuDialog}`}
              role="dialog"
              aria-modal="true"
              aria-label={menuDialog === 'help' ? 'Bilmen gerekenler' : 'Skor tablosu'}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="menu-dialog-head">
                <div>
                  <span>{menuDialog === 'help' ? 'Kısa bilgi' : 'Skor tablosu'}</span>
                  <strong>{menuDialog === 'help' ? 'Oyuna hızlı bakış' : 'Sıralama'}</strong>
                </div>
                <button type="button" className="menu-dialog-close" onClick={() => setMenuDialog(null)} aria-label="Kapat">
                  <UiIcon name="x" />
                </button>
              </div>
              <Suspense fallback={<div className="menu-dialog-loading" role="status">Hazırlanıyor…</div>}>
                {menuDialog === 'help' ? <MenuBiteTipsWidget /> : <MenuLeaderboardWidget initialExpanded />}
              </Suspense>
            </div>
          </div>
      )}

      <StartRunModal
        open={startPrompt !== null}
        daily={startPrompt?.daily ?? true}
        defaultName={stats.lastPlayerName}
        rivalScore={startPrompt?.rivalScore}
        onConfirm={confirmStart}
        onCancel={() => setStartPrompt(null)}
      />
    </div>
  );
}

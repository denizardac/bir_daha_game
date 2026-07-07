import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchTodayRunStartCount, fetchTotalRunStartCount, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { formatDailyDate } from '@/engine/seed';
import { formatScore } from '@/engine/scoring';
import { getTodayKey } from '@/engine/leaderboard';
import { getDailyStreakBonus } from '@/engine/dailyStreak';
import { getWeeklyModifier } from '@/engine/weeklyModifier';
import { MenuBiteTipsWidget } from '@/components/MenuBiteTipsWidget';
import { MenuLeaderboardWidget } from '@/components/MenuLeaderboardWidget';

import { StartRunModal } from '@/components/StartRunModal';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { loadPersisted } from '@/utils/storage';

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
  const stats = getPersistedStats();

  const [startPrompt, setStartPrompt] = useState<{ daily: boolean; afterAbandon?: boolean } | null>(null);
  const [installTipVisible, setInstallTipVisible] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [menuDialog, setMenuDialog] = useState<'help' | 'score' | null>(null);

  const openStart = (daily: boolean, afterAbandon = false) => {
    setStartPrompt({ daily, afterAbandon });
  };

  const confirmStart = (name: string) => {
    if (!startPrompt) return;
    if (startPrompt.afterAbandon) abandonRun();
    startRun(startPrompt.daily, name);
    setStartPrompt(null);
  };

  const savedRun = loadPersisted().currentRun;

  const localTodayRuns = stats.todayRunsDate === getTodayKey() ? stats.todayRuns : 0;
  const [remoteTodayRuns, setRemoteTodayRuns] = useState<number | null>(null);
  const [remoteTotalRuns, setRemoteTotalRuns] = useState<number | null>(null);
  useEffect(() => {
    if (!isRemoteLeaderboardEnabled()) return;
    let cancelled = false;
    fetchTodayRunStartCount()
      .then((count) => { if (!cancelled) setRemoteTodayRuns(count); })
      .catch(() => { /* sessiz */ });
    fetchTotalRunStartCount()
      .then((count) => { if (!cancelled) setRemoteTotalRuns(count); })
      .catch(() => { /* sessiz */ });
    return () => { cancelled = true; };
  }, []);
  const todayRuns = remoteTodayRuns ?? localTodayRuns;
  const totalRuns = remoteTotalRuns ?? stats.totalRuns;

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

  const handleNewRunFromContinue = () => {
    openStart(savedRun?.isDailySeed ?? true, true);
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
    { icon: 'trophy', label: 'Hall of Fame', screen: 'hallOfFame' },
    { icon: 'zap', label: 'Sinerjiler', screen: 'synergies' },
    { icon: 'settings', label: 'Ayarlar', screen: 'settings' },
  ];

  const summaryStats: { icon: UiIconName; label: string; value: string; sub: string; hot?: boolean }[] = [
    { icon: 'medal', label: 'En İyi Skor', value: formatScore(stats.allTimeBest), sub: 'kişisel rekor' },
    { icon: 'globe', label: 'Bugün', value: formatScore(todayRuns), sub: 'başlatılan run' },
    { icon: 'flame', label: 'Seri', value: `${stats.dailyStreak} gün`, sub: 'üst üste', hot: stats.dailyStreak > 1 },
    { icon: 'chart', label: 'Toplam', value: formatScore(totalRuns), sub: 'run oynandı' },
    { icon: 'calendar', label: 'Seed', value: formatDailyDate(), sub: String(new Date().getFullYear()) },
  ];

  return (
    <div className="menu-shell pitch-bg">
      <div className="menu-pitch-deco" aria-hidden>
        <div className="menu-pitch-circle" />
        <div className="menu-pitch-line menu-pitch-line--mid" />
        <div className="menu-pitch-line menu-pitch-line--box" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="menu-dashboard">
        <header className="menu-top">
          <div className="menu-brand">
            <p className="menu-hero-badge">Futbol Roguelite</p>
            <h1 className="menu-hero-title">
              <UiIcon name="circle-dot" className="menu-hero-ball" />
              Bir Daha
            </h1>
            <p className="menu-hero-tagline">Aynı seed. Farklı sen.</p>
            {stats.dailyStreak > 1 && getDailyStreakBonus(stats.dailyStreak).label && (
              <p className="menu-streak">
                <span className="menu-streak-bonus">{getDailyStreakBonus(stats.dailyStreak).label}</span>
              </p>
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
              <div className="menu-play-panel-inner">
                <div className="menu-play-content">
                  <div className="menu-next-action">
                    <span>Şimdi ne yapabilirim?</span>
                    <strong>{showContinuePrompt ? 'Devam eden runu bitir' : 'Bugünün seed’ini oyna'}</strong>
                    <p>
                      {showContinuePrompt
                        ? `Round ${savedRun?.round ?? '?'} · skor ${formatScore(savedRun?.score ?? 0)}. İstersen kaldığın yerden devam et.`
                        : '3 karttan seçim yap, kadronu büyüt, maçı kazan ve skoru yukarı taşı.'}
                    </p>
                  </div>

                  {(() => {
                    const mod = getWeeklyModifier();
                    return (
                      <p className="menu-weekly-mod" title={mod.description}>
                        <span className="menu-weekly-mod-icon" aria-hidden>{mod.icon}</span>
                        <strong>{mod.name}</strong>
                        <span className="menu-weekly-mod-desc">{mod.description}</span>
                      </p>
                    );
                  })()}

                  {showContinuePrompt ? (
                    <div className="menu-continue-banner">
                      <div className="menu-continue-text">
                        <p className="menu-continue-title">Devam eden runun var</p>
                        <p className="menu-continue-sub">
                          Round {savedRun?.round ?? '?'} · Skor {formatScore(savedRun?.score ?? 0)}
                          {' · '}Kaldığın yerden devam et veya yeni başla
                        </p>
                      </div>
                      <div className="menu-continue-actions">
                        <button type="button" className="btn-secondary menu-continue-btn" onClick={handleNewRunFromContinue}>Yeni Run</button>
                        <button type="button" className="btn-primary menu-continue-btn" onClick={continueRun}>Devam Et</button>
                      </div>
                    </div>
                  ) : (
                    <div className="menu-play-hint">
                      <p className="menu-play-hint-title">Bugünün meydan okuması</p>
                      <p className="menu-play-hint-sub">
                        Seed {formatDailyDate()} · 15 round · herkes aynı kartlarla oynar
                      </p>
                      {todayRuns > 0 && (
                        <p className="menu-play-hint-runs">
                          <UiIcon name="globe" />
                          <span>{formatScore(todayRuns)} run başladı — skor kartını paylaş, meydan oku</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="menu-beta-strip">
                    <span className="menu-beta-badge">Beta</span>
                    <span className="menu-beta-text">Android ve iOS app yakında</span>
                    <span className="menu-beta-date">TestFlight / APK</span>
                  </div>

                </div>

                <div className="menu-play-actions">
                  <button type="button" className="btn-primary menu-play-btn" onClick={() => handlePlayClick(true)}>
                    <span className="menu-play-btn-icon"><UiIcon name="play" /></span>
                    <span>
                      <span className="menu-play-btn-label">Bugünün Seed'ini Oyna</span>
                      <span className="menu-play-btn-sub">Aynı kartlar · tek skor · arkadaşına meydan oku</span>
                    </span>
                    <UiIcon name="arrow-right" className="menu-play-btn-arrow" />
                  </button>
                  <button type="button" className="btn-secondary menu-play-btn menu-play-btn--free" onClick={() => handlePlayClick(false)}>
                    <span className="menu-play-btn-icon"><UiIcon name="dice" /></span>
                    <span>
                      <span className="menu-play-btn-label">Serbest Mod</span>
                      <span className="menu-play-btn-sub">Rastgele seed · pratik yap, sınır yok</span>
                    </span>
                    <UiIcon name="arrow-right" className="menu-play-btn-arrow" />
                  </button>
                </div>
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
      </motion.div>

      <AnimatePresence>
        {menuDialog && (
          <motion.div
            className="menu-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuDialog(null)}
          >
            <motion.div
              className={`menu-dialog menu-dialog--${menuDialog}`}
              role="dialog"
              aria-modal="true"
              aria-label={menuDialog === 'help' ? 'Bilmen gerekenler' : 'Skor tablosu'}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
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
              {menuDialog === 'help' ? <MenuBiteTipsWidget /> : <MenuLeaderboardWidget initialExpanded />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <StartRunModal
        open={startPrompt !== null}
        daily={startPrompt?.daily ?? true}
        defaultName={stats.lastPlayerName}
        onConfirm={confirmStart}
        onCancel={() => setStartPrompt(null)}
      />
    </div>
  );
}

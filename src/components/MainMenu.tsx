import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchTodayRunStartCount, isRemoteLeaderboardEnabled } from '@/api/leaderboardRemote';
import { formatDailyDate } from '@/engine/seed';
import { formatScore } from '@/engine/scoring';
import { getTodayKey } from '@/engine/leaderboard';
import { getDailyStreakBonus } from '@/engine/dailyStreak';
import { MenuBiteTipsWidget } from '@/components/MenuBiteTipsWidget';
import { MenuLeaderboardWidget } from '@/components/MenuLeaderboardWidget';
import { MenuDailyScoreChart } from '@/components/MenuDailyScoreChart';
import { StartRunModal } from '@/components/StartRunModal';
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
  useEffect(() => {
    if (!isRemoteLeaderboardEnabled()) return;
    let cancelled = false;
    fetchTodayRunStartCount()
      .then((count) => { if (!cancelled) setRemoteTodayRuns(count); })
      .catch(() => { /* sessiz */ });
    return () => { cancelled = true; };
  }, []);
  const todayRuns = remoteTodayRuns ?? localTodayRuns;

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

  const quickLinks = [
    { icon: '📖', label: 'Nasıl Oynanır & Rehber', desc: 'Kurallar + tag, taktik, sinerji ve mevki rehberi', screen: 'gameGuide' as const },
    { icon: '🗃️', label: 'Koleksiyon', desc: 'Açtığın sinerji, efsane ve olayları topla', screen: 'collection' as const },
    { icon: '🏛️', label: 'Hall of Fame', desc: 'Aylık ve tüm zamanlar rekor tablosu', screen: 'hallOfFame' as const },
    { icon: '⚡', label: 'Sinerjiler', desc: '29 kombinasyon — bonus koşulları', screen: 'synergies' as const },
    { icon: '⚙️', label: 'Ayarlar', desc: 'Ses ve oyun tercihleri', screen: 'settings' as const },
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
              <span className="menu-hero-ball" aria-hidden>⚽</span>
              Bir Daha
            </h1>
            <p className="menu-hero-tagline">Aynı seed. Farklı sen.</p>
            {stats.dailyStreak > 1 && getDailyStreakBonus(stats.dailyStreak).label && (
              <p className="menu-streak">
                <span className="menu-streak-bonus">{getDailyStreakBonus(stats.dailyStreak).label}</span>
              </p>
            )}
          </div>

          <div className="menu-top-stats">
            <div className="menu-stat-card">
              <div className="menu-stat-icon-row">
                <span className="menu-stat-icon">🏅</span>
                <span className="menu-stat-label">Senin En İyin</span>
              </div>
              <p className="menu-stat-value menu-stat-value--big">{formatScore(stats.allTimeBest)}</p>
              <p className="menu-stat-sub">kişisel rekor</p>
            </div>
            <div className="menu-stat-card">
              <div className="menu-stat-icon-row">
                <span className="menu-stat-icon">🌍</span>
                <span className="menu-stat-label">Bugün Oynanan</span>
              </div>
              <p className="menu-stat-value menu-stat-value--big">{formatScore(todayRuns)}</p>
              <p className="menu-stat-sub">{remoteTodayRuns !== null ? 'başlatılan run' : 'bu cihazda'}</p>
            </div>
            <div className={`menu-stat-card ${stats.dailyStreak > 1 ? 'menu-stat-card--gold' : ''}`}>
              <div className="menu-stat-icon-row">
                <span className="menu-stat-icon">🔥</span>
                <span className="menu-stat-label">Seri</span>
              </div>
              <p className="menu-stat-value menu-stat-value--big menu-stat-value--gold">{stats.dailyStreak} gün</p>
              <p className="menu-stat-sub">üst üste oyna</p>
            </div>
            <div className="menu-stat-card">
              <div className="menu-stat-icon-row">
                <span className="menu-stat-icon">🎲</span>
                <span className="menu-stat-label">Bugünkü Seed</span>
              </div>
              <p className="menu-stat-value">{formatDailyDate()}</p>
              <p className="menu-stat-sub">{new Date().getFullYear()}</p>
            </div>
          </div>
        </header>

        <div className="menu-main">
          <div className="menu-body">
            <section className="menu-play-panel">
              <div className="menu-play-panel-inner">
                <div className="menu-play-content">
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
                      <p className="menu-play-hint-title">15 round · 11 oyuncu · tek hayat</p>
                      <p className="menu-play-hint-sub">Kart seç, maç oyna, kaybedersen oyuncu gider</p>
                    </div>
                  )}

                  <MenuDailyScoreChart />

                </div>

                <div className="menu-play-actions">
                  <button type="button" className="btn-secondary menu-play-btn menu-play-btn--free" onClick={() => handlePlayClick(false)}>
                    <span className="menu-play-btn-icon">🎲</span>
                    <span>
                      <span className="menu-play-btn-label">Serbest Mod — Rastgele Seed</span>
                      <span className="menu-play-btn-sub">Her oyunda yeni kadro · pratik yap, sınır yok</span>
                    </span>
                    <span className="menu-play-btn-arrow" aria-hidden>→</span>
                  </button>
                  <button type="button" className="btn-primary menu-play-btn" onClick={() => handlePlayClick(true)}>
                    <span className="menu-play-btn-icon">▶</span>
                    <span>
                      <span className="menu-play-btn-label">Oyna — Günlük Seed</span>
                      <span className="menu-play-btn-sub">Herkes aynı kartları görür · skor kıyaslanır</span>
                    </span>
                    <span className="menu-play-btn-arrow" aria-hidden>→</span>
                  </button>
                </div>
              </div>
            </section>

            <aside className="menu-side-stack">
              <MenuLeaderboardWidget initialExpanded />
            </aside>

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
                  x
                </button>
              </div>
            )}

            <MenuBiteTipsWidget />
          </div>

          <footer className="menu-footer">
            {quickLinks.map((link) => (
              <button
                key={link.screen}
                type="button"
                className="menu-footer-tile"
                onClick={() => setScreen(link.screen)}
              >
                <span className="menu-footer-icon">{link.icon}</span>
                <span className="menu-footer-label">{link.label}</span>
                <span className="menu-footer-desc">{link.desc}</span>
              </button>
            ))}
          </footer>
        </div>
      </motion.div>

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

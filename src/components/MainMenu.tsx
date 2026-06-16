import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDailyDate } from '@/engine/seed';
import { formatScore } from '@/engine/scoring';
import { getDailyStreakBonus } from '@/engine/dailyStreak';
import { MenuBiteTipsWidget } from '@/components/MenuBiteTipsWidget';
import { MenuHowToWidget } from '@/components/MenuHowToWidget';
import { MenuLeaderboardWidget } from '@/components/MenuLeaderboardWidget';
import { MenuDailyScoreChart } from '@/components/MenuDailyScoreChart';
import { StartRunModal } from '@/components/StartRunModal';
import { getPersistedStats, useGameStore } from '@/store/gameStore';
import { loadPersisted } from '@/utils/storage';

export function MainMenu() {
  const startRun = useGameStore((s) => s.startRun);
  const continueRun = useGameStore((s) => s.continueRun);
  const abandonRun = useGameStore((s) => s.abandonRun);
  const setScreen = useGameStore((s) => s.setScreen);
  const showContinuePrompt = useGameStore((s) => s.showContinuePrompt);
  const stats = getPersistedStats();

  const [startPrompt, setStartPrompt] = useState<{ daily: boolean; afterAbandon?: boolean } | null>(null);

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

            <div className="menu-hero-records">
              <div className="menu-hero-record">
                <span className="menu-hero-record-label">Senin en iyin</span>
                <span className="menu-hero-record-value">{formatScore(stats.allTimeBest)}</span>
              </div>
              <div className="menu-hero-record menu-hero-record--today">
                <span className="menu-hero-record-label">Günün rekoru</span>
                <span className="menu-hero-record-value">{formatScore(stats.todayScore)}</span>
              </div>
              <div className={`menu-hero-record menu-hero-record--streak ${stats.dailyStreak > 1 ? 'is-hot' : ''}`}>
                <span className="menu-hero-record-label">🔥 Seri</span>
                <span className="menu-hero-record-value">{stats.dailyStreak} gün</span>
              </div>
            </div>

            {stats.dailyStreak > 1 && getDailyStreakBonus(stats.dailyStreak).label && (
              <p className="menu-streak">
                <span className="menu-streak-bonus">{getDailyStreakBonus(stats.dailyStreak).label}</span>
              </p>
            )}
          </div>

          <div className="menu-top-stats">
            <div className="menu-stat-card">
              <span className="menu-stat-icon">🎲</span>
              <div>
                <p className="menu-stat-label">Bugünkü seed</p>
                <p className="menu-stat-value">{formatDailyDate()}</p>
              </div>
            </div>
            <div className="menu-stat-card menu-stat-card--gold">
              <span className="menu-stat-icon">🏃</span>
              <div>
                <p className="menu-stat-label">Toplam run</p>
                <p className="menu-stat-value menu-stat-value--big">{stats.totalRuns}</p>
              </div>
            </div>
            <div className="menu-stat-card">
              <span className="menu-stat-icon">📅</span>
              <div>
                <p className="menu-stat-label">Bugünkü en iyi</p>
                <p className="menu-stat-value menu-stat-value--big">{formatScore(stats.todayScore)}</p>
              </div>
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
                  <button type="button" className="btn-primary menu-play-btn" onClick={() => handlePlayClick(true)}>
                    <span className="menu-play-btn-icon">▶</span>
                    <span>
                      <span className="menu-play-btn-label">Oyna — Günlük Seed</span>
                      <span className="menu-play-btn-sub">Herkes aynı kartları görür · skor kıyaslanır</span>
                    </span>
                  </button>
                  <button type="button" className="btn-secondary menu-play-btn menu-play-btn--free" onClick={() => handlePlayClick(false)}>
                    <span className="menu-play-btn-icon">🎲</span>
                    <span>
                      <span className="menu-play-btn-label">Serbest Mod — rastgele seed</span>
                      <span className="menu-play-btn-sub">Her oyunda yeni kadro · pratik yap, sınır yok</span>
                    </span>
                  </button>
                </div>
              </div>
            </section>

            <aside className="menu-side-stack">
              <MenuLeaderboardWidget />
              <MenuHowToWidget />
            </aside>

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

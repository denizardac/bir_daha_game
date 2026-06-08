import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDailyDate } from '@/engine/seed';
import { formatScore } from '@/engine/scoring';
import { getDailyStreakBonus } from '@/engine/dailyStreak';
import { getDailyList } from '@/engine/leaderboard';
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
  const dailyPlayers = getDailyList(stats).length;

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

  const handleNewRunFromContinue = () => {
    const saved = loadPersisted().currentRun;
    openStart(saved?.isDailySeed ?? true, true);
  };

  const quickLinks = [
    { icon: '📖', label: 'Oyun Rehberi', desc: 'Tag, taktik, sinerji ve mevki rehberi', screen: 'gameGuide' as const },
    { icon: '🏛️', label: 'Hall of Fame', desc: 'Aylık ve tüm zamanlar rekor tablosu', screen: 'hallOfFame' as const },
    { icon: '⚡', label: 'Sinerjiler', desc: '22 kombinasyon — bonus koşulları', screen: 'synergies' as const },
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
            {stats.dailyStreak > 1 && (
              <p className="menu-streak">
                🔥 {stats.dailyStreak} gün üst üste
                {getDailyStreakBonus(stats.dailyStreak).label && (
                  <span className="menu-streak-bonus"> · {getDailyStreakBonus(stats.dailyStreak).label}</span>
                )}
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
                        <p className="menu-continue-sub">Kaldığın yerden devam et veya yeni başla</p>
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

                  <div className="menu-daily-stats">
                    <div className="menu-daily-stat">
                      <span className="menu-daily-stat-num">{dailyPlayers}</span>
                      <span className="menu-daily-stat-label">kişi bugün oynadı</span>
                    </div>
                    {stats.allTimeBest > 0 && (
                      <div className="menu-daily-stat">
                        <span className="menu-daily-stat-num">{formatScore(stats.allTimeBest)}</span>
                        <span className="menu-daily-stat-label">tüm zamanlar rekoru</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="menu-play-actions">
                  <button type="button" className="btn-primary menu-play-btn" onClick={() => openStart(true)}>
                    <span className="menu-play-btn-icon">▶</span>
                    <span>
                      <span className="menu-play-btn-label">Oyna — Günlük Seed</span>
                      <span className="menu-play-btn-sub">Herkes aynı kartları görür · skor kıyaslanır</span>
                    </span>
                  </button>
                  <button type="button" className="btn-secondary menu-play-btn-alt" onClick={() => openStart(false)}>
                    Serbest Mod — rastgele seed
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

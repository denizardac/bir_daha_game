import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useGameStore } from '@/store/gameStore';

interface AppErrorBoundaryProps {
  children: ReactNode;
  reload?: () => void;
  saveCurrentRun?: () => void;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application screen failed to render.', error, info);
  }

  private reload = () => {
    const saveCurrentRun = this.props.saveCurrentRun
      ?? (() => useGameStore.getState().saveCurrentRun());

    try {
      saveCurrentRun();
    } finally {
      (this.props.reload ?? (() => window.location.reload()))();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="runtime-recovery" role="alert">
        <section className="runtime-recovery__card">
          <span className="runtime-recovery__eyebrow">SÜRÜM SENKRONU</span>
          <h1>Yeni sürüme geçelim</h1>
          <p>
            İlerlemen korunuyor. Yayın sırasında açık kalan ekran dosyası eskimiş;
            yenileyince kaldığın yerden devam edebilirsin.
          </p>
          <button type="button" onClick={this.reload}>Şimdi yenile</button>
        </section>
      </main>
    );
  }
}

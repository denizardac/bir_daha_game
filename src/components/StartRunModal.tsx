import { useEffect, useRef, type FormEvent } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  open: boolean;
  daily: boolean;
  defaultName?: string;
  /** Meydan okuma kabul edildiyse geçilmesi gereken skor */
  rivalScore?: number;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const MAX_NAME_LEN = 18;

export function StartRunModal({ open, daily, defaultName = '', rivalScore, onConfirm, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, open, onCancel);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const raw = inputRef.current?.value ?? defaultName;
    const name = raw.trim().slice(0, MAX_NAME_LEN) || 'Anonim';
    onConfirm(name);
  };

  return (
    <div className="start-run-overlay" role="presentation" onClick={onCancel}>
      <div
        ref={modalRef}
        className="start-run-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-run-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="start-run-badge">
          {rivalScore !== undefined ? 'Meydan Okuma' : daily ? 'Günlük Ranked' : 'Serbest Mod'}
        </p>
        <h2 id="start-run-title" className="start-run-title">Run&apos;a başlamadan önce</h2>
        {rivalScore !== undefined && rivalScore > 0 && (
          <p className="start-run-rival">
            Geçmen gereken skor: <strong>{rivalScore.toLocaleString('tr-TR')}</strong>
          </p>
        )}
        <p className="start-run-sub">
          {rivalScore !== undefined
            ? 'Teknik direktör adını yaz. Bağlantıdaki kartlar ve olay akışı aynı seed ile yeniden kurulacak.'
            : daily
            ? 'Ranked tablosu ve paylaşım kartında görünecek isim. Her run için seçebilirsin.'
            : 'Run özeti ve paylaşım kartında görünecek isim. Serbest Mod sıralamaya yazılmaz.'}
        </p>

        <form onSubmit={submit} className="start-run-form">
          <label className="start-run-label">
            Teknik direktör adı
            <input
              ref={inputRef}
              className="start-run-input"
              type="text"
              defaultValue={defaultName}
              maxLength={MAX_NAME_LEN}
              placeholder="Örn: Deniz"
              autoComplete="nickname"
            />
          </label>
          <div className="start-run-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Vazgeç
            </button>
            <button type="submit" className="btn-primary">
              {rivalScore !== undefined ? 'Aynı seed ile başla' : 'Başla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import {
  createContext,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  submitFeedback,
  validateFeedback,
  type FeedbackCategory,
} from '@/api/feedbackRemote';
import { UiIcon, type UiIconName } from '@/components/UiIcon';
import { useGameStore } from '@/store/gameStore';
import { getAnonymousId } from '@/utils/storage';

type FeedbackContextValue = { openFeedback: () => void };

// Ekran bileşenleri izole testlerde provider olmadan da render edilebilsin.
const FeedbackContext = createContext<FeedbackContextValue>({ openFeedback: () => {} });

const CATEGORIES: Array<{
  value: FeedbackCategory;
  label: string;
  description: string;
  icon: UiIconName;
}> = [
  { value: 'bug', label: 'Hata', description: 'Bir şey çalışmadı', icon: 'alert-triangle' },
  { value: 'balance', label: 'Oyun dengesi', description: 'Çok kolay veya zor', icon: 'scale' },
  { value: 'suggestion', label: 'Öneri', description: 'Oyunu geliştirecek fikir', icon: 'lightbulb' },
  { value: 'other', label: 'Diğer', description: 'Başka bir konu', icon: 'message' },
];

const VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : undefined;

export function useFeedback() {
  return useContext(FeedbackContext);
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<'editing' | 'sending' | 'sent'>('editing');
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstRadioRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();

  const screen = useGameStore((state) => state.screen);
  const phase = useGameStore((state) => state.phase);
  const round = useGameStore((state) => state.round);
  const seed = useGameStore((state) => state.seed);

  const openFeedback = useCallback(() => {
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setError('');
    setStatus('editing');
    setOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    if (status === 'sending') return;
    setOpen(false);
    globalThis.setTimeout(() => restoreFocusRef.current?.focus(), 0);
  }, [status]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    globalThis.setTimeout(() => firstRadioRef.current?.focus(), 0);

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFeedback();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeFeedback, open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateFeedback({ category, message, contact });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setStatus('sending');
    const result = await submitFeedback({
      category,
      message,
      contact,
      website,
      playerId: getAnonymousId(),
      screen,
      phase: screen === 'game' ? phase : undefined,
      round: screen === 'game' ? round : undefined,
      seed: screen === 'game' ? seed : undefined,
      clientVersion: VERSION,
      platform: navigator.userAgent.slice(0, 200),
    });

    if (!result.ok) {
      setStatus('editing');
      setError(result.error);
      return;
    }

    setStatus('sent');
    setMessage('');
    setContact('');
    setWebsite('');
  };

  const stopCategoryArrowScroll = (event: ReactKeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.stopPropagation();
  };

  return (
    <FeedbackContext.Provider value={{ openFeedback }}>
      {children}
      {open && (
        <div className="feedback-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeFeedback();
        }}>
          <div
            ref={dialogRef}
            className="feedback-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <div className="feedback-dialog-accent" aria-hidden />
            <header className="feedback-dialog-head">
              <div>
                <span className="feedback-kicker"><UiIcon name="message" /> Saha kenarı hattı</span>
                <h2 id={titleId}>Bize not bırak</h2>
                <p id={descriptionId}>Hataları, denge sorunlarını ve fikirlerini doğrudan ekibe ilet.</p>
              </div>
              <button type="button" className="feedback-close" onClick={closeFeedback} aria-label="Geri bildirim kutusunu kapat" disabled={status === 'sending'}>
                <UiIcon name="x" />
              </button>
            </header>

            {status === 'sent' ? (
              <div className="feedback-success" role="status">
                <span className="feedback-success-icon"><UiIcon name="check" /></span>
                <span className="feedback-success-kicker">Not alındı</span>
                <h3>Takımın önüne düştü.</h3>
                <p>İletişim bilgisi bıraktıysan gerektiğinde sana oradan ulaşacağız.</p>
                <button type="button" className="feedback-submit" onClick={closeFeedback}>Tamam</button>
              </div>
            ) : (
              <form className="feedback-form" onSubmit={handleSubmit} noValidate>
                <fieldset className="feedback-categories" onKeyDown={stopCategoryArrowScroll}>
                  <legend>Sorun tipi</legend>
                  <div className="feedback-category-grid">
                    {CATEGORIES.map((item, index) => (
                      <label key={item.value} className={`feedback-category ${category === item.value ? 'feedback-category--selected' : ''}`}>
                        <input
                          ref={index === 0 ? firstRadioRef : undefined}
                          type="radio"
                          name="feedback-category"
                          value={item.value}
                          checked={category === item.value}
                          onChange={() => setCategory(item.value)}
                        />
                        <UiIcon name={item.icon} />
                        <span><strong>{item.label}</strong><small>{item.description}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="feedback-field" htmlFor={`${titleId}-message`}>
                  <span><strong>Ne oldu, ne öneriyorsun?</strong><small>{message.length}/2000</small></span>
                  <textarea
                    id={`${titleId}-message`}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={2_000}
                    rows={5}
                    placeholder="Örn. 8. roundda oyuncu kartını seçince maç ekranı açılmadı…"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    disabled={status === 'sending'}
                  />
                </label>

                <label className="feedback-field" htmlFor={`${titleId}-contact`}>
                  <span><strong>Sana nasıl ulaşalım?</strong><em>İsteğe bağlı</em></span>
                  <input
                    id={`${titleId}-contact`}
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    maxLength={160}
                    placeholder="E-posta veya Discord kullanıcı adı"
                    autoComplete="email"
                    disabled={status === 'sending'}
                  />
                </label>

                <label className="feedback-honeypot" aria-hidden="true">
                  Website
                  <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" />
                </label>

                <div className="feedback-context-slip">
                  <UiIcon name="shield" />
                  <p><strong>Teşhis bilgisi eklenir</strong><span>Ekran{screen === 'game' ? ` · ${phase} · Round ${round}` : ''} ve cihaz bilgisi. İletişim alanı yalnızca yanıt vermek için kullanılır.</span></p>
                </div>

                {error && <p id={errorId} className="feedback-error" role="alert"><UiIcon name="alert-triangle" /> {error}</p>}

                <div className="feedback-actions">
                  <button type="button" className="feedback-cancel" onClick={closeFeedback} disabled={status === 'sending'}>Vazgeç</button>
                  <button type="submit" className="feedback-submit" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Gönderiliyor…' : <><UiIcon name="message" /> Notu gönder</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { UiIcon } from '@/components/UiIcon';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  menu?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'İptal',
  danger,
  menu,
  onConfirm,
  onCancel,
}: Props) {
  const icon = danger ? 'alert-triangle' : menu ? 'home' : 'info';
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, true, onCancel);
  useBodyScrollLock(true);

  return (
    <motion.div
      className="confirm-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        ref={modalRef}
        className={`confirm-modal ${menu ? 'confirm-modal--menu' : ''} ${danger ? 'confirm-modal--danger' : ''}`}
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <span className="confirm-modal-icon" aria-hidden><UiIcon name={icon} /></span>
        <h2 id="confirm-modal-title" className="confirm-modal-title">{title}</h2>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="confirm-modal-btn confirm-modal-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal-btn confirm-modal-btn--confirm ${danger ? 'confirm-modal-btn--danger' : ''} ${menu ? 'confirm-modal-btn--menu' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

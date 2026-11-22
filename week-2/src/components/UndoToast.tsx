import { useEffect, useRef, useState } from 'react';
import styles from './UndoToast.module.css';

const VISIBLE_FOR_MS = 8000;

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  // The countdown pauses while the pointer or focus is on the toast, so nobody loses the
  // chance to undo because they were slow to reach the button.
  const [isPaused, setIsPaused] = useState(false);
  const undoButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    undoButton.current?.focus();
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timeout = setTimeout(onDismiss, VISIBLE_FOR_MS);
    return () => {
      clearTimeout(timeout);
    };
  }, [isPaused, onDismiss]);

  return (
    <div
      className={styles.toast}
      role="status"
      onMouseEnter={() => {
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        setIsPaused(false);
      }}
      onFocus={() => {
        setIsPaused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDismiss();
      }}
    >
      <p>{message}</p>
      <button ref={undoButton} type="button" className={styles.undo} onClick={onUndo}>
        Undo
      </button>
      <button
        type="button"
        className={styles.close}
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}

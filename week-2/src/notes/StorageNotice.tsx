import { useState } from 'react';
import { useSaveFailed } from './notesContext.ts';
import { BACKUP_KEY, type LoadResult } from './storage.ts';
import styles from './StorageNotice.module.css';

function loadMessage(result: LoadResult): string | null {
  switch (result.status) {
    case 'ok':
      return null;
    case 'partial':
      return result.discarded === 1
        ? "1 saved note couldn't be read and was skipped."
        : `${result.discarded} saved notes couldn't be read and were skipped.`;
    case 'corrupt':
      return `Your saved notes couldn't be read. A copy was kept in localStorage under "${BACKUP_KEY}".`;
  }
}

export function StorageNotice({ loadResult }: { loadResult: LoadResult }) {
  const saveFailed = useSaveFailed();
  const [loadNoticeDismissed, setLoadNoticeDismissed] = useState(false);

  if (saveFailed) {
    return (
      <div className={styles.notice} role="alert">
        <p>
          Changes aren't being saved. Your browser's storage may be full or turned off.
          Copy anything important somewhere else before closing this tab.
        </p>
      </div>
    );
  }

  const message = loadNoticeDismissed ? null : loadMessage(loadResult);
  if (!message) return null;

  return (
    <div className={styles.notice} role="alert">
      <p>{message}</p>
      <button
        type="button"
        className="button button--ghost"
        onClick={() => {
          setLoadNoticeDismissed(true);
        }}
      >
        Dismiss
      </button>
    </div>
  );
}

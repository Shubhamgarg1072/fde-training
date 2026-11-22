import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { TAGS_PER_NOTE_MAX, tagSchema } from './schema.ts';
import styles from './TagEditor.module.css';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  function commitDraft() {
    if (draft.trim() === '') return;

    const result = tagSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'That tag is not valid');
      return;
    }
    if (!tags.includes(result.data)) {
      if (tags.length >= TAGS_PER_NOTE_MAX) {
        setError(`A note can have up to ${TAGS_PER_NOTE_MAX} tags`);
        return;
      }
      onChange([...tags, result.data]);
    }
    setDraft('');
    setError(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitDraft();
    } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((existing) => existing !== tag));
    // The remove button disappears with the tag, so give focus somewhere predictable.
    inputRef.current?.focus();
  }

  return (
    <div className={styles.tagEditor}>
      {tags.length > 0 && (
        <ul className={styles.tags} role="list" aria-label="Tags">
          {tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              <span aria-hidden="true">#</span>
              {tag}
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove tag ${tag}`}
                onClick={() => {
                  removeTag(tag);
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={inputId} className="visually-hidden">
        Add a tag
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className={styles.input}
        value={draft}
        placeholder="Add a tag"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
      />
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

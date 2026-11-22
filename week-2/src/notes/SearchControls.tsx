import { useId } from 'react';
import styles from './SearchControls.module.css';

interface SearchControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export function SearchControls({
  query,
  onQueryChange,
  tags,
  activeTag,
  onTagChange,
}: SearchControlsProps) {
  const searchId = useId();

  return (
    <search className={styles.controls}>
      <label htmlFor={searchId} className="visually-hidden">
        Search notes
      </label>
      <input
        id={searchId}
        type="search"
        className={styles.search}
        placeholder="Search notes"
        value={query}
        autoComplete="off"
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
      />

      {tags.length > 0 && (
        <fieldset className={styles.tags}>
          <legend className="visually-hidden">Filter by tag</legend>
          {[null, ...tags].map((tag) => (
            <label key={tag ?? 'all'} className={styles.chip}>
              <input
                type="radio"
                name="tag-filter"
                checked={tag === activeTag}
                onChange={() => {
                  onTagChange(tag);
                }}
              />
              {tag === null ? 'All' : `#${tag}`}
            </label>
          ))}
        </fieldset>
      )}
    </search>
  );
}

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App.tsx';
import { STORAGE_KEY } from './notes/storage.ts';

async function createNote(
  user: ReturnType<typeof userEvent.setup>,
  title: string,
  body = '',
) {
  await user.click(screen.getByRole('button', { name: 'New note' }));
  await user.type(screen.getByRole('textbox', { name: 'Title' }), title);
  if (body) await user.type(screen.getByRole('textbox', { name: 'Note' }), body);
}

function noteList() {
  return within(screen.getByRole('navigation', { name: 'Notes' }));
}

describe('Margin', () => {
  it('starts with an empty state', () => {
    render(<App />);
    expect(screen.getByText('No notes yet. Create your first one.')).toBeInTheDocument();
  });

  it('creates a note, focuses its title and saves it to localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'New note' }));
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();

    await user.keyboard('Groceries');
    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'Oat milk');

    expect(noteList().getByRole('button', { name: /Groceries/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toContain('Oat milk');
    });
  });

  it('filters the list as you search', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createNote(user, 'Groceries', 'Oat milk');
    await createNote(user, 'Sprint retro', 'Smaller PRs');

    await user.type(screen.getByRole('searchbox', { name: 'Search notes' }), 'oat');

    await waitFor(() => {
      expect(
        noteList().queryByRole('button', { name: /Sprint retro/ }),
      ).not.toBeInTheDocument();
    });
    expect(noteList().getByRole('button', { name: /Groceries/ })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 matching note');
  });

  it('filters by tag', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createNote(user, 'Groceries');
    await user.type(screen.getByRole('textbox', { name: 'Add a tag' }), 'home{Enter}');
    await createNote(user, 'Sprint retro');

    await user.click(screen.getByRole('radio', { name: '#home' }));

    expect(noteList().getAllByRole('button')).toHaveLength(1);
    expect(noteList().getByRole('button', { name: /Groceries/ })).toBeInTheDocument();
  });

  it('rejects an invalid tag with a message', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createNote(user, 'Groceries');

    await user.type(
      screen.getByRole('textbox', { name: 'Add a tag' }),
      'two words{Enter}',
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tags can only use letters, numbers and dashes',
    );
    expect(screen.getByRole('textbox', { name: 'Add a tag' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('deletes a note and brings it back with undo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createNote(user, 'Groceries', 'Oat milk');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(
      noteList().queryByRole('button', { name: /Groceries/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(noteList().getByRole('button', { name: /Groceries/ })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Oat milk');
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus();
  });

  it('returns focus to the note in the list when the editor closes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createNote(user, 'Groceries');

    await user.click(screen.getByRole('button', { name: 'All notes' }));

    expect(noteList().getByRole('button', { name: /Groceries/ })).toHaveFocus();
  });

  it('keeps pinned notes at the top', async () => {
    const user = userEvent.setup();
    render(<App />);
    await createNote(user, 'Wifi password');
    await user.click(screen.getByRole('button', { name: 'Pin' }));
    await createNote(user, 'Groceries');

    const titles = noteList()
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(titles[0]).toMatch(/^Wifi password, pinned/);
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('restores notes from a previous visit', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        notes: [
          {
            id: 'a',
            title: 'From last time',
            body: '',
            tags: [],
            pinned: false,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          { id: 'b', title: 7 },
        ],
      }),
    );
    render(<App />);

    expect(
      noteList().getByRole('button', { name: /From last time/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      "1 saved note couldn't be read and was skipped.",
    );
  });
});

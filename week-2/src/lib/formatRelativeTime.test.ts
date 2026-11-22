import { formatRelativeTime } from './formatRelativeTime.ts';

const now = new Date('2026-03-10T12:00:00.000Z').getTime();

describe('formatRelativeTime', () => {
  it.each([
    ['2026-03-10T11:59:40.000Z', 'just now'],
    ['2026-03-10T11:55:00.000Z', '5 minutes ago'],
    ['2026-03-10T09:00:00.000Z', '3 hours ago'],
    ['2026-03-09T12:00:00.000Z', 'yesterday'],
    ['2026-02-24T12:00:00.000Z', '2 weeks ago'],
  ])('formats %s as "%s"', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});

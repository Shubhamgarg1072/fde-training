import type { User } from '../auth/schemas.ts';

export const DEMO_EMAIL = 'ops@slowpour.example';
export const DEMO_PASSWORD = 'brew-better';

export const users: (User & { password: string })[] = [
  { id: 'u_1', name: 'Priya Raman', email: DEMO_EMAIL, password: DEMO_PASSWORD },
];

export function publicUser(id: string): User | undefined {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) return undefined;
  return { id: user.id, name: user.name, email: user.email };
}

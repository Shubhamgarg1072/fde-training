import { HttpResponse, http } from 'msw';
import { credentialsSchema } from '../../auth/schemas.ts';
import { db } from '../db.ts';
import { publicUser, users } from '../users.ts';
import { networkDelay } from './networkDelay.ts';

export const ACCESS_TOKEN_TTL_SECONDS = 5 * 60;
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

// A real API would add HttpOnly and Secure. MSW sets mocked cookies through
// document.cookie, which can't write HttpOnly cookies, so the mock leaves them off.
function refreshCookie(token: string, maxAge = REFRESH_TTL_SECONDS) {
  return `${REFRESH_COOKIE}=${token}; Path=/; Max-Age=${String(maxAge)}; SameSite=Strict`;
}

function randomToken() {
  return crypto.randomUUID().replaceAll('-', '');
}

function issueSession(userId: string, familyId: string) {
  const sessions = db.sessions();
  const accessToken = randomToken();
  const refreshToken = randomToken();
  sessions.accessTokens[accessToken] = {
    userId,
    familyId,
    expiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
  };
  sessions.refreshTokens[refreshToken] = { userId, familyId, usedAt: null };
  db.saveSessions(sessions);

  return HttpResponse.json(
    { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS, user: publicUser(userId) },
    { headers: { 'Set-Cookie': refreshCookie(refreshToken) } },
  );
}

function revokeFamily(familyId: string) {
  const sessions = db.sessions();
  const keepOtherFamilies = ([, record]: [string, { familyId: string }]) =>
    record.familyId !== familyId;
  db.saveSessions({
    refreshTokens: Object.fromEntries(
      Object.entries(sessions.refreshTokens).filter(keepOtherFamilies),
    ),
    accessTokens: Object.fromEntries(
      Object.entries(sessions.accessTokens).filter(keepOtherFamilies),
    ),
  });
}

function unauthorized(message: string) {
  return HttpResponse.json(
    { message },
    { status: 401, headers: { 'Set-Cookie': refreshCookie('', 0) } },
  );
}

export function authenticatedUserId(request: Request): string | null {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) return null;
  const record = db.sessions().accessTokens[token];
  if (!record || record.expiresAt < Date.now()) return null;
  return record.userId;
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await networkDelay();
    const credentials = credentialsSchema.safeParse(await request.json());
    const user =
      credentials.success &&
      users.find(
        (candidate) =>
          candidate.email === credentials.data.email.toLowerCase() &&
          candidate.password === credentials.data.password,
      );
    if (!user) {
      return HttpResponse.json(
        { message: 'Email or password is incorrect.' },
        { status: 401 },
      );
    }
    return issueSession(user.id, randomToken());
  }),

  http.post('/api/auth/refresh', async ({ cookies }) => {
    await networkDelay();
    const token = cookies[REFRESH_COOKIE];
    if (!token) return unauthorized('No session.');

    const sessions = db.sessions();
    const record = sessions.refreshTokens[token];
    if (!record) return unauthorized('Session expired.');

    // Rotation: each refresh token works once. Seeing one again means it was copied,
    // so the whole family is revoked and everyone holding it has to sign in again.
    if (record.usedAt !== null) {
      revokeFamily(record.familyId);
      return unauthorized('Session revoked.');
    }

    record.usedAt = Date.now();
    db.saveSessions(sessions);
    return issueSession(record.userId, record.familyId);
  }),

  http.post('/api/auth/logout', async ({ cookies }) => {
    await networkDelay();
    const token = cookies[REFRESH_COOKIE];
    const record = token ? db.sessions().refreshTokens[token] : undefined;
    if (record) revokeFamily(record.familyId);
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': refreshCookie('', 0) },
    });
  }),
];

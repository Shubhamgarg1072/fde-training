import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { useAuthStore } from '../auth/authStore.ts';
import { api } from './apiClient.ts';

const user = { id: 'u_1', name: 'Priya Raman', email: 'ops@slowpour.example' };
let refreshCalls = 0;
let validToken = 'fresh-token';

const server = setupServer(
  http.get('/api/orders', ({ request }) => {
    const auth = request.headers.get('Authorization');
    return auth === `Bearer ${validToken}`
      ? HttpResponse.json({ ok: true })
      : HttpResponse.json({ message: 'Not signed in.' }, { status: 401 });
  }),
  http.post('/api/auth/refresh', () => {
    refreshCalls += 1;
    return HttpResponse.json({ accessToken: validToken, expiresIn: 300, user });
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

beforeEach(() => {
  refreshCalls = 0;
  validToken = 'fresh-token';
  useAuthStore.setState({ status: 'signedIn', accessToken: 'stale-token', user });
});

describe('api client', () => {
  it('sends the access token as a bearer header', async () => {
    useAuthStore.setState({ accessToken: 'fresh-token' });
    await expect(api.get('/orders')).resolves.toMatchObject({ status: 200 });
    expect(refreshCalls).toBe(0);
  });

  it('refreshes once for parallel 401s and replays every request', async () => {
    const responses = await Promise.all([
      api.get('/orders'),
      api.get('/orders'),
      api.get('/orders'),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(refreshCalls).toBe(1);
    expect(useAuthStore.getState().accessToken).toBe('fresh-token');
  });

  it('signs out as expired when the refresh is rejected', async () => {
    server.use(
      http.post('/api/auth/refresh', () =>
        HttpResponse.json({ message: 'Session revoked.' }, { status: 401 }),
      ),
    );

    await expect(api.get('/orders')).rejects.toMatchObject({ response: { status: 401 } });
    expect(useAuthStore.getState()).toMatchObject({
      status: 'expired',
      accessToken: null,
    });
  });

  it('does not loop when the replayed request is rejected again', async () => {
    validToken = 'never-matches';
    server.use(
      http.post('/api/auth/refresh', () => {
        refreshCalls += 1;
        return HttpResponse.json({ accessToken: 'still-wrong', expiresIn: 300, user });
      }),
    );

    await expect(api.get('/orders')).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshCalls).toBe(1);
  });

  it('does not try to refresh a failed login', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { message: 'Email or password is incorrect.' },
          { status: 401 },
        ),
      ),
    );

    await expect(api.post('/auth/login', {})).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshCalls).toBe(0);
  });
});

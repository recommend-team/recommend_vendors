import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, request } from './api';
import { clearSession, getAccessToken, storeSession } from './auth';
import type { AuthUser } from './contract';

const user = { id: 'v1', email: 'v@example.com', role: 'SELLER' } as AuthUser;

/** A backend response, in the envelope the interceptor always wraps things in. */
const envelope = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify({ success: true, message: 'ok', data }), {
    status: 200,
    ...init,
  });

const failure = (status: number, message: string) =>
  new Response(JSON.stringify({ success: false, message }), { status });

describe('request', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearSession();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('unwraps the envelope so callers never see it', async () => {
    fetchMock.mockResolvedValue(envelope({ items: [1, 2] }));

    await expect(request('/sellers/orders')).resolves.toEqual({
      items: [1, 2],
    });
  });

  it('sends the access token when there is one', async () => {
    storeSession({ accessToken: 'access-1', refreshToken: 'r1', user });
    fetchMock.mockResolvedValue(envelope(null));

    await request('/sellers/profile');

    const headers = fetchMock.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe('Bearer access-1');
  });

  it('sends no token when the call is anonymous', async () => {
    storeSession({ accessToken: 'access-1', refreshToken: 'r1', user });
    fetchMock.mockResolvedValue(envelope(null));

    await request('/auth/login', { anonymous: true, method: 'POST' });

    const headers = fetchMock.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBeUndefined();
  });

  it('refreshes once on a 401 and retries the original call', async () => {
    storeSession({ accessToken: 'stale', refreshToken: 'r1', user });

    fetchMock
      .mockResolvedValueOnce(failure(401, 'Unauthorized'))
      .mockResolvedValueOnce(
        envelope({ accessToken: 'fresh', refreshToken: 'r2', user }),
      )
      .mockResolvedValueOnce(envelope({ ok: true }));

    await expect(request('/sellers/orders')).resolves.toEqual({ ok: true });

    // A vendor mid-service must not be logged out because a token turned over.
    expect(getAccessToken()).toBe('fresh');
    const retryHeaders = fetchMock.mock.calls[2][1].headers as Record<
      string,
      string
    >;
    expect(retryHeaders.Authorization).toBe('Bearer fresh');
  });

  it('clears the session when the refresh itself fails', async () => {
    storeSession({ accessToken: 'stale', refreshToken: 'r1', user });

    fetchMock
      .mockResolvedValueOnce(failure(401, 'Unauthorized'))
      .mockResolvedValueOnce(failure(401, 'Refresh expired'));

    await expect(request('/sellers/orders')).rejects.toBeInstanceOf(ApiError);
    // Half a session is worse than none: the app must fall back to the login screen.
    expect(getAccessToken()).toBeNull();
  });

  it('does not retry a 403 — a wrong role is not fixed by a fresh token', async () => {
    storeSession({ accessToken: 'access-1', refreshToken: 'r1', user });
    fetchMock.mockResolvedValue(failure(403, 'Forbidden'));

    await expect(request('/admin/whatever')).rejects.toMatchObject({
      status: 403,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes only once when several calls 401 together', async () => {
    storeSession({ accessToken: 'stale', refreshToken: 'r1', user });

    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/refresh')) {
        return Promise.resolve(
          envelope({ accessToken: 'fresh', refreshToken: 'r2', user }),
        );
      }
      // Every original call fails once, then succeeds on the retry.
      const seen = fetchMock.mock.calls.filter(
        (call) => call[0] === url,
      ).length;
      return Promise.resolve(seen === 1 ? failure(401, 'nope') : envelope({}));
    });

    await Promise.all([request('/a'), request('/b'), request('/c')]);

    // Three concurrent refreshes would spend an already-rotated token and log the
    // vendor out — the second and third would fail.
    const refreshes = fetchMock.mock.calls.filter((call) =>
      String(call[0]).endsWith('/auth/refresh'),
    );
    expect(refreshes).toHaveLength(1);
  });

  it('leaves FormData alone so the multipart boundary survives', async () => {
    fetchMock.mockResolvedValue(envelope(null));
    const body = new FormData();
    body.append('file', new Blob(['x']), 'kyc.png');

    await request('/storage/upload', { method: 'POST', body });

    const headers = fetchMock.mock.calls[0][1].headers as Record<
      string,
      string
    >;
    // Setting application/json here would strip the boundary and every upload would
    // fail — which is the whole KYC flow.
    expect(headers['Content-Type']).toBeUndefined();
  });
});

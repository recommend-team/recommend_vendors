import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadError, uploadFile } from './storage.service';
import { storeSession } from '../auth';
import type { AuthUser } from '../contract';

const user = { id: 'v1', email: 'v@example.com', role: 'SELLER' } as AuthUser;

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, message: 'ok', data }), {
    status: 200,
  });

const file = (type: string, bytes = 100) =>
  new File([new Uint8Array(bytes)], 'doc.bin', { type });

describe('uploadFile', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storeSession({ accessToken: 'a', refreshToken: 'r', user });
    fetchMock = vi.fn().mockResolvedValue(ok({ secureUrl: 'https://x/y.jpg' }));
    vi.stubGlobal('fetch', fetchMock);
    // jsdom has no canvas, so shrinking always falls through to the original file —
    // which is exactly the behaviour these tests care about.
    vi.stubGlobal('createImageBitmap', undefined);
  });

  it('refuses a file type the backend would reject anyway', async () => {
    await expect(uploadFile(file('video/mp4'), 'kyc')).rejects.toBeInstanceOf(
      UploadError,
    );
    // Refused before the round trip — no point spending a vendor's data on a 400.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a PDF, which is how scanned certificates arrive', async () => {
    await expect(
      uploadFile(file('application/pdf'), 'kyc'),
    ).resolves.toMatchObject({ secureUrl: 'https://x/y.jpg' });
  });

  it('sends multipart, and lets the browser set the boundary', async () => {
    await uploadFile(file('image/jpeg'), 'kyc');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/storage/upload?folder=kyc');
    expect(init.body).toBeInstanceOf(FormData);
    // Setting Content-Type here would strip the boundary and break every upload.
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('refuses anything still over the limit after compressing', async () => {
    // 11 MB, and with no canvas available it cannot be shrunk — the backend's multer
    // guard would reject it, so saying so locally saves an 11 MB upload on mobile data.
    await expect(
      uploadFile(file('image/png', 11 * 1024 * 1024), 'products'),
    ).rejects.toThrow(/too large/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never blocks an upload because compression was unavailable', async () => {
    // The whole point of the fallbacks: a slow upload beats a KYC submission that
    // cannot be completed at all.
    await expect(
      uploadFile(file('image/jpeg', 2000), 'kyc'),
    ).resolves.toBeTruthy();
  });
});

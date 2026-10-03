import { describe, expect, it } from 'vitest';
import {
  destinationFor,
  freshAlerts,
  newestTimestamp,
  parsePushPayload,
  safePath,
} from './alerts';
import type { VendorNotification } from './contract';

const note = (over: Partial<VendorNotification> = {}): VendorNotification => ({
  id: 'n1',
  type: 'NEW_ORDER',
  title: 'New paid order',
  body: 'Ada paid.',
  data: { orderId: 'o1' },
  readAt: null,
  createdAt: '2026-10-03T10:00:00.000Z',
  ...over,
});

describe('parsePushPayload', () => {
  it('reads what the server sends', () => {
    expect(
      parsePushPayload({
        title: 'New paid order',
        body: 'Ada paid for 2× Jollof.',
        type: 'NEW_ORDER',
        url: '/orders/o1',
        tag: 'order:o1',
      }),
    ).toEqual({
      title: 'New paid order',
      body: 'Ada paid for 2× Jollof.',
      type: 'NEW_ORDER',
      url: '/orders/o1',
      tag: 'order:o1',
    });
  });

  it('still produces an alert from a payload missing everything', () => {
    // An older server, or a push with no body: show something rather than nothing.
    expect(parsePushPayload(null)).toEqual({
      title: 'Recommend',
      body: '',
      type: null,
      url: '/notifications',
      tag: null,
    });
  });
});

describe('safePath', () => {
  it.each(['/orders/o1', '/wallet', '/'])(
    'keeps the in-app path %s',
    (path) => {
      expect(safePath(path)).toBe(path);
    },
  );

  it.each([
    'https://evil.example/orders',
    '//evil.example/orders',
    '/\\evil.example',
    'javascript:alert(1)',
    'orders/o1',
    42,
    undefined,
  ])('refuses %s and falls back to the feed', (candidate) => {
    expect(safePath(candidate)).toBe('/notifications');
  });
});

describe('freshAlerts', () => {
  const seen = Date.parse('2026-10-03T10:00:00.000Z');

  it('returns new, unread alerts, newest first', () => {
    const older = note({ id: 'a', createdAt: '2026-10-03T10:01:00.000Z' });
    const newer = note({ id: 'b', createdAt: '2026-10-03T10:02:00.000Z' });

    expect(freshAlerts([older, newer], seen).map((n) => n.id)).toEqual([
      'b',
      'a',
    ]);
  });

  it('ignores what was already there', () => {
    expect(freshAlerts([note()], seen)).toEqual([]);
  });

  it('ignores what has been read', () => {
    expect(
      freshAlerts(
        [
          note({
            createdAt: '2026-10-03T10:05:00.000Z',
            readAt: '2026-10-03T10:06:00.000Z',
          }),
        ],
        seen,
      ),
    ).toEqual([]);
  });

  it('stays quiet for a wallet credit', () => {
    // Twenty orders a day would be twenty chimes for money the vendor watched arrive.
    expect(
      freshAlerts(
        [
          note({
            type: 'WALLET_CREDITED',
            createdAt: '2026-10-03T10:05:00.000Z',
          }),
        ],
        seen,
      ),
    ).toEqual([]);
  });

  it.each(['WITHDRAWAL_SETTLED', 'WITHDRAWAL_FAILED'] as const)(
    'speaks up for %s',
    (type) => {
      expect(
        freshAlerts(
          [note({ type, createdAt: '2026-10-03T10:05:00.000Z' })],
          seen,
        ),
      ).toHaveLength(1);
    },
  );
});

describe('newestTimestamp', () => {
  it('finds the latest, and never moves backwards', () => {
    const items = [note({ createdAt: '2026-10-03T09:00:00.000Z' })];
    const later = Date.parse('2026-10-03T11:00:00.000Z');

    expect(newestTimestamp(items, 0)).toBe(
      Date.parse('2026-10-03T09:00:00.000Z'),
    );
    expect(newestTimestamp(items, later)).toBe(later);
  });
});

describe('destinationFor', () => {
  it('opens the order for an order, and the wallet for money', () => {
    expect(destinationFor(note())).toBe('/orders/o1');
    expect(destinationFor(note({ type: 'WITHDRAWAL_FAILED' }))).toBe('/wallet');
  });
});

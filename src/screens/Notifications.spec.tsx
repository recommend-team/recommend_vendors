import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Notifications } from './Notifications';
import type { NotificationFeed, VendorNotification } from '../lib/contract';

const useNotifications = vi.fn();
const markRead = vi.fn();
const markAll = vi.fn();
const navigate = vi.fn();

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => useNotifications(),
  useMarkRead: () => ({ mutate: markRead, isPending: false }),
  useMarkAllRead: () => ({ mutateAsync: markAll, isPending: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return { ...actual, useNavigate: () => navigate };
});

const notification = (
  over: Partial<VendorNotification> = {},
): VendorNotification =>
  ({
    id: 'n1',
    type: 'NEW_ORDER',
    title: 'New paid order',
    body: 'Ada Obi paid for 2× Jollof Rice.',
    data: { orderId: 'o1' },
    readAt: null,
    createdAt: new Date().toISOString(),
    ...over,
  }) as VendorNotification;

function setup(items: VendorNotification[] = [], unread = items.length) {
  useNotifications.mockReturnValue({
    data: { items, total: items.length, unread, page: 1, limit: 30 } as NotificationFeed,
    isLoading: false,
    isError: false,
  });

  render(
    <MemoryRouter>
      <Notifications />
    </MemoryRouter>,
  );
}

/**
 * The feed is the record. Push has never been granted by anyone, so for now this is the
 * only place inside the app where any of it can be seen.
 */
describe('Notifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows read ones too, not just unread', () => {
    setup(
      [
        notification({ id: 'a', title: 'New paid order' }),
        notification({
          id: 'b',
          title: 'Withdrawal paid out',
          readAt: new Date().toISOString(),
        }),
      ],
      1,
    );

    // A vendor hunting for last Tuesday's order should not have to remember whether
    // they tapped the alert at the time.
    expect(screen.getByText('New paid order')).toBeVisible();
    expect(screen.getByText('Withdrawal paid out')).toBeVisible();
  });

  it('counts only the unread in the header', () => {
    setup([notification({ id: 'a' }), notification({ id: 'b' })], 1);

    expect(screen.getByText('1 unread')).toBeVisible();
  });

  it('offers mark-all only when something is unread', () => {
    setup([notification()], 1);
    expect(
      screen.getByRole('button', { name: /mark all as read/i }),
    ).toBeVisible();
  });

  it('hides mark-all when everything is read', () => {
    setup([notification({ readAt: new Date().toISOString() })], 0);
    expect(screen.queryByRole('button', { name: /mark all as read/i })).toBeNull();
  });

  it('marks one read and opens the thing it is about', async () => {
    setup([notification({ id: 'n7', data: { orderId: 'order-42' } })]);

    await userEvent.click(screen.getByText('New paid order'));

    expect(markRead).toHaveBeenCalledWith('n7');
    expect(navigate).toHaveBeenCalledWith('/orders/order-42');
  });

  it('sends a wallet notification to the wallet', async () => {
    setup([
      notification({
        type: 'WALLET_CREDITED',
        title: 'Added to your wallet',
        data: { reference: 'REC-AAA' },
      }),
    ]);

    await userEvent.click(screen.getByText('Added to your wallet'));

    expect(navigate).toHaveBeenCalledWith('/wallet');
  });

  it('does not re-mark one that is already read', async () => {
    setup([notification({ readAt: new Date().toISOString() })], 0);

    await userEvent.click(screen.getByText('New paid order'));

    expect(markRead).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();
  });

  it('says what will appear here rather than just "empty"', () => {
    setup([], 0);

    expect(screen.getByText(/orders, payments and withdrawals/i)).toBeVisible();
  });
});

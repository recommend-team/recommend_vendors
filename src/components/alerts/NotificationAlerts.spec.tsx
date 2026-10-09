import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationAlerts } from './NotificationAlerts';
import type { NotificationFeed, VendorNotification } from '../../lib/contract';

const playChime = vi.fn(() => true);
vi.mock('./chime', () => ({
  armChime: () => () => undefined,
  playChime: () => playChime(),
}));

let feed: NotificationFeed | undefined;
let unread: number | undefined;
const markRead = vi.fn();
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({ data: feed }),
  useUnreadCount: () => ({ data: unread }),
  useMarkRead: () => ({ mutate: markRead }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const note = (over: Partial<VendorNotification> = {}): VendorNotification => ({
  id: 'n1',
  type: 'NEW_ORDER',
  title: 'New paid order',
  body: 'Ada Obi paid for 2× Jollof Rice.',
  data: { orderId: 'o1' },
  readAt: null,
  createdAt: '2026-10-03T10:00:00.000Z',
  ...over,
});

const feedOf = (items: VendorNotification[]): NotificationFeed => ({
  items,
  total: items.length,
  unread: items.filter((item) => !item.readAt).length,
  page: 1,
  limit: 30,
});

const MOUNTED_AT = 1_000_000;
const SETTLED = MOUNTED_AT + 5_000;

const order = note({
  id: 'n2',
  title: 'New paid order',
  body: 'Tunde paid for 1× Suya.',
  data: { orderId: 'o2' },
  createdAt: '2026-10-03T10:05:00.000Z',
});

/** Mount with a baseline feed, as a vendor opening the app. */
function mount(items: VendorNotification[] = [note()]) {
  feed = feedOf(items);
  unread = feed.unread;
  const client = new QueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <NotificationAlerts />
    </QueryClientProvider>,
  );
  return {
    /** The feed refetches with new contents. */
    arrive: (next: VendorNotification[]) => {
      feed = feedOf(next);
      unread = feed.unread;
      view.rerender(
        <QueryClientProvider client={client}>
          <NotificationAlerts />
        </QueryClientProvider>,
      );
    },
  };
}

describe('NotificationAlerts', () => {
  let now = MOUNTED_AT;

  beforeEach(() => {
    vi.clearAllMocks();
    now = MOUNTED_AT;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  it('chimes once and shows the order when one arrives', () => {
    const { arrive } = mount();

    now = SETTLED;
    arrive([order, note()]);

    expect(playChime).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Tunde paid for 1× Suya.',
    );
  });

  it('does not chime for what was already there when the app opened', () => {
    mount([order, note()]);

    expect(playChime).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not chime twice for the same order', () => {
    const { arrive } = mount();

    now = SETTLED;
    arrive([order, note()]);
    arrive([order, note()]);

    expect(playChime).toHaveBeenCalledTimes(1);
  });

  it('stays silent for a wallet credit', () => {
    const { arrive } = mount();

    now = SETTLED;
    arrive([
      note({
        id: 'n3',
        type: 'WALLET_CREDITED',
        createdAt: '2026-10-03T10:05:00.000Z',
      }),
      note(),
    ]);

    expect(playChime).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the banner but plays nothing when muted', () => {
    localStorage.setItem('recommend.vendor.alertSoundMuted', '1');
    const { arrive } = mount();

    now = SETTLED;
    arrive([order, note()]);

    expect(playChime).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('says nothing in the first moments back on screen', () => {
    // The phone has just alerted them — usually they tapped that alert to get here.
    const { arrive } = mount();

    now = MOUNTED_AT + 1_000;
    arrive([order, note()]);

    expect(playChime).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('opens the order from the banner, marking it read', async () => {
    const { arrive } = mount();

    now = SETTLED;
    arrive([order, note()]);
    await userEvent.click(screen.getByText('Tunde paid for 1× Suya.'));

    expect(markRead).toHaveBeenCalledWith('n2');
    expect(navigate).toHaveBeenCalledWith('/orders/o2');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

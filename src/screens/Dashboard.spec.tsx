import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import type { VendorProfile } from '../lib/contract';

const useVendorProfile = vi.fn();
const mutate = vi.fn();

vi.mock('../hooks/useProfile', () => ({
  useVendorProfile: () => useVendorProfile(),
  useEarnings: () => ({ data: undefined }),
  useUpdateProfile: () => ({ mutate, isPending: false }),
}));
vi.mock('../hooks/useOrders', () => ({
  useOrders: () => ({ orders: [], awaitingCount: 0 }),
}));
vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({ total: 0 }),
}));
vi.mock('../hooks/useSuspended', () => ({ useSuspended: () => false }));

function setup(profile: Partial<VendorProfile>) {
  useVendorProfile.mockReturnValue({
    data: { businessName: 'Mama Put', operatingHours: null, ...profile },
    isLoading: false,
  });
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard — the pause card', () => {
  beforeEach(() => vi.clearAllMocks());

  it('when open, says when the shop closes', () => {
    setup({ isOpen: true, openNow: true, closesAt: '2026-10-19T18:00:00Z' });

    expect(screen.getByText('Open for orders')).toBeInTheDocument();
    expect(screen.getByText('Closes at 7pm')).toBeInTheDocument();
  });

  it('when switched on but outside its hours, says when it opens', () => {
    setup({ isOpen: true, openNow: false, opensAt: '2099-01-05T08:00:00Z' });

    expect(screen.getByText('Closed now')).toBeInTheDocument();
    expect(screen.getByText(/from your opening hours/)).toHaveTextContent(
      /^Opens .* at 9am · from your opening hours$/,
    );
  });

  it('when paused, says so, and the switch resumes orders', async () => {
    setup({ isOpen: false, openNow: false });

    expect(screen.getByText('Paused')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('switch', { name: 'Resume orders' }),
    );
    expect(mutate).toHaveBeenCalledWith({ isOpen: true });
  });

  it('links to the opening hours', () => {
    setup({ isOpen: true, openNow: true });

    expect(
      screen.getByRole('link', { name: 'Opening hours ›' }),
    ).toHaveAttribute('href', '/settings');
  });
});

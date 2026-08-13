import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Products } from './Products';
import type { SellerStatus } from '../lib/contract';

const useProducts = vi.fn();
const useSession = vi.fn();

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => useProducts(),
  useToggleAvailability: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    variables: undefined,
  }),
}));

vi.mock('../hooks/useSession', () => ({
  useSession: () => useSession(),
}));

function setup({
  status = 'APPROVED' as SellerStatus,
  total = 0,
}: { status?: SellerStatus; total?: number } = {}) {
  useSession.mockReturnValue({ user: { status } });
  useProducts.mockReturnValue({
    products: [],
    total,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });

  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>,
  );
}

/**
 * The add button was once hidden unless the vendor was approved and under the product
 * limit. A vendor who cannot see it does not deduce "I must be unapproved" — they report
 * the app as broken, which is exactly what happened. It is always on screen now, and
 * these hold it there.
 */
describe('Products', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('always offers a way to add a product', () => {
    setup();

    expect(screen.getByRole('link', { name: /add a product/i })).toHaveAttribute(
      'href',
      '/products/new',
    );
  });

  it('still shows the button to an unapproved vendor, and says why it cannot be used', async () => {
    setup({ status: 'PENDING' });

    const add = screen.getByRole('button', { name: /add a product/i });
    // Not a link: tapping must not walk them into a form the server will refuse.
    expect(screen.queryByRole('link', { name: /add a product/i })).toBeNull();

    await userEvent.click(add);
    expect(screen.getByRole('status')).toHaveTextContent(/approves your account/i);
  });

  it('explains the ceiling rather than hiding the button at the limit', async () => {
    setup({ total: 20 });

    await userEvent.click(screen.getByRole('button', { name: /add a product/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/maximum of 20 products/i);
  });
});

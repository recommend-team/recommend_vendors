import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopLinkCard } from './ShopLinkCard';

const URL = 'https://recommend.ng/store/mama-put';

describe('ShopLinkCard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the link, opening the shop', () => {
    render(<ShopLinkCard url={URL} />);

    const link = screen.getByRole('link', {
      name: 'recommend.ng/store/mama-put',
    });
    expect(link).toHaveAttribute('href', URL);
  });

  it('copies the whole link, and says so', async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    render(<ShopLinkCard url={URL} />);

    await user.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith(URL);
    expect(
      await screen.findByRole('button', { name: 'Link copied' }),
    ).toBeInTheDocument();
  });
});

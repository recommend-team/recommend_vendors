import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CollectionCheck } from './CollectionCheck';
import { ApiError } from '../../lib/api';

const checkCollectionCode = vi.fn();
vi.mock('../../lib/services/orders.service', () => ({
  checkCollectionCode: (...args: unknown[]) => checkCollectionCode(...args),
}));

function setup() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CollectionCheck orderId="o1" />
    </QueryClientProvider>,
  );
  return {
    type: (text: string) =>
      userEvent.type(screen.getByLabelText('Collection code'), text),
    submit: () =>
      userEvent.click(screen.getByRole('button', { name: 'Check' })),
  };
}

describe('CollectionCheck', () => {
  beforeEach(() => checkCollectionCode.mockReset());

  it('sends the code uppercased, as the buyer reads it', async () => {
    checkCollectionCode.mockResolvedValue({
      matches: true,
      buyerName: 'Ada Obi',
      attemptsLeft: 10,
    });
    const { type, submit } = setup();

    await type('qwerty');
    await submit();

    expect(checkCollectionCode).toHaveBeenCalledWith('o1', 'QWERTY');
  });

  it('says to hand it over, and to whom, when the code matches', async () => {
    checkCollectionCode.mockResolvedValue({
      matches: true,
      buyerName: 'Ada Obi',
      attemptsLeft: 10,
    });
    const { type, submit } = setup();

    await type('QWERTY');
    await submit();

    expect(await screen.findByRole('status')).toHaveTextContent(
      "this is Ada Obi's order. Hand it over.",
    );
  });

  it('says not to hand it over when the code is wrong', async () => {
    checkCollectionCode.mockResolvedValue({
      matches: false,
      buyerName: 'Ada Obi',
      attemptsLeft: 9,
    });
    const { type, submit } = setup();

    await type('ABCDEF');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Don't hand it over",
    );
  });

  it("passes on the server's reason when it refuses", async () => {
    checkCollectionCode.mockRejectedValue(
      new ApiError(429, 'Too many wrong codes for this order.'),
    );
    const { type, submit } = setup();

    await type('ABCDEF');
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many wrong codes for this order.',
    );
  });

  it('clears the verdict as soon as the code is edited', async () => {
    checkCollectionCode.mockResolvedValue({
      matches: false,
      buyerName: 'Ada Obi',
      attemptsLeft: 9,
    });
    const { type, submit } = setup();

    await type('ABCDEF');
    await submit();
    await screen.findByRole('alert');
    await type('X');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

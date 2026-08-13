import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Withdraw } from './Withdraw';
import type { PayoutAccount } from '../lib/contract';

const useWallet = vi.fn();
const usePayoutAccounts = vi.fn();
const useWithdrawalQuote = vi.fn();
const requestWithdrawal = vi.fn();

vi.mock('../hooks/useWallet', () => ({
  useWallet: () => useWallet(),
  usePayoutAccounts: () => usePayoutAccounts(),
  useWithdrawalQuote: (amount: number) => useWithdrawalQuote(amount),
  useRequestWithdrawal: () => ({
    mutateAsync: requestWithdrawal,
    isPending: false,
  }),
}));

const account = (over: Partial<PayoutAccount> = {}): PayoutAccount =>
  ({
    id: 'acc1',
    bankName: 'Guaranty Trust Bank',
    accountNumber: '••••6789',
    accountName: 'ADA OBI',
    status: 'ACTIVE',
    isDefault: true,
    ...over,
  }) as PayoutAccount;

function setup({
  balance = 10000,
  accounts = [account()],
}: { balance?: number; accounts?: PayoutAccount[] } = {}) {
  useWallet.mockReturnValue({ data: { balance } });
  usePayoutAccounts.mockReturnValue({ data: accounts });
  useWithdrawalQuote.mockImplementation((amount: number) => ({
    data:
      amount > 0
        ? { amountRequested: amount, feeAmount: 25, amountSent: amount - 25 }
        : undefined,
  }));

  render(
    <MemoryRouter>
      <Withdraw />
    </MemoryRouter>,
  );
}

/**
 * The fee is the reason this screen exists.
 *
 * Deducting it is defensible; discovering it afterwards is what vendors resent. These
 * hold it on screen, before the button is reachable.
 */
describe('Withdraw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the fee and the amount arriving before anything is confirmed', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/amount/i), '4800');

    expect(screen.getByText(/transfer fee/i)).toBeInTheDocument();
    expect(screen.getByText('−₦25')).toBeInTheDocument();
    expect(screen.getByText(/you'll receive/i)).toBeInTheDocument();
    expect(screen.getByText('₦4,775')).toBeInTheDocument();
  });

  it('puts what actually arrives on the button, not what was typed', async () => {
    setup();

    await userEvent.type(screen.getByLabelText(/amount/i), '4800');

    expect(
      screen.getByRole('button', { name: /withdraw ₦4,775/i }),
    ).toBeEnabled();
  });

  it('refuses more than the balance, and says how much there is', async () => {
    setup({ balance: 3000 });

    await userEvent.type(screen.getByLabelText(/amount/i), '4800');

    expect(screen.getByText(/you have ₦3,000/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^withdraw$/i })).toBeDisabled();
  });

  it('sends nothing until there is an amount', () => {
    setup();

    expect(screen.getByRole('button', { name: /^withdraw$/i })).toBeDisabled();
  });

  it('sends the vendor to add an account rather than a dead form', () => {
    // A withdrawal needs a confirmed destination. Showing the form and failing on submit
    // teaches nothing; this says what is missing and where to fix it.
    setup({ accounts: [] });

    expect(
      screen.getByRole('link', { name: /add a payout account/i }),
    ).toHaveAttribute('href', '/payout-accounts');
    expect(screen.queryByLabelText(/amount/i)).toBeNull();
  });

  it('ignores an unconfirmed account when choosing where to send', () => {
    setup({
      accounts: [
        account({ id: 'pending', status: 'PENDING_VERIFICATION' }),
        account({ id: 'live', bankName: 'Kuda' }),
      ],
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(/kuda/i);
  });

  it('defaults to the account the vendor marked default', () => {
    setup({
      accounts: [
        account({ id: 'other', bankName: 'Kuda', isDefault: false }),
        account({ id: 'chosen', bankName: 'Zenith', isDefault: true }),
      ],
    });

    expect(screen.getByLabelText(/send to/i)).toHaveValue('chosen');
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PayoutAccounts } from './PayoutAccounts';
import { ApiError } from '../lib/api';
import type { PayoutAccount } from '../lib/contract';

const usePayoutAccounts = vi.fn();
const addAccount = vi.fn();
const verifyAccount = vi.fn();

vi.mock('../hooks/useWallet', () => ({
  usePayoutAccounts: () => usePayoutAccounts(),
  useBanks: () => ({
    data: [
      { name: 'Guaranty Trust Bank', code: '058', slug: 'gtb' },
      { name: 'Kuda', code: '50211', slug: 'kuda' },
    ],
    isLoading: false,
  }),
  useAddPayoutAccount: () => ({ mutateAsync: addAccount, isPending: false }),
  useVerifyPayoutAccount: () => ({
    mutateAsync: verifyAccount,
    isPending: false,
  }),
  useResendPayoutCode: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSetDefaultAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRemovePayoutAccount: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const account = (over: Partial<PayoutAccount> = {}): PayoutAccount =>
  ({
    id: 'acc1',
    bankName: 'Guaranty Trust Bank',
    bankCode: '058',
    accountNumber: '••••6789',
    accountName: 'ADA OBI',
    status: 'ACTIVE',
    isDefault: false,
    ...over,
  }) as PayoutAccount;

function setup(accounts: PayoutAccount[] = []) {
  usePayoutAccounts.mockReturnValue({ data: accounts, isLoading: false });
  render(
    <MemoryRouter>
      <PayoutAccounts />
    </MemoryRouter>,
  );
}

describe('PayoutAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addAccount.mockResolvedValue(account({ status: 'PENDING_VERIFICATION' }));
    verifyAccount.mockResolvedValue(account());
  });

  it('offers banks from the backend rather than a hard-coded list', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: /add an account/i }));

    expect(screen.getByRole('option', { name: 'Kuda' })).toBeInTheDocument();
  });

  it('will not submit until there is a bank and ten digits', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /add an account/i }));

    const submit = screen.getByRole('button', { name: /^add account$/i });
    expect(submit).toBeDisabled();

    await userEvent.selectOptions(screen.getByLabelText(/bank/i), '058');
    await userEvent.type(screen.getByLabelText(/account number/i), '012345');
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/account number/i), '6789');
    expect(submit).toBeEnabled();
  });

  it('sends the password with the account', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /add an account/i }));

    await userEvent.selectOptions(screen.getByLabelText(/bank/i), '058');
    await userEvent.type(screen.getByLabelText(/account number/i), '0123456789');
    await userEvent.type(screen.getByLabelText(/your password/i), 'hunter2');
    await userEvent.click(screen.getByRole('button', { name: /^add account$/i }));

    expect(addAccount).toHaveBeenCalledWith({
      bankCode: '058',
      accountNumber: '0123456789',
      currentPassword: 'hunter2',
    });
  });

  it("passes the backend's reason through when an account cannot be found", async () => {
    // "We could not find that account at that bank" is actionable. "Something went wrong"
    // is not, and the vendor would retype the same wrong number.
    addAccount.mockRejectedValue(
      new ApiError(400, 'We could not find that account at that bank.'),
    );
    setup();
    await userEvent.click(screen.getByRole('button', { name: /add an account/i }));

    await userEvent.selectOptions(screen.getByLabelText(/bank/i), '058');
    await userEvent.type(screen.getByLabelText(/account number/i), '9999999999');
    await userEvent.click(screen.getByRole('button', { name: /^add account$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not find that account/i,
    );
  });

  it('marks an unconfirmed account and asks for the code', () => {
    setup([account({ status: 'PENDING_VERIFICATION' })]);

    expect(screen.getByText(/unconfirmed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
    // Nothing about defaults or removal until it can actually receive money.
    expect(screen.queryByRole('button', { name: /make default/i })).toBeNull();
  });

  it('needs all six digits before confirming', async () => {
    setup([account({ status: 'PENDING_VERIFICATION' })]);

    const confirm = screen.getByRole('button', { name: /confirm account/i });
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/code/i), '123456');
    expect(confirm).toBeEnabled();
  });

  it('shows the bank-resolved name, which the vendor never typed', () => {
    setup([account({ accountName: 'ADEBAYO A OBI' })]);

    expect(screen.getByText('ADEBAYO A OBI')).toBeInTheDocument();
  });

  it('asks for the password before removing an account', async () => {
    setup([account()]);

    await userEvent.click(screen.getByRole('button', { name: /^remove$/i }));

    expect(screen.getByLabelText(/your password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /remove account/i }),
    ).toBeInTheDocument();
  });

  it('hides removed accounts entirely', () => {
    setup([account({ id: 'gone', status: 'REMOVED' })]);

    expect(screen.queryByText(/guaranty/i)).toBeNull();
    expect(screen.getByText(/no payout account yet/i)).toBeInTheDocument();
  });
});

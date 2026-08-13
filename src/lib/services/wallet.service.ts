import { request } from '../api';
import type {
  Bank,
  PayoutAccount,
  Wallet,
  WalletEntry,
  Withdrawal,
  WithdrawalQuote,
} from '../contract';

/**
 * The wallet, and the accounts money can leave to.
 *
 * `currentPassword` appears on the three calls that can redirect or move money. It is
 * optional because the backend remembers a confirmation for a few minutes — send it the
 * first time, and omit it while the window is open. A 401 with `code: PASSWORD_REQUIRED`
 * is the signal to ask again.
 */

export function fetchWallet(): Promise<Wallet> {
  return request<Wallet>('/sellers/wallet');
}

export function fetchWalletEntries(limit = 30): Promise<WalletEntry[]> {
  return request<WalletEntry[]>(`/sellers/wallet/entries?limit=${limit}`);
}

// ─── Payout accounts ──────────────────────────────────────────────────────────

/** Paystack's own list, cached by the backend. Never hard-code banks against this. */
export function listBanks(): Promise<Bank[]> {
  return request<Bank[]>('/sellers/payout-accounts/banks');
}

export function listPayoutAccounts(): Promise<PayoutAccount[]> {
  return request<PayoutAccount[]>('/sellers/payout-accounts');
}

/**
 * Resolves the account with Paystack and emails a code. Nothing is saved if the number
 * does not exist at that bank, so a 400 here means the details are wrong — not that
 * something went wrong.
 */
export function addPayoutAccount(input: {
  bankCode: string;
  accountNumber: string;
  currentPassword?: string;
}): Promise<PayoutAccount> {
  return request<PayoutAccount>('/sellers/payout-accounts', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function verifyPayoutAccount(
  id: string,
  code: string,
): Promise<PayoutAccount> {
  return request<PayoutAccount>(
    `/sellers/payout-accounts/${encodeURIComponent(id)}/verify`,
    { method: 'POST', body: JSON.stringify({ code }) },
  );
}

export function resendPayoutCode(id: string): Promise<unknown> {
  return request(
    `/sellers/payout-accounts/${encodeURIComponent(id)}/resend`,
    { method: 'POST' },
  );
}

export function setDefaultPayoutAccount(id: string): Promise<PayoutAccount> {
  return request<PayoutAccount>(
    `/sellers/payout-accounts/${encodeURIComponent(id)}/default`,
    { method: 'PATCH' },
  );
}

export function removePayoutAccount(
  id: string,
  currentPassword?: string,
): Promise<unknown> {
  return request(`/sellers/payout-accounts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    body: JSON.stringify({ currentPassword }),
  });
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export function listWithdrawals(): Promise<Withdrawal[]> {
  return request<Withdrawal[]>('/sellers/wallet/withdrawals');
}

/** What the vendor would actually receive. Shown before they confirm, never after. */
export function quoteWithdrawal(amount: number): Promise<WithdrawalQuote> {
  return request<WithdrawalQuote>(
    `/sellers/wallet/withdrawals/quote?amount=${encodeURIComponent(amount)}`,
  );
}

export function requestWithdrawal(input: {
  accountId: string;
  amount: number;
  currentPassword?: string;
}): Promise<Withdrawal> {
  return request<Withdrawal>('/sellers/wallet/withdrawals', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

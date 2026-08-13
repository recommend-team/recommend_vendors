import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPayoutAccount,
  fetchWallet,
  fetchWalletEntries,
  listBanks,
  listPayoutAccounts,
  listWithdrawals,
  quoteWithdrawal,
  removePayoutAccount,
  requestWithdrawal,
  resendPayoutCode,
  setDefaultPayoutAccount,
  verifyPayoutAccount,
} from '../lib/services/wallet.service';
import type {
  Bank,
  PayoutAccount,
  Wallet,
  WalletEntry,
  Withdrawal,
  WithdrawalQuote,
} from '../lib/contract';

const WALLET_KEY = ['vendor', 'wallet'];
const ENTRIES_KEY = ['vendor', 'wallet', 'entries'];
const ACCOUNTS_KEY = ['vendor', 'payout-accounts'];
const WITHDRAWALS_KEY = ['vendor', 'withdrawals'];

export function useWallet() {
  return useQuery<Wallet>({
    queryKey: WALLET_KEY,
    queryFn: fetchWallet,
    // Money moves without the vendor doing anything — an order is confirmed received and
    // the balance changes. Short, so reopening the screen shows the truth.
    staleTime: 15_000,
  });
}

export function useWalletEntries() {
  return useQuery<WalletEntry[]>({
    queryKey: ENTRIES_KEY,
    queryFn: () => fetchWalletEntries(),
    staleTime: 15_000,
  });
}

export function usePayoutAccounts() {
  return useQuery<PayoutAccount[]>({
    queryKey: ACCOUNTS_KEY,
    queryFn: listPayoutAccounts,
    staleTime: 60_000,
  });
}

export function useBanks() {
  return useQuery<Bank[]>({
    queryKey: ['banks'],
    queryFn: listBanks,
    // Nigeria's bank list changes a few times a year. Refetching it on a phone is waste.
    staleTime: 24 * 60 * 60_000,
  });
}

export function useWithdrawals() {
  return useQuery<Withdrawal[]>({
    queryKey: WITHDRAWALS_KEY,
    queryFn: listWithdrawals,
    staleTime: 15_000,
  });
}

/**
 * The fee, fetched as the vendor types.
 *
 * From the backend rather than computed here: the tiers are configuration, and a copy in
 * the app would quote a fee we then do not charge the day they change.
 */
export function useWithdrawalQuote(amount: number) {
  return useQuery<WithdrawalQuote>({
    queryKey: ['withdrawal-quote', amount],
    queryFn: () => quoteWithdrawal(amount),
    enabled: amount > 0,
    staleTime: 60 * 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function useAccountsMutation<TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    },
  });
}

export function useAddPayoutAccount() {
  return useAccountsMutation(addPayoutAccount);
}

export function useVerifyPayoutAccount() {
  return useAccountsMutation(({ id, code }: { id: string; code: string }) =>
    verifyPayoutAccount(id, code),
  );
}

export function useResendPayoutCode() {
  return useMutation({ mutationFn: resendPayoutCode });
}

export function useSetDefaultAccount() {
  return useAccountsMutation(setDefaultPayoutAccount);
}

export function useRemovePayoutAccount() {
  return useAccountsMutation(
    ({ id, currentPassword }: { id: string; currentPassword?: string }) =>
      removePayoutAccount(id, currentPassword),
  );
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: () => {
      // The balance and the statement both moved, and the vendor is about to look at
      // them. Refetch rather than patch — the debit is the backend's arithmetic, not ours.
      void queryClient.invalidateQueries({ queryKey: WALLET_KEY });
      void queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
      void queryClient.invalidateQueries({ queryKey: WITHDRAWALS_KEY });
    },
  });
}

import { useState, type FormEvent } from 'react';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import {
  useAddPayoutAccount,
  useBanks,
  usePayoutAccounts,
  useRemovePayoutAccount,
  useResendPayoutCode,
  useSetDefaultAccount,
  useVerifyPayoutAccount,
} from '../hooks/useWallet';
import { ApiError } from '../lib/api';
import type { PayoutAccount } from '../lib/contract';

/**
 * The accounts money can leave to.
 *
 * Replaces the old single-account form, which posted to an endpoint that no longer
 * exists. Three things changed and all three are visible here:
 *
 * 1. **Banks come from Paystack**, not a hard-coded list that needed a release per bank.
 * 2. **The account name is resolved, never typed.** Whatever the bank says it is, is what
 *    is shown — a vendor cannot mistype themselves into a bounced transfer.
 * 3. **An account is confirmed by an emailed code before it can receive money**, and
 *    adding or removing one needs the password. Changing where earnings go is the whole
 *    prize for anyone who steals a session.
 */
export function PayoutAccounts() {
  const { data: accounts, isLoading } = usePayoutAccounts();
  const [adding, setAdding] = useState(false);

  const live = (accounts ?? []).filter((a) => a.status !== 'REMOVED');

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader title="Payout accounts" />

      <div className="space-y-3 px-4 pb-6">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Where your money is sent. We check the account with your bank before
          you can use it, so the name below is the bank&apos;s, not ours.
        </p>

        {isLoading && (
          <p className="py-8 text-center text-[13px] text-ink-soft">Loading…</p>
        )}

        {live.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}

        {!isLoading && live.length === 0 && !adding && (
          <p className="py-6 text-center text-[13px] text-ink-soft">
            No payout account yet. Add one to withdraw your earnings.
          </p>
        )}

        {adding ? (
          <AddAccountForm onDone={() => setAdding(false)} />
        ) : (
          <Button variant="secondary" onClick={() => setAdding(true)}>
            Add an account
          </Button>
        )}
      </div>
    </div>
  );
}

function AccountCard({ account }: { account: PayoutAccount }) {
  const setDefault = useSetDefaultAccount();
  const remove = useRemovePayoutAccount();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | null>(null);

  const pending = account.status === 'PENDING_VERIFICATION';

  const doRemove = async () => {
    setFailure(null);
    try {
      await remove.mutateAsync({ id: account.id, currentPassword: password });
      setConfirming(false);
      setPassword('');
    } catch (cause) {
      setFailure(messageFor(cause, 'Could not remove that account.'));
    }
  };

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold text-ink">
            {account.bankName}
          </p>
          <p className="text-[13px] text-ink-soft">{account.accountNumber}</p>
          <p className="truncate text-[13px] text-ink-soft">
            {account.accountName}
          </p>
        </div>

        {account.isDefault && !pending && (
          <span className="shrink-0 rounded-full bg-mint px-2.5 py-1 text-[11px] font-extrabold text-brand">
            Default
          </span>
        )}
        {pending && (
          <span className="shrink-0 rounded-full bg-amber px-2.5 py-1 text-[11px] font-extrabold text-ink">
            Unconfirmed
          </span>
        )}
      </div>

      {pending ? (
        <VerifyForm account={account} />
      ) : (
        <div className="mt-3 flex gap-2">
          {!account.isDefault && (
            <Button
              variant="secondary"
              full={false}
              loading={setDefault.isPending}
              onClick={() => void setDefault.mutateAsync(account.id)}
            >
              Make default
            </Button>
          )}
          <Button
            variant="ghost"
            full={false}
            onClick={() => setConfirming((open) => !open)}
          >
            Remove
          </Button>
        </div>
      )}

      {confirming && (
        <div className="mt-3 space-y-2 rounded-2xl bg-canvas p-3">
          <p className="text-[13px] leading-snug text-ink-soft">
            Confirm with your password to remove this account.
          </p>
          <Field
            label="Your password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button loading={remove.isPending} onClick={() => void doRemove()}>
            Remove account
          </Button>
        </div>
      )}

      {failure && (
        <p role="alert" className="mt-2 text-[13px] text-accent">
          {failure}
        </p>
      )}
    </section>
  );
}

/**
 * Six digits, emailed.
 *
 * The count of remaining attempts comes from the backend's own message rather than being
 * tracked here — five wrong codes void the account, and a client-side counter that
 * disagreed would be worse than none.
 */
function VerifyForm({ account }: { account: PayoutAccount }) {
  const verify = useVerifyPayoutAccount();
  const resend = useResendPayoutCode();
  const [code, setCode] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);
    try {
      await verify.mutateAsync({ id: account.id, code });
    } catch (cause) {
      setFailure(messageFor(cause, 'Could not confirm that code.'));
    }
  };

  const askAgain = async () => {
    setFailure(null);
    setSent(false);
    try {
      await resend.mutateAsync(account.id);
      setSent(true);
    } catch (cause) {
      setFailure(messageFor(cause, 'Could not send another code.'));
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-2xl bg-canvas p-3">
      <p className="text-[13px] leading-snug text-ink-soft">
        We emailed you a six-digit code. Enter it to start using this account.
      </p>

      <Field
        label="Code"
        inputMode="numeric"
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(event) =>
          setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
        }
      />

      {failure && (
        <p role="alert" className="text-[13px] text-accent">
          {failure}
        </p>
      )}
      {sent && <p className="text-[13px] text-brand">New code sent.</p>}

      <Button type="submit" loading={verify.isPending} disabled={code.length < 6}>
        Confirm account
      </Button>
      <Button
        variant="ghost"
        type="button"
        loading={resend.isPending}
        onClick={() => void askAgain()}
      >
        Send another code
      </Button>
    </form>
  );
}

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const { data: banks, isLoading: banksLoading } = useBanks();
  const add = useAddPayoutAccount();

  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);

    try {
      await add.mutateAsync({
        bankCode,
        accountNumber,
        currentPassword: password || undefined,
      });
      onDone();
    } catch (cause) {
      setFailure(
        messageFor(
          cause,
          'Could not add that account. Check the number and try again.',
        ),
      );
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm"
    >
      <div>
        <label
          htmlFor="bank"
          className="mb-1.5 block text-[13px] font-bold text-ink-soft"
        >
          Bank
        </label>
        <select
          id="bank"
          value={bankCode}
          onChange={(event) => setBankCode(event.target.value)}
          className="min-h-12 w-full rounded-full border border-hairline bg-surface px-4 text-ink outline-none"
        >
          <option value="">
            {banksLoading ? 'Loading banks…' : 'Choose your bank'}
          </option>
          {(banks ?? []).map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="Account number"
        inputMode="numeric"
        maxLength={10}
        placeholder="0123456789"
        value={accountNumber}
        onChange={(event) =>
          setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10))
        }
      />

      <Field
        label="Your password"
        type="password"
        placeholder="To confirm it's you"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {failure && (
        <p role="alert" className="text-[13px] text-accent">
          {failure}
        </p>
      )}

      <Button
        type="submit"
        loading={add.isPending}
        disabled={!bankCode || accountNumber.length !== 10}
      >
        Add account
      </Button>
      <Button variant="ghost" type="button" onClick={onDone}>
        Cancel
      </Button>
    </form>
  );
}

/**
 * The backend's message, when it has one worth showing.
 *
 * Its 400s here are all things the vendor can act on — wrong code, wrong account number,
 * too soon to resend — so passing them through is more useful than a generic apology.
 */
function messageFor(cause: unknown, fallback: string): string {
  return cause instanceof ApiError && cause.message ? cause.message : fallback;
}

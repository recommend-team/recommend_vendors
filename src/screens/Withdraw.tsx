import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import {
  usePayoutAccounts,
  useRequestWithdrawal,
  useWallet,
  useWithdrawalQuote,
} from '../hooks/useWallet';
import { ApiError } from '../lib/api';
import { formatNaira } from '../lib/format';

/**
 * Taking money out.
 *
 * The fee is shown before the vendor confirms, never after. Deducting it is defensible;
 * surprising someone with it is not, and the difference between those two is entirely
 * this screen.
 *
 * The amount, the fee and the total are all the backend's arithmetic — quoted live as the
 * vendor types. A copy of the fee tiers in here would quote a number we then do not
 * charge, the first time the tiers change.
 */
export function Withdraw() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { data: accounts } = usePayoutAccounts();
  const withdraw = useRequestWithdrawal();

  const usable = (accounts ?? []).filter((a) => a.status === 'ACTIVE');

  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | null>(null);

  const balance = wallet.data?.balance ?? 0;
  const parsed = Number(amount) || 0;
  const quote = useWithdrawalQuote(parsed);

  // Default to the account they already chose as default, so the common case is one tap.
  useEffect(() => {
    if (accountId || usable.length === 0) return;
    setAccountId((usable.find((a) => a.isDefault) ?? usable[0]).id);
  }, [accountId, usable]);

  const tooMuch = parsed > balance;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);

    try {
      await withdraw.mutateAsync({
        accountId,
        amount: parsed,
        currentPassword: password || undefined,
      });
      navigate('/wallet');
    } catch (cause) {
      setFailure(
        cause instanceof ApiError && cause.message
          ? cause.message
          : 'Could not start that withdrawal. Try again in a moment.',
      );
    }
  };

  if (usable.length === 0) {
    return (
      <div className="flex min-h-full flex-col bg-canvas">
        <ScreenHeader title="Withdraw" />
        <div className="space-y-4 px-4 pb-6">
          <p className="text-[13px] leading-relaxed text-ink-soft">
            You need a confirmed payout account before you can withdraw. It
            takes a minute — we check it with your bank and email you a code.
          </p>
          <Link to="/payout-accounts" className="block">
            <Button>Add a payout account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader title="Withdraw" />

      <form onSubmit={submit} className="space-y-4 px-4 pb-6">
        <div className="rounded-2xl bg-forest p-4 text-white">
          <p className="text-[11px] font-extrabold tracking-widest text-white/60 uppercase">
            Available
          </p>
          <p className="mt-1 text-3xl font-extrabold">
            {formatNaira(balance)}
          </p>
        </div>

        <div>
          <label
            htmlFor="account"
            className="mb-1.5 block text-[13px] font-bold text-ink-soft"
          >
            Send to
          </label>
          <select
            id="account"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            className="min-h-12 w-full rounded-full border border-hairline bg-surface px-4 text-ink outline-none"
          >
            {usable.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} {account.accountNumber}
              </option>
            ))}
          </select>
        </div>

        <Field
          label="Amount"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value.replace(/[^\d]/g, ''))
          }
          error={tooMuch ? `You have ${formatNaira(balance)}` : null}
        />

        <button
          type="button"
          onClick={() => setAmount(String(Math.floor(balance)))}
          className="text-[13px] font-bold text-brand"
        >
          Withdraw everything
        </button>

        {/* The whole point of the screen. Shown while typing, before the button is ever
            reachable — a fee revealed on the receipt is the thing vendors resent. */}
        {parsed > 0 && quote.data && !tooMuch && (
          <dl className="space-y-1.5 rounded-2xl bg-surface p-4 text-[13px] shadow-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Withdrawing</dt>
              <dd className="font-bold text-ink">
                {formatNaira(quote.data.amountRequested)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Transfer fee</dt>
              <dd className="font-bold text-ink">
                −{formatNaira(quote.data.feeAmount)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-hairline pt-1.5">
              <dt className="font-bold text-ink">You&apos;ll receive</dt>
              <dd className="text-[15px] font-extrabold text-brand">
                {formatNaira(quote.data.amountSent)}
              </dd>
            </div>
          </dl>
        )}

        <Field
          label="Your password"
          type="password"
          placeholder="To confirm it's you"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {failure && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {failure}
          </p>
        )}

        <Button
          type="submit"
          loading={withdraw.isPending}
          disabled={parsed <= 0 || tooMuch || !accountId}
        >
          {quote.data && parsed > 0 && !tooMuch
            ? `Withdraw ${formatNaira(quote.data.amountSent)}`
            : 'Withdraw'}
        </Button>

        <p className="text-center text-[12px] leading-snug text-ink-soft">
          Transfers usually arrive the same day. We&apos;ll notify you when it
          reaches your bank.
        </p>
      </form>
    </div>
  );
}

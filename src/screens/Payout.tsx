import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useUpdatePayout, useVendorProfile } from '../hooks/useProfile';
import { ApiError } from '../lib/api';
import { requiredProblem } from '../lib/validate';

/**
 * Where the money goes.
 *
 * All four fields are required together — `updatePayoutSchema` has no optionals — and
 * rightly so: a half-saved bank account is one nobody can pay into.
 *
 * `bankCode` is a Paystack code, and the backend has no bank-list endpoint. Rather than
 * make a vendor find "058" for GTBank, the common Nigerian banks are listed here and the
 * code is filled in for them. It is a hard-coded list, which is a real cost — a new bank
 * means a release — and the honest fix is a `/banks` endpoint proxying Paystack.
 */
const BANKS: { name: string; code: string }[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank', code: '023' },
  { name: 'Ecobank', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Moniepoint MFB', code: '50515' },
  { name: 'OPay', code: '999992' },
  { name: 'Palmpay', code: '999991' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank', code: '032' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

export function Payout() {
  const { data: profile } = useVendorProfile();
  const update = useUpdatePayout();

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setBankName(profile.bankName ?? '');
    setAccountNumber(profile.bankAccountNumber ?? '');
    setAccountName(profile.bankAccountName ?? '');
  }, [profile]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(null);
    setSaved(false);

    const bank = BANKS.find((candidate) => candidate.name === bankName);
    const problems = {
      bankName: bank ? null : 'Choose your bank',
      // NUBAN: exactly ten digits, which is what the backend enforces too.
      bankAccountNumber: /^\d{10}$/.test(accountNumber)
        ? null
        : 'Account numbers are exactly 10 digits',
      bankAccountName: requiredProblem(accountName, 'Account name'),
    };

    if (Object.values(problems).some(Boolean)) {
      setErrors(problems);
      return;
    }

    try {
      await update.mutateAsync({
        bankName: bank!.name,
        bankCode: bank!.code,
        bankAccountNumber: accountNumber,
        bankAccountName: accountName.trim(),
      });
      setSaved(true);
    } catch (cause) {
      setFailure(
        cause instanceof ApiError
          ? cause.message
          : 'Could not save those details. Try again in a moment.',
      );
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader title="Payout account" />

      <form onSubmit={submit} className="flex flex-1 flex-col gap-5 px-4 pb-6">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Where we send your earnings. Make sure the name matches the account
          exactly, or the transfer will bounce.
        </p>

        <div>
          <label
            htmlFor="bank"
            className="mb-1.5 block text-[13px] font-bold text-ink-soft"
          >
            Bank
          </label>
          <select
            id="bank"
            value={bankName}
            onChange={(event) => {
              setBankName(event.target.value);
              setErrors((current) => ({ ...current, bankName: null }));
              setSaved(false);
            }}
            className="min-h-12 w-full rounded-full border border-hairline bg-surface px-4 text-ink outline-none"
          >
            <option value="">Choose your bank</option>
            {BANKS.map((bank) => (
              <option key={bank.code} value={bank.name}>
                {bank.name}
              </option>
            ))}
          </select>
          {errors.bankName && (
            <p className="mt-1.5 px-4 text-[13px] text-accent">
              {errors.bankName}
            </p>
          )}
        </div>

        <Field
          label="Account number"
          inputMode="numeric"
          maxLength={10}
          placeholder="0123456789"
          value={accountNumber}
          onChange={(event) => {
            setAccountNumber(
              event.target.value.replace(/\D/g, '').slice(0, 10),
            );
            setErrors((current) => ({ ...current, bankAccountNumber: null }));
            setSaved(false);
          }}
          error={errors.bankAccountNumber}
        />

        <Field
          label="Account name"
          placeholder="As it appears on your bank statement"
          value={accountName}
          onChange={(event) => {
            setAccountName(event.target.value);
            setErrors((current) => ({ ...current, bankAccountName: null }));
            setSaved(false);
          }}
          error={errors.bankAccountName}
          maxLength={100}
        />

        {failure && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {failure}
          </p>
        )}

        {saved && (
          <p className="rounded-2xl bg-mint px-4 py-3 text-[13px] font-bold text-brand">
            Saved.
          </p>
        )}

        <div className="mt-auto pt-4">
          <Button type="submit" loading={update.isPending}>
            Save account
          </Button>
        </div>
      </form>
    </div>
  );
}

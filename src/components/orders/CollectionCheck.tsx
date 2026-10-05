import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  checkCollectionCode,
  type CollectionCheck as CheckResult,
} from '../../lib/services/orders.service';
import { ApiError } from '../../lib/api';

/**
 * "Someone's here to collect — is it them?"
 *
 * On a pickup order that is ready, the buyer shows a six-letter code from their Orders
 * tab. Typing it here says whether it belongs to this order, and whose it is. It only
 * answers: nothing is marked collected, and the vendor's pay is untouched.
 */
export function CollectionCheck({ orderId }: { orderId: string }) {
  const [code, setCode] = useState('');
  const check = useMutation<CheckResult, Error, string>({
    mutationFn: (value) => checkCollectionCode(orderId, value),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim()) check.mutate(code.trim());
  };

  const result = check.data;

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <h2 className="text-[14px] font-extrabold text-ink">
        Someone here to collect?
      </h2>
      <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
        Ask for the code in their Recommend app and type it here before you hand
        the order over.
      </p>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            check.reset();
          }}
          placeholder="ABCDEF"
          aria-label="Collection code"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={12}
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-hairline bg-canvas px-3 font-mono text-[18px] font-bold tracking-[0.25em] text-ink outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={!code.trim() || check.isPending}
          className="min-h-12 shrink-0 rounded-xl bg-brand px-4 text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {check.isPending ? 'Checking…' : 'Check'}
        </button>
      </form>

      {result?.matches && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-brand/10 px-3 py-2 text-[13px] font-bold text-brand"
        >
          ✓ Code matches — this is {result.buyerName}&apos;s order. Hand it
          over.
        </p>
      )}

      {result && !result.matches && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-[13px] font-bold text-accent"
        >
          ✗ That code isn&apos;t for this order. Don&apos;t hand it over — ask
          them to check the code in their app.
        </p>
      )}

      {check.isError && (
        <p role="alert" className="mt-3 text-[13px] text-accent">
          {check.error instanceof ApiError
            ? check.error.message
            : "Couldn't check that just now. Try again."}
        </p>
      )}
    </section>
  );
}

import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Bank } from '../../lib/contract';

/** Words left out of a bank's initials: "United Bank for Africa" is UBA, not UBFA. */
const NOT_IN_INITIALS = new Set([
  'of',
  'for',
  'and',
  'the',
  'plc',
  'ltd',
  'limited',
  'nigeria',
  'mfb',
]);

function initials(name: string): string {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !NOT_IN_INITIALS.has(word))
    .map((word) => word[0])
    .join('');
}

/**
 * How well `bank` matches what was typed, best first; null for no match.
 *
 * Every word typed must appear in the name — "first bank", "kuda", "moniepoint" — or the
 * whole query is the bank's initials, as people say them: "gtb", "uba", "fcmb". A name
 * starting with what was typed beats one containing it, which beats scattered words, so
 * "first bank" puts First Bank of Nigeria above First City Monument Bank.
 */
function rank(bank: Bank, query: string): number | null {
  const name = bank.name.toLowerCase();
  const phrase = query.toLowerCase().trim().replace(/\s+/g, ' ');
  if (name.startsWith(phrase)) return 0;
  if (name.includes(phrase)) return 1;
  const words = phrase.split(' ');
  if (words.every((word) => name.includes(word))) return 2;
  const compact = phrase.replace(/[^a-z0-9]/g, '');
  if (compact.length >= 2 && initials(bank.name).startsWith(compact)) return 2;
  return null;
}

function search(banks: Bank[], query: string): Bank[] {
  if (!query.trim()) return banks;
  return banks
    .map((bank) => ({ bank, score: rank(bank, query) }))
    .filter((hit): hit is { bank: Bank; score: number } => hit.score !== null)
    .sort((a, b) => a.score - b.score)
    .map((hit) => hit.bank);
}

/**
 * Choosing a bank from Paystack's list — a few hundred of them, banks and microfinance
 * banks together — by typing part of its name instead of scrolling.
 *
 * Until a bank is chosen the list sits open under the search box; choosing one collapses
 * it to that bank, with "Change" to search again. A combobox for screen readers and the
 * keyboard: arrows move, Enter chooses, Escape clears the search.
 */
export function BankPicker({
  banks,
  loading,
  value,
  onChange,
}: {
  banks: Bank[];
  loading: boolean;
  /** The chosen bank's code, or '' for none. */
  value: string;
  onChange: (code: string) => void;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const chosen = banks.find((bank) => bank.code === value) ?? null;
  const results = useMemo(() => search(banks, query), [banks, query]);
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  const choose = (bank: Bank) => {
    onChange(bank.code);
    setQuery('');
    setActive(0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === 'Enter') {
      // Never submits the form from here: Enter chooses the highlighted bank.
      event.preventDefault();
      const bank = results[activeIndex];
      if (bank) choose(bank);
    } else if (event.key === 'Escape' && query) {
      event.preventDefault();
      setQuery('');
      setActive(0);
    }
  };

  if (chosen) {
    return (
      <div>
        <span className="mb-1.5 block text-[13px] font-bold text-ink-soft">
          Bank
        </span>
        <div className="flex min-h-12 items-center gap-3 rounded-full border border-hairline bg-surface pr-2 pl-4">
          <span className="min-w-0 flex-1 truncate font-bold text-ink">
            {chosen.name}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange('');
              // Straight back to typing.
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="min-h-9 shrink-0 rounded-full bg-canvas px-3.5 text-[13px] font-bold text-accent"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-bold text-ink-soft"
      >
        Bank
      </label>
      <div className="flex min-h-12 items-center gap-2 rounded-full border border-hairline bg-surface px-4">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0 text-ink-faint"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          id={id}
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            results[activeIndex]
              ? `${listId}-${results[activeIndex].code}`
              : undefined
          }
          autoComplete="off"
          placeholder={
            loading ? 'Loading banks…' : 'Search your bank, e.g. GTB'
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="min-h-12 w-full bg-transparent text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label="Banks"
        className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-hairline bg-surface"
      >
        {results.map((bank, index) => (
          <li
            key={bank.code}
            id={`${listId}-${bank.code}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(bank)}
            className={[
              'cursor-pointer border-b border-hairline px-4 py-3 text-[14px] text-ink last:border-b-0',
              index === activeIndex ? 'bg-canvas font-bold' : '',
            ].join(' ')}
          >
            {bank.name}
          </li>
        ))}
        {!loading && results.length === 0 && (
          <li className="px-4 py-4 text-center text-[13px] text-ink-soft">
            No bank matches “{query.trim()}”. Try fewer letters.
          </li>
        )}
      </ul>
    </div>
  );
}

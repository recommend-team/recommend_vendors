import { useState } from 'react';
import { useCategoryOptions } from '../hooks/useProfile';
import { percentText } from '../lib/fees';
import { Field } from './ui/Field';

/**
 * The categories, should the list fail to load — so signing up never stalls on it. The
 * server links a vendor by name, so these still put them in the right category.
 */
const FALLBACK = [
  'Restaurant',
  'Gadgets',
  'Phone Accessories',
  'Home Appliances',
  'Fashion',
  'Beauty',
];

const same = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * "What do you sell?" — one of Recommend's categories, each with what Recommend keeps of
 * a sale in it, or "Something else" in their own words. A category from the list puts
 * the vendor in it, at its rate; anything else is sorted by Recommend.
 */
export function CategoryPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}) {
  const { data } = useCategoryOptions();
  const options =
    data && data.length > 0
      ? data
      : FALLBACK.map((name) => ({ id: name, name, feePercent: null }));

  const listed = options.find((option) => same(option.name, value));
  const [other, setOther] = useState(false);
  const typingOwn = other || (!!value.trim() && !listed);

  const chip = (selected: boolean) =>
    [
      'min-h-11 rounded-full px-4 text-[14px] font-bold transition',
      selected ? 'bg-accent text-white' : 'bg-surface text-ink-soft',
    ].join(' ');

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-bold text-ink-soft">What do you sell?</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={!typingOwn && !!listed && listed.id === option.id}
            onClick={() => {
              setOther(false);
              onChange(option.name);
            }}
            className={chip(!typingOwn && !!listed && listed.id === option.id)}
          >
            {option.name}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={typingOwn}
          onClick={() => {
            setOther(true);
            if (listed) onChange('');
          }}
          className={chip(typingOwn)}
        >
          Something else
        </button>
      </div>

      {typingOwn && (
        <div className="mt-3">
          <Field
            label="Tell us what you sell"
            placeholder="e.g. Pet supplies"
            value={listed ? '' : value}
            onChange={(event) => onChange(event.target.value)}
            maxLength={100}
          />
          <p className="mt-1 text-[12px] text-ink-soft">
            Recommend will put your store in the right category.
          </p>
        </div>
      )}

      {!typingOwn && listed && listed.feePercent !== null && (
        <p className="mt-2 text-[13px] text-ink-soft">
          Recommend keeps{' '}
          <strong className="text-ink">{percentText(listed.feePercent)}</strong> of
          each sale in {listed.name}.
        </p>
      )}

      {error && <p className="mt-1.5 text-[13px] text-accent">{error}</p>}
    </div>
  );
}

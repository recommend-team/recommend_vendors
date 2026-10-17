import type { ChoiceGroup } from '../../lib/contract';
import type { ChoiceGroupInput } from '../../lib/services/products.service';

/**
 * Questions on a dish — "Choose your protein: Chicken / Beef / Fish (+₦300)".
 *
 * Each choice: a name, whether the buyer must answer it, how many they pick ("exactly 1",
 * "up to 2"), and its options with an extra cost per portion. One answer covers the whole
 * pack. Existing choices keep their ids, so carts already holding them keep working.
 */

export interface DraftOption {
  key: string;
  id?: string;
  name: string;
  /** As typed — a price box. */
  priceDelta: string;
  isAvailable: boolean;
}

export interface DraftChoice {
  key: string;
  id?: string;
  name: string;
  required: boolean;
  /** "exactly N" only makes sense when required; an optional choice is "up to N". */
  mode: 'exactly' | 'upTo';
  count: number;
  options: DraftOption[];
}

let counter = 0;
const newKey = () => `k${Date.now().toString(36)}${(counter++).toString(36)}`;

export function newOption(name = ''): DraftOption {
  return { key: newKey(), name, priceDelta: '', isAvailable: true };
}

export function newChoice(): DraftChoice {
  return {
    key: newKey(),
    name: '',
    required: true,
    mode: 'exactly',
    count: 1,
    options: [newOption(), newOption()],
  };
}

export function toDrafts(groups: ChoiceGroup[] = []): DraftChoice[] {
  return groups.map((group) => ({
    key: newKey(),
    id: group.id,
    name: group.name,
    required: group.required,
    mode:
      group.required && group.minPick === group.maxPick ? 'exactly' : 'upTo',
    count: group.maxPick,
    options: group.options.map((option) => ({
      key: newKey(),
      id: option.id,
      name: option.name,
      priceDelta: option.priceDelta ? String(option.priceDelta) : '',
      isAvailable: option.isAvailable,
    })),
  }));
}

/** The first thing wrong with a choice, said so a vendor can fix it — or null. */
export function choiceProblem(choice: DraftChoice): string | null {
  if (choice.name.trim().length < 2)
    return 'Name the choice, e.g. Choose your protein';
  const options = choice.options.filter((option) => option.name.trim());
  if (options.length === 0) return 'Add at least one option';
  if (choice.options.some((o) => !o.name.trim() && o.priceDelta.trim())) {
    return 'Give every option a name';
  }
  for (const option of options) {
    const cost = option.priceDelta.trim() ? Number(option.priceDelta) : 0;
    if (!Number.isFinite(cost) || cost < 0)
      return `Check the extra cost on ${option.name}`;
  }
  if (choice.count < 1) return 'Buyers must be able to pick at least one';
  if (choice.count > options.length) {
    return `Buyers can pick ${choice.count}, but there ${options.length === 1 ? 'is' : 'are'} only ${options.length} option${options.length === 1 ? '' : 's'}`;
  }
  return null;
}

export function toChoiceInputs(drafts: DraftChoice[]): ChoiceGroupInput[] {
  return drafts.map((choice) => {
    const exactly = choice.required && choice.mode === 'exactly';
    return {
      ...(choice.id ? { id: choice.id } : {}),
      name: choice.name.trim(),
      required: choice.required,
      minPick: exactly ? choice.count : choice.required ? 1 : 0,
      maxPick: choice.count,
      options: choice.options
        .filter((option) => option.name.trim())
        .map((option) => ({
          ...(option.id ? { id: option.id } : {}),
          name: option.name.trim(),
          priceDelta: option.priceDelta.trim()
            ? Math.round(Number(option.priceDelta) * 100) / 100
            : 0,
          isAvailable: option.isAvailable,
        })),
    };
  });
}

const INPUT =
  'min-h-11 w-full rounded-xl border border-hairline bg-canvas px-3 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-brand';

export function ChoicesEditor({
  choices,
  onChange,
  problems,
}: {
  choices: DraftChoice[];
  onChange: (next: DraftChoice[]) => void;
  /** By choice key. */
  problems: Record<string, string | null>;
}) {
  const update = (key: string, patch: Partial<DraftChoice>) =>
    onChange(choices.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  const updateOption = (
    choice: DraftChoice,
    optionKey: string,
    patch: Partial<DraftOption>,
  ) =>
    update(choice.key, {
      options: choice.options.map((o) =>
        o.key === optionKey ? { ...o, ...patch } : o,
      ),
    });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[14px] font-extrabold text-ink">Choices</h2>
        <p className="text-[12px] leading-snug text-ink-soft">
          Questions buyers answer when they add this dish, e.g. &ldquo;Choose
          your protein&rdquo;. One answer covers the whole pack.
        </p>
      </div>

      {choices.map((choice, index) => (
        <div
          key={choice.key}
          className="space-y-3 rounded-2xl bg-surface p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`${choice.key}-name`}>
              Choice {index + 1} name
            </label>
            <input
              id={`${choice.key}-name`}
              value={choice.name}
              maxLength={60}
              placeholder="e.g. Choose your protein"
              onChange={(e) => update(choice.key, { name: e.target.value })}
              className={`${INPUT} font-bold`}
            />
            <button
              type="button"
              onClick={() =>
                onChange(choices.filter((c) => c.key !== choice.key))
              }
              aria-label={`Remove ${choice.name || `choice ${index + 1}`}`}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft active:bg-black/5"
            >
              <TrashIcon />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink">Required</p>
              <p className="text-[11px] leading-snug text-ink-soft">
                Buyers can&apos;t add the dish without answering.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={choice.required}
              aria-label={`${choice.name || `Choice ${index + 1}`} required`}
              onClick={() =>
                update(choice.key, {
                  required: !choice.required,
                  mode: choice.required ? 'upTo' : choice.mode,
                })
              }
              className={[
                'relative h-7 w-12 shrink-0 rounded-full transition',
                choice.required ? 'bg-brand' : 'bg-hairline',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-1 h-5 w-5 rounded-full bg-white transition-all',
                  choice.required ? 'left-6' : 'left-1',
                ].join(' ')}
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
            <span className="font-bold">Buyers pick</span>
            {choice.required ? (
              <select
                aria-label="Exactly or up to"
                value={choice.mode}
                onChange={(e) =>
                  update(choice.key, {
                    mode: e.target.value as DraftChoice['mode'],
                  })
                }
                className="min-h-10 rounded-xl border border-hairline bg-canvas px-2"
              >
                <option value="exactly">exactly</option>
                <option value="upTo">up to</option>
              </select>
            ) : (
              <span>up to</span>
            )}
            <select
              aria-label="How many"
              value={choice.count}
              onChange={(e) =>
                update(choice.key, { count: Number(e.target.value) })
              }
              className="min-h-10 rounded-xl border border-hairline bg-canvas px-2"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <ul className="space-y-2">
            {choice.options.map((option, optionIndex) => (
              <li key={option.key} className="flex items-center gap-2">
                <input
                  aria-label={`Option ${optionIndex + 1}`}
                  value={option.name}
                  maxLength={60}
                  placeholder={optionIndex === 0 ? 'e.g. Chicken' : 'Option'}
                  onChange={(e) =>
                    updateOption(choice, option.key, { name: e.target.value })
                  }
                  className={`${INPUT} min-w-0 flex-1 ${option.isAvailable ? '' : 'text-ink-faint line-through'}`}
                />
                <div className="relative w-24 shrink-0">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12px] text-ink-faint">
                    +₦
                  </span>
                  <input
                    aria-label={`Extra cost for ${option.name || `option ${optionIndex + 1}`}, per portion`}
                    inputMode="decimal"
                    value={option.priceDelta}
                    placeholder="0"
                    onChange={(e) =>
                      updateOption(choice, option.key, {
                        priceDelta: e.target.value.replace(/[^\d.]/g, ''),
                      })
                    }
                    className={`${INPUT} pl-8`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateOption(choice, option.key, {
                      isAvailable: !option.isAvailable,
                    })
                  }
                  aria-pressed={!option.isAvailable}
                  aria-label={`${option.name || 'Option'} ${option.isAvailable ? 'available — tap when it runs out' : 'out — tap when it is back'}`}
                  className={`min-h-11 shrink-0 rounded-full px-2.5 text-[11px] font-bold ${option.isAvailable ? 'bg-mint text-brand' : 'bg-amber text-ink-soft'}`}
                >
                  {option.isAvailable ? 'In' : 'Out'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update(choice.key, {
                      options: choice.options.filter(
                        (o) => o.key !== option.key,
                      ),
                    })
                  }
                  aria-label={`Remove ${option.name || `option ${optionIndex + 1}`}`}
                  className="grid h-11 w-9 shrink-0 place-items-center text-ink-faint"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-ink-faint">
            Extra cost is per portion — leave empty if it&apos;s included.
          </p>

          <button
            type="button"
            onClick={() =>
              update(choice.key, { options: [...choice.options, newOption()] })
            }
            disabled={choice.options.length >= 10}
            className="text-[13px] font-bold text-accent disabled:opacity-40"
          >
            + Add option
          </button>

          {problems[choice.key] && (
            <p role="alert" className="text-[12px] font-bold text-accent">
              {problems[choice.key]}
            </p>
          )}
        </div>
      ))}

      {choices.length < 5 && (
        <button
          type="button"
          onClick={() => onChange([...choices, newChoice()])}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-dashed border-brand/50 text-[14px] font-bold text-brand"
        >
          + Add a choice
        </button>
      )}
    </section>
  );
}

function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M10 7V5h4v2m-7 0 1 13h8l1-13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

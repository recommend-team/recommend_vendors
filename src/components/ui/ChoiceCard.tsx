import type { ReactNode } from 'react';

export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  icon,
  title,
  badge,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  icon?: ReactNode;
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={[
        'block cursor-pointer rounded-2xl border-2 bg-surface p-4 transition',
        checked ? 'border-accent' : 'border-transparent',
      ].join(' ')}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />

      <div className="flex items-start gap-3">
        {icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber text-accent">
            {icon}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[16px] font-extrabold text-ink">{title}</p>
            {badge && (
              <span className="shrink-0 rounded-full bg-mint px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-brand uppercase">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">
            {children}
          </p>
        </div>
      </div>
    </label>
  );
}

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

/**
 * A labelled input, in the reference's style: pill-shaped, white on cream.
 *
 * The label is a real `<label>` bound by id rather than a floating placeholder — a
 * placeholder disappears the moment someone starts typing, which is exactly when a
 * vendor filling in KYC needs to know which field they are in.
 */
export function Field({
  label,
  hint,
  error,
  trailing,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  trailing?: ReactNode;
}) {
  const id = useId();

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-bold text-ink-soft">
          {label}
        </label>
        {hint}
      </div>

      <div
        className={[
          'flex items-center gap-2 rounded-full border bg-surface px-4',
          error ? 'border-accent' : 'border-hairline',
        ].join(' ')}
      >
        <input
          id={id}
          aria-invalid={!!error}
          className="min-h-12 w-full bg-transparent text-ink outline-none placeholder:text-ink-faint"
          {...rest}
        />
        {trailing}
      </div>

      {error && <p className="mt-1.5 px-4 text-[13px] text-accent">{error}</p>}
    </div>
  );
}

/** Password field with a reveal toggle, as in the reference. */
export function PasswordField({
  label,
  hint,
  error,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // Typing a password on a phone keyboard is error-prone enough that hiding it
          // by default and letting them check is kinder than either extreme.
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="shrink-0 p-1 text-ink-faint"
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      }
      {...rest}
    />
  );
}

function Eye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 10.7a3 3 0 004.2 4.2M9.9 5.2A9.6 9.6 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.2 6.7A17 17 0 002 12s3.5 7 10 7c1 0 1.9-.1 2.7-.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

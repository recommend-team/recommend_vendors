import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

/**
 * The one thing a vendor taps in a hurry.
 *
 * Sized for a thumb rather than a cursor: `min-h-12` is roughly the smallest target that
 * is reliably hit while standing up and holding something else. Nothing shrinks below it.
 */
export function Button({
  variant = 'primary',
  full = true,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}) {
  const styles: Record<Variant, string> = {
    primary: 'bg-accent text-white active:bg-accent-active',
    // Present without competing — the references use mint for the second choice.
    secondary: 'bg-mint text-brand active:bg-mint-hover',
    ghost: 'bg-transparent text-ink-soft active:opacity-60',
  };

  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5',
        'text-[15px] font-bold transition active:scale-[0.99]',
        'disabled:opacity-50',
        full ? 'w-full' : '',
        styles[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? 'Please wait…' : children}
      {!loading && icon}
    </button>
  );
}

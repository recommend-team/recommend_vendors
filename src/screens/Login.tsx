import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field, PasswordField } from '../components/ui/Field';
import { useSession } from '../hooks/useSession';
import { ApiError } from '../lib/api';

/**
 * Signing in.
 *
 * **Email, not phone.** The reference shows a phone field with a `+234` selector, but
 * the API authenticates on `{ email, password }` — `loginSchema` has no phone, and there
 * is no lookup by number anywhere in the backend. A phone field here would be a login
 * screen that cannot log anyone in.
 *
 * Moving to phone is a backend change first: resolve a number to an account, and decide
 * what happens when two accounts share one.
 */
export function Login() {
  const navigate = useNavigate();
  const { login } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/orders', { replace: true });
    } catch (cause) {
      // The backend distinguishes wrong credentials from an unverified email and a
      // suspended account, and each needs a different action from the vendor — so its
      // message is shown rather than a generic one.
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Could not sign you in. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas px-6 pt-14 pb-8">
      <header className="text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-2xl font-extrabold text-white">
          R
        </span>
        <p className="mt-3 text-xl font-extrabold text-accent">Recommend</p>
        <p className="text-[10px] font-bold tracking-[0.2em] text-ink-faint uppercase">
          For Vendors
        </p>
      </header>

      <div className="mt-10">
        <h1 className="text-3xl font-extrabold text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Log in to manage your business
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="you@yourbusiness.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          hint={
            <Link
              to="/forgot-password"
              className="text-[13px] font-bold text-accent"
            >
              Forgot password?
            </Link>
          }
        />

        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
          >
            {error}
          </p>
        )}

        <Button type="submit" loading={busy} className="mt-2">
          Login
        </Button>
      </form>

      <p className="mt-8 text-center text-[13px] text-ink-soft">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-bold text-accent">
          Sign up
        </Link>
      </p>
    </div>
  );
}

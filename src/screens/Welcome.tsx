import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

/**
 * The way in, from the reference: deep green, one cream card, two choices.
 *
 * Sign up is the primary action even though most early traffic will be existing vendors
 * logging in — the app's job at this point is to recruit, and someone who already has an
 * account knows exactly where Login is.
 */
export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col bg-forest px-6 pt-16 pb-8 text-white">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight">Recommend</h1>
        <p className="mt-1 text-sm font-bold text-white/70">
          Grow Your Business
        </p>
      </header>

      <div className="rounded-3xl bg-canvas p-6 text-ink">
        <p className="text-[11px] font-extrabold tracking-widest text-accent uppercase">
          Vendor portal
        </p>
        <h2 className="mt-2 text-2xl leading-tight font-extrabold">
          Ready to expand your reach?
        </h2>

        <div className="mt-6 space-y-3">
          <Button onClick={() => navigate('/signup')} icon={<ArrowRight />}>
            Sign Up
          </Button>
          <Button variant="secondary" onClick={() => navigate('/login')}>
            Login
          </Button>
        </div>

        <p className="mt-6 text-center text-[11px] text-ink-faint">
          Sell to buyers already looking for what you have
        </p>
      </div>

      <footer className="mt-auto flex justify-center gap-6 pt-10 text-[12px] text-white/60">
        <span>Help &amp; Support</span>
        <span>Resources</span>
      </footer>
    </div>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14m0 0-5-5m5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

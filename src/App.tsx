import { UpdateToast } from './components/UpdateToast';

/**
 * The shell.
 *
 * V0 is setup only — there are no screens yet, and no router until V1 gives it
 * something to route between. This placeholder exists so the build, the service worker
 * and the install path can be proved end to end before any of that is written.
 */
export function App() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-surface">
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-lg font-extrabold text-white">
          R
        </span>
        <div>
          <h1 className="text-base font-extrabold text-ink">Recommend</h1>
          <p className="text-xs text-ink-soft">for vendors</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-bold text-ink">Setup complete</p>
        <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
          Orders, products and payouts land here as the sprints ship.
        </p>
      </main>

      <UpdateToast />
    </div>
  );
}

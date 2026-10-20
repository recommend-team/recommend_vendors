import { ScreenHeader } from '../components/layout/ScreenHeader';
import { OpeningHours } from '../components/settings/OpeningHours';

/**
 * How the shop runs, as opposed to how it looks (Store details).
 *
 * One section per setting, opening hours first. A setting that outgrows its section gets
 * a screen of its own; until then they all live here, one tap from the menu.
 */
export function Settings() {
  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader title="Settings" />
      <div className="space-y-4 px-4 pb-6">
        <OpeningHours />
      </div>
    </div>
  );
}

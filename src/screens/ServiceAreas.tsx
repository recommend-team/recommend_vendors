import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import {
  useAreas,
  useStates,
  useUpdateProfile,
  useVendorProfile,
} from '../hooks/useProfile';
import { ApiError } from '../lib/api';

/** `updateProfileSchema` caps coverage at twenty areas. */
const MAX_AREAS = 20;

/**
 * Where a vendor delivers.
 *
 * **Sends `areaIds`, never `businessAreas`.** Areas became admin-created rows in B1 and
 * the free-text field is gone; `recommend-fe` still sends the old comma-joined string
 * and consequently cannot save coverage at all (`BACKLOG.md` §2.1). That bug is the one
 * thing this screen exists to not repeat.
 *
 * It also matters more than it looks: discovery filters vendors by area, so a vendor
 * with no areas set is invisible to every buyer regardless of how good their products
 * are.
 */
export function ServiceAreas() {
  const { data: profile } = useVendorProfile();
  const update = useUpdateProfile();

  const { data: states } = useStates();
  const [stateId, setStateId] = useState<string | null>(null);
  const { data: areas, isLoading: areasLoading } = useAreas(stateId);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Seed from whatever the vendor already covers.
  useEffect(() => {
    if (!profile) return;
    setSelected(new Set(profile.serviceAreas.map((area) => area.id)));
  }, [profile]);

  // Default to the state the vendor already serves, or the first available.
  useEffect(() => {
    if (stateId || !states?.length) return;
    setStateId(profile?.serviceAreas[0]?.stateId ?? states[0].id);
  }, [states, stateId, profile]);

  const toggle = (id: string) => {
    setSaved(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_AREAS) next.add(id);
      return next;
    });
  };

  const save = async () => {
    setFailure(null);
    try {
      await update.mutateAsync({ areaIds: [...selected] });
      setSaved(true);
    } catch (cause) {
      setFailure(
        cause instanceof ApiError
          ? cause.message
          : 'Could not save your areas. Try again in a moment.',
      );
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-canvas">
      <ScreenHeader
        title="Where you deliver"
        subtitle={`${selected.size} area${selected.size === 1 ? '' : 's'} selected`}
      />

      <div className="px-4 pb-4">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          Buyers only see you when they search in an area you cover. Pick every
          area you can reach.
        </p>

        {(states?.length ?? 0) > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {states?.map((state) => (
              <button
                key={state.id}
                onClick={() => setStateId(state.id)}
                className={[
                  'min-h-10 shrink-0 rounded-full px-4 text-[14px] font-bold transition',
                  stateId === state.id
                    ? 'bg-accent text-white'
                    : 'bg-surface text-ink-soft',
                ].join(' ')}
              >
                {state.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4">
        {areasLoading && (
          <p className="py-8 text-center text-[13px] text-ink-soft">
            Loading areas…
          </p>
        )}

        {!areasLoading && areas?.length === 0 && (
          <p className="py-8 text-center text-[13px] leading-relaxed text-ink-soft">
            No areas listed here yet. We add them as we open up new
            neighbourhoods.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {areas?.map((area) => {
            const chosen = selected.has(area.id);
            return (
              <button
                key={area.id}
                onClick={() => toggle(area.id)}
                aria-pressed={chosen}
                className={[
                  'min-h-11 rounded-full px-4 text-[14px] font-bold transition',
                  chosen ? 'bg-brand text-white' : 'bg-surface text-ink-soft',
                ].join(' ')}
              >
                {area.name}
              </button>
            );
          })}
        </div>

        {selected.size >= MAX_AREAS && (
          <p className="mt-4 text-[12px] leading-snug text-ink-faint">
            That&apos;s the maximum of {MAX_AREAS} areas. Remove one to add
            another.
          </p>
        )}

        {selected.size === 0 && (
          <p className="mt-4 rounded-2xl bg-amber px-4 py-3 text-[12px] leading-snug text-ink">
            With no areas selected, buyers cannot find your products at all.
          </p>
        )}
      </div>

      <div
        className="mt-auto border-t border-hairline bg-surface p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {failure && (
          <p role="alert" className="mb-3 text-[13px] text-accent">
            {failure}
          </p>
        )}
        {saved && (
          <p className="mb-3 text-center text-[13px] font-bold text-brand">
            Saved.
          </p>
        )}
        <Button onClick={() => void save()} loading={update.isPending}>
          Save areas
        </Button>
      </div>
    </div>
  );
}

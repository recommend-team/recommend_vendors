import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { useUpdateProfile, useVendorProfile } from '../../hooks/useProfile';
import { ApiError } from '../../lib/api';
import type { DaySchedule, OperatingHours, WeekDay } from '../../lib/contract';
import {
  STARTER_WEEK,
  WEEK,
  closesPhrase,
  dayNote,
  timeChoices,
  twelveHour,
  opensPhrase,
  shopState,
} from '../../lib/opening';

const EVERY_DAY_OFF =
  'Open at least one day — to stop taking orders for now, pause the shop on your Dashboard instead.';

const STOP_USING =
  'Stop using opening hours? Buyers will be able to order whenever your shop is switched on.';

/**
 * The week a vendor takes orders in — the Settings page's first section.
 *
 * Exactly the backend's rule: each day open between two times or off, a closing time
 * earlier than the opening one closes the next day, the same time is all day. The whole
 * week is sent on every save, because the backend replaces the stored week and refuses
 * part of one. Nothing is saved until the vendor taps Save.
 */
export function OpeningHours() {
  const { data: profile, isLoading } = useVendorProfile();
  const update = useUpdateProfile();

  const [useHours, setUseHours] = useState(false);
  const [week, setWeek] = useState<OperatingHours>(STARTER_WEEK);
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUseHours(profile.operatingHours !== null);
    setWeek(profile.operatingHours ?? STARTER_WEEK);
  }, [profile]);

  const changed = () => {
    setFailure(null);
    setSaved(false);
  };
  const setDay = (key: WeekDay, patch: Partial<DaySchedule>) => {
    setWeek((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
    changed();
  };

  const hadHours = profile?.operatingHours != null;
  const nothingToSave = !useHours && !hadHours;

  const save = async () => {
    setFailure(null);
    if (useHours && !WEEK.some(({ key }) => week[key].isOpen)) {
      setFailure(EVERY_DAY_OFF);
      return;
    }
    if (!useHours && !window.confirm(STOP_USING)) return;

    try {
      await update.mutateAsync({ operatingHours: useHours ? week : null });
      setSaved(true);
    } catch (cause) {
      setFailure(
        cause instanceof ApiError
          ? cause.message
          : 'Could not save that. Check your connection and try again.',
      );
    }
  };

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <h2 className="text-[17px] font-extrabold text-ink">Opening hours</h2>
      {profile && (
        <p role="status" className="mt-0.5 text-[13px] font-bold text-brand">
          {statusLine(profile)}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-ink">
            Use opening hours
          </span>
          <span className="mt-0.5 block text-[12px] leading-snug text-ink-soft">
            {useHours
              ? 'Buyers can order only inside these hours, while your shop is switched on.'
              : 'Off: buyers can order whenever your shop is switched on.'}
          </span>
        </span>
        <Switch
          label="Use opening hours"
          on={useHours}
          onToggle={() => {
            setUseHours(!useHours);
            changed();
          }}
        />
      </div>

      {useHours && (
        // One day per block, stacked: the name and its switch on one line, the two times
        // side by side beneath. Nothing shares a line with more than it can fit on a
        // narrow phone.
        <ul className="mt-4 divide-y divide-hairline border-t border-hairline">
          {WEEK.map(({ key, label }) => {
            const day = week[key];
            const note = dayNote(day);
            return (
              <li key={key} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 text-[15px] font-bold text-ink">
                    {label}
                  </span>
                  <span
                    className={[
                      'text-[12px] font-bold',
                      day.isOpen ? 'text-brand' : 'text-ink-faint',
                    ].join(' ')}
                  >
                    {day.isOpen ? 'Open' : 'Closed'}
                  </span>
                  <Switch
                    label={`Open on ${label}`}
                    on={day.isOpen}
                    onToggle={() => setDay(key, { isOpen: !day.isOpen })}
                  />
                </div>
                {day.isOpen && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <TimeSelect
                      caption="Opens"
                      label={`${label} opens`}
                      value={day.open}
                      onChange={(open) => setDay(key, { open })}
                    />
                    <TimeSelect
                      caption="Closes"
                      label={`${label} closes`}
                      value={day.close}
                      onChange={(close) => setDay(key, { close })}
                    />
                  </div>
                )}
                {note && (
                  <p className="mt-1.5 text-[12px] font-bold text-brand">
                    {note}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {failure && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-[13px] leading-snug text-accent"
        >
          {failure}
        </p>
      )}

      {saved && (
        <p className="mt-4 rounded-2xl bg-mint px-4 py-3 text-[13px] font-bold text-brand">
          Saved.
        </p>
      )}

      <div className="mt-4">
        <Button
          onClick={save}
          loading={isLoading || update.isPending}
          disabled={nothingToSave}
        >
          Save hours
        </Button>
      </div>
    </section>
  );
}

/** "Open now · closes 7pm", "Closed · opens tomorrow at 8am", "Paused". */
function statusLine(profile: {
  isOpen: boolean;
  openNow?: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
}): string {
  switch (shopState(profile)) {
    case 'paused':
      return 'Paused';
    case 'open':
      return profile.closesAt
        ? `Open now · ${closesPhrase(profile.closesAt)}`
        : 'Open now';
    case 'closed':
      return profile.opensAt
        ? `Closed · ${opensPhrase(profile.opensAt)}`
        : 'Closed';
  }
}

/**
 * A time as a 12-hour list ("9:00 AM"), not the phone's time box — that shows 24-hour
 * time on many phones and the app cannot change it. A plain list opens the phone's own
 * picker wheel, and is easy to hit with a thumb.
 */
function TimeSelect({
  caption,
  label,
  value,
  onChange,
}: {
  caption: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-extrabold tracking-wide text-ink-soft uppercase">
        {caption}
      </span>
      <span className="relative block">
        <select
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-hairline bg-canvas pr-8 pl-3 text-[15px] font-bold text-ink outline-none focus:border-brand"
        >
          {timeChoices(value).map((time) => (
            <option key={time} value={time}>
              {twelveHour(time)}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-soft"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}

function Switch({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={[
        'relative h-7 w-12 shrink-0 rounded-full transition',
        on ? 'bg-brand' : 'bg-ink-faint/40',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={[
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all',
          on ? 'left-[22px]' : 'left-0.5',
        ].join(' ')}
      />
    </button>
  );
}

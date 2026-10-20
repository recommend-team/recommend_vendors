/**
 * Opening hours, as a vendor reads them.
 *
 * Whether the shop is open is the server's call (`openNow`, `opensAt`, `closesAt` on the
 * profile) — this only words it. Every time is Lagos time, whatever the phone's own
 * timezone: WAT is UTC+1 all year, so a fixed offset is exact.
 *
 * `lib/`, so React Native gets these unchanged.
 */
import type { DaySchedule, OperatingHours, WeekDay } from './contract';

/** Monday first — the order a vendor plans their week in. */
export const WEEK: { key: WeekDay; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

/** What turning hours on for the first time fills in, for the vendor to adjust. */
export const STARTER_WEEK: OperatingHours = {
  monday: { isOpen: true, open: '09:00', close: '19:00' },
  tuesday: { isOpen: true, open: '09:00', close: '19:00' },
  wednesday: { isOpen: true, open: '09:00', close: '19:00' },
  thursday: { isOpen: true, open: '09:00', close: '19:00' },
  friday: { isOpen: true, open: '09:00', close: '19:00' },
  saturday: { isOpen: true, open: '09:00', close: '19:00' },
  sunday: { isOpen: false, open: '09:00', close: '19:00' },
};

/** "closes the next day" / "open 24 hours" — what an unusual pair of times means. */
export function dayNote(day: DaySchedule): string | null {
  if (!day.isOpen) return null;
  if (day.close === day.open) return 'Open 24 hours';
  if (day.close < day.open) return 'Closes the next day';
  return null;
}

const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** "7pm", "8:30am" — a moment's clock time in Lagos. */
export function lagosClock(iso: string): string {
  const local = new Date(new Date(iso).getTime() + LAGOS_OFFSET_MS);
  const hours = local.getUTCHours();
  const minutes = local.getUTCMinutes();
  return (
    `${hours % 12 || 12}` +
    (minutes ? `:${String(minutes).padStart(2, '0')}` : '') +
    (hours < 12 ? 'am' : 'pm')
  );
}

/** "today at 9am", "tomorrow at 8am", "Friday at 6pm", "next Monday at 9am". */
export function lagosWhen(iso: string, now = new Date()): string {
  const at = new Date(iso);
  const lagosDay = (date: Date) =>
    Math.floor((date.getTime() + LAGOS_OFFSET_MS) / DAY_MS);
  const days = lagosDay(at) - lagosDay(now);
  const name = DAY_NAMES[new Date(at.getTime() + LAGOS_OFFSET_MS).getUTCDay()];
  const day =
    days <= 0
      ? 'today'
      : days === 1
        ? 'tomorrow'
        : days >= 7
          ? `next ${name}`
          : name;
  return `${day} at ${lagosClock(iso)}`;
}

export type ShopState = 'open' | 'closed' | 'paused';

/**
 * Where the shop stands right now, from the profile. An older server sends no `openNow`;
 * then the switch is all there is.
 */
export function shopState(profile: {
  isOpen: boolean;
  openNow?: boolean;
}): ShopState {
  if (!profile.isOpen) return 'paused';
  return (profile.openNow ?? true) ? 'open' : 'closed';
}

/** "closes at 7pm", or "closes tomorrow at 2am" for hours past midnight. */
export function closesPhrase(closesAt: string, now = new Date()): string {
  const when = lagosWhen(closesAt, now);
  return when.startsWith('today ')
    ? `closes ${when.slice(6)}`
    : `closes ${when}`;
}

/** "opens tomorrow at 8am". */
export function opensPhrase(opensAt: string, now = new Date()): string {
  return `opens ${lagosWhen(opensAt, now)}`;
}

/** Capitalises a phrase for the start of a line. */
export function sentence(phrase: string): string {
  return phrase[0].toUpperCase() + phrase.slice(1);
}

/** Every half hour of the day, "HH:mm" — what the time lists offer. */
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const hours = String(Math.floor(i / 2)).padStart(2, '0');
  return `${hours}:${i % 2 ? '30' : '00'}`;
});

/**
 * The times a list offers: every half hour, plus `current` if it falls between them
 * (hours saved elsewhere, such as by the team), so a saved time is never lost.
 */
export function timeChoices(current: string): string[] {
  return HALF_HOURS.includes(current)
    ? HALF_HOURS
    : [...HALF_HOURS, current].sort();
}

/** "09:00" → "9:00 AM", "12:00" → "12:00 PM (noon)", "00:00" → "12:00 AM (midnight)". */
export function twelveHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const clock = `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours < 12 ? 'AM' : 'PM'}`;
  if (time === '00:00') return `${clock} (midnight)`;
  if (time === '12:00') return `${clock} (noon)`;
  return clock;
}

import { describe, expect, it } from 'vitest';
import {
  closesPhrase,
  dayNote,
  lagosWhen,
  opensPhrase,
  shopState,
  timeChoices,
  twelveHour,
} from './opening';

/** A moment written as Lagos wall-clock time. 2026-10-19 is a Monday. */
const lagos = (local: string) => `${local}:00+01:00`;
const MONDAY_NIGHT = new Date(lagos('2026-10-19T21:00'));

describe('lagosWhen', () => {
  it.each([
    ['2026-10-19T22:00', 'today at 10pm'],
    ['2026-10-20T08:00', 'tomorrow at 8am'],
    ['2026-10-20T08:30', 'tomorrow at 8:30am'],
    ['2026-10-23T12:00', 'Friday at 12pm'],
    ['2026-10-25T00:00', 'Sunday at 12am'],
    ['2026-10-26T09:00', 'next Monday at 9am'],
  ])('reads %s as "%s"', (at, said) => {
    expect(lagosWhen(lagos(at), MONDAY_NIGHT)).toBe(said);
  });

  it('counts days in Lagos, whatever timezone the phone is in', () => {
    // 23:30 UTC Monday is already 00:30 Tuesday in Lagos.
    expect(
      lagosWhen('2026-10-19T23:30:00Z', new Date('2026-10-19T20:00:00Z')),
    ).toBe('tomorrow at 12:30am');
  });
});

describe('closing and opening phrases', () => {
  it('drops "today" from a closing time later today', () => {
    expect(closesPhrase(lagos('2026-10-19T23:00'), MONDAY_NIGHT)).toBe(
      'closes at 11pm',
    );
  });

  it('keeps the day for hours that run past midnight', () => {
    expect(closesPhrase(lagos('2026-10-20T02:00'), MONDAY_NIGHT)).toBe(
      'closes tomorrow at 2am',
    );
  });

  it('says when the shop opens', () => {
    expect(opensPhrase(lagos('2026-10-20T08:00'), MONDAY_NIGHT)).toBe(
      'opens tomorrow at 8am',
    );
  });
});

describe('dayNote', () => {
  it.each([
    [{ isOpen: true, open: '18:00', close: '02:00' }, 'Closes the next day'],
    [{ isOpen: true, open: '00:00', close: '00:00' }, 'Open 24 hours'],
    [{ isOpen: true, open: '09:00', close: '19:00' }, null],
    [{ isOpen: false, open: '18:00', close: '02:00' }, null],
  ])('%o → %s', (day, note) => {
    expect(dayNote(day)).toBe(note);
  });
});

describe('shopState', () => {
  it('is paused when the switch is off, whatever the hours say', () => {
    expect(shopState({ isOpen: false, openNow: true })).toBe('paused');
  });

  it('follows the server’s judgement when switched on', () => {
    expect(shopState({ isOpen: true, openNow: true })).toBe('open');
    expect(shopState({ isOpen: true, openNow: false })).toBe('closed');
  });

  it('trusts the switch alone from a server that does not send openNow', () => {
    expect(shopState({ isOpen: true })).toBe('open');
  });
});

describe('twelveHour', () => {
  it.each([
    ['09:00', '9:00 AM'],
    ['13:30', '1:30 PM'],
    ['19:00', '7:00 PM'],
    ['12:00', '12:00 PM (noon)'],
    ['00:00', '12:00 AM (midnight)'],
    ['00:30', '12:30 AM'],
    ['08:10', '8:10 AM'],
  ])('reads %s as "%s"', (time, said) => {
    expect(twelveHour(time)).toBe(said);
  });
});

describe('timeChoices', () => {
  it('offers every half hour of the day', () => {
    const choices = timeChoices('09:00');
    expect(choices).toHaveLength(48);
    expect(choices.slice(0, 3)).toEqual(['00:00', '00:30', '01:00']);
    expect(choices.at(-1)).toBe('23:30');
  });

  it('keeps a saved time that falls between half hours, in its place', () => {
    const choices = timeChoices('08:10');
    expect(choices).toHaveLength(49);
    expect(choices.slice(16, 19)).toEqual(['08:00', '08:10', '08:30']);
  });
});

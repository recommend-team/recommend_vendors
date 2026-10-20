import { describe, expect, it } from 'vitest';
import {
  closesPhrase,
  dayNote,
  lagosWhen,
  opensPhrase,
  shopState,
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

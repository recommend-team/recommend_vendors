import { describe, expect, it } from 'vitest';
import {
  emailProblem,
  passwordProblem,
  phoneProblem,
  toE164,
} from './validate';

describe('toE164', () => {
  it('accepts the way Nigerians actually write a number', () => {
    // Every one of these means the same phone. None of them passes the backend's
    // `/^\+?[1-9]\d{1,14}$/` unchanged, so signup would fail on a valid number.
    expect(toE164('08012345678')).toBe('+2348012345678');
    expect(toE164('0801 234 5678')).toBe('+2348012345678');
    expect(toE164('+234 801 234 5678')).toBe('+2348012345678');
    expect(toE164('234-801-234-5678')).toBe('+2348012345678');
    expect(toE164('8012345678')).toBe('+2348012345678');
  });

  it('refuses what is not a number', () => {
    expect(toE164('')).toBeNull();
    expect(toE164('abc')).toBeNull();
    expect(toE164('0')).toBeNull();
  });

  it('leaves an already-normalised number alone', () => {
    expect(toE164('+2348012345678')).toBe('+2348012345678');
  });
});

describe('phoneProblem', () => {
  it('passes anything toE164 can normalise', () => {
    expect(phoneProblem('0801 234 5678')).toBeNull();
    expect(phoneProblem('nonsense')).toBeTruthy();
  });
});

describe('passwordProblem', () => {
  it('enforces exactly what the backend enforces', () => {
    // Mirrors `registerVendorSchema`. Getting this wrong means a wizard that accepts a
    // password on step 5 and is rejected on submit, after every other answer.
    expect(passwordProblem('VendorTest123!')).toBeNull();
    expect(passwordProblem('short1!A')).toBeNull();
  });

  it('explains what is missing rather than just refusing', () => {
    expect(passwordProblem('abc')).toMatch(/8 characters/);
    // No capital, no symbol.
    expect(passwordProblem('alllowercase1')).toMatch(/capital|symbol/i);
    expect(passwordProblem('NoSymbols123')).toMatch(/symbol/i);
  });
});

describe('emailProblem', () => {
  it('catches the obvious typos before a round trip', () => {
    expect(emailProblem('vendor@example.com')).toBeNull();
    expect(emailProblem('vendor@')).toBeTruthy();
    expect(emailProblem('no-at-sign')).toBeTruthy();
  });
});

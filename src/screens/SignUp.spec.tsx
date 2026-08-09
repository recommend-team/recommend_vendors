import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SignUp } from './SignUp';

/**
 * The marketing site's tier cards deep-link here as `/signup?type=REGISTERED`. That link
 * crosses a repo boundary, so nothing else can catch it drifting — if the param name or
 * its accepted values change, the funnel silently degrades to "pick your tier twice"
 * rather than failing loudly.
 */
function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SignUp />
    </MemoryRouter>,
  );
}

describe('SignUp', () => {
  it('pre-selects the tier the marketing site linked with', () => {
    renderAt('/signup?type=REGISTERED');

    expect(screen.getByRole('radio', { name: /registered business/i })).toBeChecked();
  });

  it('pre-selects the non-registered tier too', () => {
    renderAt('/signup?type=NON_REGISTERED');

    expect(screen.getByRole('radio', { name: /not registered yet/i })).toBeChecked();
  });

  it('ignores a tier it does not recognise rather than trusting the URL', () => {
    renderAt('/signup?type=ADMIN');

    expect(
      screen.getByRole('radio', { name: /registered business/i }),
    ).not.toBeChecked();
  });

  it('starts with nothing chosen when no tier is linked', () => {
    renderAt('/signup');

    expect(
      screen.getByRole('radio', { name: /registered business/i }),
    ).not.toBeChecked();
  });
});

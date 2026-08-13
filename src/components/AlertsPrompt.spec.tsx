import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertsPrompt } from './AlertsPrompt';
import type { PushState } from '../lib/push';
import type { UseInstallPrompt } from '../hooks/useInstallPrompt';

const push = vi.fn();
const install = vi.fn();

vi.mock('../hooks/usePush', () => ({ usePush: () => push() }));
vi.mock('../hooks/useInstallPrompt', () => ({
  useInstallPrompt: () => install(),
}));

function setup({
  state = 'available' as PushState,
  canAsk = true,
  kind = null as UseInstallPrompt['kind'],
  installed = false,
  askForPush = true,
} = {}) {
  push.mockReturnValue({
    state,
    canAsk,
    enable: vi.fn(),
    dismiss: vi.fn(),
    busy: false,
  });
  install.mockReturnValue({
    kind,
    installed,
    install: vi.fn(),
    dismiss: vi.fn(),
    reset: vi.fn(),
  });

  render(<AlertsPrompt askForPush={askForPush} />);
}

describe('AlertsPrompt', () => {
  beforeEach(() => vi.clearAllMocks());

  /**
   * The bug this component exists to fix. Safari cannot grant push to a tab, so the old
   * prompt rendered nothing and an iPhone vendor got silence with no explanation — on the
   * one app where a missed notification means a paid-for order goes unseen.
   */
  it('tells an iPhone vendor to install, rather than showing nothing', () => {
    setup({ state: 'unsupported', canAsk: false, kind: 'ios' });

    expect(screen.getByText(/add recommend to your home screen/i)).toBeVisible();
    expect(screen.getByText(/add to home screen/i)).toBeVisible();
  });

  it('asks for notifications when it can, without making install a barrier', () => {
    // Android in a tab: push works uninstalled, so the ask must not be gated behind it.
    setup({ canAsk: true, kind: 'native' });

    expect(
      screen.getByRole('button', { name: /turn on notifications/i }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /add to home screen/i }),
    ).toBeVisible();
  });

  it('still offers install once notifications are settled', () => {
    setup({ state: 'granted', canAsk: false, kind: 'native' });

    expect(
      screen.getByRole('button', { name: /add to home screen/i }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /turn on notifications/i }),
    ).toBeNull();
  });

  it('explains a refusal, because browsers never ask twice', () => {
    setup({ state: 'denied', canAsk: false });

    expect(screen.getByText(/blocked for this site/i)).toBeVisible();
  });

  /**
   * The gate that changed. Install and notifications used to share one, so a vendor with
   * no orders yet saw neither — and never installed, so could never be told about the
   * first one. Installing costs nothing to refuse; a notification prompt is asked once
   * ever. Only the second waits.
   */
  it('still offers install before the vendor has seen any order', () => {
    setup({ canAsk: true, kind: 'native', askForPush: false });

    expect(
      screen.getByRole('button', { name: /add to home screen/i }),
    ).toBeVisible();
  });

  it('holds the notification ask back until then', () => {
    setup({ canAsk: true, kind: 'native', askForPush: false });

    expect(
      screen.queryByRole('button', { name: /turn on notifications/i }),
    ).toBeNull();
  });

  it('tells an iPhone vendor to install even with no orders yet', () => {
    // Safari cannot push to a tab at all, so installing is the precondition rather than
    // a nicety — withholding it until an order arrives is a deadlock.
    setup({ state: 'unsupported', canAsk: false, kind: 'ios', askForPush: false });

    expect(screen.getByText(/add recommend to your home screen/i)).toBeVisible();
  });

  it('does not explain a refusal to someone never asked', () => {
    setup({ state: 'denied', canAsk: false, askForPush: false });

    expect(screen.queryByText(/blocked for this site/i)).toBeNull();
  });

  it('says nothing once installed and subscribed', () => {
    setup({ state: 'granted', canAsk: false, kind: null, installed: true });

    expect(screen.queryByRole('button')).toBeNull();
  });
});

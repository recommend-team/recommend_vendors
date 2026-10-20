import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpeningHours } from './OpeningHours';
import { ApiError } from '../../lib/api';
import type { OperatingHours, VendorProfile } from '../../lib/contract';

const useVendorProfile = vi.fn();
const mutateAsync = vi.fn();

vi.mock('../../hooks/useProfile', () => ({
  useVendorProfile: () => useVendorProfile(),
  useUpdateProfile: () => ({ mutateAsync, isPending: false }),
}));

const day = (isOpen: boolean, open = '09:00', close = '19:00') => ({
  isOpen,
  open,
  close,
});
const WEEK: OperatingHours = {
  monday: day(true),
  tuesday: day(true, '08:00', '18:00'),
  wednesday: day(true),
  thursday: day(true),
  friday: day(true, '18:00', '02:00'),
  saturday: day(true, '00:00', '00:00'),
  sunday: day(false),
};

function setup(profile: Partial<VendorProfile>) {
  useVendorProfile.mockReturnValue({
    data: { isOpen: true, operatingHours: null, ...profile },
    isLoading: false,
  });
  render(<OpeningHours />);
}

const save = () =>
  userEvent.click(screen.getByRole('button', { name: 'Save hours' }));

describe('OpeningHours', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsync.mockResolvedValue({});
  });

  it('shows the saved week, with what unusual hours mean', () => {
    setup({ operatingHours: WEEK });

    expect(screen.getByLabelText('Tuesday opens')).toHaveValue('08:00');
    expect(screen.getByLabelText('Tuesday closes')).toHaveValue('18:00');
    expect(screen.getByText('Closes the next day')).toBeInTheDocument();
    expect(screen.getByText('Open 24 hours')).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: 'Open on Sunday' }),
    ).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByLabelText('Sunday opens')).not.toBeInTheDocument();
  });

  it('sends all seven days when one is changed', async () => {
    setup({ operatingHours: WEEK });

    fireEvent.change(screen.getByLabelText('Monday closes'), {
      target: { value: '21:30' },
    });
    await save();

    expect(mutateAsync).toHaveBeenCalledWith({
      operatingHours: { ...WEEK, monday: day(true, '09:00', '21:30') },
    });
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });

  it('starts a vendor with no hours on a ready-made week when they turn hours on', async () => {
    setup({ operatingHours: null });
    expect(screen.queryByLabelText('Monday opens')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('switch', { name: 'Use opening hours' }),
    );
    await save();

    const sent = mutateAsync.mock.calls[0][0].operatingHours as OperatingHours;
    expect(Object.keys(sent)).toHaveLength(7);
    expect(sent.monday).toEqual(day(true, '09:00', '19:00'));
    expect(sent.sunday.isOpen).toBe(false);
  });

  it('refuses a week with every day off, pointing to the pause', async () => {
    const closed = Object.fromEntries(
      Object.keys(WEEK).map((key) => [key, day(false)]),
    ) as OperatingHours;
    setup({ operatingHours: { ...closed, monday: day(true) } });

    await userEvent.click(
      screen.getByRole('switch', { name: 'Open on Monday' }),
    );
    await save();

    expect(screen.getByRole('alert')).toHaveTextContent(/pause the shop/);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('clears the hours only once the vendor confirms', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    setup({ operatingHours: WEEK });

    await userEvent.click(
      screen.getByRole('switch', { name: 'Use opening hours' }),
    );
    await save();
    expect(confirm).toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await save();
    expect(mutateAsync).toHaveBeenCalledWith({ operatingHours: null });
  });

  it('has nothing to save for a vendor without hours who leaves them off', () => {
    setup({ operatingHours: null });
    expect(screen.getByRole('button', { name: 'Save hours' })).toBeDisabled();
  });

  it('shows what the server said when it refuses', async () => {
    mutateAsync.mockRejectedValue(new ApiError(400, "Send sunday's hours too"));
    setup({ operatingHours: WEEK });

    await save();

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Send sunday's hours too",
    );
  });

  it.each([
    [{ isOpen: false }, 'Paused'],
    [{ isOpen: true, openNow: true, closesAt: null }, 'Open now'],
    [{ isOpen: true, openNow: false, opensAt: null }, 'Closed'],
  ])('sums up where the shop stands (%o)', (state, said) => {
    setup({ operatingHours: WEEK, ...state });
    expect(screen.getByRole('status')).toHaveTextContent(said);
  });
});

describe('OpeningHours — on a phone', () => {
  beforeEach(() => vi.clearAllMocks());

  it('offers times in 12-hour form', () => {
    setup({ operatingHours: WEEK });

    const opens = screen.getByLabelText('Monday opens');
    expect(opens).toHaveDisplayValue('9:00 AM');
    expect(screen.getByLabelText('Monday closes')).toHaveDisplayValue(
      '7:00 PM',
    );
    expect(
      Array.from((opens as HTMLSelectElement).options, (o) => o.text),
    ).toContain('12:00 PM (noon)');
  });
});

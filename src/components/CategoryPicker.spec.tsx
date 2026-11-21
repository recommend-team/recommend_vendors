import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryPicker } from './CategoryPicker';
import { listCategories } from '../lib/services/profile.service';

vi.mock('../lib/services/profile.service', () => ({
  listCategories: vi.fn(),
}));

const listed = vi.mocked(listCategories);

/** The picker with its value held, as a form would hold it. */
function Picker({ initial = '', onValue }: { initial?: string; onValue?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <CategoryPicker
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

function renderPicker(props: { initial?: string; onValue?: (v: string) => void } = {}) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Picker {...props} />
    </QueryClientProvider>,
  );
}

describe('CategoryPicker', () => {
  beforeEach(() => {
    listed.mockReset().mockResolvedValue([
      { id: 'cat-food', name: 'Restaurant', feePercent: 25 },
      { id: 'cat-gadgets', name: 'Gadgets', feePercent: 3 },
    ]);
  });

  it("offers Recommend's categories, and says what Recommend keeps of the one picked", async () => {
    const onValue = vi.fn();
    renderPicker({ onValue });

    fireEvent.click(await screen.findByRole('button', { name: 'Gadgets' }));

    expect(onValue).toHaveBeenLastCalledWith('Gadgets');
    expect(screen.getByText('3%')).toBeInTheDocument();
    expect(screen.getByText(/of each sale in Gadgets/)).toBeInTheDocument();
  });

  it('takes "something else" in their own words', async () => {
    const onValue = vi.fn();
    renderPicker({ onValue });

    fireEvent.click(await screen.findByRole('button', { name: 'Something else' }));
    fireEvent.change(screen.getByLabelText('Tell us what you sell'), {
      target: { value: 'Pet supplies' },
    });

    expect(onValue).toHaveBeenLastCalledWith('Pet supplies');
  });

  it('shows a category they typed before as their own words', async () => {
    renderPicker({ initial: 'Candles' });

    expect(await screen.findByLabelText('Tell us what you sell')).toHaveValue('Candles');
  });

  it('still offers the usual categories when the list cannot load', async () => {
    listed.mockRejectedValue(new Error('offline'));
    renderPicker();

    expect(await screen.findByRole('button', { name: 'Restaurant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beauty' })).toBeInTheDocument();
  });
});

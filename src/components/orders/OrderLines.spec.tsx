import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderLines } from './OrderLines';
import type { VendorOrder } from '../../lib/contract';

const order = (over: Partial<VendorOrder>): VendorOrder =>
  ({ items: [], ...over }) as unknown as VendorOrder;

describe('OrderLines', () => {
  it('shows each pack whole, so the kitchen packs it right', () => {
    render(
      <OrderLines
        order={order({
          lines: [
            {
              productName: 'Rice and beans',
              name: 'Rice and beans (2 portions, with Beef ×2, Takeaway pack ×1)',
              quantity: 2,
              portions: 2,
              packs: 2,
              unit: 'portion',
              lineTotal: 8400,
              unitPrice: 4200,
              isAddOn: false,
              choices: [],
              extras: [
                { name: 'Beef', quantity: 2, unitPrice: 1000, lineTotal: 4000 },
                {
                  name: 'Takeaway pack',
                  quantity: 1,
                  unitPrice: 200,
                  lineTotal: 400,
                },
              ],
            },
            {
              productName: 'Rice and stew',
              name: 'Rice and stew (1 portion, Protein: Beef)',
              quantity: 1,
              portions: 1,
              packs: 1,
              unit: 'portion',
              lineTotal: 1500,
              unitPrice: 1500,
              isAddOn: false,
              choices: [
                { group: 'Choose your protein', option: 'Beef', priceDelta: 0 },
              ],
              extras: [],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText('2 packs')).toBeInTheDocument();
    expect(screen.getByText('2 portions each')).toBeInTheDocument();
    expect(
      screen.getByText('+ Beef ×2, Takeaway pack ×1 in each pack'),
    ).toBeInTheDocument();
    expect(screen.getByText('₦8,400')).toBeInTheDocument();
    expect(screen.getByText('Choose your protein: Beef')).toBeInTheDocument();
  });

  it('shows an order from an older server one item per row', () => {
    render(
      <OrderLines
        order={order({
          items: [
            {
              id: 'i',
              productId: 'p',
              productName: 'Jollof',
              unitPrice: '3000',
              quantity: 2,
              lineTotal: '6000',
            },
          ],
        })}
      />,
    );
    expect(screen.getByText('Jollof')).toBeInTheDocument();
    expect(screen.getByText('2×')).toBeInTheDocument();
  });
});

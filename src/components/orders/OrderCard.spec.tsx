import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OrderCard } from './OrderCard';
import type { OrderStatus, VendorOrder } from '../../lib/contract';

const order = (
  status: OrderStatus,
  over: Partial<VendorOrder> = {},
): VendorOrder => ({
  id: 'o1',
  buyerName: 'Chinwe Obi',
  buyerPhone: '+2348012345678',
  buyerEmail: null,
  totalAmount: '7900.00',
  platformFee: '1580.00',
  vendorAmount: '6320.00',
  fulfillmentType: 'DELIVERY',
  status,
  deliveryAddress: '67 Akowonjo, Egbeda',
  notes: null,
  paidAt: '2026-08-09T12:00:00.000Z',
  createdAt: '2026-08-09T11:58:00.000Z',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      productName: 'Ofada Rice & Ayamase',
      unitPrice: '3750.00',
      quantity: 1,
      lineTotal: '3750.00',
    },
  ],
  checkout: {
    id: 'ck1',
    reference: 'REC-8B2FCE09CA37',
    rider: null,
  },
  ...over,
});

const draw = (
  status: OrderStatus,
  onMarkReady = vi.fn(),
  over: Partial<VendorOrder> = {},
) => {
  render(
    <MemoryRouter>
      <OrderCard order={order(status, over)} onMarkReady={onMarkReady} />
    </MemoryRouter>,
  );
  return onMarkReady;
};

const musa = { name: 'Musa Bello', phone: '+2348011111111' };

describe('OrderCard', () => {
  it('offers "Mark ready" only on a paid order', async () => {
    const onMarkReady = draw('PAID');
    await userEvent.click(screen.getByRole('button', { name: /mark ready/i }));
    expect(onMarkReady).toHaveBeenCalledWith('o1');
  });

  it.each<OrderStatus>(['READY', 'DISPATCHED', 'COMPLETED', 'CANCELLED'])(
    'offers nothing to do on a %s order',
    (status) => {
      draw(status);
      expect(
        screen.queryByRole('button', { name: /mark ready/i }),
      ).not.toBeInTheDocument();
    },
  );

  it('never shows Accept or Reject', () => {
    // The reference design has both. Neither exists: accepting was collapsed into
    // "ready", and declining needs a refund path that is deliberately unbuilt. A button
    // that cannot work is worse than a missing one.
    draw('PAID');
    expect(
      screen.queryByRole('button', { name: /accept/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reject|decline/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the vendor’s own subtotal in naira, not the basket total', () => {
    draw('PAID');
    // ₦7,900 is this vendor's items. ₦9,400 is the whole checkout including delivery,
    // which belongs to the platform — showing it would imply they are owed part of it.
    expect(screen.getByText('₦7,900')).toBeInTheDocument();
    expect(screen.queryByText('₦9,400')).not.toBeInTheDocument();
  });

  it('labels a paid order as new work rather than as money', () => {
    draw('PAID');
    // To a vendor "Paid" is not the point; "New order" is the instruction.
    expect(screen.getByText(/new order/i)).toBeInTheDocument();
  });

  it('uses the payment reference, which the buyer and admin also hold', () => {
    draw('PAID');
    expect(screen.getByText('REC-8B2FCE09CA37')).toBeInTheDocument();
  });

  describe('a ready order', () => {
    it('names the rider coming to collect, a tap away', () => {
      draw('READY', vi.fn(), {
        checkout: { id: 'ck1', reference: 'REC-8B2FCE09CA37', rider: musa },
      });

      expect(
        screen.getByText(/Musa Bello is collecting it/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Call Musa Bello' }),
      ).toHaveAttribute('href', 'tel:+2348011111111');
    });

    it('says a rider is being assigned when nobody is yet', () => {
      draw('READY');
      expect(
        screen.getByText(/a rider is being assigned/i),
      ).toBeInTheDocument();
    });

    it('says the customer is collecting a pickup', () => {
      draw('READY', vi.fn(), { fulfillmentType: 'PICKUP' });
      expect(
        screen.getByText(/the customer is collecting it/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/rider/i)).not.toBeInTheDocument();
    });
  });
});

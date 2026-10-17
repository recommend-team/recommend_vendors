import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApprovalBanner } from './ApprovalBanner';

const useSession = vi.fn();
const useSuspended = vi.fn();

vi.mock('../hooks/useSession', () => ({ useSession: () => useSession() }));
vi.mock('../hooks/useSuspended', () => ({
  useSuspended: () => useSuspended(),
}));

const renderBanner = () =>
  render(
    <MemoryRouter>
      <ApprovalBanner />
    </MemoryRouter>,
  );

describe('ApprovalBanner', () => {
  beforeEach(() => {
    useSuspended.mockReturnValue(false);
  });

  it('tells a suspended vendor, with a way to call us', () => {
    useSession.mockReturnValue({ user: { status: 'APPROVED' } });
    useSuspended.mockReturnValue(true);
    renderBanner();

    expect(screen.getByRole('status')).toHaveTextContent(
      /your account is suspended/i,
    );
    expect(screen.getByRole('link', { name: 'Call us' })).toHaveAttribute(
      'href',
      'tel:+2348143067676',
    );
  });

  it('still asks a vendor under review for their documents', () => {
    useSession.mockReturnValue({ user: { status: 'PENDING' } });
    renderBanner();

    expect(screen.getByText(/reviewing your account/i)).toBeInTheDocument();
  });

  it('says nothing to an approved vendor, or when signed out', () => {
    useSession.mockReturnValue({ user: { status: 'APPROVED' } });
    const { container } = renderBanner();
    expect(container).toBeEmptyDOMElement();

    useSession.mockReturnValue({ user: null });
    const again = renderBanner();
    expect(again.container).toBeEmptyDOMElement();
  });
});

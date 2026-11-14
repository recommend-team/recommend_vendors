import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Kyc } from './Kyc';

const useVendorProfile = vi.fn();
vi.mock('../hooks/useProfile', () => ({
  useVendorProfile: () => useVendorProfile(),
}));
vi.mock('../hooks/useSession', () => ({
  useSession: () => ({ user: { vendorType: 'NON_REGISTERED' } }),
}));

const profile = (documents: Record<string, string | null> = {}) => ({
  isLoading: false,
  data: {
    vendorType: 'NON_REGISTERED',
    ninDocumentUrl: null,
    passportPhotoUrl: null,
    bankStatementUrl: null,
    utilityBillUrl: null,
    ...documents,
  },
});

function setup() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <Kyc />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const card = (label: string) =>
  screen.getByText(label).closest('div.rounded-2xl') as HTMLElement;

describe('Kyc', () => {
  beforeEach(() => useVendorProfile.mockReset());

  it('shows a document already on the account as submitted, and won’t take it again', () => {
    useVendorProfile.mockReturnValue(
      profile({ ninDocumentUrl: 'kyc:image/recommend/kyc/v1/nin.jpg' }),
    );
    setup();

    const nin = card('NIN slip');
    expect(nin).toHaveTextContent('Submitted — we’re reviewing it');
    expect(nin.querySelector('button') as HTMLButtonElement).toBeDisabled();

    // The rest can still be uploaded.
    const bill = card('Utility bill');
    expect(bill.querySelector('button')).toBeEnabled();
    expect(screen.getByText(/Need to change a document/)).toBeInTheDocument();
  });

  it('says so when everything is in', () => {
    useVendorProfile.mockReturnValue(
      profile({
        ninDocumentUrl: 'kyc:a',
        passportPhotoUrl: 'kyc:b',
        bankStatementUrl: 'kyc:c',
        utilityBillUrl: 'kyc:d',
      }),
    );
    setup();

    expect(screen.getByText(/All your documents are in/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'All documents submitted' }),
    ).toBeDisabled();
  });

  it('asks for documents when nothing has been submitted', () => {
    useVendorProfile.mockReturnValue(profile());
    setup();

    expect(card('NIN slip').querySelector('button')).toBeEnabled();
    expect(
      screen.queryByText(/Need to change a document/),
    ).not.toBeInTheDocument();
  });
});

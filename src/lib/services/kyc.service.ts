import { request } from '../api';
import type { VendorType } from '../contract';

export interface KycDocument {
  /** The field name the API expects. */
  key: string;
  label: string;
  hint: string;
}

export const KYC_DOCUMENTS: Record<VendorType, KycDocument[]> = {
  REGISTERED: [
    {
      key: 'cacDocumentUrl',
      label: 'CAC certificate',
      hint: 'Your certificate of incorporation',
    },
    {
      key: 'tinDocumentUrl',
      label: 'TIN certificate',
      hint: 'Tax identification number document',
    },
  ],
  NON_REGISTERED: [
    {
      key: 'ninDocumentUrl',
      label: 'NIN slip',
      hint: 'National identity number slip or card',
    },
    {
      key: 'passportPhotoUrl',
      label: 'Passport photograph',
      hint: 'A clear photo of your face',
    },
    {
      key: 'bankStatementUrl',
      label: 'Bank statement',
      hint: 'Any recent statement showing your name',
    },
    {
      key: 'utilityBillUrl',
      label: 'Utility bill',
      hint: 'Showing your business or home address',
    },
  ],
};

/** Whatever has been uploaded so far, keyed by document. */
export type KycSubmission = Record<string, string>;

export function submitKyc(documents: KycSubmission): Promise<unknown> {
  return request<unknown>('/sellers/profile/kyc', {
    method: 'POST',
    body: JSON.stringify(documents),
  });
}

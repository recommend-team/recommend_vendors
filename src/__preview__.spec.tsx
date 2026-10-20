import { it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { writeFileSync } from 'node:fs';
import { OpeningHours } from './components/settings/OpeningHours';

const d = (isOpen: boolean, open = '09:00', close = '19:00') => ({ isOpen, open, close });
vi.mock('./hooks/useProfile', () => ({
  useVendorProfile: () => ({
    data: {
      isOpen: true,
      openNow: true,
      closesAt: '2026-10-20T18:00:00Z',
      operatingHours: {
        monday: d(true), tuesday: d(true, '08:00', '18:00'), wednesday: d(true),
        thursday: d(true), friday: d(true, '18:00', '02:00'),
        saturday: d(true, '00:00', '00:00'), sunday: d(false),
      },
    },
    isLoading: false,
  }),
  useUpdateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

it('writes a preview', () => {
  const { container } = render(<OpeningHours />);
  writeFileSync('C:/Users/User/AppData/Local/Temp/claude/c--Users-User-chinweike-recommend-recommend-be/2975cfd5-b59c-42b6-816c-f8a7883c143e/scratchpad/preview/hours.html',
    '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<link rel="stylesheet" href="build/assets/index-sI9xGo4G.css"></head>' +
    '<body class="bg-canvas"><div class="px-4 py-4">' + container.innerHTML + '</div></body></html>');
});

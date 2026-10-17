import { useSession } from './useSession';
import { useVendorProfile } from './useProfile';

export function useSuspended(): boolean {
  const { user } = useSession();
  const { data: profile } = useVendorProfile();
  return (profile?.status ?? user?.status) === 'SUSPENDED';
}

export const SUSPENDED_EXPLAINER =
  'Your account is suspended, so changes and withdrawals are paused. Call Recommend to sort it out.';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchEarnings,
  fetchVendorProfile,
  listAreas,
  listStates,
  updatePayoutDetails,
  updateVendorProfile,
  type PayoutDetails,
  type ProfileChanges,
} from '../lib/services/profile.service';
import type { Area, Earnings, State, VendorProfile } from '../lib/contract';

const PROFILE_KEY = ['vendor', 'profile'];

export function useVendorProfile() {
  return useQuery<VendorProfile>({
    queryKey: PROFILE_KEY,
    queryFn: fetchVendorProfile,
    staleTime: 60_000,
  });
}

function useProfileMutation<TInput>(
  action: (input: TInput) => Promise<VendorProfile>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: (profile) => {
      // The response *is* the new profile, so seed the cache with it rather than
      // refetching — a vendor on mobile data should not pay for a round trip that
      // returns what they were just handed.
      queryClient.setQueryData(PROFILE_KEY, profile);
    },
  });
}

export function useUpdateProfile() {
  return useProfileMutation<ProfileChanges>(updateVendorProfile);
}

export function useUpdatePayout() {
  return useProfileMutation<PayoutDetails>(updatePayoutDetails);
}

export function useEarnings() {
  return useQuery<Earnings>({
    queryKey: ['vendor', 'earnings'],
    queryFn: fetchEarnings,
    staleTime: 60_000,
  });
}

export function useStates() {
  return useQuery<State[]>({
    queryKey: ['locations', 'states'],
    queryFn: listStates,
    // Admin-managed and rarely edited; refetching them on a phone is wasted data.
    staleTime: 60 * 60_000,
  });
}

export function useAreas(stateId: string | null) {
  return useQuery<Area[]>({
    queryKey: ['locations', 'areas', stateId],
    queryFn: () => listAreas(stateId!),
    enabled: !!stateId,
    staleTime: 60 * 60_000,
  });
}

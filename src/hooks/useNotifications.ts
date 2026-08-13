import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/services/notifications.service';
import type { NotificationFeed } from '../lib/contract';

const FEED_KEY = ['notifications'];
const UNREAD_KEY = ['notifications', 'unread'];

export function useNotifications() {
  return useQuery<NotificationFeed>({
    queryKey: FEED_KEY,
    queryFn: () => fetchNotifications(),
    staleTime: 15_000,
  });
}

/**
 * The badge.
 *
 * Polled, because the things that produce notifications happen server-side while the
 * vendor is looking at something else — an order is paid, a withdrawal settles. A minute
 * is often enough to matter and cheap enough not to: one small request, and only while
 * the app is actually open.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: fetchUnreadCount,
    select: (data) => data.unread,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEED_KEY });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FEED_KEY });
    },
  });
}

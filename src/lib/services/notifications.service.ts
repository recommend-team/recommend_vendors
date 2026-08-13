import { request } from '../api';
import type { NotificationFeed, VendorNotification } from '../contract';

/**
 * The in-app feed.
 *
 * Distinct from `push.ts`, which is about *delivery*. This is the record: it works with
 * notifications switched off, on a device that never subscribed, and after a push was
 * missed — which today is every device, since nobody has subscribed yet.
 */

export function fetchNotifications(page = 1): Promise<NotificationFeed> {
  return request<NotificationFeed>(`/notifications?page=${page}&limit=30`);
}

export function fetchUnreadCount(): Promise<{ unread: number }> {
  return request<{ unread: number }>('/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<VendorNotification> {
  return request<VendorNotification>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: 'PATCH' },
  );
}

export function markAllNotificationsRead(): Promise<unknown> {
  return request('/notifications/read-all', { method: 'PATCH' });
}

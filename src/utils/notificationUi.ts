import { Ionicons } from '@expo/vector-icons';

import type { NotificationCategory, NotificationKind } from '@/src/data/notifications';

type IonName = keyof typeof Ionicons.glyphMap;

/** 알림 종류 → 아이콘 */
export function notificationKindIcon(kind: NotificationKind): IonName {
  if (kind.startsWith('schedule')) return 'calendar-outline';
  if (kind.startsWith('assignment')) return 'document-text-outline';
  if (kind.startsWith('notice')) return 'megaphone-outline';
  if (kind.startsWith('member')) return 'people-outline';
  if (kind.startsWith('lead')) return 'ribbon-outline';
  return 'notifications-outline';
}

/** 알림함 카테고리 칩 → 아이콘 */
export function notificationCategoryIcon(category: NotificationCategory): IonName {
  if (category === 'schedule') return 'calendar-outline';
  if (category === 'assignment') return 'document-text-outline';
  if (category === 'notice') return 'megaphone-outline';
  if (category === 'member') return 'people-outline';
  if (category === 'lead') return 'ribbon-outline';
  return 'notifications-outline';
}

/** 스와이프 삭제 임계값 (px, 왼쪽) */
export const NOTIFICATION_SWIPE_DELETE_THRESHOLD = -88;

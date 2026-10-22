import type { Href } from 'expo-router';

import type { AppNotification } from '@/src/data/notifications';

/** 알림 탭 시 이동할 경로 (studyId 없으면 알림함 유지) */
export function hrefForNotification(item: AppNotification): Href {
  const studyId = item.studyId;
  if (!studyId) return '/(tabs)/notifications';

  if (item.kind.startsWith('schedule')) {
    return '/(tabs)/schedule';
  }
  if (item.kind.startsWith('assignment')) {
    return {
      pathname: '/(tabs)/studies/[studyId]/assignments',
      params: { studyId },
    };
  }
  if (item.kind.startsWith('notice')) {
    return {
      pathname: '/(tabs)/studies/[studyId]/notices',
      params: { studyId },
    } as unknown as Href;
  }
  if (item.kind.startsWith('member') || item.kind.startsWith('lead')) {
    return {
      pathname: '/(tabs)/studies/[studyId]/members',
      params: { studyId },
    };
  }
  return {
    pathname: '/(tabs)/studies/[studyId]',
    params: { studyId },
  };
}

import {
  MOCK_ASSIGNMENTS,
  MOCK_NOTICES,
  MOCK_SCHEDULE,
  MOCK_STUDIES,
} from '@/src/data/mock';
import { MOCK_STUDY_MEMBERS } from '@/src/data/studyMembers';

export type NotificationKind =
  | 'schedule_created'
  | 'schedule_updated'
  | 'schedule_deleted'
  | 'assignment_created'
  | 'assignment_updated'
  | 'assignment_deleted'
  | 'notice_created'
  | 'notice_updated'
  | 'notice_deleted'
  | 'member_joined'
  | 'member_left'
  | 'lead_offered'
  | 'lead_accepted';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** ISO datetime */
  createdAt: string;
  studyId?: string;
  studyName?: string;
  read: boolean;
};

/** 저장된 더미 알림을 새 시드로 교체할 때 사용 */
export const NOTIFICATION_SEED_VERSION = 5;

export const NOTIFICATION_PREVIEW_COUNT = 10;
export const NOTIFICATION_MONTH_DAYS = 30;

/** 안읽음 뱃지: 두 자리 초과 시 99+ */
export function formatUnreadBadge(count: number) {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return String(count);
}

/** 30일 지난 알림 제거 */
export function purgeExpiredNotifications(items: AppNotification[], now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - NOTIFICATION_MONTH_DAYS);
  const cutoffIso = cutoff.toISOString();
  return items.filter((item) => item.createdAt >= cutoffIso);
}

export function previewNotifications(items: AppNotification[], limit = NOTIFICATION_PREVIEW_COUNT) {
  return [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function atDay(base: Date, dayOffset: number, hour: number, minute: number) {
  const d = new Date(base);
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function studyById(id: string) {
  return MOCK_STUDIES.find((s) => s.id === id) ?? MOCK_STUDIES[0];
}

type SeedItem = {
  kind: NotificationKind;
  title: string;
  body: string;
  studyId: string;
  studyName: string;
  emoji: string;
};

/** 스터디·일정·과제·공지·멤버 더미를 조합해 알림 시드 생성 */
function buildSeedPool(): SeedItem[] {
  const pool: SeedItem[] = [];

  for (const sch of MOCK_SCHEDULE) {
    const study = studyById(sch.studyId);
    const place =
      sch.placeType === 'online'
        ? sch.place
        : sch.address
          ? `${sch.place} · ${sch.address}`
          : sch.place;
    pool.push({
      kind: 'schedule_created',
      title: '일정 등록',
      body: `「${sch.title}」 ${sch.date} ${sch.time} · ${place}`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
    pool.push({
      kind: 'schedule_updated',
      title: '일정 수정',
      body: `「${sch.title}」 시간/장소가 바뀌었어요. (${sch.date} ${sch.time})`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
    pool.push({
      kind: 'schedule_deleted',
      title: '일정 삭제',
      body: `「${sch.title}」 일정이 취소됐어요.`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
  }

  for (const hw of MOCK_ASSIGNMENTS) {
    const study = studyById(hw.studyId);
    const mode = hw.submitMode === 'file' ? '파일 제출' : '메모 제출';
    pool.push({
      kind: 'assignment_created',
      title: '과제 등록',
      body: `「${hw.title}」 마감 ${hw.dueDate} · ${mode}`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
    pool.push({
      kind: 'assignment_updated',
      title: '과제 수정',
      body: `「${hw.title}」 내용이 수정됐어요. 마감 ${hw.dueDate}`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
    pool.push({
      kind: 'assignment_deleted',
      title: '과제 삭제',
      body: `「${hw.title}」 과제가 삭제됐어요.`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
  }

  for (const notice of MOCK_NOTICES) {
    const study = studyById(notice.studyId);
    pool.push({
      kind: 'notice_created',
      title: '새 공지',
      body: `「${notice.title}」 ${notice.body.slice(0, 40)}${notice.body.length > 40 ? '…' : ''}`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
    pool.push({
      kind: 'notice_updated',
      title: '공지 수정',
      body: `「${notice.title}」 공지가 수정됐어요.`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
    pool.push({
      kind: 'notice_deleted',
      title: '공지 삭제',
      body: `「${notice.title}」 공지가 삭제됐어요.`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
  }

  for (const member of MOCK_STUDY_MEMBERS) {
    const study = studyById(member.studyId);
    pool.push({
      kind: 'member_joined',
      title: '스터디원 가입',
      body: `${member.nickname}님이 ${study.name}에 들어왔어요.`,
      studyId: study.id,
      studyName: study.name,
      emoji: study.emoji,
    });
    if (member.role !== 'admin') {
      pool.push({
        kind: 'member_left',
        title: '스터디원 탈퇴',
        body: `${member.nickname}님이 ${study.name}에서 나갔어요.`,
        studyId: study.id,
        studyName: study.name,
        emoji: study.emoji,
      });
      pool.push({
        kind: 'lead_offered',
        title: '스터디장 위임 요청',
        body: `${member.nickname}님에게 스터디장 위임 요청을 보냈어요.`,
        studyId: study.id,
        studyName: study.name,
        emoji: study.emoji,
      });
      pool.push({
        kind: 'lead_accepted',
        title: '스터디장 위임 완료',
        body: `${member.nickname}님이 ${study.name} 스터디장을 수락했어요.`,
        studyId: study.id,
        studyName: study.name,
        emoji: study.emoji,
      });
    }
  }

  return pool;
}

/** 오늘(프로토타입 기준 2026-10-19) 근처로 알림 100개 */
export function buildMockNotifications(now = new Date(2026, 9, 19, 18, 0, 0)): AppNotification[] {
  const pool = buildSeedPool();
  const list: AppNotification[] = [];
  for (let i = 0; i < 100; i++) {
    const seed = pool[i % pool.length];
    const dayOffset = Math.min(Math.floor(i / 4), NOTIFICATION_MONTH_DAYS - 1); // 최근 30일 안
    const hour = 8 + (i % 12);
    const minute = (i * 11) % 60;
    list.push({
      id: `notif_mock_v${NOTIFICATION_SEED_VERSION}_${pad(i + 1)}`,
      kind: seed.kind,
      title: seed.title,
      body: `${seed.emoji} ${seed.body}`,
      createdAt: atDay(now, dayOffset, hour, minute),
      studyId: seed.studyId,
      studyName: seed.studyName,
      read: true,
    });
  }
  // 정렬 후 최신 N개만 미읽음 → 뱃지 숫자가 안정적으로 나옴
  return list
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item, index) => ({ ...item, read: index >= 12 }));
}

export const MOCK_NOTIFICATIONS = buildMockNotifications();

export type NotificationCategory =
  | 'all'
  | 'schedule'
  | 'assignment'
  | 'notice'
  | 'member'
  | 'lead';

export const NOTIFICATION_CATEGORIES: {
  id: NotificationCategory;
  label: string;
}[] = [
  { id: 'all', label: '전체' },
  { id: 'schedule', label: '일정' },
  { id: 'assignment', label: '과제' },
  { id: 'notice', label: '공지' },
  { id: 'member', label: '멤버' },
  { id: 'lead', label: '위임' },
];

export function notificationCategory(kind: NotificationKind): Exclude<NotificationCategory, 'all'> {
  if (kind.startsWith('schedule')) return 'schedule';
  if (kind.startsWith('assignment')) return 'assignment';
  if (kind.startsWith('notice')) return 'notice';
  if (kind.startsWith('member')) return 'member';
  return 'lead';
}

export type NotificationReadFilter = 'all' | 'unread' | 'read';

export const NOTIFICATION_READ_FILTERS: {
  id: NotificationReadFilter;
  label: string;
}[] = [
  { id: 'all', label: '전체' },
  { id: 'unread', label: '안읽음' },
  { id: 'read', label: '읽음' },
];

export function filterNotificationsByCategory(
  items: AppNotification[],
  category: NotificationCategory,
) {
  if (category === 'all') return items;
  return items.filter((item) => notificationCategory(item.kind) === category);
}

export function filterNotificationsByRead(
  items: AppNotification[],
  readFilter: NotificationReadFilter,
) {
  if (readFilter === 'unread') return items.filter((item) => !item.read);
  if (readFilter === 'read') return items.filter((item) => item.read);
  return items;
}

export function filterNotificationsForInbox(
  items: AppNotification[],
  options: {
    expanded: boolean;
    category?: NotificationCategory;
    readFilter?: NotificationReadFilter;
    now?: Date;
  },
) {
  const now = options.now ?? new Date();
  const byCategory = filterNotificationsByCategory(items, options.category ?? 'all');
  const byRead = filterNotificationsByRead(byCategory, options.readFilter ?? 'all');
  const sorted = [...byRead].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!options.expanded) return sorted.slice(0, NOTIFICATION_PREVIEW_COUNT);

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - NOTIFICATION_MONTH_DAYS);
  const cutoffIso = cutoff.toISOString();
  return sorted.filter((item) => item.createdAt >= cutoffIso);
}

export function unreadNotificationCount(items: AppNotification[]) {
  return items.filter((item) => !item.read).length;
}

export function countNotificationsByCategory(items: AppNotification[]) {
  const counts: Record<NotificationCategory, number> = {
    all: items.length,
    schedule: 0,
    assignment: 0,
    notice: 0,
    member: 0,
    lead: 0,
  };
  for (const item of items) {
    counts[notificationCategory(item.kind)] += 1;
  }
  return counts;
}

export function countNotificationsByRead(
  items: AppNotification[],
  category: NotificationCategory = 'all',
) {
  const scoped = filterNotificationsByCategory(items, category);
  return {
    all: scoped.length,
    unread: scoped.filter((item) => !item.read).length,
    read: scoped.filter((item) => item.read).length,
  } as Record<NotificationReadFilter, number>;
}

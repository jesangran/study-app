import { Linking, Platform } from 'react-native';

import { ScheduleItem } from '@/src/data/mock';
import { formatPlaceLabel } from '@/src/utils/schedulePlace';
import { studyName } from '@/src/utils/study';

const DEFAULT_DURATION_MS = 90 * 60 * 1000;

export type CalendarExportPayload = {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  notes: string;
};

export function buildCalendarPayload(
  item: ScheduleItem,
  options?: { studyTitle?: string; durationMs?: number },
): CalendarExportPayload {
  const startDate = parseScheduleDateTime(item.date, item.time);
  const endDate = new Date(startDate.getTime() + (options?.durationMs ?? DEFAULT_DURATION_MS));
  const studyTitle = options?.studyTitle ?? studyName(item.studyId);
  const location = formatPlaceLabel(item);
  const notes = [
    `StudyBuddy · ${studyTitle}`,
    item.placeType === 'online' ? `온라인: ${item.place}` : null,
    item.placeType === 'offline' && item.address ? `주소: ${item.address}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    title: `[${studyTitle}] ${item.title}`,
    startDate,
    endDate,
    location,
    notes,
  };
}

export function parseScheduleDateTime(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [hhRaw, mmRaw] = time.split(':');
  const hh = Number(hhRaw);
  const mm = Number(mmRaw);
  return new Date(y, (m || 1) - 1, d || 1, Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0, 0, 0);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** Google Calendar 템플릿용 로컬 시각 (YYYYMMDDTHHMMSS) */
function toGoogleLocalStamp(date: Date) {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `T${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`
  );
}

export function googleCalendarUrl(payload: CalendarExportPayload) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.title,
    dates: `${toGoogleLocalStamp(payload.startDate)}/${toGoogleLocalStamp(payload.endDate)}`,
    details: payload.notes,
    location: payload.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export type ExportResult =
  | { status: 'saved'; via: 'device' }
  | { status: 'canceled' }
  | { status: 'opened'; via: 'google' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

/**
 * 기기 캘린더 UI를 열어 등록 (Google/삼성/기본 캘린더 선택 가능).
 * Expo Go·웹·권한 문제 시 실패할 수 있음.
 */
export async function addToDeviceCalendar(payload: CalendarExportPayload): Promise<ExportResult> {
  if (Platform.OS === 'web') {
    return {
      status: 'unavailable',
      message: '웹에서는 기기 캘린더 등록을 지원하지 않아요. Google 캘린더로 열어 주세요.',
    };
  }

  try {
    const Calendar = await import('expo-calendar/legacy');
    const available = await Calendar.isAvailableAsync();
    if (!available) {
      return {
        status: 'unavailable',
        message: '이 환경에서는 기기 캘린더를 사용할 수 없어요. 개발 빌드에서 시도해 주세요.',
      };
    }

    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (permission.status !== 'granted') {
      return {
        status: 'unavailable',
        message: '캘린더 권한이 필요해요. 설정에서 허용해 주세요.',
      };
    }

    const result = await Calendar.createEventInCalendarAsync({
      title: payload.title,
      startDate: payload.startDate,
      endDate: payload.endDate,
      location: payload.location,
      notes: payload.notes,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    // iOS: saved | canceled | deleted / Android: done (저장·취소 구분 불가)
    if (result.action === 'canceled' || result.action === 'deleted') {
      return { status: 'canceled' };
    }
    return { status: 'saved', via: 'device' };
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : '캘린더 등록에 실패했어요. Google 캘린더로 열어 보세요.';
    // Expo Go stub 등
    if (/Expo Go|not available|unimplemented|Cannot find/i.test(message)) {
      return {
        status: 'unavailable',
        message:
          'Expo Go에서는 캘린더 등록이 제한돼요. 개발 빌드(npx expo run:android) 또는 Google 캘린더를 이용해 주세요.',
      };
    }
    return { status: 'error', message };
  }
}

export async function openInGoogleCalendar(payload: CalendarExportPayload): Promise<ExportResult> {
  const url = googleCalendarUrl(payload);
  try {
    await Linking.openURL(url);
    return { status: 'opened', via: 'google' };
  } catch {
    return { status: 'error', message: 'Google 캘린더를 열 수 없어요.' };
  }
}

/**
 * 기기 캘린더에 등록을 먼저 시도하고, 안 되면 Google 캘린더 작성 화면을 엽니다.
 */
export async function exportToCalendar(payload: CalendarExportPayload): Promise<ExportResult> {
  const device = await addToDeviceCalendar(payload);
  if (device.status === 'saved' || device.status === 'canceled') return device;
  return openInGoogleCalendar(payload);
}

export type RhythmSchedule = {
  id: string;
  studyId: string;
  title: string;
  date: string;
  time: string;
  place: string;
  placeType: 'online' | 'offline';
  address?: string;
  mapx?: string;
  mapy?: string;
};

export type RhythmNotice = {
  id: string;
  studyId: string;
  title: string;
  body: string;
  date: string;
  pinned?: boolean;
};

export type RhythmAssignment = {
  id: string;
  dueDate: string;
};

export type RhythmSession = {
  id: string;
  date: string;
  time: string;
};

export type ScheduleDraft = {
  studyId: string;
  title: string;
  date: string;
  time: string;
  placeType: 'online' | 'offline';
  place: string;
  address?: string;
  mapx?: string;
  mapy?: string;
};

export function todayYmd(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function diffDays(fromYmd: string, toYmd: string) {
  const [y1, m1, d1] = fromYmd.split('-').map(Number);
  const [y2, m2, d2] = toYmd.split('-').map(Number);
  const from = Date.UTC(y1, m1 - 1, d1);
  const to = Date.UTC(y2, m2 - 1, d2);
  return Math.round((to - from) / 86_400_000);
}

export function isValidYmd(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function validateScheduleDraft(
  input: ScheduleDraft,
): { ok: true; value: Omit<ScheduleDraft, 'studyId'> & { studyId: string } } | { ok: false; message: string } {
  const title = input.title.trim();
  const date = input.date.trim();
  const place = input.place.trim();
  const address = input.address?.trim() || undefined;
  if (!title) return { ok: false, message: '일정 제목을 입력해 주세요.' };
  if (!isValidYmd(date)) return { ok: false, message: '날짜는 YYYY-MM-DD 형식으로 입력해 주세요.' };
  const match = /^(\d{1,2}):(\d{2})$/.exec(input.time.trim());
  if (!match) return { ok: false, message: '시간은 HH:MM 형식으로 입력해 주세요.' };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { ok: false, message: '시간은 HH:MM 형식으로 입력해 주세요.' };
  const time = `${String(hour).padStart(2, '0')}:${match[2]}`;
  if (input.placeType === 'online') {
    if (!place) return { ok: false, message: '온라인 장소(Zoom 등)를 입력해 주세요.' };
  } else if (!address) {
    return { ok: false, message: '오프라인 일정이면 주소를 선택하거나 입력해 주세요.' };
  }

  return {
    ok: true,
    value: {
      studyId: input.studyId,
      title,
      date,
      time,
      placeType: input.placeType,
      place: place || '오프라인 모임',
      address,
      mapx: input.mapx,
      mapy: input.mapy,
    },
  };
}

export type AssignmentSubmitMode = 'file' | 'memo';

export type AssignmentDraft = {
  studyId: string;
  title: string;
  dueDate: string;
  description: string;
  submitMode: AssignmentSubmitMode;
};

export const ASSIGNMENT_MEMO_MAX = 1000;
export const ASSIGNMENT_FILE_MAX_BYTES = 10 * 1024 * 1024;

export function validateAssignmentDraft(
  input: AssignmentDraft,
): { ok: true; value: AssignmentDraft } | { ok: false; message: string } {
  const title = input.title.trim();
  const dueDate = input.dueDate.trim();
  const description = input.description.trim();
  const submitMode = input.submitMode === 'file' ? 'file' : 'memo';
  if (!title) return { ok: false, message: '과제 제목을 입력해 주세요.' };
  if (title.length > 40) return { ok: false, message: '과제 제목은 40자 이하로 입력해 주세요.' };
  if (!isValidYmd(dueDate)) return { ok: false, message: '마감일은 YYYY-MM-DD 형식으로 입력해 주세요.' };
  if (description.length > 300) return { ok: false, message: '과제 설명은 300자 이하로 입력해 주세요.' };
  return { ok: true, value: { studyId: input.studyId, title, dueDate, description, submitMode } };
}

export function validateAssignmentMemo(memo: string) {
  const text = memo.trim();
  if (!text) return { ok: false as const, message: '메모를 작성해 주세요.' };
  if (text.length > ASSIGNMENT_MEMO_MAX) {
    return { ok: false as const, message: `메모는 ${ASSIGNMENT_MEMO_MAX}자 이내로 작성해 주세요.` };
  }
  return { ok: true as const, value: text };
}

const FILE_EXT_OK = /\.(png|jpe?g|gif|webp|heic|doc|docx|xls|xlsx|pdf)$/i;

export function isAllowedAssignmentFile(name: string, mime?: string) {
  const lower = (mime ?? '').toLowerCase();
  if (
    lower.startsWith('image/') ||
    lower === 'application/pdf' ||
    lower === 'application/msword' ||
    lower === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower === 'application/vnd.ms-excel' ||
    lower === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return true;
  }
  return FILE_EXT_OK.test(name);
}

export function validateAssignmentFile(input: { name: string; size?: number; mimeType?: string }) {
  if (!isAllowedAssignmentFile(input.name, input.mimeType)) {
    return { ok: false as const, message: '이미지, 워드, 엑셀, PDF만 올릴 수 있어요.' };
  }
  if (typeof input.size === 'number' && input.size > ASSIGNMENT_FILE_MAX_BYTES) {
    return { ok: false as const, message: '파일은 10MB 이내로 올려 주세요.' };
  }
  return { ok: true as const };
}

export function validateNoticeDraft(input: { title: string; body: string }) {
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { ok: false as const, message: '공지 제목을 입력해 주세요.' };
  if (title.length > 40) return { ok: false as const, message: '공지 제목은 40자 이하로 입력해 주세요.' };
  if (!body) return { ok: false as const, message: '공지 내용을 입력해 주세요.' };
  if (body.length > 500) return { ok: false as const, message: '공지 내용은 500자 이하로 입력해 주세요.' };
  return { ok: true as const, value: { title, body } };
}

export function mergeSchedules<T extends { id: string; date: string; time: string }>(
  base: T[],
  custom: T[],
  edits: Record<string, T>,
  deletedIds: string[],
) {
  const deleted = new Set(deletedIds);
  const map = new Map<string, T>();
  for (const item of [...base, ...custom]) {
    if (!deleted.has(item.id)) map.set(item.id, item);
  }
  for (const [id, edit] of Object.entries(edits)) {
    if (!deleted.has(id) && map.has(id)) map.set(id, edit);
  }
  return [...map.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id),
  );
}

export function mergeAssignments<T extends { id: string; dueDate: string }>(
  base: T[],
  custom: T[],
  edits: Record<string, T>,
  deletedIds: string[],
) {
  const deleted = new Set(deletedIds);
  const map = new Map<string, T>();
  for (const item of [...base, ...custom]) {
    if (!deleted.has(item.id)) map.set(item.id, item);
  }
  for (const [id, edit] of Object.entries(edits)) {
    if (!deleted.has(id) && map.has(id)) map.set(id, edit);
  }
  return [...map.values()].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
}

export function mergeNotices<T extends { id: string; date: string; pinned?: boolean }>(
  base: T[],
  custom: T[],
  edits: Record<string, T>,
  deletedIds: string[],
) {
  const deleted = new Set(deletedIds);
  const map = new Map<string, T>();
  for (const item of [...base, ...custom]) {
    if (!deleted.has(item.id)) map.set(item.id, item);
  }
  for (const [id, edit] of Object.entries(edits)) {
    if (!deleted.has(id) && map.has(id)) map.set(id, edit);
  }
  return [...map.values()].sort((a, b) => {
    const pin = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
    if (pin !== 0) return pin;
    return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
  });
}

export function pickUpcomingSchedule<T extends { date: string; time: string }>(items: T[], today: string) {
  return (
    items
      .filter((item) => item.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))[0] ?? null
  );
}

export function dueBadge(dueDate: string, today: string) {
  if (dueDate === today) return '오늘 마감';
  if (dueDate < today) return '마감 지남';
  const days = diffDays(today, dueDate);
  return days === 1 ? '내일 마감' : `D-${days}`;
}

export function pickOpenAssignments<T extends RhythmAssignment>(
  items: T[],
  submittedIds: string[],
  today: string,
  limit = 3,
) {
  const done = new Set(submittedIds);
  return items
    .filter((item) => !done.has(item.id))
    .filter((item) => {
      const delta = diffDays(today, item.dueDate);
      return delta <= 7 && delta >= -14;
    })
    .sort((a, b) => {
      const aOpen = a.dueDate >= today;
      const bOpen = b.dueDate >= today;
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      if (aOpen) return a.dueDate.localeCompare(b.dueDate);
      return b.dueDate.localeCompare(a.dueDate);
    })
    .slice(0, limit);
}

/** 오늘을 넘긴 세션은 빼고, 가장 최근 세션부터 출석이 끊기기 전까지 셉니다. */
export function attendanceStreak(sessions: RhythmSession[], attendedIds: string[], today: string) {
  const attended = new Set(attendedIds);
  const past = sessions
    .filter((session) => session.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time) || b.id.localeCompare(a.id));
  let streak = 0;
  for (const session of past) {
    if (!attended.has(session.id)) break;
    streak += 1;
  }
  return streak;
}

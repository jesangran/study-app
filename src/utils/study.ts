import { MOCK_STUDIES, Study, StudyVisibility } from '@/src/data/mock';

let runtimeStudies: Study[] = [...MOCK_STUDIES];

export function normalizeStudy(raw: Partial<Study> & Pick<Study, 'id' | 'name' | 'topic' | 'inviteCode'>): Study {
  return {
    id: raw.id,
    name: raw.name,
    topic: raw.topic,
    inviteCode: raw.inviteCode,
    memberCount: raw.memberCount ?? 1,
    emoji: raw.emoji ?? '📚',
    color: raw.color ?? '#DE7272',
    visibility: raw.visibility === 'private' ? 'private' : 'public',
  };
}

export function syncRuntimeStudies(
  customStudies: Study[],
  studyEdits: Record<string, Partial<Study>> = {},
  deletedStudyIds: string[] = [],
) {
  const byId = new Map<string, Study>();
  for (const study of MOCK_STUDIES) byId.set(study.id, study);
  for (const study of customStudies.map(normalizeStudy)) byId.set(study.id, study);
  runtimeStudies = [...byId.values()]
    .filter((study) => !deletedStudyIds.includes(study.id))
    .map((study) => {
      const edit = studyEdits[study.id];
      return edit ? normalizeStudy({ ...study, ...edit }) : study;
    });
}

export function isPrivateStudy(study: Pick<Study, 'visibility'> | null | undefined) {
  return study?.visibility === 'private';
}

export function visibilityLabel(visibility: StudyVisibility) {
  return visibility === 'private' ? '비공개' : '공개';
}

export function getAllStudies() {
  return runtimeStudies;
}

export function findStudyById(studyId: string) {
  return runtimeStudies.find((s) => s.id === studyId) ?? null;
}

export function studyName(studyId: string) {
  return findStudyById(studyId)?.name ?? '스터디';
}

export function studyEmoji(studyId: string) {
  return findStudyById(studyId)?.emoji ?? '✨';
}

export function studyColor(studyId: string) {
  return findStudyById(studyId)?.color ?? '#DE7272';
}

export const STUDY_EMOJI_OPTIONS = ['📚', '🧩', '🎨', '💬', '🔥', '🌱', '💡', '🎯', '📝', '🧠'] as const;

export const STUDY_COLOR_OPTIONS = [
  '#DE7272',
  '#FFCA88',
  '#FFF6A9',
  '#B4E4D6',
  '#6DB8A6',
  '#F5C8C8',
] as const;

const INVITE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const INVITE_DIGITS = '23456789';
const INVITE_CHARS = `${INVITE_LETTERS}${INVITE_DIGITS}`;

export const INVITE_CODE_MIN = 6;
export const INVITE_CODE_MAX = 10;

/** 소문자→대문자, 영문/숫자만 남김 */
export function normalizeInviteCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, INVITE_CODE_MAX);
}

export type InviteCodeCheck =
  | { ok: true; code: string }
  | { ok: false; message: string };

/** 6~10자, 영문 대문자·숫자 모두 포함, 특수문자 불가 */
export function validateInviteCode(
  raw: string,
  existingCodes: string[] = [],
): InviteCodeCheck {
  const code = normalizeInviteCode(raw);
  if (!code) {
    return { ok: false, message: '초대코드를 입력해 주세요.' };
  }
  if (code.length < INVITE_CODE_MIN || code.length > INVITE_CODE_MAX) {
    return {
      ok: false,
      message: `초대코드는 ${INVITE_CODE_MIN}~${INVITE_CODE_MAX}자로 입력해 주세요.`,
    };
  }
  if (!/[A-Z]/.test(code) || !/[0-9]/.test(code)) {
    return { ok: false, message: '초대코드에는 영문 대문자와 숫자를 모두 넣어 주세요.' };
  }
  if (existingCodes.some((c) => c.toUpperCase() === code)) {
    return { ok: false, message: '이미 사용 중인 초대코드예요.' };
  }
  return { ok: true, code };
}

function pick(chars: string) {
  return chars[Math.floor(Math.random() * chars.length)];
}

/** 앱에서 생성: 6~10자, 영문+숫자 포함 */
export function makeInviteCode(existingCodes: string[] = []) {
  const taken = new Set(existingCodes.map((c) => c.toUpperCase()));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const length = INVITE_CODE_MIN + Math.floor(Math.random() * (INVITE_CODE_MAX - INVITE_CODE_MIN + 1));
    const chars: string[] = [pick(INVITE_LETTERS), pick(INVITE_DIGITS)];
    while (chars.length < length) {
      chars.push(pick(INVITE_CHARS));
    }
    // shuffle
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const code = chars.join('');
    if (!taken.has(code)) return code;
  }
  const fallback = normalizeInviteCode(`SB${Date.now().toString(36).toUpperCase()}9`);
  return fallback.length >= INVITE_CODE_MIN ? fallback.slice(0, INVITE_CODE_MAX) : 'STUDY01';
}

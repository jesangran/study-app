/**
 * 프로토타입 데모 스위치
 * 실서비스 전환 시 `false`로 두고, mock 시드·초대코드 안내를 끈다.
 */
export const DEMO_MODE = true;

export const DEMO_INVITE_CODES = [
  { code: 'ALGO24', name: '알고리즘 밤샘반' },
  { code: 'TOEIC7', name: '토익 아침 스터디' },
  { code: 'CUTE99', name: '디자인 감성모임' },
  { code: 'JOB202', name: '면접 준비반' },
] as const;

export function demoInviteCodesLabel() {
  if (!DEMO_MODE) return '';
  return DEMO_INVITE_CODES.map((c) => c.code).join(' · ');
}

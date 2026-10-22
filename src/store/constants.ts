/** AppContext 스토리지·인증 상수 */

export const STORAGE_KEY = 'studybuddy.v4';

/** 프로토타입용 예약 닉네임 (실서비스에선 서버 검사) */
export const RESERVED_NICKNAMES = ['관리자', '운영자', '스터디장', 'studybuddy', 'admin'];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const EMAIL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** 이메일 인증코드 TTL (프로토타입: 1분) */
export const EMAIL_CODE_TTL_MS = 1 * 60 * 1000;

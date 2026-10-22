/**
 * AppContext 공개·내부 타입
 * (상태 머신 / API 시그니처 — 구현은 AppContext.tsx)
 */

import type { SocialProfile, SocialProvider, OAuthProvider } from '@/src/auth/social';
import type {
  Assignment,
  AssignmentSubmission,
  AttendanceSession,
  Notice,
  ScheduleItem,
  Study,
} from '@/src/data/mock';
import type { AppNotification } from '@/src/data/notifications';

export type User = {
  id: string;
  /** 프로필(연락용) 이메일 — 소셜 로그인 이메일과 달라도 됨 */
  email: string;
  emailVerified: boolean;
  nickname: string;
  providers: SocialProvider[];
  emailsByProvider: Partial<Record<SocialProvider, string>>;
  lastProvider: SocialProvider;
  createdAt: string;
};

export type NicknameCheckResult = { ok: true } | { ok: false; message: string };

export type EmailRequestResult =
  | { ok: true; demoCode: string; expiresAt: number }
  | { ok: false; message: string };

export type PendingEmailVerification = {
  userId: string;
  email: string;
  code: string;
  sentAt: number;
};

/** 비로그인 이메일 가입/로그인용 인증 대기 */
export type PendingEmailAuth = {
  purpose: 'signup' | 'login';
  email: string;
  code: string;
  sentAt: number;
  verified: boolean;
};

export type EmailCheckResult = { ok: true } | { ok: false; message: string };

export type LastLogin = {
  provider: SocialProvider;
  email: string;
  nickname: string;
  userId: string;
  at: string;
};

export type SocialLoginResult =
  | { status: 'need_nickname' }
  | { status: 'logged_in'; merged?: boolean }
  | { status: 'error'; message: string };

export type LinkProviderResult =
  | { status: 'linked'; autoMerged: boolean }
  | { status: 'confirm'; profile: SocialProfile }
  | { status: 'already_linked' }
  | { status: 'error'; message: string };

export type LeadOffer = {
  id: string;
  studyId: string;
  toMemberId: string;
  toNickname: string;
};

export type PersistedState = {
  user: User | null;
  accounts: User[];
  autoLogin: boolean;
  lastLogin: LastLogin | null;
  joinedStudyIds: string[];
  adminStudyIds: string[];
  attendedIds: string[];
  submittedAssignmentIds: string[];
  customSchedules: ScheduleItem[];
  scheduleEdits: Record<string, ScheduleItem>;
  deletedScheduleIds: string[];
  customNotices: Notice[];
  noticeEdits: Record<string, Notice>;
  deletedNoticeIds: string[];
  customAssignments: Assignment[];
  assignmentEdits: Record<string, Assignment>;
  deletedAssignmentIds: string[];
  assignmentSubmissions: Record<string, AssignmentSubmission>;
  customStudies: Study[];
  /** 스터디명 등 필드 덮어쓰기 (목 스터디 포함) */
  studyEdits: Record<string, Partial<Study>>;
  deletedStudyIds: string[];
  leadOffers: LeadOffer[];
  studyLeads: Record<string, string>;
  notifications: AppNotification[];
  notificationSeedVersion: number;
};

/** useApp() 공개 API */
export type AppContextValue = {
  ready: boolean;
  user: User | null;
  pendingSocial: SocialProfile | null;
  autoLogin: boolean;
  lastLogin: LastLogin | null;
  joinedStudyIds: string[];
  adminStudyIds: string[];
  attendedIds: string[];
  submittedAssignmentIds: string[];
  assignmentSubmissions: Record<string, AssignmentSubmission>;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationsRead: (ids?: string[]) => Promise<void>;
  markNotificationsUnread: (ids: string[]) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  studies: Study[];
  myStudies: Study[];
  managedStudies: Study[];
  schedule: ScheduleItem[];
  mySchedule: ScheduleItem[];
  attendance: AttendanceSession[];
  myAttendance: AttendanceSession[];
  assignments: Assignment[];
  myAssignments: Assignment[];
  notices: Notice[];
  myNotices: Notice[];
  setAutoLogin: (value: boolean) => Promise<void>;
  loginWithSocial: (provider: OAuthProvider) => Promise<SocialLoginResult>;
  completeNickname: (nickname: string) => Promise<string | null>;
  clearPendingSocial: () => void;
  checkNicknameAvailable: (nickname: string, excludeUserId?: string) => NicknameCheckResult;
  checkEmailAvailable: (email: string, excludeUserId?: string) => EmailCheckResult;
  updateNickname: (nickname: string) => Promise<string | null>;
  requestEmailVerification: (email: string) => Promise<EmailRequestResult>;
  confirmEmailVerification: (code: string) => Promise<string | null>;
  requestSignupEmailCode: (email: string) => Promise<EmailRequestResult>;
  confirmSignupEmailCode: (code: string) => Promise<string | null>;
  completeEmailSignup: (nickname: string) => Promise<string | null>;
  requestEmailLoginCode: (email: string) => Promise<EmailRequestResult>;
  confirmEmailLogin: (code: string) => Promise<string | null>;
  clearPendingEmailAuth: () => void;
  requestLinkProvider: (provider: OAuthProvider) => Promise<LinkProviderResult>;
  confirmLinkProvider: (profile: SocialProfile) => Promise<string | null>;
  unlinkProvider: (provider: SocialProvider) => Promise<string | null>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
  joinStudy: (studyId: string, options?: { viaInvite?: boolean }) => Promise<string | null>;
  joinByInvite: (code: string) => Promise<string | null>;
  leaveStudy: (studyId: string) => Promise<void>;
  deleteStudy: (studyId: string) => Promise<string | null>;
  /** 스터디장: 스터디 이름 변경 */
  updateStudyName: (studyId: string, name: string) => Promise<string | null>;
  setStudyAdmin: (studyId: string, isAdmin: boolean) => Promise<string | null>;
  leadOffers: LeadOffer[];
  studyLeads: Record<string, string>;
  requestLeadTransfer: (studyId: string, memberId: string, nickname: string) => Promise<string | null>;
  cancelLeadTransfer: (studyId: string) => Promise<void>;
  respondLeadTransfer: (studyId: string, accept: boolean) => Promise<string | null>;
  createStudy: (input: {
    name: string;
    topic: string;
    emoji: string;
    color: string;
    inviteCode?: string;
    visibility: 'public' | 'private';
  }) => Promise<{ ok: true; study: Study } | { ok: false; message: string }>;
  addSchedule: (input: {
    studyId: string;
    title: string;
    date: string;
    time: string;
    placeType: 'online' | 'offline';
    place: string;
    address?: string;
    mapx?: string;
    mapy?: string;
  }) => Promise<string | null>;
  updateSchedule: (
    scheduleId: string,
    input: {
      title: string;
      date: string;
      time: string;
      placeType: 'online' | 'offline';
      place: string;
      address?: string;
      mapx?: string;
      mapy?: string;
    },
  ) => Promise<string | null>;
  deleteSchedule: (scheduleId: string) => Promise<string | null>;
  addNotice: (input: {
    studyId: string;
    title: string;
    body: string;
    pinned?: boolean;
  }) => Promise<string | null>;
  updateNotice: (
    noticeId: string,
    input: { title: string; body: string; pinned?: boolean },
  ) => Promise<string | null>;
  deleteNotice: (noticeId: string) => Promise<string | null>;
  addAssignment: (input: {
    studyId: string;
    title: string;
    dueDate: string;
    description: string;
    submitMode: 'file' | 'memo';
  }) => Promise<string | null>;
  updateAssignment: (
    assignmentId: string,
    input: { title: string; dueDate: string; description: string; submitMode: 'file' | 'memo' },
  ) => Promise<string | null>;
  deleteAssignment: (assignmentId: string) => Promise<string | null>;
  toggleAttendance: (sessionId: string) => Promise<void>;
  /** @deprecated 제출은 submitAssignment / clearAssignmentSubmission 사용 */
  toggleAssignment: (assignmentId: string) => Promise<void>;
  submitAssignment: (
    assignmentId: string,
    input:
      | { mode: 'memo'; memo: string }
      | { mode: 'file'; fileName: string; fileUri: string; fileMime?: string; fileSize?: number },
  ) => Promise<string | null>;
  clearAssignmentSubmission: (assignmentId: string) => Promise<void>;
  attendanceRate: number;
  assignmentRate: number;
};

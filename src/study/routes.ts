/**
 * 스터디 하위 화면 경로 헬퍼 (Expo Router params 통일)
 */
import type { Href } from 'expo-router';

export function studyHubHref(studyId: string): Href {
  return { pathname: '/studies/[studyId]', params: { studyId } };
}

export function studyAttendanceHref(studyId: string): Href {
  return { pathname: '/studies/[studyId]/attendance', params: { studyId } };
}

export function studyAssignmentsHref(studyId: string): Href {
  return { pathname: '/studies/[studyId]/assignments', params: { studyId } };
}

export function studyNoticesHref(studyId: string): Href {
  return {
    pathname: '/studies/[studyId]/notices',
    params: { studyId },
  } as unknown as Href;
}

export function studyMembersHref(studyId: string): Href {
  return { pathname: '/studies/[studyId]/members', params: { studyId } };
}

export function studyMemberHref(studyId: string, memberId: string): Href {
  return {
    pathname: '/studies/[studyId]/member/[memberId]',
    params: { studyId, memberId },
  };
}

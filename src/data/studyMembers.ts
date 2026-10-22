import {
  Assignment,
  AttendanceSession,
  MOCK_ASSIGNMENTS,
  MOCK_ATTENDANCE,
} from '@/src/data/mock';
import { findStudyById } from '@/src/utils/study';

export type StudyMember = {
  id: string;
  studyId: string;
  nickname: string;
  joinedAt: string;
  role: 'admin' | 'member';
};

/** 멤버별 출석 기록 (세션 id) */
export type MemberAttendanceMark = {
  memberId: string;
  sessionId: string;
};

/** 멤버별 과제 제출 기록 */
export type MemberAssignmentMark = {
  memberId: string;
  assignmentId: string;
  submittedAt: string;
};

/** 관리자 화면용 — 스터디별 출석 세션을 더 풍부하게 */
export const MOCK_ADMIN_ATTENDANCE: AttendanceSession[] = [
  ...MOCK_ATTENDANCE,
  { id: 'a1b', studyId: 's1', title: '그리디 기초', date: '2026-09-25', time: '20:00' },
  { id: 'a1c', studyId: 's1', title: '이분탐색 연습', date: '2026-09-30', time: '20:00' },
  { id: 'a1d', studyId: 's1', title: 'DP 기초 세션', date: '2026-10-01', time: '20:00' },
  { id: 'a2b', studyId: 's2', title: 'Part 5 문법', date: '2026-09-26', time: '07:30' },
  { id: 'a2c', studyId: 's2', title: 'LC 단어퀴즈', date: '2026-09-30', time: '07:30' },
  { id: 'a2d', studyId: 's2', title: '리스닝 쉐도잉', date: '2026-10-02', time: '07:30' },
  { id: 'a3b', studyId: 's3', title: '컬러 토큰 정리', date: '2026-09-29', time: '19:00' },
  { id: 'a3c', studyId: 's3', title: '컬러 시스템 리뷰', date: '2026-10-02', time: '19:00' },
  { id: 'a4a', studyId: 's4', title: '자소서 피드백', date: '2026-09-26', time: '21:00' },
  { id: 'a4b', studyId: 's4', title: '자기소개 모의면접', date: '2026-09-28', time: '21:00' },
  { id: 'a4c', studyId: 's4', title: 'CS 질문 대비', date: '2026-10-01', time: '21:00' },
];

export const MOCK_STUDY_MEMBERS: StudyMember[] = [
  // s1 알고리즘
  { id: 'm-s1-1', studyId: 's1', nickname: '코딩토끼', joinedAt: '2026-09-01', role: 'admin' },
  { id: 'm-s1-2', studyId: 's1', nickname: '밤샘펭귄', joinedAt: '2026-09-03', role: 'member' },
  { id: 'm-s1-3', studyId: 's1', nickname: '알고냥이', joinedAt: '2026-09-05', role: 'member' },
  { id: 'm-s1-4', studyId: 's1', nickname: 'DP마스터', joinedAt: '2026-09-08', role: 'member' },
  { id: 'm-s1-5', studyId: 's1', nickname: 'BFS러너', joinedAt: '2026-09-10', role: 'member' },
  // s2 토익
  { id: 'm-s2-1', studyId: 's2', nickname: '모닝잉글리시', joinedAt: '2026-09-02', role: 'admin' },
  { id: 'm-s2-2', studyId: 's2', nickname: '단어왕', joinedAt: '2026-09-04', role: 'member' },
  { id: 'm-s2-3', studyId: 's2', nickname: '리스닝요정', joinedAt: '2026-09-06', role: 'member' },
  { id: 'm-s2-4', studyId: 's2', nickname: '토익900', joinedAt: '2026-09-09', role: 'member' },
  // s3 디자인
  { id: 'm-s3-1', studyId: 's3', nickname: '감성픽셀', joinedAt: '2026-09-01', role: 'admin' },
  { id: 'm-s3-2', studyId: 's3', nickname: '피그마토끼', joinedAt: '2026-09-07', role: 'member' },
  { id: 'm-s3-3', studyId: 's3', nickname: 'UI냥', joinedAt: '2026-09-11', role: 'member' },
  // s4 면접
  { id: 'm-s4-1', studyId: 's4', nickname: '면접준비중', joinedAt: '2026-09-02', role: 'admin' },
  { id: 'm-s4-2', studyId: 's4', nickname: '자소서요정', joinedAt: '2026-09-05', role: 'member' },
  { id: 'm-s4-3', studyId: 's4', nickname: 'CS정복', joinedAt: '2026-09-12', role: 'member' },
];

function marksForStudy(
  studyId: string,
  sessionIds: string[],
  pattern: number[],
): MemberAttendanceMark[] {
  const members = MOCK_STUDY_MEMBERS.filter((m) => m.studyId === studyId);
  const marks: MemberAttendanceMark[] = [];
  members.forEach((member, mi) => {
    sessionIds.forEach((sessionId, si) => {
      const bit = pattern[(mi + si) % pattern.length];
      if (bit) marks.push({ memberId: member.id, sessionId });
    });
  });
  return marks;
}

function assignmentMarksForStudy(
  studyId: string,
  assignmentIds: string[],
  pattern: number[],
): MemberAssignmentMark[] {
  const members = MOCK_STUDY_MEMBERS.filter((m) => m.studyId === studyId);
  const marks: MemberAssignmentMark[] = [];
  members.forEach((member, mi) => {
    assignmentIds.forEach((assignmentId, ai) => {
      const bit = pattern[(mi * 2 + ai) % pattern.length];
      if (bit) {
        marks.push({
          memberId: member.id,
          assignmentId,
          submittedAt: '2026-09-28',
        });
      }
    });
  });
  return marks;
}

export const MOCK_MEMBER_ATTENDANCE: MemberAttendanceMark[] = [
  ...marksForStudy('s1', ['a1', 'a1b', 'a1c', 'a1d'], [1, 1, 0, 1]),
  ...marksForStudy('s2', ['a2', 'a2b', 'a2c', 'a2d'], [1, 0, 1, 1]),
  ...marksForStudy('s3', ['a3', 'a3b', 'a3c'], [1, 1, 0]),
  ...marksForStudy('s4', ['a4a', 'a4b', 'a4c'], [1, 0, 1]),
];

export const MOCK_MEMBER_ASSIGNMENTS: MemberAssignmentMark[] = [
  ...assignmentMarksForStudy('s1', ['hw1', 'hw2'], [1, 0, 1, 1]),
  ...assignmentMarksForStudy('s2', ['hw3'], [1, 1, 0]),
  ...assignmentMarksForStudy('s3', ['hw4'], [1, 0, 1]),
];

export type MemberStudyStats = {
  member: StudyMember;
  sessions: AttendanceSession[];
  attendanceBySession: Array<{ session: AttendanceSession; attended: boolean }>;
  attendanceRate: number;
  attendedCount: number;
  assignments: Assignment[];
  assignmentByItem: Array<{ assignment: Assignment; submitted: boolean; submittedAt?: string }>;
  assignmentRate: number;
  submittedCount: number;
};

export function getStudyMembers(studyId: string) {
  return MOCK_STUDY_MEMBERS.filter((m) => m.studyId === studyId);
}

export function getStudySessions(studyId: string) {
  return MOCK_ADMIN_ATTENDANCE.filter((s) => s.studyId === studyId).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export const SELF_MEMBER_ID = 'self';

export function getStudyAssignments(studyId: string) {
  return MOCK_ASSIGNMENTS.filter((a) => a.studyId === studyId).sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
}

export function getMemberStats(
  studyId: string,
  memberId: string,
  assignmentsOverride?: Assignment[],
): MemberStudyStats | null {
  const member = MOCK_STUDY_MEMBERS.find((m) => m.id === memberId && m.studyId === studyId);
  if (!member) return null;

  const sessions = getStudySessions(studyId);
  const assignments = assignmentsOverride
    ? [...assignmentsOverride].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    : getStudyAssignments(studyId);
  const attendedSet = new Set(
    MOCK_MEMBER_ATTENDANCE.filter((m) => m.memberId === memberId).map((m) => m.sessionId),
  );
  const submittedMap = new Map(
    MOCK_MEMBER_ASSIGNMENTS.filter((m) => m.memberId === memberId).map((m) => [
      m.assignmentId,
      m.submittedAt,
    ]),
  );

  const attendanceBySession = sessions.map((session) => ({
    session,
    attended: attendedSet.has(session.id),
  }));
  const attendedCount = attendanceBySession.filter((x) => x.attended).length;
  const attendanceRate =
    sessions.length === 0 ? 0 : Math.round((attendedCount / sessions.length) * 100);

  const assignmentByItem = assignments.map((assignment) => ({
    assignment,
    submitted: submittedMap.has(assignment.id),
    submittedAt: submittedMap.get(assignment.id),
  }));
  const submittedCount = assignmentByItem.filter((x) => x.submitted).length;
  const assignmentRate =
    assignments.length === 0 ? 0 : Math.round((submittedCount / assignments.length) * 100);

  return {
    member,
    sessions,
    attendanceBySession,
    attendanceRate,
    attendedCount,
    assignments,
    assignmentByItem,
    assignmentRate,
    submittedCount,
  };
}

export function getSelfMemberStats(
  nickname: string,
  studyId: string,
  sessions: AttendanceSession[],
  assignments: Assignment[],
  attendedIds: string[],
  submittedIds: string[],
): MemberStudyStats {
  const member: StudyMember = {
    id: SELF_MEMBER_ID,
    studyId,
    nickname,
    joinedAt: '나',
    role: 'member',
  };
  const attended = new Set(attendedIds);
  const submitted = new Set(submittedIds);
  const attendanceBySession = sessions.map((session) => ({
    session,
    attended: attended.has(session.id),
  }));
  const attendedCount = attendanceBySession.filter((item) => item.attended).length;
  const assignmentByItem = [...assignments]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((assignment) => ({
      assignment,
      submitted: submitted.has(assignment.id),
    }));
  const submittedCount = assignmentByItem.filter((item) => item.submitted).length;
  return {
    member,
    sessions,
    attendanceBySession,
    attendanceRate: sessions.length === 0 ? 0 : Math.round((attendedCount / sessions.length) * 100),
    attendedCount,
    assignments: assignmentByItem.map((item) => item.assignment),
    assignmentByItem,
    assignmentRate:
      assignmentByItem.length === 0 ? 0 : Math.round((submittedCount / assignmentByItem.length) * 100),
    submittedCount,
  };
}

export function getMembersWithSummary(studyId: string, assignmentsOverride?: Assignment[]) {
  return getStudyMembers(studyId).map((member) => {
    const stats = getMemberStats(studyId, member.id, assignmentsOverride)!;
    return {
      member,
      attendanceRate: stats.attendanceRate,
      assignmentRate: stats.assignmentRate,
      attendedCount: stats.attendedCount,
      sessionCount: stats.sessions.length,
      submittedCount: stats.submittedCount,
      assignmentCount: stats.assignments.length,
    };
  });
}

export function findStudy(studyId: string) {
  return findStudyById(studyId);
}

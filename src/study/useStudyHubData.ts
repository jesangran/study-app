/**
 * 스터디 허브 요약용 데이터 (출석·과제·일정·공지 미리보기)
 */
import { useMemo } from 'react';

import { useApp } from '@/src/store/AppContext';
import { pickUpcomingSchedule, todayYmd } from '@/src/utils/studyRhythm';

export function useStudyHubData(studyId: string | undefined) {
  const {
    myAssignments,
    submittedAssignmentIds,
    myAttendance,
    attendedIds,
    mySchedule,
    myNotices,
  } = useApp();
  const today = todayYmd();

  const assignments = useMemo(
    () =>
      myAssignments
        .filter((item) => item.studyId === studyId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [myAssignments, studyId],
  );

  const sessions = useMemo(
    () =>
      myAttendance
        .filter((item) => item.studyId === studyId)
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [myAttendance, studyId],
  );

  const upcoming = useMemo(() => {
    const mine = mySchedule.filter((item) => item.studyId === studyId);
    const next = pickUpcomingSchedule(mine, today);
    if (!next) return [] as typeof mine;
    return mine
      .filter((item) => item.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 2);
  }, [mySchedule, studyId, today]);

  const notices = useMemo(
    () => myNotices.filter((item) => item.studyId === studyId).slice(0, 2),
    [myNotices, studyId],
  );

  const assignmentDone = assignments.filter((item) => submittedAssignmentIds.includes(item.id)).length;
  const attendanceDone = sessions.filter((item) => attendedIds.includes(item.id)).length;
  const assignmentRate =
    assignments.length === 0 ? 0 : Math.round((assignmentDone / assignments.length) * 100);
  const attendanceRate =
    sessions.length === 0 ? 0 : Math.round((attendanceDone / sessions.length) * 100);

  return {
    today,
    assignments,
    sessions,
    upcoming,
    notices,
    assignmentRate,
    attendanceRate,
    openAssignmentCount: assignments.length - assignmentDone,
    openAttendanceCount: sessions.length - attendanceDone,
    noticeCount: myNotices.filter((item) => item.studyId === studyId).length,
  };
}

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  attendanceStreak,
  dueBadge,
  mergeAssignments,
  mergeNotices,
  mergeSchedules,
  pickOpenAssignments,
  pickUpcomingSchedule,
  validateAssignmentDraft,
  validateAssignmentFile,
  validateAssignmentMemo,
  validateNoticeDraft,
  validateScheduleDraft,
} from './studyRhythm.ts';

const baseSchedule = [
  { id: 'sch1', studyId: 's1', title: '기존', date: '2026-10-18', time: '20:00', place: 'Zoom', placeType: 'online' as const },
  { id: 'sch2', studyId: 's1', title: '내일', date: '2026-10-20', time: '07:30', place: '카페', placeType: 'offline' as const },
];

describe('일정 수정·삭제', () => {
  it('잘못된 날짜와 시간을 거절하고, 한 자리 시는 두 자리로 맞춘다', () => {
    const bad = validateScheduleDraft({
      studyId: 's1',
      title: '세션',
      date: '2026-02-31',
      time: '20:00',
      placeType: 'online',
      place: 'Zoom',
    });
    assert.equal(bad.ok, false);

    const padded = validateScheduleDraft({
      studyId: 's1',
      title: '세션',
      date: '2026-10-21',
      time: '9:05',
      placeType: 'online',
      place: 'Zoom',
    });
    assert.equal(padded.ok, true);
    if (padded.ok) assert.equal(padded.value.time, '09:05');
  });

  it('수정본을 덮어쓰고 삭제한 일정은 목록에서 뺀다', () => {
    const custom = [
      { id: 'sch_custom_1', studyId: 's1', title: '추가', date: '2026-10-22', time: '19:00', place: 'Meet', placeType: 'online' as const },
    ];
    const edited = mergeSchedules(baseSchedule, custom, {
      sch1: { ...baseSchedule[0], title: '이름 변경', time: '21:00' },
    }, []);
    assert.equal(edited.find((item) => item.id === 'sch1')?.title, '이름 변경');
    assert.equal(edited[0].id, 'sch1');

    const deleted = mergeSchedules(baseSchedule, custom, {}, ['sch2', 'sch_custom_1']);
    assert.deepEqual(deleted.map((item) => item.id), ['sch1']);
  });
});

describe('과제', () => {
  it('마감일이 없거나 잘못된 날짜는 거절하고, 수정·삭제를 반영한다', () => {
    const missing = validateAssignmentDraft({
      studyId: 's1',
      title: '백준 10문제',
      dueDate: '10/20',
      description: '',
      submitMode: 'memo',
    });
    assert.equal(missing.ok, false);

    const ok = validateAssignmentDraft({
      studyId: 's1',
      title: ' 백준 10문제 ',
      dueDate: '2026-10-24',
      description: '실버',
      submitMode: 'file',
    });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.value.title, '백준 10문제');
      assert.equal(ok.value.submitMode, 'file');
    }

    const merged = mergeAssignments(
      [{ id: 'hw1', dueDate: '2026-10-20' }, { id: 'hw2', dueDate: '2026-10-18' }],
      [{ id: 'hw3', dueDate: '2026-10-22' }],
      { hw2: { id: 'hw2', dueDate: '2026-10-25' } },
      ['hw1'],
    );
    assert.deepEqual(merged.map((item) => item.id), ['hw3', 'hw2']);
    assert.equal(merged[1].dueDate, '2026-10-25');

    assert.equal(validateAssignmentMemo('').ok, false);
    assert.equal(validateAssignmentMemo('a'.repeat(1001)).ok, false);
    assert.equal(validateAssignmentMemo('제출합니다').ok, true);
    assert.equal(validateAssignmentFile({ name: 'note.txt', size: 100 }).ok, false);
    assert.equal(validateAssignmentFile({ name: 'hw.pdf', size: 1024 }).ok, true);
    assert.equal(
      validateAssignmentFile({ name: 'big.pdf', size: 11 * 1024 * 1024 }).ok,
      false,
    );
  });
});

describe('공지', () => {
  it('빈 제목은 거절하고, 고정 공지를 위로 올린다', () => {
    const empty = validateNoticeDraft({ title: '  ', body: '내용' });
    assert.equal(empty.ok, false);

    const notices = mergeNotices(
      [
        { id: 'n1', studyId: 's1', title: '오래된 고정', body: 'a', date: '2026-10-10', pinned: true },
        { id: 'n2', studyId: 's1', title: '일반', body: 'b', date: '2026-10-18' },
      ],
      [{ id: 'n3', studyId: 's1', title: '새 글', body: 'c', date: '2026-10-19', pinned: true }],
      { n2: { id: 'n2', studyId: 's1', title: '고친 일반', body: 'b2', date: '2026-10-18' } },
      ['n1'],
    );
    assert.deepEqual(notices.map((item) => item.id), ['n3', 'n2']);
    assert.equal(notices[1].title, '고친 일반');
  });
});

describe('오늘 할 일', () => {
  const today = '2026-10-19';

  it('오늘 이후의 가장 가까운 일정만 고른다', () => {
    const next = pickUpcomingSchedule(
      [
        { date: '2026-10-18', time: '21:00' },
        { date: '2026-10-20', time: '09:00' },
        { date: '2026-10-19', time: '20:00' },
      ],
      today,
    );
    assert.deepEqual(next, { date: '2026-10-19', time: '20:00' });
  });

  it('제출한 과제는 빼고, 마감이 가까운 순으로 보여 준다', () => {
    const open = pickOpenAssignments(
      [
        { id: 'old', dueDate: '2026-10-01' },
        { id: 'today', dueDate: '2026-10-19' },
        { id: 'done', dueDate: '2026-10-19' },
        { id: 'soon', dueDate: '2026-10-21' },
        { id: 'late', dueDate: '2026-10-17' },
      ],
      ['done'],
      today,
    );
    assert.deepEqual(open.map((item) => item.id), ['today', 'soon', 'late']);
    assert.equal(dueBadge('2026-10-19', today), '오늘 마감');
    assert.equal(dueBadge('2026-10-20', today), '내일 마감');
    assert.equal(dueBadge('2026-10-17', today), '마감 지남');
  });
});

describe('연속 출석', () => {
  const sessions = [
    { id: 'a1', date: '2026-10-19', time: '20:00' },
    { id: 'a2', date: '2026-10-18', time: '07:30' },
    { id: 'a3', date: '2026-10-17', time: '19:00' },
    { id: 'future', date: '2026-10-21', time: '20:00' },
  ];

  it('최근 세션부터 출석이 이어진 횟수를 센다', () => {
    assert.equal(attendanceStreak(sessions, ['a1', 'a2', 'a3'], '2026-10-19'), 3);
    assert.equal(attendanceStreak(sessions, ['a1'], '2026-10-19'), 1);
    assert.equal(attendanceStreak(sessions, ['a2', 'a3'], '2026-10-19'), 0);
    assert.equal(attendanceStreak(sessions, [], '2026-10-19'), 0);
  });

  it('아직 오지 않은 세션은 연속 기록에 넣지 않는다', () => {
    assert.equal(attendanceStreak(sessions, ['future'], '2026-10-19'), 0);
    assert.equal(attendanceStreak(sessions, ['a1', 'future'], '2026-10-19'), 1);
  });
});

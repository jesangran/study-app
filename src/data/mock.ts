export type StudyVisibility = 'public' | 'private';

export type Study = {
  id: string;
  name: string;
  topic: string;
  inviteCode: string;
  memberCount: number;
  emoji: string;
  color: string;
  /** public: 바로 가입 / private: 초대코드 필요 (검색은 둘 다 가능) */
  visibility: StudyVisibility;
};

export type PlaceType = 'online' | 'offline';

export type ScheduleItem = {
  id: string;
  studyId: string;
  title: string;
  date: string;
  time: string;
  /** online: Zoom 등 / offline: 장소명 */
  place: string;
  placeType: PlaceType;
  /** offline일 때 도로명·지번 주소 */
  address?: string;
  /** 네이버 좌표 (optional) */
  mapx?: string;
  mapy?: string;
};

export type AttendanceSession = {
  id: string;
  studyId: string;
  title: string;
  date: string;
  time: string;
};

/** 스터디장이 고르는 과제 제출 방식 */
export type AssignmentSubmitMode = 'file' | 'memo';

export type Assignment = {
  id: string;
  studyId: string;
  title: string;
  dueDate: string;
  description: string;
  /** file: 이미지·워드·엑셀·PDF / memo: 텍스트 */
  submitMode: AssignmentSubmitMode;
};

export type AssignmentSubmission = {
  assignmentId: string;
  mode: AssignmentSubmitMode;
  submittedAt: string;
  memo?: string;
  fileName?: string;
  fileUri?: string;
  fileMime?: string;
  fileSize?: number;
};

export type Notice = {
  id: string;
  studyId: string;
  title: string;
  body: string;
  date: string;
  pinned?: boolean;
};

export const MOCK_STUDIES: Study[] = [
  {
    id: 's1',
    name: '알고리즘 밤샘반',
    topic: '코딩 테스트',
    inviteCode: 'ALGO24',
    memberCount: 8,
    emoji: '🧩',
    color: '#DE7272',
    visibility: 'public',
  },
  {
    id: 's2',
    name: '토익 아침 스터디',
    topic: '영어',
    inviteCode: 'TOEIC7',
    memberCount: 12,
    emoji: '📚',
    color: '#6DB8A6',
    visibility: 'public',
  },
  {
    id: 's3',
    name: '디자인 감성모임',
    topic: 'UI/UX',
    inviteCode: 'CUTE99',
    memberCount: 6,
    emoji: '🎨',
    color: '#FFCA88',
    visibility: 'public',
  },
  {
    id: 's4',
    name: '면접 준비반',
    topic: '취업',
    inviteCode: 'JOB202',
    memberCount: 10,
    emoji: '💬',
    color: '#B4E4D6',
    visibility: 'private',
  },
];

export const MOCK_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sch1',
    studyId: 's1',
    title: 'DFS/BFS 문제풀이',
    date: '2026-10-19',
    time: '20:00',
    placeType: 'online',
    place: 'Zoom',
  },
  {
    id: 'sch2',
    studyId: 's1',
    title: 'DP 기초 세션',
    date: '2026-10-21',
    time: '20:00',
    placeType: 'offline',
    place: '스터디룸 A',
    address: '서울특별시 강남구 테헤란로 152',
  },
  {
    id: 'sch3',
    studyId: 's2',
    title: 'LC 파트 7 단어퀴즈',
    date: '2026-10-20',
    time: '07:30',
    placeType: 'offline',
    place: '카페 모모',
    address: '서울특별시 마포구 연남로 12',
  },
  {
    id: 'sch4',
    studyId: 's3',
    title: '컬러 시스템 리뷰',
    date: '2026-10-22',
    time: '19:00',
    placeType: 'online',
    place: 'Google Meet',
  },
  {
    id: 'sch5',
    studyId: 's4',
    title: '자기소개 모의면접',
    date: '2026-10-18',
    time: '21:00',
    placeType: 'online',
    place: 'Zoom',
  },
];

export const MOCK_ATTENDANCE: AttendanceSession[] = [
  {
    id: 'a1',
    studyId: 's1',
    title: 'DFS/BFS 문제풀이',
    date: '2026-10-19',
    time: '20:00',
  },
  {
    id: 'a2',
    studyId: 's2',
    title: '아침 단어 퀴즈',
    date: '2026-10-18',
    time: '07:30',
  },
  {
    id: 'a3',
    studyId: 's3',
    title: '와이어프레임 피드백',
    date: '2026-10-17',
    time: '19:00',
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 'hw1',
    studyId: 's1',
    title: '백준 1920번 풀이 정리',
    dueDate: '2026-10-20',
    description: '시간복잡도 설명과 코드를 노션에 정리해 제출해주세요.',
    submitMode: 'memo',
  },
  {
    id: 'hw2',
    studyId: 's1',
    title: '주간 모의고사 3세트',
    dueDate: '2026-10-24',
    description: '틀린 문제만 오답노트로 올려주세요.',
    submitMode: 'file',
  },
  {
    id: 'hw3',
    studyId: 's2',
    title: 'Part 5 오답노트',
    dueDate: '2026-10-19',
    description: '틀린 문법 포인트 5개를 요약해주세요.',
    submitMode: 'memo',
  },
  {
    id: 'hw4',
    studyId: 's3',
    title: '앱 홈 시안 1장',
    dueDate: '2026-10-22',
    description: 'Figma 링크 또는 이미지로 제출해주세요.',
    submitMode: 'file',
  },
];

export const MOCK_NOTICES: Notice[] = [
  {
    id: 'n1',
    studyId: 's1',
    title: '이번 주 Zoom 링크 변경 안내',
    body: '수요일부터는 새 Zoom 방(비밀번호 1234)을 사용합니다. 지각 시 채팅으로 알려주세요!',
    date: '2026-10-17',
    pinned: true,
  },
  {
    id: 'n2',
    studyId: 's2',
    title: '교재 3장까지 예습 부탁드려요',
    body: '목요일 세션에서 서로 설명해보는 시간을 가질 예정입니다.',
    date: '2026-10-16',
  },
  {
    id: 'n3',
    studyId: 's3',
    title: '디자인 레퍼런스 공유함',
    body: '노션에 아기자기한 모바일 UI 레퍼런스 모음을 올려두었어요. 자유롭게 참고하세요.',
    date: '2026-10-15',
    pinned: true,
  },
  {
    id: 'n4',
    studyId: 's4',
    title: '모의면접 일정 조율',
    body: '이번 주 일요일 저녁으로 모의면접을 옮깁니다. 참석 여부를 댓글로 남겨주세요.',
    date: '2026-10-14',
  },
];

/**
 * 스터디 하위 화면 공통: studyId · 가입/스터디장 · 스터디 엔티티
 */
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import type { Study } from '@/src/data/mock';
import { useApp } from '@/src/store/AppContext';

function pickStudyId(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === 'string' && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return undefined;
}

export type StudyScope = {
  studyId: string | undefined;
  study: Study | null;
  joined: boolean;
  isAdmin: boolean;
  /** 가입된 유효 스터디 */
  available: boolean;
};

export function useStudyScope(): StudyScope {
  const { studyId: raw } = useLocalSearchParams<{ studyId?: string | string[] }>();
  const studyId = pickStudyId(raw);
  const { studies, joinedStudyIds, adminStudyIds } = useApp();

  const study = useMemo(
    () => (studyId ? studies.find((item) => item.id === studyId) ?? null : null),
    [studies, studyId],
  );
  const joined = studyId ? joinedStudyIds.includes(studyId) : false;
  const isAdmin = studyId ? adminStudyIds.includes(studyId) : false;

  return {
    studyId,
    study,
    joined,
    isAdmin,
    available: Boolean(study && joined),
  };
}

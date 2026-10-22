/**
 * 일정 탭 — 달력/목록 · 일정·과제 CRUD · 캘린더 내보내기
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  buildCalendarPayload,
  exportToCalendar,
} from '@/src/calendar/exportSchedule';
import { AssignmentFormModal } from '@/src/components/AssignmentFormModal';
import { AssignmentSubmitModal } from '@/src/components/AssignmentSubmitModal';
import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { MenuHeader } from '@/src/components/MenuHeader';
import {
  PlaceFormValue,
  SchedulePlaceFields,
} from '@/src/components/SchedulePlaceFields';
import { SoftBackground } from '@/src/components/SoftBackground';
import { StudyLeadMark } from '@/src/components/StudyLeadMark';
import {
  formatKrHolidayLabel,
  getKrHolidaysOn,
  isKrBlueDay,
  isKrRedDay,
  KR_CAL_SAT,
  KR_CAL_SUN,
} from '@/src/data/krHolidays';
import { Assignment, ScheduleItem, Study } from '@/src/data/mock';
import { useUnsavedGuard } from '@/src/navigation/UnsavedGuard';
import { useApp } from '@/src/store/AppContext';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';
import { formatPlaceLabel } from '@/src/utils/schedulePlace';
import { studyEmoji, studyName } from '@/src/utils/study';
import { dueBadge, todayYmd } from '@/src/utils/studyRhythm';

type ViewMode = 'list' | 'calendar';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toYmd(year: number, monthIndex: number, day: number) {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function buildMonthCells(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startWeekday = first.getDay();
  const cells: Array<{ day: number | null; ymd: string | null }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ day: null, ymd: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, ymd: toYmd(year, monthIndex, day) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, ymd: null });
  }
  return cells;
}

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.toggleWrap}>
      <Pressable
        onPress={() => onChange('calendar')}
        style={[styles.toggleBtn, mode === 'calendar' && styles.toggleBtnActive]}
      >
        <Ionicons
          name="calendar"
          size={16}
          color={mode === 'calendar' ? colors.white : colors.inkMuted}
        />
        <Text style={[styles.toggleText, mode === 'calendar' && styles.toggleTextActive]}>
          달력으로 보기
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('list')}
        style={[styles.toggleBtn, mode === 'list' && styles.toggleBtnActive]}
      >
        <Ionicons
          name="list"
          size={16}
          color={mode === 'list' ? colors.white : colors.inkMuted}
        />
        <Text style={[styles.toggleText, mode === 'list' && styles.toggleTextActive]}>
          목록으로 보기
        </Text>
      </Pressable>
    </View>
  );
}

function StudyListView({
  studyBlocks,
  onSelect,
  onSelectAssignment,
}: {
  studyBlocks: Array<{
    study: Study;
    isAdmin: boolean;
    items: ScheduleItem[];
    assignments: Assignment[];
  }>;
  onSelect: (item: ScheduleItem) => void;
  onSelectAssignment: (item: Assignment) => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);

  if (studyBlocks.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.empty}>아직 가입한 스터디가 없어요</Text>
        <Text style={styles.emptyHint}>스터디에 가입하면 일정이 여기에 모여요</Text>
      </View>
    );
  }

  return (
    <>
      {studyBlocks.map(({ study, isAdmin, items, assignments }) => (
        <View key={study.id} style={styles.groupCard}>
          <View style={[styles.groupAccent, { backgroundColor: study.color }]} />
          <View style={styles.groupBody}>
            <View style={styles.groupHead}>
              <Text style={styles.emoji}>{study.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.groupTitle}>{study.name}</Text>
                  {isAdmin ? <StudyLeadMark /> : null}
                </View>
                <Text style={styles.groupMeta}>
                  {study.topic} · 일정 {items.length}개 · 과제 {assignments.length}개
                </Text>
              </View>
            </View>

            <Text style={styles.kindLabel}>일정</Text>
            <View style={styles.listSection}>
              {items.length === 0 ? (
                <Text style={styles.listEmpty}>
                  {isAdmin
                    ? '아직 일정이 없어요. 위에서 등록해 보세요'
                    : '등록된 일정이 없어요'}
                </Text>
              ) : (
                items.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelect(item)}
                    style={({ pressed }) => [styles.itemCard, pressed && { opacity: 0.88 }]}
                  >
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>
                      {item.date} · {item.time}
                    </Text>
                    <Text style={styles.itemMeta}>{formatPlaceLabel(item)}</Text>
                    <Text style={styles.itemActionHint}>탭해서 캘린더에 등록</Text>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.kindLabel}>과제</Text>
            <View style={styles.listSection}>
              {assignments.length === 0 ? (
                <Text style={styles.listEmpty}>
                  {isAdmin ? '아직 과제가 없어요. 위에서 등록해 보세요' : '등록된 과제가 없어요'}
                </Text>
              ) : (
                assignments.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectAssignment(item)}
                    style={({ pressed }) => [styles.itemCard, pressed && { opacity: 0.88 }]}
                  >
                    <Text style={styles.kindChip}>과제</Text>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>
                      마감 {item.dueDate} · {dueBadge(item.dueDate, todayYmd())}
                    </Text>
                    {item.description ? (
                      <Text style={styles.itemMeta} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

function CalendarView({
  cursor,
  selectedYmd,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  cells,
  marksByDate,
  dayItems,
  dayAssignments,
  studyById,
  adminStudyIds,
  onSelect,
  onSelectAssignment,
}: {
  cursor: { year: number; monthIndex: number };
  selectedYmd: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (ymd: string) => void;
  cells: Array<{ day: number | null; ymd: string | null }>;
  marksByDate: Record<string, string[]>;
  dayItems: ScheduleItem[];
  dayAssignments: Assignment[];
  studyById: Record<string, Study>;
  adminStudyIds: string[];
  onSelect: (item: ScheduleItem) => void;
  onSelectAssignment: (item: Assignment) => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);

  const today = todayYmd();
  const monthLabel = `${cursor.year}년 ${cursor.monthIndex + 1}월`;
  const selectedHolidayLabel = formatKrHolidayLabel(selectedYmd);

  return (
    <View>
      <View style={styles.calCard}>
        <View style={styles.calHeader}>
          <Pressable onPress={onPrevMonth} hitSlop={10} style={styles.calNavBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.calMonth}>{monthLabel}</Text>
          <Pressable onPress={onNextMonth} hitSlop={10} style={styles.calNavBtn}>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((label, weekday) => (
            <Text
              key={label}
              style={[
                styles.weekLabel,
                weekday === 0 && styles.weekLabelSun,
                weekday === 6 && styles.weekLabelSat,
              ]}
            >
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.dayGrid}>
          {cells.map((cell, index) => {
            if (!cell.day || !cell.ymd) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }
            const weekday = index % 7;
            const marks = marksByDate[cell.ymd] ?? [];
            const selected = cell.ymd === selectedYmd;
            const isToday = cell.ymd === today;
            const holidays = getKrHolidaysOn(cell.ymd);
            const holidayShort = holidays[0]?.name ?? '';
            const red = isKrRedDay(cell.ymd, weekday);
            const blue = isKrBlueDay(cell.ymd, weekday);
            return (
              <Pressable
                key={cell.ymd}
                onPress={() => onSelectDay(cell.ymd!)}
                style={[
                  styles.dayCell,
                  selected && styles.dayCellSelected,
                  isToday && !selected && styles.dayCellToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    red && styles.dayNumSun,
                    blue && styles.dayNumSat,
                    selected && styles.dayNumSelected,
                    isToday && !selected && styles.dayNumToday,
                  ]}
                >
                  {cell.day}
                </Text>
                {holidayShort ? (
                  <Text
                    style={[styles.holidayChip, red && styles.holidayChipRed]}
                    numberOfLines={1}
                  >
                    {holidayShort.replace(' 대체공휴일', ' 대체').replace(' 연휴', '')}
                  </Text>
                ) : null}
                <View style={styles.dotRow}>
                  {marks.slice(0, 3).map((color, i) => (
                    <View
                      key={`${cell.ymd}-${i}`}
                      style={[styles.dot, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.dayDetail}>
        <Text style={styles.dayDetailTitle}>
          {selectedYmd} 일정 · 과제
          {selectedHolidayLabel ? ` · ${selectedHolidayLabel}` : ''}
        </Text>
        {dayItems.length === 0 && dayAssignments.length === 0 ? (
          <Text style={styles.listEmpty}>이 날에는 일정과 과제가 없어요</Text>
        ) : null}
        {dayItems.length === 0 ? null : (
          dayItems.map((item) => {
            const study = studyById[item.studyId];
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelect(item)}
                style={({ pressed }) => [styles.itemCard, pressed && { opacity: 0.88 }]}
              >
                <View style={styles.calItemHead}>
                  <Text style={styles.itemTitle}>
                    {study?.emoji ?? '✨'} {item.title}
                  </Text>
                  {adminStudyIds.includes(item.studyId) ? <StudyLeadMark /> : null}
                </View>
                <Text style={styles.itemMeta}>{study?.name ?? '스터디'}</Text>
                <Text style={styles.itemMeta}>
                  {item.time} · {formatPlaceLabel(item)}
                </Text>
                <Text style={styles.itemActionHint}>탭해서 캘린더에 등록</Text>
              </Pressable>
            );
          })
        )}
        {dayAssignments.map((item) => {
          const study = studyById[item.studyId];
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelectAssignment(item)}
              style={({ pressed }) => [styles.itemCard, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.kindChip}>과제</Text>
              <Text style={styles.itemTitle}>
                {study?.emoji ?? '✨'} {item.title}
              </Text>
              <Text style={styles.itemMeta}>{study?.name ?? '스터디'}</Text>
              <Text style={styles.itemMeta}>마감 {item.dueDate}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addStudyId } = useLocalSearchParams<{ addStudyId?: string }>();
  const openedAdd = useRef<string | null>(null);
  const {
    myStudies,
    mySchedule,
    myAssignments,
    adminStudyIds,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    clearAssignmentSubmission,
    assignmentSubmissions,
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const now = new Date();
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  });
  const [selectedYmd, setSelectedYmd] = useState(todayYmd());

  const [open, setOpen] = useState(false);
  const [createKind, setCreateKind] = useState<'schedule' | 'assignment'>('schedule');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studyId, setStudyId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayYmd());
  const [time, setTime] = useState('20:00');
  const [placeForm, setPlaceForm] = useState<PlaceFormValue>({
    placeType: 'online',
    place: '',
  });
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentSubmitMode, setAssignmentSubmitMode] = useState<'file' | 'memo'>('memo');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [assignmentStudyId, setAssignmentStudyId] = useState('');
  const [confirmAssignmentDelete, setConfirmAssignmentDelete] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [submitTarget, setSubmitTarget] = useState<Assignment | null>(null);
  useUnsavedGuard(open);

  const studyBlocks = useMemo(
    () =>
      myStudies.map((study) => ({
        study,
        isAdmin: adminStudyIds.includes(study.id),
        items: mySchedule
          .filter((item) => item.studyId === study.id)
          .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
        assignments: myAssignments
          .filter((item) => item.studyId === study.id)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      })),
    [myStudies, mySchedule, myAssignments, adminStudyIds],
  );

  const studyById = useMemo(() => {
    const map: Record<string, Study> = {};
    myStudies.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [myStudies]);

  const marksByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    mySchedule.forEach((item) => {
      const color = studyById[item.studyId]?.color ?? colors.sky;
      if (!map[item.date]) map[item.date] = [];
      if (!map[item.date].includes(color)) map[item.date].push(color);
    });
    myAssignments.forEach((item) => {
      const color = studyById[item.studyId]?.color ?? colors.peach;
      if (!map[item.dueDate]) map[item.dueDate] = [];
      if (!map[item.dueDate].includes(color)) map[item.dueDate].push(color);
    });
    return map;
  }, [mySchedule, myAssignments, studyById]);

  const cells = useMemo(
    () => buildMonthCells(cursor.year, cursor.monthIndex),
    [cursor.year, cursor.monthIndex],
  );

  const dayItems = useMemo(
    () =>
      mySchedule
        .filter((item) => item.date === selectedYmd)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [mySchedule, selectedYmd],
  );

  const dayAssignments = useMemo(
    () =>
      myAssignments
        .filter((item) => item.dueDate === selectedYmd)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [myAssignments, selectedYmd],
  );

  const targetStudy = useMemo(
    () => myStudies.find((s) => s.id === studyId) ?? null,
    [myStudies, studyId],
  );

  const managedStudies = useMemo(
    () => myStudies.filter((study) => adminStudyIds.includes(study.id)),
    [myStudies, adminStudyIds],
  );

  const openRegister = (opts?: {
    studyId?: string;
    presetDate?: string;
    kind?: 'schedule' | 'assignment';
  }) => {
    const id = opts?.studyId ?? managedStudies[0]?.id ?? '';
    setEditingId(null);
    setCreateKind(opts?.kind ?? 'schedule');
    setStudyId(id);
    setTitle('');
    setDate(opts?.presetDate ?? selectedYmd);
    setTime('20:00');
    setPlaceForm({ placeType: 'online', place: '' });
    setAssignmentDesc('');
    setAssignmentSubmitMode('memo');
    setError(null);
    setOpen(true);
  };

  useEffect(() => {
    const id = typeof addStudyId === 'string' ? addStudyId : '';
    if (!id) {
      openedAdd.current = null;
      return;
    }
    if (openedAdd.current === id || !adminStudyIds.includes(id)) return;
    openedAdd.current = id;
    openRegister({ studyId: id });
    router.setParams({ addStudyId: '' });
  }, [addStudyId, adminStudyIds, router]);

  const openAssignmentDetail = (item: Assignment) => {
    setSelectedItem(null);
    setAssignmentError(null);
    setConfirmAssignmentDelete(false);
    setSelectedAssignment(item);
  };

  const openEditAssignment = (item: Assignment) => {
    setSelectedAssignment(null);
    setEditingAssignmentId(item.id);
    setAssignmentStudyId(item.studyId);
    setAssignmentError(null);
    setAssignmentOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setSelectedItem(null);
    setConfirmDelete(false);
    setEditingId(item.id);
    setCreateKind('schedule');
    setStudyId(item.studyId);
    setTitle(item.title);
    setDate(item.date);
    setTime(item.time);
    setPlaceForm({
      placeType: item.placeType,
      place: item.place,
      address: item.address,
      mapx: item.mapx,
      mapy: item.mapy,
    });
    setError(null);
    setOpen(true);
  };

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.monthIndex + delta, 1);
      return { year: d.getFullYear(), monthIndex: d.getMonth() };
    });
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    if (!editingId && createKind === 'assignment') {
      const err = await addAssignment({
        studyId,
        title,
        dueDate: date,
        description: assignmentDesc,
        submitMode: assignmentSubmitMode,
      });
      setSaving(false);
      if (err) {
        setError(err);
        return;
      }
      setSelectedYmd(date);
      setOpen(false);
      return;
    }
    const payload = {
      title,
      date,
      time,
      placeType: placeForm.placeType,
      place: placeForm.place,
      address: placeForm.address,
      mapx: placeForm.mapx,
      mapy: placeForm.mapy,
    };
    const err = editingId
      ? await updateSchedule(editingId, payload)
      : await addSchedule({ studyId, ...payload });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setSelectedYmd(date);
    setEditingId(null);
    setOpen(false);
  };

  const openDetail = (item: ScheduleItem) => {
    setSelectedItem(item);
    setConfirmDelete(false);
    setDeleteError(null);
    setExportMessage(null);
  };

  const onDelete = async () => {
    if (!selectedItem) return;
    setSaving(true);
    setDeleteError(null);
    const err = await deleteSchedule(selectedItem.id);
    setSaving(false);
    if (err) {
      setDeleteError(err);
      return;
    }
    setConfirmDelete(false);
    setSelectedItem(null);
  };

  const calendarPayload = selectedItem
    ? buildCalendarPayload(selectedItem, { studyTitle: studyName(selectedItem.studyId) })
    : null;

  const onExportCalendar = async () => {
    if (!calendarPayload) return;
    setExporting(true);
    setExportMessage(null);
    const result = await exportToCalendar(calendarPayload);
    setExporting(false);
    if (result.status === 'saved') {
      setExportMessage('캘린더에 등록했어요.');
    } else if (result.status === 'canceled') {
      setExportMessage('등록을 취소했어요.');
    } else if (result.status === 'opened') {
      setExportMessage('캘린더 작성 화면을 열었어요.');
    } else if (result.status === 'unavailable' || result.status === 'error') {
      setExportMessage(result.message);
    }
  };

  return (
    <SoftBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: spacing.md }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MenuHeader
          title="일정"
          caption={
            viewMode === 'calendar'
              ? '달력에서 날짜를 골라 일정을 확인해요'
              : '스터디별로 일정과 과제를 모아 봐요'
          }
        />

        {managedStudies.length > 0 ? (
          <CuteButton
            label="일정/과제등록하기"
            variant="mint"
            onPress={() => openRegister()}
            style={styles.topRegisterBtn}
          />
        ) : null}

        <ViewToggle mode={viewMode} onChange={setViewMode} />

        {viewMode === 'list' ? (
          <StudyListView
            studyBlocks={studyBlocks}
            onSelect={openDetail}
            onSelectAssignment={openAssignmentDetail}
          />
        ) : (
          <CalendarView
            cursor={cursor}
            selectedYmd={selectedYmd}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
            onSelectDay={setSelectedYmd}
            cells={cells}
            marksByDate={marksByDate}
            dayItems={dayItems}
            dayAssignments={dayAssignments}
            studyById={studyById}
            adminStudyIds={adminStudyIds}
            onSelect={openDetail}
            onSelectAssignment={openAssignmentDetail}
          />
        )}
      </ScrollView>

      <Modal
        visible={!!selectedItem}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {selectedItem ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScroll}
              >
                <View style={styles.detailTop}>
                  <Text style={[styles.modalTitle, { flex: 1 }]} numberOfLines={1}>
                    일정 상세
                  </Text>
                  <View style={styles.detailTopRight}>
                    <Pressable
                      onPress={onExportCalendar}
                      disabled={exporting}
                      accessibilityLabel="캘린더에 등록"
                      style={({ pressed }) => [styles.calBtn, pressed && { opacity: 0.85 }]}
                    >
                      <Ionicons name="calendar-outline" size={15} color={colors.white} />
                      <Text style={styles.calBtnText}>캘린더에 등록</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setSelectedItem(null)}
                      hitSlop={8}
                      accessibilityLabel="닫기"
                      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                    >
                      <Ionicons name="close" size={20} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.modalHint}>
                  {studyEmoji(selectedItem.studyId)} {studyName(selectedItem.studyId)}
                </Text>
                <Text style={styles.detailTitle}>{selectedItem.title}</Text>
                <Text style={styles.detailMeta}>
                  {selectedItem.date} · {selectedItem.time} · 약 90분
                </Text>
                <Text style={styles.detailMeta}>{formatPlaceLabel(selectedItem)}</Text>
                {exportMessage ? <Text style={styles.exportMessage}>{exportMessage}</Text> : null}

                {adminStudyIds.includes(selectedItem.studyId) ? (
                  confirmDelete ? (
                    <View style={styles.exportBlock}>
                      <Text style={styles.exportLabel}>이 일정을 삭제할까요?</Text>
                      {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
                      <View style={styles.modalActions}>
                        <CuteButton
                          label="취소"
                          variant="ghost"
                          onPress={() => setConfirmDelete(false)}
                          style={{ flex: 1 }}
                        />
                        <CuteButton
                          label="삭제"
                          onPress={onDelete}
                          loading={saving}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.modalActions}>
                      <CuteButton
                        label="수정"
                        variant="mint"
                        onPress={() => openEdit(selectedItem)}
                        style={{ flex: 1 }}
                      />
                      <CuteButton
                        label="삭제"
                        variant="ghost"
                        onPress={() => setConfirmDelete(true)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  )
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <Text style={styles.modalTitle}>
                {editingId
                  ? '일정 수정'
                  : createKind === 'assignment'
                    ? '과제 등록'
                    : '일정 등록'}
              </Text>
              <Text style={styles.modalHint}>
                {editingId
                  ? `${targetStudy?.emoji ?? ''} ${targetStudy?.name ?? '스터디'} 일정을 고쳐요`
                  : '일정인지 과제인지 고른 뒤 등록해요'}
              </Text>

              {!editingId ? (
                <View style={styles.kindToggle}>
                  <Pressable
                    onPress={() => setCreateKind('schedule')}
                    style={[styles.kindToggleBtn, createKind === 'schedule' && styles.kindToggleOn]}
                  >
                    <Text
                      style={[
                        styles.kindToggleText,
                        createKind === 'schedule' && styles.kindToggleTextOn,
                      ]}
                    >
                      일정
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCreateKind('assignment')}
                    style={[styles.kindToggleBtn, createKind === 'assignment' && styles.kindToggleOn]}
                  >
                    <Text
                      style={[
                        styles.kindToggleText,
                        createKind === 'assignment' && styles.kindToggleTextOn,
                      ]}
                    >
                      과제
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {!editingId && managedStudies.length > 1 ? (
                <View style={styles.studyChips}>
                  {managedStudies.map((study) => {
                    const selected = study.id === studyId;
                    return (
                      <Pressable
                        key={study.id}
                        onPress={() => setStudyId(study.id)}
                        style={[styles.studyChip, selected && styles.studyChipOn]}
                      >
                        <Text style={[styles.studyChipText, selected && styles.studyChipTextOn]}>
                          {study.emoji} {study.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : targetStudy ? (
                <Text style={styles.modalHint}>
                  {targetStudy.emoji} {targetStudy.name}
                </Text>
              ) : null}

              <CuteInput
                label="제목"
                value={title}
                onChangeText={setTitle}
                placeholder={createKind === 'assignment' ? '예: 백준 10문제' : '예: DP 기초 세션'}
              />
              <CuteInput
                label={createKind === 'assignment' && !editingId ? '마감일 (YYYY-MM-DD)' : '날짜 (YYYY-MM-DD)'}
                value={date}
                onChangeText={setDate}
                placeholder="2026-10-05"
                autoCapitalize="none"
              />
              {editingId || createKind === 'schedule' ? (
                <>
                  <CuteInput
                    label="시간 (HH:MM)"
                    value={time}
                    onChangeText={setTime}
                    placeholder="20:00"
                    autoCapitalize="none"
                  />
                  <SchedulePlaceFields value={placeForm} onChange={setPlaceForm} />
                </>
              ) : (
                <>
                  <CuteInput
                    label="설명"
                    value={assignmentDesc}
                    onChangeText={setAssignmentDesc}
                    placeholder="무엇을 제출하면 되는지 적어 주세요"
                    multiline
                    style={styles.assignmentBody}
                  />
                  <Text style={styles.modeLabel}>제출 형식</Text>
                  <View style={styles.kindToggle}>
                    <Pressable
                      onPress={() => setAssignmentSubmitMode('file')}
                      style={[
                        styles.kindToggleBtn,
                        assignmentSubmitMode === 'file' && styles.kindToggleOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.kindToggleText,
                          assignmentSubmitMode === 'file' && styles.kindToggleTextOn,
                        ]}
                      >
                        파일
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setAssignmentSubmitMode('memo')}
                      style={[
                        styles.kindToggleBtn,
                        assignmentSubmitMode === 'memo' && styles.kindToggleOn,
                      ]}
                    >
                      <Text
                        style={[
                          styles.kindToggleText,
                          assignmentSubmitMode === 'memo' && styles.kindToggleTextOn,
                        ]}
                      >
                        메모
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={styles.modeHint}>
                    {assignmentSubmitMode === 'file'
                      ? '이미지·워드·엑셀·PDF · 10MB 이내'
                      : '텍스트 메모 · 1,000자 이내'}
                  </Text>
                </>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.modalActions}>
                <CuteButton
                  label="취소"
                  variant="ghost"
                  onPress={() => {
                    setEditingId(null);
                    setOpen(false);
                  }}
                  style={{ flex: 1 }}
                />
                <CuteButton
                  label={editingId ? '수정 저장' : '저장'}
                  onPress={onSave}
                  loading={saving}
                  disabled={!studyId}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedAssignment}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAssignment(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            {selectedAssignment ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailTop}>
                  <Text style={styles.modalTitle}>과제</Text>
                  <Pressable onPress={() => setSelectedAssignment(null)} hitSlop={8}>
                    <Ionicons name="close" size={20} color={colors.ink} />
                  </Pressable>
                </View>
                <Text style={styles.modalHint}>
                  {studyEmoji(selectedAssignment.studyId)} {studyName(selectedAssignment.studyId)}
                </Text>
                <Text style={styles.detailTitle}>{selectedAssignment.title}</Text>
                <Text style={styles.detailMeta}>
                  마감 {selectedAssignment.dueDate} · {dueBadge(selectedAssignment.dueDate, todayYmd())}
                </Text>
                {selectedAssignment.description ? (
                  <Text style={styles.detailMeta}>{selectedAssignment.description}</Text>
                ) : null}
                {assignmentSubmissions[selectedAssignment.id] ? (
                  <>
                    <Text style={styles.detailMeta}>
                      {assignmentSubmissions[selectedAssignment.id].mode === 'file'
                        ? `제출 파일: ${assignmentSubmissions[selectedAssignment.id].fileName}`
                        : `제출 메모: ${assignmentSubmissions[selectedAssignment.id].memo}`}
                    </Text>
                    <CuteButton
                      label="제출 취소"
                      variant="ghost"
                      onPress={() => void clearAssignmentSubmission(selectedAssignment.id)}
                      style={{ marginTop: spacing.md }}
                    />
                  </>
                ) : (
                  <CuteButton
                    label="과제 제출하기"
                    onPress={() => setSubmitTarget(selectedAssignment)}
                    style={{ marginTop: spacing.md }}
                  />
                )}
                {adminStudyIds.includes(selectedAssignment.studyId) ? (
                  confirmAssignmentDelete ? (
                    <View style={styles.exportBlock}>
                      <Text style={styles.exportLabel}>{assignmentError ?? '이 과제를 삭제할까요?'}</Text>
                      <View style={styles.modalActions}>
                        <CuteButton
                          label="취소"
                          variant="ghost"
                          onPress={() => {
                            setConfirmAssignmentDelete(false);
                            setAssignmentError(null);
                          }}
                          style={{ flex: 1 }}
                        />
                        <CuteButton
                          label="삭제"
                          loading={saving}
                          onPress={async () => {
                            setSaving(true);
                            const message = await deleteAssignment(selectedAssignment.id);
                            setSaving(false);
                            if (message) {
                              setAssignmentError(message);
                              return;
                            }
                            setSelectedAssignment(null);
                            setConfirmAssignmentDelete(false);
                          }}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.modalActions}>
                      <CuteButton
                        label="수정"
                        variant="mint"
                        onPress={() => openEditAssignment(selectedAssignment)}
                        style={{ flex: 1 }}
                      />
                      <CuteButton
                        label="삭제"
                        variant="ghost"
                        onPress={() => setConfirmAssignmentDelete(true)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  )
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <AssignmentFormModal
        visible={assignmentOpen}
        heading={editingAssignmentId ? '과제 수정' : '과제 등록'}
        studies={myStudies
          .filter((study) => study.id === (editingAssignmentId
            ? myAssignments.find((item) => item.id === editingAssignmentId)?.studyId
            : assignmentStudyId))
          .map((study) => ({ id: study.id, name: study.name, emoji: study.emoji }))}
        lockStudy
        initial={(() => {
          const current = editingAssignmentId
            ? myAssignments.find((item) => item.id === editingAssignmentId)
            : null;
          return {
            studyId: current?.studyId ?? assignmentStudyId,
            title: current?.title ?? '',
            dueDate: current?.dueDate ?? selectedYmd,
            description: current?.description ?? '',
            submitMode: current?.submitMode ?? 'memo',
          };
        })()}
        onClose={() => {
          setAssignmentOpen(false);
          setEditingAssignmentId(null);
        }}
        onSubmit={(draft) =>
          editingAssignmentId ? updateAssignment(editingAssignmentId, draft) : addAssignment(draft)
        }
      />
      <AssignmentSubmitModal
        visible={!!submitTarget}
        assignment={submitTarget}
        onClose={() => setSubmitTarget(null)}
        onSubmit={(input) =>
          submitTarget ? submitAssignment(submitTarget.id, input) : Promise.resolve('과제를 찾을 수 없어요.')
        }
      />
    </SoftBackground>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  topRegisterBtn: {
    marginBottom: spacing.md,
    minHeight: 48,
  },
  kindToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  kindToggleBtn: {
    flex: 1,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingVertical: 10,
    alignItems: 'center',
  },
  kindToggleOn: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.mint,
  },
  kindToggleText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  kindToggleTextOn: {
    color: colors.ink,
  },
  studyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  studyChip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  studyChipOn: {
    backgroundColor: colors.peach,
    borderColor: '#E06A48',
  },
  studyChipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  studyChipTextOn: {
    color: colors.white,
  },
  assignmentBody: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modeLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  modeHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  toggleBtnActive: {
    backgroundColor: colors.peach,
  },
  toggleText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  toggleTextActive: {
    color: colors.white,
  },
  emptyBox: {
    marginBottom: spacing.md,
  },
  empty: {
    fontFamily: fonts.bold,
    color: colors.ink,
    marginBottom: 4,
  },
  emptyHint: {
    fontFamily: fonts.medium,
    color: colors.inkMuted,
    fontSize: 13,
  },
  groupCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  groupAccent: {
    width: 6,
  },
  groupBody: {
    flex: 1,
    padding: spacing.md,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.ink,
  },
  groupMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 4,
  },
  kindLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: 6,
    marginTop: 4,
  },
  kindChip: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.peach,
    backgroundColor: colors.peachSoft,
    borderRadius: radii.pill,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  listSection: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  listEmpty: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    padding: spacing.sm,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  itemTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  itemMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 3,
  },
  itemActionHint: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.peach,
    marginTop: 8,
  },
  detailTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
  },
  detailMeta: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  exportBlock: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  exportLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  exportHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  exportMessage: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.mint,
    marginTop: spacing.sm,
  },
  calCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  calHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  calMonth: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.inkMuted,
    paddingVertical: 6,
  },
  weekLabelSun: {
    color: KR_CAL_SUN,
  },
  weekLabelSat: {
    color: KR_CAL_SAT,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingHorizontal: 1,
    borderRadius: radii.sm,
  },
  dayCellSelected: {
    backgroundColor: colors.peachSoft,
  },
  dayCellToday: {
    backgroundColor: colors.mintSoft,
  },
  dayNum: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  dayNumSun: {
    color: KR_CAL_SUN,
  },
  dayNumSat: {
    color: KR_CAL_SAT,
  },
  dayNumSelected: {
    color: colors.peach,
  },
  dayNumToday: {
    color: colors.mint,
  },
  holidayChip: {
    fontFamily: fonts.medium,
    fontSize: 8,
    lineHeight: 10,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 1,
    maxWidth: '100%',
  },
  holidayChipRed: {
    color: KR_CAL_SUN,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    minHeight: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayDetail: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  dayDetailTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  calItemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(47,42,40,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    maxHeight: '92%',
  },
  modalScroll: {
    paddingBottom: spacing.sm,
  },
  detailTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  detailTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    flexShrink: 1,
  },
  calBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.peach,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E06A48',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  calBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  modalTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
  },
  modalHint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  error: {
    fontFamily: fonts.bold,
    color: '#D6453D',
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});

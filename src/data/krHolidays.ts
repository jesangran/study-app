/**
 * 한국 공휴일 · 국경일 (프로토타입용 정적 데이터)
 * - 양력 고정일 + 설·부처님오신날·추석(연도별)
 * - 주요 대체공휴일 포함 (2024~2032)
 */

export type KrHolidayKind = 'national' | 'public' | 'substitute';

export type KrHoliday = {
  name: string;
  kind: KrHolidayKind;
};

const FIXED_SOLAR: Array<{ month: number; day: number; name: string; kind: KrHolidayKind }> = [
  { month: 1, day: 1, name: '신정', kind: 'public' },
  { month: 3, day: 1, name: '삼일절', kind: 'national' },
  { month: 5, day: 5, name: '어린이날', kind: 'public' },
  { month: 6, day: 6, name: '현충일', kind: 'public' },
  { month: 7, day: 17, name: '제헌절', kind: 'national' },
  { month: 8, day: 15, name: '광복절', kind: 'national' },
  { month: 10, day: 3, name: '개천절', kind: 'national' },
  { month: 10, day: 9, name: '한글날', kind: 'national' },
  { month: 12, day: 25, name: '성탄절', kind: 'public' },
];

/** 음력 명절 중심일 (YYYY-MM-DD) — 설·추석·부처님오신날 */
const LUNAR_CENTER: Record<
  number,
  { seol: string; buddha: string; chuseok: string }
> = {
  2024: { seol: '2024-02-10', buddha: '2024-05-15', chuseok: '2024-09-17' },
  2025: { seol: '2025-01-29', buddha: '2025-05-05', chuseok: '2025-10-06' },
  2026: { seol: '2026-02-17', buddha: '2026-05-24', chuseok: '2026-09-25' },
  2027: { seol: '2027-02-06', buddha: '2027-05-13', chuseok: '2027-09-15' },
  2028: { seol: '2028-01-26', buddha: '2028-05-02', chuseok: '2028-10-03' },
  2029: { seol: '2029-02-13', buddha: '2029-05-20', chuseok: '2029-09-22' },
  2030: { seol: '2030-02-03', buddha: '2030-05-09', chuseok: '2030-09-12' },
  2031: { seol: '2031-01-23', buddha: '2031-05-28', chuseok: '2031-10-01' },
  2032: { seol: '2032-02-11', buddha: '2032-05-16', chuseok: '2032-09-19' },
};

/** 연도별 대체공휴일 (알려진 일정) */
const SUBSTITUTES: Record<number, Array<{ ymd: string; name: string }>> = {
  2024: [
    { ymd: '2024-02-12', name: '설날 대체공휴일' },
    { ymd: '2024-05-06', name: '어린이날 대체공휴일' },
  ],
  2025: [
    { ymd: '2025-03-03', name: '삼일절 대체공휴일' },
    { ymd: '2025-05-06', name: '어린이날 대체공휴일' },
    { ymd: '2025-10-08', name: '추석 대체공휴일' },
  ],
  2026: [
    { ymd: '2026-05-25', name: '부처님오신날 대체공휴일' },
    { ymd: '2026-08-17', name: '광복절 대체공휴일' },
    { ymd: '2026-10-05', name: '개천절 대체공휴일' },
  ],
  2027: [{ ymd: '2027-02-08', name: '설날 대체공휴일' }],
  2028: [
    { ymd: '2028-10-04', name: '개천절 대체공휴일' },
    { ymd: '2028-10-05', name: '추석 대체공휴일' },
  ],
  2029: [{ ymd: '2029-05-07', name: '어린이날 대체공휴일' }],
  2030: [],
  2031: [],
  2032: [],
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toYmd(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shiftYmd(ymd: string, deltaDays: number) {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + deltaDays);
  return toYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function addHoliday(
  map: Map<string, KrHoliday[]>,
  ymd: string,
  holiday: KrHoliday,
) {
  const list = map.get(ymd) ?? [];
  if (!list.some((h) => h.name === holiday.name)) {
    list.push(holiday);
    map.set(ymd, list);
  }
}

const cache = new Map<number, Map<string, KrHoliday[]>>();

/** 해당 연도 공휴일·국경일 맵 (ymd → 목록) */
export function getKrHolidaysForYear(year: number): Map<string, KrHoliday[]> {
  const hit = cache.get(year);
  if (hit) return hit;

  const map = new Map<string, KrHoliday[]>();

  for (const item of FIXED_SOLAR) {
    addHoliday(map, toYmd(year, item.month, item.day), {
      name: item.name,
      kind: item.kind,
    });
  }

  const lunar = LUNAR_CENTER[year];
  if (lunar) {
    addHoliday(map, shiftYmd(lunar.seol, -1), { name: '설날 연휴', kind: 'public' });
    addHoliday(map, lunar.seol, { name: '설날', kind: 'public' });
    addHoliday(map, shiftYmd(lunar.seol, 1), { name: '설날 연휴', kind: 'public' });

    addHoliday(map, lunar.buddha, { name: '부처님오신날', kind: 'public' });

    addHoliday(map, shiftYmd(lunar.chuseok, -1), { name: '추석 연휴', kind: 'public' });
    addHoliday(map, lunar.chuseok, { name: '추석', kind: 'public' });
    addHoliday(map, shiftYmd(lunar.chuseok, 1), { name: '추석 연휴', kind: 'public' });
  }

  for (const sub of SUBSTITUTES[year] ?? []) {
    addHoliday(map, sub.ymd, { name: sub.name, kind: 'substitute' });
  }

  cache.set(year, map);
  return map;
}

export function getKrHolidaysOn(ymd: string): KrHoliday[] {
  const year = Number(ymd.slice(0, 4));
  if (!Number.isFinite(year)) return [];
  return getKrHolidaysForYear(year).get(ymd) ?? [];
}

/** 일요일·공휴일·국경일 → 붉은 날짜 */
export function isKrRedDay(ymd: string, weekday: number) {
  if (weekday === 0) return true;
  return getKrHolidaysOn(ymd).length > 0;
}

export function isKrBlueDay(ymd: string, weekday: number) {
  if (getKrHolidaysOn(ymd).length > 0) return false;
  return weekday === 6;
}

export function formatKrHolidayLabel(ymd: string) {
  const list = getKrHolidaysOn(ymd);
  if (list.length === 0) return '';
  return list.map((h) => h.name).join(' · ');
}

export const KR_CAL_SUN = '#E53935';
export const KR_CAL_SAT = '#1E88E5';

import { Linking } from 'react-native';

import { PlaceType, ScheduleItem } from '@/src/data/mock';

export function normalizeScheduleItem(raw: Partial<ScheduleItem> & { place?: string }): ScheduleItem {
  const place = (raw.place ?? '').trim();
  const placeType: PlaceType =
    raw.placeType ??
    (/온라인|zoom|meet|discord|google\s*meet/i.test(place) ? 'online' : 'offline');

  if (placeType === 'online') {
    return {
      id: raw.id ?? `sch_${Date.now()}`,
      studyId: raw.studyId ?? '',
      title: raw.title ?? '',
      date: raw.date ?? '',
      time: raw.time ?? '',
      placeType: 'online',
      place: place.replace(/^온라인\s*/i, '').trim() || place || '온라인',
    };
  }

  return {
    id: raw.id ?? `sch_${Date.now()}`,
    studyId: raw.studyId ?? '',
    title: raw.title ?? '',
    date: raw.date ?? '',
    time: raw.time ?? '',
    placeType: 'offline',
    place: place || '오프라인',
    address: raw.address?.trim() || undefined,
    mapx: raw.mapx,
    mapy: raw.mapy,
  };
}

export function formatPlaceLabel(item: Pick<ScheduleItem, 'placeType' | 'place' | 'address'>) {
  if (item.placeType === 'online') {
    return `온라인 · ${item.place}`;
  }
  if (item.address) {
    return `${item.place} · ${item.address}`;
  }
  return item.place;
}

export function naverMapSearchUrl(query: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`;
}

export async function openInNaverMap(query: string) {
  const url = naverMapSearchUrl(query);
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
    return;
  }
  await Linking.openURL(url);
}

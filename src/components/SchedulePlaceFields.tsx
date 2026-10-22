import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CuteButton } from '@/src/components/CuteButton';
import { CuteInput } from '@/src/components/CuteInput';
import { NaverPlaceResult, hasNaverMapKeys, searchNaverPlaces } from '@/src/maps/naverPlaceSearch';
import { PlaceType } from '@/src/data/mock';
import { openInNaverMap } from '@/src/utils/schedulePlace';
import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

export type PlaceFormValue = {
  placeType: PlaceType;
  place: string;
  address?: string;
  mapx?: string;
  mapy?: string;
};

type Props = {
  value: PlaceFormValue;
  onChange: (next: PlaceFormValue) => void;
};

export function SchedulePlaceFields({ value, onChange }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NaverPlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hint, setHint] = useState<string | null>(
    hasNaverMapKeys()
      ? null
      : '지금은 데모 검색이에요. .env에 네이버 지도/검색 API 키를 넣으면 실제 주소가 붙어요.',
  );

  const setType = (placeType: PlaceType) => {
    onChange({
      placeType,
      place: '',
      address: undefined,
      mapx: undefined,
      mapy: undefined,
    });
    setResults([]);
    setQuery('');
  };

  const onSearch = async () => {
    setSearching(true);
    setHint(null);
    try {
      const outcome = await searchNaverPlaces(query);
      setResults(outcome.items);
      if (outcome.message) setHint(outcome.message);
    } finally {
      setSearching(false);
    }
  };

  const pick = (item: NaverPlaceResult) => {
    onChange({
      placeType: 'offline',
      place: item.title,
      address: item.roadAddress || item.address,
      mapx: item.mapx,
      mapy: item.mapy,
    });
    setResults([]);
    setQuery(item.title);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>장소 유형</Text>
      <View style={styles.typeRow}>
        <Pressable
          onPress={() => setType('online')}
          style={[styles.typeBtn, value.placeType === 'online' && styles.typeBtnActiveOnline]}
        >
          <Ionicons
            name="videocam"
            size={16}
            color={value.placeType === 'online' ? colors.white : colors.inkMuted}
          />
          <Text
            style={[styles.typeText, value.placeType === 'online' && styles.typeTextActive]}
          >
            온라인
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType('offline')}
          style={[styles.typeBtn, value.placeType === 'offline' && styles.typeBtnActiveOffline]}
        >
          <Ionicons
            name="location"
            size={16}
            color={value.placeType === 'offline' ? colors.white : colors.inkMuted}
          />
          <Text
            style={[styles.typeText, value.placeType === 'offline' && styles.typeTextActive]}
          >
            오프라인
          </Text>
        </Pressable>
      </View>

      {value.placeType === 'online' ? (
        <CuteInput
          label="온라인 장소"
          value={value.place}
          onChangeText={(place) => onChange({ ...value, place })}
          placeholder="예: Zoom / Google Meet / Discord"
        />
      ) : (
        <>
          <CuteInput
            label="장소명 (선택)"
            value={value.place}
            onChangeText={(place) => onChange({ ...value, place })}
            placeholder="예: 스터디룸 A"
          />

          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <CuteInput
                label="주소 검색 (네이버 지도)"
                value={query}
                onChangeText={setQuery}
                placeholder="주소 또는 상호명 검색"
                onSubmitEditing={onSearch}
                style={{ marginBottom: 0 }}
              />
            </View>
            <CuteButton
              label="검색"
              onPress={onSearch}
              loading={searching}
              style={styles.searchBtn}
            />
          </View>

          {hint ? <Text style={styles.hint}>{hint}</Text> : null}

          {searching ? (
            <ActivityIndicator color={colors.mint} style={{ marginVertical: spacing.sm }} />
          ) : null}

          {results.map((item, idx) => (
            <Pressable
              key={`${item.title}-${item.address}-${idx}`}
              onPress={() => pick(item)}
              style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultAddr}>{item.roadAddress || item.address}</Text>
              <Text style={styles.resultSource}>
                {item.source === 'demo' ? '데모' : '네이버'}
              </Text>
            </Pressable>
          ))}

          {value.address ? (
            <View style={styles.selectedBox}>
              <Text style={styles.selectedLabel}>선택된 주소</Text>
              <Text style={styles.selectedAddr}>{value.address}</Text>
              <Pressable
                onPress={() => openInNaverMap(value.address || value.place)}
                style={styles.mapLink}
              >
                <Ionicons name="map" size={14} color={colors.sky} />
                <Text style={styles.mapLinkText}>네이버 지도에서 보기</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.hint}>검색 결과에서 주소를 고르거나, 아래에서 직접 입력해요.</Text>
          )}

          <CuteInput
            label="주소 직접 입력"
            value={value.address ?? ''}
            onChangeText={(address) =>
              onChange({
                ...value,
                address,
                mapx: undefined,
                mapy: undefined,
              })
            }
            placeholder="도로명 주소를 입력해도 돼요"
          />
        </>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  typeBtnActiveOnline: {
    backgroundColor: colors.sky,
    borderColor: colors.sky,
  },
  typeBtnActiveOffline: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  typeText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  typeTextActive: {
    color: colors.white,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: spacing.sm,
  },
  searchBtn: {
    minHeight: 52,
    paddingHorizontal: 18,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    marginBottom: 8,
  },
  resultTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  resultAddr: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 3,
  },
  resultSource: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.peach,
    marginTop: 4,
  },
  selectedBox: {
    backgroundColor: colors.mintSoft,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  selectedLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.mint,
  },
  selectedAddr: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    marginTop: 4,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  mapLinkText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.sky,
  },
});

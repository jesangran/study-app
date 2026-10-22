import { useFocusEffect, useNavigation } from 'expo-router';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppColors } from '@/src/theme';
import { fonts, radii, spacing, useColors, useThemedStyles } from '@/src/theme';

type UnsavedContextValue = {
  isDirty: () => boolean;
  /** true면 이동, false면 현재 화면에 남음 */
  confirmLeave: () => Promise<boolean>;
  setDirty: (id: string, dirty: boolean) => void;
  /** 방금 떠나기로 한 이동 한 번만 beforeRemove가 다시 막지 않게 함 */
  allowNextLeave: () => void;
  consumeLeave: () => boolean;
};

const UnsavedContext = createContext<UnsavedContextValue | null>(null);

export function UnsavedProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const dirtyIds = useRef(new Set<string>());
  const pending = useRef<Promise<boolean> | null>(null);
  const allowLeaveRef = useRef(false);
  const [ask, setAsk] = useState<((leave: boolean) => void) | null>(null);

  const isDirty = useCallback(() => dirtyIds.current.size > 0, []);
  const allowNextLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);
  const consumeLeave = useCallback(() => {
    if (!allowLeaveRef.current) return false;
    allowLeaveRef.current = false;
    return true;
  }, []);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyIds.current.add(id);
    else dirtyIds.current.delete(id);
  }, []);

  const confirmLeave = useCallback(() => {
    if (!isDirty()) return Promise.resolve(true);
    if (pending.current) return pending.current;

    const next = new Promise<boolean>((resolve) => {
      setAsk(() => (leave: boolean) => resolve(leave));
    }).finally(() => {
      pending.current = null;
      setAsk(null);
    });

    pending.current = next;
    return next;
  }, [isDirty]);

  const value = useMemo(
    () => ({ isDirty, confirmLeave, setDirty, allowNextLeave, consumeLeave }),
    [isDirty, confirmLeave, setDirty, allowNextLeave, consumeLeave],
  );

  const answer = (leave: boolean) => {
    const resolve = ask;
    setAsk(null);
    resolve?.(leave);
  };

  return (
    <UnsavedContext.Provider value={value}>
      {children}
      <Modal visible={!!ask} transparent animationType="fade" onRequestClose={() => answer(false)}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>저장하지 않은 정보</Text>
            <Text style={styles.body}>
              저장하지 않은 정보가 있어요.{'\n'}
              확인을 누르면 이 화면에 남고, 취소를 누르면 이동합니다.
            </Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => answer(true)}
                style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable
                onPress={() => answer(false)}
                style={({ pressed }) => [styles.btn, styles.okBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.okText}>확인</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </UnsavedContext.Provider>
  );
}

export function useUnsavedGuardContext() {
  const ctx = useContext(UnsavedContext);
  if (!ctx) throw new Error('useUnsavedGuard must be used within UnsavedProvider');
  return ctx;
}

/** 등록·수정 중인 화면에서 호출. 그 화면이 앞에 있을 때만 이동을 막습니다. */
export function useUnsavedGuard(active: boolean) {
  const colors = useColors();
  const styles = useThemedStyles(createStyles);
  const id = useId();
  const navigation = useNavigation();
  const { setDirty, confirmLeave, consumeLeave } = useUnsavedGuardContext();
  const skipping = useRef(false);
  const activeRef = useRef(active);
  const focusedRef = useRef(false);
  activeRef.current = active;

  const publish = useCallback(() => {
    setDirty(id, activeRef.current && focusedRef.current);
  }, [id, setDirty]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      publish();
      return () => {
        focusedRef.current = false;
        setDirty(id, false);
      };
    }, [id, publish, setDirty]),
  );

  useEffect(() => {
    publish();
  }, [active, publish]);

  useEffect(() => {
    const sub = navigation.addListener(
      'beforeRemove',
      (e: {
        preventDefault: () => void;
        data: { action: Parameters<typeof navigation.dispatch>[0] };
      }) => {
        if (!activeRef.current || !focusedRef.current || skipping.current || consumeLeave()) return;
        e.preventDefault();
        void confirmLeave().then((leave) => {
          if (!leave) return;
          skipping.current = true;
          navigation.dispatch(e.data.action);
          skipping.current = false;
        });
      },
    );
    return sub;
  }, [navigation, confirmLeave, consumeLeave]);
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(47, 42, 40, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtn: {
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  okBtn: {
    backgroundColor: colors.peach,
    borderColor: '#E06A48',
  },
  cancelText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  okText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
  },
});

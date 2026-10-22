import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, TextStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUnsavedGuardContext } from '@/src/navigation/UnsavedGuard';
import { fonts, useColors } from '@/src/theme';

function TabLabel({
  label,
  en,
  color,
  focused,
}: {
  label: string;
  en: string;
  color: TextStyle['color'];
  focused: boolean;
}) {
  return (
    <View
      style={{
        marginTop: 2,
        minHeight: 16,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={{
          color,
          fontSize: 12,
          fontFamily: focused ? fonts.bold : fonts.medium,
          fontWeight: focused ? '700' : '600',
          textAlign: 'center',
          lineHeight: Platform.OS === 'web' ? 15 : 14,
          ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
        }}
      >
        {label}
      </Text>
      {en ? (
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          style={{
            color,
            opacity: focused ? 0.85 : 0.7,
            fontSize: 9,
            fontFamily: fonts.medium,
            textAlign: 'center',
            lineHeight: Platform.OS === 'web' ? 12 : 11,
            marginTop: 1,
            ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
          }}
        >
          {en}
        </Text>
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'web' ? 12 : 0);
  const { isDirty, confirmLeave, allowNextLeave, consumeLeave } = useUnsavedGuardContext();
  const colors = useColors();

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          if (!isDirty() || navigation.isFocused()) return;
          e.preventDefault();
          void confirmLeave().then((leave) => {
            if (!leave) return;
            // 화면의 getParent()는 탭이 아니라 루트 스택이라, 그쪽으로 navigate 하면 이동이 버려진다.
            allowNextLeave();
            navigation.dispatch({
              type: 'JUMP_TO',
              payload: { name: route.name },
            });
            consumeLeave();
          });
        },
      })}
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'top',
        tabBarActiveTintColor: colors.peach,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          borderBottomColor: colors.line,
          borderBottomWidth: 1,
          height: 64 + topPad,
          paddingTop: topPad,
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={18} color={color} />,
          tabBarLabel: ({ color, focused }) => (
            <TabLabel label="홈" en="" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '일정',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={18} color={color} />,
          tabBarLabel: ({ color, focused }) => (
            <TabLabel label="일정" en="" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          href: null,
          title: '스터디',
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          href: null,
          title: '출석',
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '통계',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={18} color={color} />,
          tabBarLabel: ({ color, focused }) => (
            <TabLabel label="통계" en="" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={18} color={color} />,
          tabBarLabel: ({ color, focused }) => (
            <TabLabel label="프로필" en="" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          href: null,
          title: '더보기',
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          href: null,
          headerShown: false,
          title: '공지',
        }}
      />
      <Tabs.Screen
        name="account-link"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerShown: false,
          title: '알림함',
        }}
      />
      <Tabs.Screen
        name="studies"
        options={{
          href: null,
          headerShown: false,
          title: '스터디',
        }}
      />
    </Tabs>
  );
}

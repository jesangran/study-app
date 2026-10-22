import { Redirect } from 'expo-router';

import { useApp } from '@/src/store/AppContext';

export default function Index() {
  const { user, joinedStudyIds, ready } = useApp();
  if (!ready) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (joinedStudyIds.length === 0) return <Redirect href="/studies/join" />;
  return <Redirect href="/(tabs)" />;
}

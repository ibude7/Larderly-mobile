import { useMemo } from 'react';
import { View } from 'react-native';
import { YStack } from 'tamagui';
import { HomeGlassHeader } from '../components/home/HomeGlassHeader';
import { HomeGlassHero } from '../components/home/HomeGlassHero';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useAppColors } from '../hooks/useAppColors';

export default function DashboardScreen() {
  const c = useAppColors();
  const { user } = useAuth();
  const { userProfile } = useProfile();

  const firstName =
    userProfile?.firstName || user?.displayName?.split(' ')[0] || 'Guest';

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <YStack flex={1} style={{ backgroundColor: c.surfaceElevated }} testID="home-screen">
      <HomeGlassHeader />
      <HomeGlassHero greeting={greeting} name={firstName} />
      <View style={{ flex: 1 }} />
    </YStack>
  );
}

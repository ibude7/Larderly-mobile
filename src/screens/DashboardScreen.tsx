import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import { useAuth } from '../contexts/AuthContext';
import type { TabScreenNavigationProp } from '../navigation/types';

export default function DashboardScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const { signOut } = useAuth();

  return (
    <FeaturePlaceholderShell
      eyebrow="Home"
      title="Dashboard "
      titleAccent="coming soon"
      subcopy="Your kitchen overview will live here. Use the shortcuts below to preview other routes."
      variant="tab"
      actions={[
        { label: 'Search', onPress: () => navigation.navigate('Search') },
        { label: 'Settings', onPress: () => navigation.navigate('Settings') },
        { label: 'Achievements', onPress: () => navigation.navigate('Achievements') },
        { label: 'Notifications', onPress: () => navigation.navigate('Notifications') },
        { label: 'Meal planner', onPress: () => navigation.navigate('MealPlanner') },
        { label: 'Join household', onPress: () => navigation.navigate('Join', { code: 'DEMO1234' }) },
        { label: 'Sign out', onPress: () => void signOut(), variant: 'dark' },
      ]}
    />
  );
}

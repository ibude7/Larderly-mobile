import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import type { MainStackNavigationProp } from '../navigation/types';

export default function AchievementsScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();

  return (
    <FeaturePlaceholderShell
      eyebrow="Achievements"
      title="Achievements "
      titleAccent="coming soon"
      subcopy="Streaks, milestones, and household wins will show up here."
      variant="stack"
      onBack={() => navigation.goBack()}
    />
  );
}

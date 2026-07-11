import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import type { MainStackNavigationProp } from '../navigation/types';

export default function RemindersScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();

  return (
    <FeaturePlaceholderShell
      eyebrow="Reminders"
      title="Reminders "
      titleAccent="coming soon"
      subcopy="Custom reminder schedules and snooze controls will return here."
      variant="stack"
      onBack={() => navigation.goBack()}
    />
  );
}

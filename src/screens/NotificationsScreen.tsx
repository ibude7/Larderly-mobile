import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import type { MainStackNavigationProp } from '../navigation/types';

export default function NotificationsScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();

  return (
    <FeaturePlaceholderShell
      eyebrow="Notifications"
      title="Notification center "
      titleAccent="coming soon"
      subcopy="Expiry alerts, household activity, and reminders will be centralized here."
      variant="stack"
      onBack={() => navigation.goBack()}
    />
  );
}

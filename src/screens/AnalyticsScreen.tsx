import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import type { MainStackNavigationProp } from '../navigation/types';

export default function AnalyticsScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();

  return (
    <FeaturePlaceholderShell
      eyebrow="Analytics"
      title="Analytics "
      titleAccent="coming soon"
      subcopy="Waste, spend, and usage trends will be visualized here."
      variant="stack"
      onBack={() => navigation.goBack()}
    />
  );
}

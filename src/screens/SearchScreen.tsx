import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import type { MainStackNavigationProp } from '../navigation/types';

export default function SearchScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();

  return (
    <FeaturePlaceholderShell
      eyebrow="Search"
      title="Global search "
      titleAccent="coming soon"
      subcopy="Search pantry items, lists, recipes, and activity from one place."
      variant="stack"
      onBack={() => navigation.goBack()}
    />
  );
}

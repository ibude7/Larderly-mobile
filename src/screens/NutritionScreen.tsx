import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import type { MainStackNavigationProp } from '../navigation/types';

export default function NutritionScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();

  return (
    <FeaturePlaceholderShell
      eyebrow="Nutrition"
      title="Nutrition "
      titleAccent="coming soon"
      subcopy="Macros, dietary goals, and pantry nutrition insights will live here."
      variant="stack"
      onBack={() => navigation.goBack()}
    />
  );
}

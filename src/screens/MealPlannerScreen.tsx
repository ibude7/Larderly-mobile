import { useNavigation } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import type { MainStackNavigationProp } from '../navigation/types';

export default function MealPlannerScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();

  return (
    <FeaturePlaceholderShell
      eyebrow="Meal planner"
      title="AI meal planner "
      titleAccent="coming soon"
      subcopy="Weekly plans and recipe suggestions will be rebuilt here."
      variant="stack"
      onBack={() => navigation.goBack()}
    />
  );
}

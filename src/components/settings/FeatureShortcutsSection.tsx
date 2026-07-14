import { View } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import { Bell, Calendar, Clock, Star, TrendingDown, UtensilsCrossed } from '../ui/Glyph';
import type { MainStackNavigationProp } from '../../navigation/types';
import { useScale } from '../../theme/scale';
import { SettingsRow } from './SettingsRow';
import { SettingsRowGroup } from './SettingsRowGroup';

export function FeatureShortcutsSection() {
  const { s } = useScale();
  const navigation = useNavigation<MainStackNavigationProp>();

  const links = [
    { title: 'Notifications', subtitle: 'Alerts and activity', Icon: Bell, route: 'Notifications' as const },
    { title: 'Reminders', subtitle: 'Custom schedules', Icon: Clock, route: 'Reminders' as const },
    { title: 'Nutrition', subtitle: 'Dietary insights', Icon: UtensilsCrossed, route: 'Nutrition' as const },
    { title: 'Analytics', subtitle: 'Usage trends', Icon: TrendingDown, route: 'Analytics' as const },
    { title: 'Meal planner', subtitle: 'Weekly plans', Icon: Calendar, route: 'MealPlanner' as const },
    { title: 'Achievements', subtitle: 'Streaks and badges', Icon: Star, route: 'Achievements' as const },
  ];

  return (
    <View style={{ gap: s(8) }}>
      <SettingsRowGroup>
        {links.map((link) => (
          <SettingsRow
            key={link.route}
            icon={link.Icon}
            label={link.title}
            subtitle={link.subtitle}
            onPress={() => navigation.navigate(link.route)}
          />
        ))}
      </SettingsRowGroup>
    </View>
  );
}

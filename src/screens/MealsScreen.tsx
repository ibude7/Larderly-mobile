import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { TabScreenNavigationProp } from '../navigation/types';
import AppHeader from '../components/layout/AppHeader';
import MealPlanner from '../components/meals/MealPlanner';
import { useMealPlansStore } from '../contexts/MealPlansContext';
import { usePantryStore } from '../contexts/PantryContext';

export default function MealsScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const { meals, loading, addMeal, deleteMeal } = useMealPlansStore();
  const { items, addShoppingItem } = usePantryStore();

  return (
    <View className="flex-1 bg-canvas dark:bg-[#0F0F13]">
      <AppHeader onOpenSettings={() => navigation.navigate('Settings')} />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <MealPlanner
          meals={meals}
          loading={loading}
          pantryItems={items}
          onAdd={addMeal}
          onDelete={deleteMeal}
          onAddToShoppingList={addShoppingItem}
        />
      </ScrollView>
    </View>
  );
}

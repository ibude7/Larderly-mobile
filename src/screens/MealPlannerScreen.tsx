import { View, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/layout/AppHeader';
import MealPlanner from '../components/meals/MealPlanner';
import { useMealPlansStore } from '../contexts/MealPlansContext';
import { usePantryStore } from '../contexts/PantryContext';

export default function MealPlannerScreen() {
  const navigation = useNavigation<any>();
  const { meals, loading, addMeal, deleteMeal } = useMealPlansStore();
  const { items, addShoppingItem } = usePantryStore();

  return (
    <View className="flex-1 bg-canvas">
      <AppHeader title="Meal planner" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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

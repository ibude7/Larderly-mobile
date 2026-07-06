import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import type { Recipe } from '../../lib/recipes';

interface RecipeCardProps {
  recipe: Recipe;
  availableCount: number;
  totalIngredients: number;
  favorite?: boolean;
  risky?: boolean;
  rating: number;
  views: number;
  onPress: () => void;
  onFavorite: () => void;
  onCook: () => void;
}

function availabilityTone(ratio: number) {
  if (ratio >= 0.8) return { bg: 'rgba(85, 194, 138, 0.18)', text: '#55C28A' };
  if (ratio >= 0.5) return { bg: 'rgba(245, 158, 11, 0.18)', text: '#F59E0B' };
  return { bg: 'rgba(255, 106, 97, 0.18)', text: '#FF6A61' };
}

function RecipeCard({
  recipe,
  availableCount,
  totalIngredients,
  favorite,
  risky,
  rating,
  views,
  onPress,
  onFavorite,
  onCook,
}: RecipeCardProps) {
  const c = useAppColors();
  const ratio = totalIngredients > 0 ? availableCount / totalIngredients : 0;
  const tone = availabilityTone(ratio);
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-card border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21]"
    >
      <LinearGradient
        colors={[c.primary, c.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18, minHeight: 132, justifyContent: 'space-between' }}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-black text-white">{recipe.title}</Text>
            <Text className="mt-2 text-sm font-semibold text-white/80" numberOfLines={2}>
              {recipe.description || `${recipe.cuisine} ${recipe.mealType}`}
            </Text>
          </View>
          <Pressable
            onPress={onFavorite}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/15"
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Remove favorite' : 'Save favorite'}
          >
            <Icon name="star" size={20} color={favorite ? '#FFFFFF' : 'rgba(255,255,255,0.72)'} />
          </Pressable>
        </View>
        <View className="mt-4 flex-row flex-wrap items-center gap-2">
          <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: tone.bg }}>
            <Text className="text-xs font-bold" style={{ color: tone.text }}>
              {availableCount} of {totalIngredients} ingredients available
            </Text>
          </View>
          {recipe.source === 'ai' ? (
            <View className="rounded-full bg-white/15 px-3 py-1.5">
              <Text className="text-xs font-bold text-white">AI</Text>
            </View>
          ) : null}
          {risky ? (
            <View className="rounded-full bg-black/20 px-3 py-1.5">
              <Text className="text-xs font-bold text-white">Allergen check</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Icon name="clock" size={16} color={c.muted} />
              <Text className="text-sm font-semibold text-muted dark:text-[#9A948D]">{totalTime} min</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon name="user" size={16} color={c.muted} />
              <Text className="text-sm font-semibold text-muted dark:text-[#9A948D]">{recipe.servings}</Text>
            </View>
            <Text className="text-sm font-semibold text-muted dark:text-[#9A948D]">★ {rating.toFixed(1)}</Text>
          </View>
          {views > 0 ? <Text className="text-xs text-muted dark:text-[#9A948D]">{views} views</Text> : null}
        </View>
        <Button label="Cook this" icon="chef" onPress={onCook} />
      </View>
    </Pressable>
  );
}

export default React.memo(RecipeCard);

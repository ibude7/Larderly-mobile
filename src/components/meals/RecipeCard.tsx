import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import type { Recipe, Cuisine } from '../../lib/recipes';

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

/** Curated fallback photography keyed by cuisine (AI/user recipes without images). */
const CUISINE_IMAGES: Record<Cuisine, string> = {
  italian: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
  american: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  mexican: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
  asian: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  indian: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
  mediterranean: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
  other: 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHx2aWJyYW50JTIwZnJlc2glMjB2ZWdldGFibGVzJTIwaW5ncmVkaWVudHMlMjBjaW5lbWF0aWN8ZW58MHx8fHwxNzgzMzIzNzM2fDA&ixlib=rb-4.1.0&q=85',
};

function availabilityTone(ratio: number) {
  if (ratio >= 0.8) return { bg: 'rgba(26, 224, 173, 0.92)', text: '#04231A' };
  if (ratio >= 0.5) return { bg: 'rgba(255, 214, 0, 0.92)', text: '#231A00' };
  return { bg: 'rgba(255, 77, 121, 0.92)', text: '#FFFFFF' };
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
  const imageUri = recipe.imageUrl || CUISINE_IMAGES[recipe.cuisine] || CUISINE_IMAGES.other;

  return (
    <Pressable
      onPress={onPress}
      testID={`recipe-card-${recipe.id}`}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.985 : 1 }] }]}
      className="mb-5 overflow-hidden rounded-card border border-line dark:border-line-dark bg-surface dark:bg-surface-dark"
    >
      {/* Magazine image hero */}
      <View style={{ height: 200 }}>
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={350}
          recyclingKey={recipe.id}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.78)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top chips + save */}
        <View className="flex-row items-start justify-between p-3">
          <View className="flex-1 flex-row flex-wrap gap-1.5">
            <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: tone.bg }}>
              <Text style={{ fontSize: 11, fontFamily: 'Outfit_700Bold', color: tone.text }}>
                {availableCount}/{totalIngredients} in pantry
              </Text>
            </View>
            {recipe.source === 'ai' ? (
              <View className="flex-row items-center gap-1 rounded-full bg-black/40 px-2.5 py-1.5">
                <Icon name="sparkles" size={11} color="#FFE033" />
                <Text style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#FFFFFF' }}>AI</Text>
              </View>
            ) : null}
            {risky ? (
              <View className="rounded-full bg-black/40 px-2.5 py-1.5">
                <Text style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#FFB4C6' }}>
                  Allergen check
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={onFavorite}
            hitSlop={8}
            testID={`recipe-favorite-${recipe.id}`}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: favorite ? c.primary : 'rgba(0,0,0,0.35)' }}
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Remove favorite' : 'Save favorite'}
          >
            <Icon name="star" size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Editorial title overlay */}
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 14 }}>
          <Text
            style={{ fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}
          >
            {recipe.cuisine} · {recipe.mealType}
          </Text>
          <Text
            numberOfLines={2}
            style={{ marginTop: 3, fontSize: 26, lineHeight: 30, fontFamily: 'Fraunces_700Bold', color: '#FFFFFF' }}
          >
            {recipe.title}
          </Text>
        </View>
      </View>

      {/* Meta + CTA */}
      <View className="gap-4 p-4">
        {recipe.description ? (
          <Text numberOfLines={2} className="text-sm font-medium leading-5 text-muted dark:text-muted-dark">
            {recipe.description}
          </Text>
        ) : null}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <Icon name="clock" size={15} color={c.muted} />
              <Text className="text-sm font-semibold text-muted dark:text-muted-dark">{totalTime} min</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon name="user" size={15} color={c.muted} />
              <Text className="text-sm font-semibold text-muted dark:text-muted-dark">{recipe.servings}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="star" size={14} color={c.amber} />
              <Text className="text-sm font-semibold text-muted dark:text-muted-dark">{rating.toFixed(1)}</Text>
            </View>
          </View>
          {views > 0 ? (
            <Text className="text-xs font-medium text-muted dark:text-muted-dark">{views} views</Text>
          ) : null}
        </View>
        <Button label="Cook this" icon="chef" onPress={onCook} />
      </View>
    </Pressable>
  );
}

export default React.memo(RecipeCard);

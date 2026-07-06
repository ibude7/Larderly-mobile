import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { useHaptics } from '../../hooks/useHaptics';
import { CUISINE_IMAGES } from './RecipeCard';
import type { Recipe } from '../../lib/recipes';

interface RecipeDetailSheetProps {
  recipe: Recipe | null;
  isOpen: boolean;
  favorite?: boolean;
  userRating: number;
  isAvailable: (ingredient: string) => boolean;
  onClose: () => void;
  onFavorite: () => void;
  onRate: (rating: number) => void;
  onCook: () => void;
  onAddMissing: () => void;
  onSaveToCollection: () => void;
}

function MetaChip({ icon, label }: { icon: Parameters<typeof Icon>[0]['name']; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
      <Icon name={icon} size={13} color="#FFFFFF" />
      <Text style={{ fontSize: 12, fontFamily: 'Outfit_600SemiBold', color: '#FFFFFF' }}>{label}</Text>
    </View>
  );
}

export default function RecipeDetailSheet({
  recipe,
  isOpen,
  favorite,
  userRating,
  isAvailable,
  onClose,
  onFavorite,
  onRate,
  onCook,
  onAddMissing,
  onSaveToCollection,
}: RecipeDetailSheetProps) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [mode, setMode] = useState<'overview' | 'cook'>('overview');
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMode('overview');
    setDone(new Set());
    // reset only when a different recipe is opened
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id]);

  const availability = useMemo(
    () => (recipe ? recipe.ingredients.map((ing) => isAvailable(ing)) : []),
    [recipe, isAvailable],
  );

  if (!recipe) return null;

  const imageUri = recipe.imageUrl || CUISINE_IMAGES[recipe.cuisine] || CUISINE_IMAGES.other;
  const availableCount = availability.filter(Boolean).length;
  const missingCount = recipe.ingredients.length - availableCount;
  const totalSteps = recipe.instructions.length;
  const allDone = totalSteps > 0 && done.size === totalSteps;
  const progress = totalSteps > 0 ? done.size / totalSteps : 0;
  const currentStep = recipe.instructions.findIndex((_, i) => !done.has(i));

  const toggleStep = (i: number) => {
    haptics.tap();
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-canvas dark:bg-canvas-dark">
        {/* Hero */}
        <View style={{ height: 320 }}>
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={350} />
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.82)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={{ paddingTop: insets.top + 8 }} className="flex-row items-center justify-between px-4">
            <Pressable
              onPress={onClose}
              testID="recipe-sheet-close"
              className="h-11 w-11 items-center justify-center rounded-full bg-black/40"
              accessibilityRole="button"
              accessibilityLabel="Close recipe"
            >
              <Icon name="close" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={onFavorite}
              testID="recipe-sheet-favorite"
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: favorite ? c.primary : 'rgba(0,0,0,0.4)' }}
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Remove favorite' : 'Save favorite'}
            >
              <Icon name="star" size={19} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18 }}>
            <Text
              style={{ fontSize: 11, fontFamily: 'Outfit_700Bold', letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}
            >
              {recipe.cuisine} · {recipe.mealType} · {recipe.difficulty}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 32, lineHeight: 37, fontFamily: 'Fraunces_700Bold', color: '#FFFFFF' }}>
              {recipe.title}
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <MetaChip icon="clock" label={`${recipe.prepTime + recipe.cookTime} min`} />
              <MetaChip icon="user" label={`Serves ${recipe.servings}`} />
              {recipe.caloriesPerServing ? <MetaChip icon="flame" label={`${recipe.caloriesPerServing} kcal`} /> : null}
            </View>
          </View>
        </View>

        {mode === 'overview' ? (
          <>
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {recipe.description ? (
                <Text className="mb-5 text-[15px] font-medium leading-6 text-muted dark:text-muted-dark">
                  {recipe.description}
                </Text>
              ) : null}

              <View className="mb-3 flex-row items-center justify-between">
                <Text className="font-display text-2xl text-ink dark:text-ink-dark">Ingredients</Text>
                <View
                  className="rounded-full px-3 py-1.5"
                  style={{ backgroundColor: missingCount === 0 ? `${c.teal}26` : `${c.amber}2E` }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'Outfit_700Bold',
                      color: missingCount === 0 ? c.success : '#7A5B00',
                    }}
                  >
                    {availableCount}/{recipe.ingredients.length} in pantry
                  </Text>
                </View>
              </View>

              <View className="gap-2">
                {recipe.ingredients.map((ing, i) => {
                  const have = availability[i];
                  return (
                    <Animated.View
                      key={`${ing}-${i}`}
                      entering={FadeInUp.duration(300).delay(i * 40)}
                      className="flex-row items-center gap-3 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3"
                    >
                      <View
                        className="h-6 w-6 items-center justify-center rounded-full"
                        style={{ backgroundColor: have ? c.teal : c.surfaceMuted }}
                      >
                        <Icon name={have ? 'check' : 'cart'} size={13} color={have ? '#04231A' : c.muted} />
                      </View>
                      <Text className="flex-1 text-[15px] font-medium text-ink dark:text-ink-dark">{ing}</Text>
                      {!have ? (
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
                          Missing
                        </Text>
                      ) : null}
                    </Animated.View>
                  );
                })}
              </View>

              {missingCount > 0 ? (
                <View className="mt-3">
                  <Button
                    label={`Add ${missingCount} missing to list`}
                    icon="cart"
                    variant="secondary"
                    onPress={onAddMissing}
                    full
                  />
                </View>
              ) : null}

              {/* Rating */}
              <Text className="mb-2 mt-7 font-display text-2xl text-ink dark:text-ink-dark">Your rating</Text>
              <View className="flex-row items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => {
                      haptics.tap();
                      onRate(star);
                    }}
                    hitSlop={6}
                    testID={`recipe-rate-${star}`}
                  >
                    <Icon name="star" size={30} color={star <= userRating ? c.amber : c.line} />
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={onSaveToCollection} className="mt-6 self-start">
                <Text className="text-sm font-bold text-primary">+ Save to a collection</Text>
              </Pressable>
            </ScrollView>

            {/* Sticky CTA */}
            <View
              style={{ paddingBottom: insets.bottom + 12 }}
              className="border-t border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark px-5 pt-3"
            >
              <Button label="Start cooking" icon="chef" onPress={() => setMode('cook')} full />
            </View>
          </>
        ) : (
          <>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-display text-2xl text-ink dark:text-ink-dark">Cook mode</Text>
                <Text className="text-sm font-bold text-muted dark:text-muted-dark">
                  {done.size}/{totalSteps} steps
                </Text>
              </View>
              <View className="mb-5 h-2.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                <View className="h-full rounded-full bg-teal" style={{ width: `${progress * 100}%` }} />
              </View>

              <View className="gap-3">
                {recipe.instructions.map((step, i) => {
                  const checked = done.has(i);
                  const isCurrent = i === currentStep;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => toggleStep(i)}
                      testID={`cook-step-${i}`}
                      className={`flex-row gap-3 rounded-3xl border p-4 ${
                        checked
                          ? 'border-teal/40 bg-teal/10'
                          : isCurrent
                            ? 'border-primary bg-surface dark:bg-surface-dark'
                            : 'border-line dark:border-line-dark bg-surface dark:bg-surface-dark'
                      }`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                    >
                      <View
                        className="h-8 w-8 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: checked ? c.teal : isCurrent ? c.primary : c.surfaceMuted,
                        }}
                      >
                        {checked ? (
                          <Icon name="check" size={16} color="#04231A" />
                        ) : (
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: 'Outfit_700Bold',
                              color: isCurrent ? '#FFFFFF' : c.muted,
                            }}
                          >
                            {i + 1}
                          </Text>
                        )}
                      </View>
                      <Text
                        className={`flex-1 text-[15px] leading-6 ${
                          checked
                            ? 'font-medium text-muted line-through dark:text-muted-dark'
                            : 'font-medium text-ink dark:text-ink-dark'
                        }`}
                      >
                        {step}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {allDone ? (
                <Animated.View
                  entering={FadeIn.duration(350)}
                  className="mt-6 items-center rounded-3xl rounded-tr-xl bg-teal p-6"
                >
                  <Text style={{ fontSize: 24, fontFamily: 'Fraunces_700Bold', color: '#04231A' }}>
                    Bon appétit!
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 13, fontFamily: 'Outfit_500Medium', color: 'rgba(4,35,26,0.75)' }}>
                    All {totalSteps} steps done — enjoy your {recipe.title}.
                  </Text>
                </Animated.View>
              ) : null}
            </ScrollView>

            <View
              style={{ paddingBottom: insets.bottom + 12 }}
              className="flex-row gap-2 border-t border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark px-5 pt-3"
            >
              <Button label="Overview" variant="secondary" onPress={() => setMode('overview')} />
              <View className="flex-1">
                <Button
                  label={allDone ? 'Finish & mark as cooked' : 'Mark as cooked'}
                  icon="chef"
                  onPress={onCook}
                  full
                />
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

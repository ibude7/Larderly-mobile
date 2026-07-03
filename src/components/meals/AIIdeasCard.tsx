import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { PantryItem, MealPlan, ShoppingListItem } from '../../types';
import { generateIdeas, type AIMealIdea } from '../../lib/mealAI';
import AIRecipeModal from './AIRecipeModal';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Icon } from '../ui/Icon';
import { colors } from '../../theme';

interface AIIdeasCardProps {
  pantryItems: PantryItem[];
  onSaveMeal?: (
    meal: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<{ error: Error | null }>;
  onAddToShoppingList: (
    item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<{ error: Error | null }>;
}

export default function AIIdeasCard({
  pantryItems,
  onSaveMeal,
  onAddToShoppingList,
}: AIIdeasCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [ideas, setIdeas] = useState<AIMealIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<AIMealIdea | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    if (pantryItems.length === 0) {
      setIdeas([]);
      setError('Add a few pantry items first — I need something to work with.');
      setHasRun(true);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setIdeas([]);

    generateIdeas(pantryItems, {
      count: 6,
      allowMissingIngredients: true,
      signal: ctrl.signal,
      onPartial: (partial) => {
        if (!ctrl.signal.aborted) setIdeas(partial);
      },
    })
      .then((final) => {
        if (ctrl.signal.aborted) return;
        setIdeas(final);
        setLoading(false);
        setHasRun(true);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Could not generate suggestions.');
        setLoading(false);
        setHasRun(true);
      });
  }, [pantryItems]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (expanded && !hasRun && !loading && pantryItems.length > 0) {
      run();
    }
  }, [expanded, hasRun, loading, pantryItems.length, run]);

  const showEmpty = hasRun && !loading && ideas.length === 0 && !error;

  return (
    <>
      <View className="mt-6 overflow-hidden rounded-card border border-line bg-surface">
        <Pressable
          onPress={() => setExpanded((e) => !e)}
          className="flex-row items-center gap-3 p-4"
        >
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
            <Icon name="sparkles" size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">
              AI suggestions {loading ? '…' : ''}
            </Text>
            <Text className="text-[15px] font-bold text-ink">What can I make right now?</Text>
          </View>
          {ideas.length > 0 ? (
            <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
              <Text className="text-[10px] font-bold text-primary">{ideas.length} ideas</Text>
            </View>
          ) : null}
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
        </Pressable>

        {expanded ? (
          <View className="border-t border-line p-4">
            <View className="mb-3 flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-xs text-muted">
                Based on {pantryItems.length} pantry{' '}
                {pantryItems.length === 1 ? 'item' : 'items'}. Tap an idea for a full recipe.
              </Text>
              <Button
                label={loading ? 'Thinking…' : 'Regenerate'}
                icon="refresh"
                variant="secondary"
                size="sm"
                onPress={run}
                disabled={loading || pantryItems.length === 0}
                loading={loading}
              />
            </View>

            {error ? (
              <View className="rounded-2xl border border-danger/30 bg-danger/10 p-4">
                <Text className="text-sm font-semibold text-ink">Hmm.</Text>
                <Text className="mt-1 text-sm text-ink/70">{error}</Text>
              </View>
            ) : null}

            {showEmpty ? (
              <View className="rounded-2xl border border-dashed border-line p-6">
                <Text className="text-center text-sm text-muted">
                  No ideas came back. Try regenerating.
                </Text>
              </View>
            ) : null}

            {ideas.length > 0 ? (
              <View className="gap-3">
                {ideas.map((idea, i) => (
                  <IdeaCard key={`${idea.name}-${i}`} idea={idea} onSelect={() => setSelectedIdea(idea)} />
                ))}
              </View>
            ) : null}

            {loading && ideas.length === 0 && !error ? (
              <View className="items-center py-8">
                <LoadingSpinner />
                <Text className="mt-3 text-sm text-muted">Cooking up ideas…</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {selectedIdea ? (
        <AIRecipeModal
          mealName={selectedIdea.name}
          pantryItems={pantryItems}
          initialPartial={selectedIdea}
          onSaveMeal={onSaveMeal}
          onAddToShoppingList={onAddToShoppingList}
          onClose={() => setSelectedIdea(null)}
        />
      ) : null}
    </>
  );
}

function IdeaCard({ idea, onSelect }: { idea: AIMealIdea; onSelect: () => void }) {
  const totalMin = (idea.prepTimeMin ?? 0) + (idea.cookTimeMin ?? 0);
  const missing = idea.ingredients.filter((i) => !i.inPantry).length;
  const coveragePct = Math.round((idea.pantryCoverage ?? 0) * 100);

  return (
    <Pressable
      onPress={onSelect}
      className="rounded-3xl border border-line bg-canvas p-4"
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-primary">
            <Icon name="chef" size={16} color="#FFFFFF" />
          </View>
          <Text numberOfLines={1} className="flex-1 text-sm font-bold text-ink">
            {idea.name}
          </Text>
        </View>
        <View
          className={`rounded-full px-2 py-0.5 ${
            coveragePct >= 80
              ? 'bg-success/10'
              : coveragePct >= 50
                ? 'bg-warning/10'
                : 'bg-primary/10'
          }`}
        >
          <Text
            className={`text-[10px] font-bold ${
              coveragePct >= 80
                ? 'text-success'
                : coveragePct >= 50
                  ? 'text-warning'
                  : 'text-primary'
            }`}
          >
            {coveragePct}%
          </Text>
        </View>
      </View>
      {idea.description ? (
        <Text numberOfLines={2} className="mt-2 text-xs leading-relaxed text-muted">
          {idea.description}
        </Text>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-1.5">
        {totalMin > 0 ? (
          <View className="flex-row items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5">
            <Icon name="clock" size={12} color={colors.muted} />
            <Text className="text-[10px] font-bold text-ink">{totalMin} min</Text>
          </View>
        ) : null}
        <View className="rounded-full bg-success/10 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-success">
            {idea.ingredients.length - missing} in pantry
          </Text>
        </View>
        {missing > 0 ? (
          <View className="rounded-full bg-primary/10 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-primary">{missing} to buy</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet from '../ui/BottomSheet';
import { ShoppingListMeta } from '../../types/household';
import { formatCurrency } from '../../lib/format';
import { usePrefs } from '../../contexts/PreferencesContext';

type ListTab = 'active' | 'history' | 'templates';

interface ListPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeListId: string | null;
  activeLists: ShoppingListMeta[];
  historyLists: ShoppingListMeta[];
  templates: ShoppingListMeta[];
  tab: ListTab;
  onTabChange: (tab: ListTab) => void;
  onSelectList: (id: string, isTemplate: boolean) => void;
}

export default function ListPickerSheet({
  isOpen,
  onClose,
  activeListId,
  activeLists,
  historyLists,
  templates,
  tab,
  onTabChange,
  onSelectList,
}: ListPickerSheetProps) {
  const { prefs } = usePrefs();
  const displayLists = tab === 'active' ? activeLists : tab === 'history' ? historyLists : templates;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Your lists">
      <View className="mb-3 flex-row gap-2">
        {(['active', 'history', 'templates'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => onTabChange(t)}
            className={`rounded-full px-3 py-1.5 capitalize ${tab === t ? 'bg-ink' : 'border border-line'}`}
          >
            <Text className={tab === t ? 'text-xs font-semibold text-white' : 'text-xs text-ink'}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      {displayLists.map((list) => (
        <Pressable
          key={list.id}
          onPress={() => {
            onSelectList(list.id, !!list.isTemplate);
            onClose();
          }}
          className={`mb-2 rounded-xl border px-4 py-3 ${
            list.id === activeListId ? 'border-primary bg-primary/5' : 'border-line'
          }`}
        >
          <Text className="font-semibold text-ink">{list.name}</Text>
          {list.budget ? (
            <Text className="text-xs text-muted">
              Budget {formatCurrency(list.budget, prefs.currency)}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </BottomSheet>
  );
}

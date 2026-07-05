import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Modal from './Modal';
import { Icon } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
}

/**
 * Replaces the web `<select>` with a tappable field that opens a bottom-sheet
 * list of options. Used for category, unit, and storage-location pickers.
 */
export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  title,
}: SelectFieldProps) {
  const c = useAppColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      {label ? (
        <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-field border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] px-3.5 py-3"
      >
        <Text className={selected ? 'text-sm text-ink dark:text-[#F0EEE9]' : 'text-sm text-muted dark:text-[#6B6878]'}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={c.muted} />
      </Pressable>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={title ?? label ?? 'Select'} scroll={false}>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 12 }}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value || '__none'}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex-row items-center justify-between rounded-xl px-4 py-3 ${
                  active ? 'bg-primary/10' : ''
                }`}
              >
                <Text className={`text-base ${active ? 'font-bold text-primary' : 'text-ink dark:text-[#F0EEE9]'}`}>
                  {o.label}
                </Text>
                {active ? <Icon name="check" size={18} color={c.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>
    </View>
  );
}

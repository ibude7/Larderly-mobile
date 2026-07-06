import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { parseStoredDate, formatDateString } from '../../lib/date';
import { Icon } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface DateInputProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function displayDate(iso: string): string {
  const d = parseStoredDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Date field backed by the native date picker. Replaces the web
 * `<input type="date">`. Stores/returns the same YYYY-MM-DD string format the
 * rest of the app expects (via formatDateString), or null when cleared.
 */
export default function DateInput({ value, onChange, placeholder = 'Select date' }: DateInputProps) {
  const c = useAppColors();
  const [show, setShow] = useState(false);
  const current = value ? parseStoredDate(value) : new Date();

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') return;
    if (selected) onChange(formatDateString(selected));
  };

  return (
    <View>
      <Pressable
        onPress={() => setShow(true)}
        className="flex-row items-center justify-between rounded-field border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-3.5 py-3"
      >
        <Text className={value ? 'text-sm text-ink dark:text-ink-dark' : 'text-sm text-muted dark:text-muted-dark'}>
          {value ? displayDate(value) : placeholder}
        </Text>
        <View className="flex-row items-center gap-3">
          {value ? (
            <Pressable onPress={() => onChange(null)} hitSlop={8}>
              <Icon name="close" size={16} color={c.muted} />
            </Pressable>
          ) : null}
          <Icon name="calendar" size={18} color={c.muted} />
        </View>
      </Pressable>

      {show ? (
        <View>
          <DateTimePicker
            value={current}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={handleChange}
            accentColor={c.primary}
          />
          {Platform.OS === 'ios' ? (
            <Pressable onPress={() => setShow(false)} className="items-center py-2">
              <Text className="text-sm font-semibold text-primary">Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

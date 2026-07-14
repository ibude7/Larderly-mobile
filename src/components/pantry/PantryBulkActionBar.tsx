import { Pressable, StyleSheet } from 'react-native';
import { Text, XStack } from 'tamagui';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface PantryBulkActionBarProps {
  count: number;
  countLabel: string;
  consumeLabel: string;
  deleteLabel: string;
  cancelLabel: string;
  onConsume: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function PantryBulkActionBar({
  count,
  countLabel,
  consumeLabel,
  deleteLabel,
  cancelLabel,
  onConsume,
  onDelete,
  onCancel,
}: PantryBulkActionBarProps) {
  const { s, fs } = useScale();
  const c = useAppColors();

  return (
    <SettingsGlass
      elevated
      interactive={false}
      radius={s(22)}
      contentStyle={{
        paddingHorizontal: s(14),
        paddingVertical: s(12),
        gap: s(10),
      }}
    >
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: s(8) }}>
        <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.ink, flex: 1 }]}>
          {countLabel.replace('{{count}}', String(count))}
        </Text>
        <Pressable onPress={onCancel} hitSlop={8} testID="pantry-bulk-cancel">
          <Text style={[settingsType('medium'), { fontSize: fs(13), color: c.muted }]}>
            {cancelLabel}
          </Text>
        </Pressable>
      </XStack>
      <XStack style={{ gap: s(8) }}>
        <Pressable
          onPress={onConsume}
          style={[styles.action, { backgroundColor: c.surfaceMuted, borderRadius: s(999), flex: 1 }]}
          testID="pantry-bulk-consume"
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(13), color: c.ink, textAlign: 'center' }]}>
            {consumeLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          style={[styles.action, { backgroundColor: c.danger, borderRadius: s(999), flex: 1 }]}
          testID="pantry-bulk-delete"
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(13), color: '#FFF', textAlign: 'center' }]}>
            {deleteLabel}
          </Text>
        </Pressable>
      </XStack>
    </SettingsGlass>
  );
}

const styles = StyleSheet.create({
  action: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});

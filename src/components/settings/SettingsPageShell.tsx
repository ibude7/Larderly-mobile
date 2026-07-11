import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

interface SettingsPageShellProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightSlot?: ReactNode;
  children: ReactNode;
}

/** Utility sub-page shell for settings detail screens — theme-aware, no editorial chrome. */
export function SettingsPageShell({ title, subtitle, onBack, rightSlot, children }: SettingsPageShellProps) {
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();

  return (
    <View style={[styles.root, { backgroundColor: c.canvas }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + s(10),
            paddingBottom: s(6),
            paddingHorizontal: s(16),
            minHeight: fsLayout(48),
            borderBottomColor: c.line,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.backBtn,
            {
              width: s(34),
              height: s(34),
              borderRadius: s(17),
              borderColor: c.line,
              backgroundColor: c.surface,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <ChevronLeft size={fs(18)} color={c.ink} strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: s(10) }}>
          <Text
            style={{
              fontSize: fs(17),
              lineHeight: fs(22),
              fontWeight: '600',
              color: c.ink,
              flexShrink: 0,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{ fontSize: fs(12), lineHeight: fs(16), color: c.muted, flexShrink: 0 }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightSlot ?? <View style={{ width: s(34) }} />}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: s(20),
            paddingTop: s(14),
            paddingBottom: insets.bottom + s(32),
            gap: s(20),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

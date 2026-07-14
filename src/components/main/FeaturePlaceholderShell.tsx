import { ReactNode } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthTopBar } from '../auth/AuthTopBar';
import { EditorialHeader } from '../landing/EditorialHeader';
import { GlassButton } from '../landing/GlassButton';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import { AccentProvider } from '../../theme/accent';

export interface PlaceholderAction {
  label: string;
  onPress: () => void;
  variant?: 'dark' | 'light' | 'navbar';
}

interface FeaturePlaceholderShellProps {
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  subcopy?: string;
  /** Tab screens reserve space for the bottom tab bar. */
  variant?: 'tab' | 'stack';
  onBack?: () => void;
  actions?: PlaceholderAction[];
  children?: ReactNode;
}

export function FeaturePlaceholderShell({
  eyebrow = 'Coming soon',
  title,
  titleAccent,
  subcopy = 'This screen is queued for rebuild.',
  variant = 'tab',
  onBack,
  actions,
  children,
}: FeaturePlaceholderShellProps) {
  const insets = useSafeAreaInsets();
  const { s, fsLayout } = useScale();
  const c = useAppColors();
  const contentWidth = s(340);
  const isTab = variant === 'tab';
  const bottomPad = insets.bottom + (isTab ? fsLayout(100) : fsLayout(32));

  return (
    <AccentProvider color={c.primary}>
      <View style={[styles.root, { backgroundColor: c.canvas }]}>
        {!isTab ? <AuthTopBar onBack={onBack} floating /> : null}

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: s(28),
            paddingTop: insets.top + (isTab ? s(24) : fsLayout(72)),
            paddingBottom: bottomPad,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ width: '100%', maxWidth: contentWidth, gap: s(24) }}>
            <EditorialHeader
              eyebrow={eyebrow}
              title={title}
              titleAccent={titleAccent}
              subcopy={subcopy}
              size="auth"
            />

            {children}

            {actions && actions.length > 0 ? (
              <View style={{ gap: s(10) }}>
                {actions.map((action) => (
                  <GlassButton
                    key={action.label}
                    label={action.label}
                    onPress={action.onPress}
                    variant={action.variant ?? 'navbar'}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </AccentProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

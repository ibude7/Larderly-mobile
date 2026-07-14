import type { ComponentType } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { TriangleAlert, PackageMinus } from '../ui/Glyph';
import { SettingsSurface } from '../settings/SettingsSurface';
import { SettingsIconWell } from '../settings/SettingsIconWell';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

interface PantryInsightRailProps {
  lowCount: number;
  expiringCount: number;
  lowLabel: string;
  expiringLabel: string;
  lowDetail: string;
  expiringDetail: string;
  onPressLow: () => void;
  onPressExpiring: () => void;
}

type GlyphIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

/** Compact status cards — Settings hub rhythm for pantry alerts. */
export function PantryInsightRail({
  lowCount,
  expiringCount,
  lowLabel,
  expiringLabel,
  lowDetail,
  expiringDetail,
  onPressLow,
  onPressExpiring,
}: PantryInsightRailProps) {
  const { s } = useScale();
  const c = useAppColors();

  if (lowCount === 0 && expiringCount === 0) return null;

  return (
    <XStack style={{ gap: s(8), marginBottom: s(4) }}>
      {lowCount > 0 ? (
        <InsightCard
          title={lowLabel}
          detail={lowDetail}
          color={c.warning}
          icon={PackageMinus}
          onPress={onPressLow}
        />
      ) : null}
      {expiringCount > 0 ? (
        <InsightCard
          title={expiringLabel}
          detail={expiringDetail}
          color={c.danger}
          icon={TriangleAlert}
          onPress={onPressExpiring}
        />
      ) : null}
    </XStack>
  );
}

function InsightCard({
  title,
  detail,
  color,
  icon: Icon,
  onPress,
}: {
  title: string;
  detail: string;
  color: string;
  icon: GlyphIcon;
  onPress: () => void;
}) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();

  return (
    <Pressable onPress={onPress} style={{ flex: 1, minWidth: 0 }} accessibilityRole="button">
      <SettingsSurface
        elevated
        interactive={false}
        radius={s(16)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(8),
          paddingHorizontal: s(10),
          paddingVertical: s(10),
          minHeight: fsLayout(52),
        }}
      >
        <SettingsIconWell icon={Icon} color={color} size={30} iconSize={15} shape="circle" />
        <YStack style={{ flex: 1, minWidth: 0, gap: 0 }}>
          <Text
            numberOfLines={1}
            style={[settingsType('semibold'), { fontSize: fs(12.5), lineHeight: fs(16), color }]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              settingsType('regular'),
              { fontSize: fs(10.5), lineHeight: fs(13), color: c.muted },
            ]}
          >
            {detail}
          </Text>
        </YStack>
      </SettingsSurface>
    </Pressable>
  );
}

import { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { resolveLocationGlyph } from '../../lib/locationGlyphs';
import { SettingsGlass } from '../settings/SettingsGlass';
import { useScale } from '../../theme/scale';

const STROKE = 2.35;

type LocationIconProps = {
  name: string;
  color?: string | null;
  /** Design px before scale. */
  size?: number;
};

/** Name-aware storage location glyph in a tinted glass well. */
export function LocationIcon({ name, color, size = 36 }: LocationIconProps) {
  const { s } = useScale();
  const dim = s(size);
  const radius = s(Math.max(10, size * 0.33));
  const resolved = useMemo(() => resolveLocationGlyph(name, color), [name, color]);
  const glyphSize = s(Math.round(size * 0.5));

  return (
    <SettingsGlass
      interactive={false}
      elevated={false}
      accent={resolved.color}
      radius={radius}
      style={{ width: dim, height: dim, flexShrink: 0 }}
      contentStyle={{
        width: dim,
        height: dim,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <HugeiconsIcon
        icon={resolved.glyph}
        size={glyphSize}
        color={resolved.color}
        strokeWidth={STROKE}
      />
    </SettingsGlass>
  );
}

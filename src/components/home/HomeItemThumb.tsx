import { Image, View } from 'react-native';
import { Text } from 'tamagui';
import { categoryFromName } from '../../lib/categories';
import { useScale } from '../../theme/scale';
import { useAppColors } from '../../hooks/useAppColors';

/** Soft thumbnail — product image or category emoji fallback. */
export function HomeItemThumb({
  name,
  imageUrl,
  size = 40,
}: {
  name: string;
  imageUrl?: string | null;
  size?: number;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const dim = s(size);
  const radius = s(10);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: dim, height: dim, borderRadius: radius, backgroundColor: c.surfaceMuted }}
      />
    );
  }

  const emoji = categoryFromName(name).emoji;
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        backgroundColor: c.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: fs(size * 0.42) }}>{emoji}</Text>
    </View>
  );
}

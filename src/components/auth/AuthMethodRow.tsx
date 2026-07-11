import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { landing, landingFonts as SF } from '../../theme/landing';
import { useScale } from '../../theme/scale';

export function AuthMethodRow({
  index,
  title,
  detail,
  onPress,
  accentColor,
}: {
  index: string;
  title: string;
  detail: string;
  onPress: () => void;
  accentColor: string;
}) {
  const { s, fs } = useScale();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          gap: s(14),
          paddingVertical: s(14),
          opacity: pressed ? 0.65 : 1,
          borderBottomColor: landing.line,
        },
      ]}
    >
      <Text
        style={[
          styles.index,
          { color: accentColor, fontSize: fs(12), letterSpacing: fs(1) },
        ]}
      >
        {index}
      </Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { fontSize: fs(17), lineHeight: fs(21) }]}>{title}</Text>
        <Text
          style={[
            styles.detail,
            { fontSize: fs(12), lineHeight: fs(17), marginTop: s(3) },
          ]}
        >
          {detail}
        </Text>
      </View>
      <ChevronRight size={fs(19)} color={landing.muted} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  index: {
    fontFamily: SF.bold,
  },
  title: {
    fontFamily: SF.semibold,
    color: landing.ink,
  },
  detail: {
    fontFamily: SF.regular,
    color: landing.muted,
  },
});

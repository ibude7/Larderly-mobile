import { Platform, StyleSheet, Text, View } from 'react-native';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { useAccent } from '../../theme/accent';

interface AuthHeaderProps {
  title: string;
  titleAccent?: string;
  subcopy?: string;
  eyebrow?: string;
}

export function AuthHeader({ title, titleAccent, subcopy, eyebrow }: AuthHeaderProps) {
  const { s, fs } = useScale();
  const accent = useAccent();

  return (
    <View style={[styles.root, { gap: s(6) }]}>
      {eyebrow ? (
        <Text
          style={{
            fontSize: fs(11),
            lineHeight: fs(14),
            fontFamily: SF.semibold,
            fontWeight: Platform.OS === 'ios' ? '600' : undefined,
            letterSpacing: fs(0.6),
            textTransform: 'uppercase',
            color: accent,
          }}
          numberOfLines={1}
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text
        style={{
          fontSize: fs(28),
          lineHeight: fs(34),
          letterSpacing: fs(-0.4),
          fontFamily: SF.serif,
          color: landing.ink,
        }}
        numberOfLines={3}
      >
        {title}
        {titleAccent ? (
          <Text style={{ fontFamily: SF.serifItalic, color: accent }}>{titleAccent}</Text>
        ) : null}
      </Text>
      {subcopy ? (
        <Text
          style={{
            fontSize: fs(14),
            lineHeight: fs(20),
            fontFamily: SF.regular,
            fontWeight: Platform.OS === 'ios' ? '400' : undefined,
            color: landing.body,
            maxWidth: s(300),
          }}
          numberOfLines={3}
        >
          {subcopy}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
});

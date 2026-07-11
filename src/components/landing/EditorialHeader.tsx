import { Platform, StyleSheet, Text, View } from 'react-native';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { useAccent } from '../../theme/accent';

interface EditorialHeaderProps {
  title: string;
  titleAccent?: string;
  subcopy?: string;
  /** Uppercase phase label above the headline. */
  eyebrow?: string;
  size?: 'auth' | 'onboarding';
}

export function EditorialHeader({
  title,
  titleAccent,
  subcopy,
  eyebrow,
  size = 'auth',
}: EditorialHeaderProps) {
  const { s, fs } = useScale();
  const accent = useAccent();
  const isAuth = size === 'auth';

  return (
    <View style={[styles.root, { gap: s(isAuth ? 6 : 5), maxWidth: s(320) }]}>
      {eyebrow ? (
        <Text
          style={{
            fontSize: fs(10),
            lineHeight: fs(13),
            fontFamily: SF.bold,
            fontWeight: Platform.OS === 'ios' ? '700' : undefined,
            letterSpacing: fs(1.2),
            textTransform: 'uppercase',
            color: accent,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {eyebrow}
        </Text>
      ) : null}

      <Text
        style={[
          styles.headline,
          {
            fontSize: fs(isAuth ? 28 : 24),
            lineHeight: fs(isAuth ? 34 : 30),
            letterSpacing: fs(isAuth ? -0.4 : -0.3),
          },
        ]}
        numberOfLines={3}
      >
        {title}
        {titleAccent ? (
          <Text style={[styles.headline, { color: accent }]}>{titleAccent}</Text>
        ) : null}
      </Text>

      {subcopy ? (
        <Text
          style={[
            styles.subcopy,
            {
              fontSize: fs(isAuth ? 14 : 13),
              lineHeight: fs(isAuth ? 20 : 18),
              maxWidth: s(isAuth ? 300 : 280),
            },
          ]}
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
    alignItems: 'center',
    flexShrink: 0,
  },
  headline: {
    fontFamily: SF.serif,
    color: landing.ink,
    textAlign: 'center',
    flexShrink: 0,
  },
  headlineAccent: {
    fontFamily: SF.serif,
  },
  subcopy: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    color: landing.body,
    textAlign: 'center',
    flexShrink: 0,
  },
});

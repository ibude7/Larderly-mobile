import { Platform, StyleSheet, Text, View } from 'react-native';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';

interface AuthNoticeProps {
  title: string;
  body: string;
  tone?: 'success' | 'info';
}

export function AuthNotice({ title, body, tone = 'success' }: AuthNoticeProps) {
  const { s, fs } = useScale();
  const color = tone === 'success' ? landing.success : landing.body;

  return (
    <View
      style={{
        width: '100%',
        gap: s(3),
        paddingVertical: s(2),
        borderLeftWidth: s(2),
        borderLeftColor: color,
        paddingLeft: s(10),
      }}
    >
      <Text
        style={{
          fontSize: fs(13),
          fontFamily: SF.semibold,
          fontWeight: Platform.OS === 'ios' ? '600' : undefined,
          color: landing.ink,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: fs(12),
          lineHeight: fs(17),
          fontFamily: SF.regular,
          fontWeight: Platform.OS === 'ios' ? '400' : undefined,
          color: landing.body,
        }}
      >
        {body}
      </Text>
    </View>
  );
}

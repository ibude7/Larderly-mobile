import { Text } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { FeaturePlaceholderShell } from '../components/main/FeaturePlaceholderShell';
import { useScale } from '../theme/scale';
import { landing, landingFonts as SF } from '../theme/landing';
import type { MainStackNavigationProp, MainStackParamList } from '../navigation/types';

export default function JoinScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();
  const route = useRoute<RouteProp<MainStackParamList, 'Join'>>();
  const { fs } = useScale();
  const code = route.params?.code ?? '';

  return (
    <FeaturePlaceholderShell
      eyebrow="Household"
      title="Join household "
      titleAccent="coming soon"
      subcopy="Invite-code joining will be rebuilt here."
      variant="stack"
      onBack={() => navigation.goBack()}
    >
      {code ? (
        <Text
          style={{
            textAlign: 'center',
            fontSize: fs(13),
            lineHeight: fs(18),
            fontFamily: SF.medium,
            color: landing.muted,
          }}
        >
          Invite code: {code}
        </Text>
      ) : null}
    </FeaturePlaceholderShell>
  );
}

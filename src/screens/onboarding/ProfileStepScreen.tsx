import { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Camera } from '../../components/ui/Glyph';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';
import { pickProfilePhoto, uploadUserAvatar } from '../../lib/avatar';
import { useScale } from '../../theme/scale';
import { landingFonts as SF } from '../../theme/landing';
import { useLandingColors } from '../../hooks/useLandingColors';
import { ONBOARDING_STEP_ACCENT_COLORS } from '../../navigation/onboardingSteps';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

export default function ProfileStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { s, fs } = useScale();
  const lc = useLandingColors();
  const { user } = useAuth();
  const { userProfile, updateUserProfile } = useProfile();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(
    userProfile?.firstName ?? user?.displayName?.split(' ')[0] ?? '',
  );
  const [lastName, setLastName] = useState(
    userProfile?.lastName ?? user?.displayName?.split(' ').slice(1).join(' ') ?? '',
  );
  const [photoUrl, setPhotoUrl] = useState(
    userProfile?.profilePictureUrl ?? user?.photoURL ?? '',
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const accent = ONBOARDING_STEP_ACCENT_COLORS.Profile;
  const photoSize = s(72);
  const badgeSize = s(26);

  const onContinue = async () => {
    setSaving(true);
    const { error } = await updateUserProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(photoUrl ? { profilePictureUrl: photoUrl } : {}),
    });
    setSaving(false);
    if (error) {
      showToast('Could not save', 'error');
      return;
    }
    navigation.navigate('Household');
  };

  const pickPhoto = async () => {
    if (!user) return;
    const uri = await pickProfilePhoto();
    if (!uri) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadUserAvatar(user.uid, uri);
      setPhotoUrl(url);
      showToast('Photo uploaded', 'success');
    } catch {
      showToast('Could not upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <OnboardingShell saving={saving} onContinue={onContinue}>
      <View style={{ gap: s(10) }}>
        <View style={{ alignItems: 'center', gap: s(8) }}>
          <Pressable
            onPress={pickPhoto}
            disabled={uploadingPhoto}
            style={{ position: 'relative' }}
          >
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={{
                  width: photoSize,
                  height: photoSize,
                  borderRadius: photoSize / 2,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: lc.line,
                }}
              />
            ) : (
              <View
                style={{
                  width: photoSize,
                  height: photoSize,
                  borderRadius: photoSize / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(46,43,38,0.06)',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: lc.line,
                }}
              >
                <Text style={{ fontSize: fs(22), fontFamily: SF.medium, color: lc.muted }}>
                  ?
                </Text>
              </View>
            )}
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: lc.canvas,
              }}
            >
              <Camera size={fs(12)} color={'#FFFFFF'} strokeWidth={2.2} />
            </View>
          </Pressable>
          <Text
            style={{
              fontSize: fs(12),
              fontFamily: SF.regular,
              fontWeight: Platform.OS === 'ios' ? '400' : undefined,
              color: lc.muted,
              textAlign: 'center',
            }}
          >
            {uploadingPhoto ? 'Uploading…' : 'Tap photo to change'}
          </Text>
        </View>
        <TextField
          variant="landing"
          label="First name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextField
          variant="landing"
          label="Last name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
    </OnboardingShell>
  );
}

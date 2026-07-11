import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';
import { pickProfilePhoto, uploadUserAvatar } from '../../lib/avatar';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsBodyText } from './SettingsBodyText';
import { SettingsSurface } from './SettingsSurface';
import { SettingsTextField } from './SettingsTextField';
import { SETTINGS_SECTION_COLORS } from './settingsHelpers';

const ACCENT = SETTINGS_SECTION_COLORS.account;

export function ProfileSection() {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const { user } = useAuth();
  const { profile, userProfile, updateProfile, updateUserProfile } = useProfile();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(userProfile?.profilePictureUrl ?? user?.photoURL ?? '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile?.full_name]);

  useEffect(() => {
    setPhotoUrl(userProfile?.profilePictureUrl ?? user?.photoURL ?? '');
  }, [userProfile?.profilePictureUrl, user?.photoURL]);

  const isAnonymous = !!user?.isAnonymous;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await updateProfile({ full_name: fullName });
    if (error) showToast('Failed to update profile', 'error');
    else showToast('Profile updated', 'success');
    setSavingProfile(false);
  };

  return (
    <SettingsSurface accent={ACCENT} contentStyle={{ padding: s(16), gap: s(14) }}>
      <View style={{ alignItems: 'center', gap: s(10) }}>
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{
              width: s(80),
              height: s(80),
              borderRadius: s(40),
              borderWidth: 1,
              borderColor: c.line,
            }}
          />
        ) : (
          <View
            style={{
              width: s(80),
              height: s(80),
              borderRadius: s(40),
              borderWidth: 1,
              borderColor: c.line,
              backgroundColor: c.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={fs(28)} color={c.muted} strokeWidth={2} />
          </View>
        )}
        <SettingsActionButton
          label={uploadingPhoto ? 'Uploading…' : 'Change photo'}
          loading={uploadingPhoto}
          disabled={uploadingPhoto}
          onPress={() => {
            void (async () => {
              if (!user) return;
              const uri = await pickProfilePhoto();
              if (!uri) return;
              setUploadingPhoto(true);
              try {
                const url = await uploadUserAvatar(user.uid, uri);
                const { error } = await updateUserProfile({ profilePictureUrl: url });
                if (error) showToast('Could not save photo', 'error');
                else {
                  setPhotoUrl(url);
                  showToast('Profile photo updated', 'success');
                }
              } catch {
                showToast('Upload failed', 'error');
              } finally {
                setUploadingPhoto(false);
              }
            })();
          }}
        />
      </View>

      <SettingsBodyText>
        {isAnonymous ? 'Guest session — no email on file' : user?.email || 'Signed in'}
      </SettingsBodyText>

      <SettingsTextField
        label="Display name"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your name"
        autoComplete="name"
      />

      <SettingsActionButton
        label={savingProfile ? 'Saving…' : 'Save changes'}
        tone="primary"
        loading={savingProfile}
        disabled={savingProfile || fullName === (profile?.full_name || '')}
        onPress={() => void handleSaveProfile()}
      />
    </SettingsSurface>
  );
}

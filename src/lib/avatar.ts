import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { app } from './firebase';

export async function pickProfilePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}

export async function uploadUserAvatar(uid: string, localUri: string): Promise<string> {
  const storage = getStorage(app);
  const avatarRef = ref(storage, `users/${uid}/avatar`);
  await putFile(avatarRef, localUri, { contentType: 'image/jpeg' });
  return getDownloadURL(avatarRef);
}

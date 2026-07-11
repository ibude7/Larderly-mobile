import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

export type SettingsPermissionState =
  | 'granted'
  | 'limited'
  | 'denied'
  | 'undetermined'
  | 'unavailable';

export type SettingsPermissionKind = 'notifications' | 'camera' | 'photos' | 'speech';

export interface SettingsPermissionSnapshot {
  kind: SettingsPermissionKind;
  state: SettingsPermissionState;
  canAskAgain: boolean;
  canOpenSettings: boolean;
}

interface PermissionLike {
  status?: unknown;
  granted?: boolean;
  canAskAgain?: boolean;
  restricted?: boolean;
  accessPrivileges?: unknown;
  ios?: {
    status?: unknown;
  };
}

const IS_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';

function snapshot(
  kind: SettingsPermissionKind,
  state: SettingsPermissionState,
  canAskAgain = false,
): SettingsPermissionSnapshot {
  return {
    kind,
    state,
    canAskAgain: state !== 'unavailable' && canAskAgain,
    canOpenSettings: IS_NATIVE && state !== 'unavailable',
  };
}

function normalizedStatus(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : '';
}

/**
 * Maps the slightly different Expo permission responses to the states shown by
 * settings UI. `limited` covers selected-photo access and provisional/ephemeral
 * iOS notifications.
 */
export function normalizePermissionState(
  response: PermissionLike | null | undefined,
  kind: SettingsPermissionKind,
): SettingsPermissionSnapshot {
  if (!response) return snapshot(kind, 'unavailable');

  if (response.restricted) {
    return snapshot(kind, 'unavailable');
  }

  if (response.accessPrivileges === 'limited') {
    return snapshot(kind, 'limited', Boolean(response.canAskAgain));
  }

  if (kind === 'notifications' && response.ios?.status !== undefined) {
    const iosStatus = response.ios.status;
    if (
      iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL ||
      normalizedStatus(iosStatus) === 'provisional' ||
      normalizedStatus(iosStatus) === 'ephemeral'
    ) {
      return snapshot(kind, 'limited', Boolean(response.canAskAgain));
    }
    if (
      iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      normalizedStatus(iosStatus) === 'authorized'
    ) {
      return snapshot(kind, 'granted', Boolean(response.canAskAgain));
    }
    if (
      iosStatus === Notifications.IosAuthorizationStatus.NOT_DETERMINED ||
      normalizedStatus(iosStatus) === 'not_determined' ||
      normalizedStatus(iosStatus) === 'notdetermined'
    ) {
      return snapshot(kind, 'undetermined', true);
    }
    if (
      iosStatus === Notifications.IosAuthorizationStatus.DENIED ||
      normalizedStatus(iosStatus) === 'denied'
    ) {
      return snapshot(kind, 'denied', Boolean(response.canAskAgain));
    }
  }

  if (response.granted || normalizedStatus(response.status) === 'granted') {
    return snapshot(kind, 'granted', Boolean(response.canAskAgain));
  }

  const status = normalizedStatus(response.status);
  if (status === 'undetermined' || status === 'not_determined') {
    return snapshot(kind, 'undetermined', true);
  }
  if (status === 'limited') {
    return snapshot(kind, 'limited', Boolean(response.canAskAgain));
  }
  if (status === 'denied' || status === 'blocked') {
    return snapshot(kind, 'denied', Boolean(response.canAskAgain));
  }

  return snapshot(kind, 'unavailable');
}

function unavailable(kind: SettingsPermissionKind): SettingsPermissionSnapshot {
  return snapshot(kind, 'unavailable');
}

export async function getNotificationPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('notifications');
  try {
    return normalizePermissionState(await Notifications.getPermissionsAsync(), 'notifications');
  } catch {
    return unavailable('notifications');
  }
}

export async function requestNotificationPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('notifications');
  try {
    return normalizePermissionState(await Notifications.requestPermissionsAsync(), 'notifications');
  } catch {
    return unavailable('notifications');
  }
}

export async function getCameraPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('camera');
  try {
    if (typeof CameraView.isAvailableAsync === 'function') {
      const available = await CameraView.isAvailableAsync().catch(() => true);
      if (!available) return unavailable('camera');
    }
    return normalizePermissionState(await Camera.getCameraPermissionsAsync(), 'camera');
  } catch {
    return unavailable('camera');
  }
}

export async function requestCameraPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('camera');
  try {
    return normalizePermissionState(await Camera.requestCameraPermissionsAsync(), 'camera');
  } catch {
    return unavailable('camera');
  }
}

export async function getPhotosPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('photos');
  try {
    return normalizePermissionState(
      await ImagePicker.getMediaLibraryPermissionsAsync(false),
      'photos',
    );
  } catch {
    return unavailable('photos');
  }
}

export async function requestPhotosPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('photos');
  try {
    return normalizePermissionState(
      await ImagePicker.requestMediaLibraryPermissionsAsync(false),
      'photos',
    );
  } catch {
    return unavailable('photos');
  }
}

async function speechModule() {
  try {
    const module = await import('expo-speech-recognition');
    return module.ExpoSpeechRecognitionModule;
  } catch {
    return null;
  }
}

export async function getSpeechPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('speech');
  const speech = await speechModule();
  if (!speech) return unavailable('speech');
  try {
    if (!speech.isRecognitionAvailable()) return unavailable('speech');
    return normalizePermissionState(await speech.getPermissionsAsync(), 'speech');
  } catch {
    return unavailable('speech');
  }
}

export async function requestSpeechPermission(): Promise<SettingsPermissionSnapshot> {
  if (!IS_NATIVE) return unavailable('speech');
  const speech = await speechModule();
  if (!speech) return unavailable('speech');
  try {
    if (!speech.isRecognitionAvailable()) return unavailable('speech');
    return normalizePermissionState(await speech.requestPermissionsAsync(), 'speech');
  } catch {
    return unavailable('speech');
  }
}

export const SETTINGS_PERMISSION_GETTERS = {
  notifications: getNotificationPermission,
  camera: getCameraPermission,
  photos: getPhotosPermission,
  speech: getSpeechPermission,
} satisfies Record<SettingsPermissionKind, () => Promise<SettingsPermissionSnapshot>>;

export const SETTINGS_PERMISSION_REQUESTERS = {
  notifications: requestNotificationPermission,
  camera: requestCameraPermission,
  photos: requestPhotosPermission,
  speech: requestSpeechPermission,
} satisfies Record<SettingsPermissionKind, () => Promise<SettingsPermissionSnapshot>>;

export async function getSettingsPermissions(): Promise<
  Record<SettingsPermissionKind, SettingsPermissionSnapshot>
> {
  const [notifications, camera, photos, speech] = await Promise.all([
    getNotificationPermission(),
    getCameraPermission(),
    getPhotosPermission(),
    getSpeechPermission(),
  ]);
  return { notifications, camera, photos, speech };
}

export function canRequestPermission(permission: SettingsPermissionSnapshot): boolean {
  return (
    permission.state !== 'granted' &&
    permission.state !== 'unavailable' &&
    permission.canAskAgain
  );
}

export async function openAppPermissionSettings(): Promise<boolean> {
  if (!IS_NATIVE || typeof Linking.openSettings !== 'function') return false;
  try {
    await Linking.openSettings();
    return true;
  } catch {
    return false;
  }
}

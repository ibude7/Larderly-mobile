const fs = require('fs');
const { withEntitlementsPlist } = require('expo/config-plugins');

// Personal/free Apple Developer teams cannot provision push or Sign in with Apple.
// Strip those entitlements for local device builds; re-enable once on a paid team.
function withoutPaidTeamEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    delete config.modResults['com.apple.developer.applesignin'];
    return config;
  });
}

// react-native-firebase reads its config from these native files, which you
// download from the Firebase console after registering an iOS and an Android
// app (see SETUP.md). They are conditionally referenced so `expo prebuild`
// still works before you've added them — Firebase just won't initialize until
// the matching file is present.
const IOS_GOOGLE_SERVICES = './GoogleService-Info.plist';
const ANDROID_GOOGLE_SERVICES = './google-services.json';

// The iOS URL scheme is the REVERSED_CLIENT_ID from GoogleService-Info.plist.
// Set EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME in .env once you have it so native
// Google Sign-In can complete its redirect. Until then the plugin is added
// without a scheme and Google Sign-In stays disabled.
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

const googleSignInPlugin = googleIosUrlScheme
  ? ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }]
  : '@react-native-google-signin/google-signin';

/** @type {import('@expo/config-types').ExpoConfig} */
module.exports = () => ({
  name: 'Larderly',
  slug: 'larderly',
  scheme: 'larderly',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.larderly.app',
    supportsTablet: true,
    usesAppleSignIn: false,
    googleServicesFile: fs.existsSync(IOS_GOOGLE_SERVICES) ? IOS_GOOGLE_SERVICES : undefined,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.larderly.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#F4F2EE',
    },
    googleServicesFile: fs.existsSync(ANDROID_GOOGLE_SERVICES) ? ANDROID_GOOGLE_SERVICES : undefined,
    edgeToEdgeEnabled: true,
  },
  plugins: [
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    [
      'expo-build-properties',
      {
        // react-native-firebase requires static frameworks on iOS.
        ios: { useFrameworks: 'static' },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#F4F2EE',
      },
    ],
    'expo-font',
    [
      'expo-camera',
      {
        cameraPermission: 'Larderly uses the camera to scan barcodes on your groceries.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Larderly uses your photo library to set profile pictures and scan receipts.',
        cameraPermission: 'Larderly uses the camera to capture profile photos and receipts.',
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Larderly uses the microphone for voice commands when adding items.',
        speechRecognitionPermission: 'Larderly uses speech recognition to turn voice into shopping commands.',
      },
    ],
    googleSignInPlugin,
    withoutPaidTeamEntitlements,
  ],
  extra: {
    // Toggle to skip the auth gate during local UI development.
    bypassAuth: process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true',
  },
});

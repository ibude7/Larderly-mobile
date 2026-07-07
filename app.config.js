const fs = require('fs');
const path = require('path');
const { withDangerousMod, withEntitlementsPlist } = require('expo/config-plugins');

// Personal/free Apple Developer teams cannot provision push or Sign in with Apple.
// Strip those entitlements for local device builds; re-enable once on a paid team.
function withoutPaidTeamEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    delete config.modResults['com.apple.developer.applesignin'];
    return config;
  });
}

function withIosFirebasePodSettings(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');
      const firebasePodSettings = [
        '$RNFirebaseAsStaticFramework = true',
        '',
        "def use_firebase_modular_headers!",
        "  pod 'FirebaseCore', :modular_headers => true",
        "  pod 'FirebaseCoreInternal', :modular_headers => true",
        "  pod 'GoogleUtilities', :modular_headers => true",
        "  pod 'RecaptchaInterop', :modular_headers => true",
        "  pod 'FirebaseAuthInterop', :modular_headers => true",
        "  pod 'FirebaseAppCheckInterop', :modular_headers => true",
        "  pod 'GoogleDataTransport', :modular_headers => true",
        "  pod 'nanopb', :modular_headers => true",
        "  pod 'FirebaseFirestoreInternal', :modular_headers => true",
        "  pod 'FirebaseMessagingInterop', :modular_headers => true",
        'end',
      ].join('\n');
      const crashlyticsSkipHelper = [
        "def skip_crashlytics_when_google_services_missing!(installer)",
        "  [File.join(__dir__, 'Larderly.xcodeproj')]",
        '    .select { |project_path| File.exist?(project_path) }',
        '    .map { |project_path| Xcodeproj::Project.open(project_path) }',
        '    .each do |project|',
        '      project.targets.each do |target|',
        '        target.shell_script_build_phases.each do |phase|',
        "          next unless phase.name&.include?('[RNFB] Crashlytics Configuration')",
        "          next if phase.shell_script.include?('Skipping RNFB Crashlytics Configuration')",
        '',
        "          phase.shell_script = <<-'SCRIPT'",
        'if [[ -f "${PROJECT_DIR}/GoogleService-Info.plist" ]] || [[ -f "${PROJECT_DIR}/../GoogleService-Info.plist" ]] || [[ -f "${PROJECT_DIR}/Larderly/GoogleService-Info.plist" ]] || [[ -n "${GOOGLE_SERVICES_PLIST}" && -f "${GOOGLE_SERVICES_PLIST}" ]]; then',
        '  if [[ ${PODS_ROOT} ]]; then',
        '    echo "info: Exec FirebaseCrashlytics Run from Pods"',
        '    "${PODS_ROOT}/FirebaseCrashlytics/run"',
        '  else',
        '    echo "info: Exec FirebaseCrashlytics Run from framework"',
        '    "${PROJECT_DIR}/FirebaseCrashlytics.framework/run"',
        '  fi',
        'else',
        '  echo "info: Skipping RNFB Crashlytics Configuration because GoogleService-Info.plist is missing"',
        'fi',
        'SCRIPT',
        '        end',
        '      end',
        '      project.save',
        '    end',
        'end',
      ].join('\n');

      podfile = podfile.replace(/\nuse_modular_headers!\n/g, '\n');
      if (!podfile.includes('$RNFirebaseAsStaticFramework = true')) {
        podfile = podfile.replace(/\ntarget /, `\n${firebasePodSettings}\n\ntarget `);
      }
      if (!podfile.includes('def skip_crashlytics_when_google_services_missing!')) {
        podfile = podfile.replace(/\ntarget /, `\n${crashlyticsSkipHelper}\n\ntarget `);
      }
      if (!podfile.includes('  use_firebase_modular_headers!')) {
        podfile = podfile.replace(/(target 'Larderly' do\n)/, '$1  use_firebase_modular_headers!\n');
      }
      if (podfile.includes('post_install do |installer|')) {
        podfile = podfile.replace(
          /\n\s+skip_crashlytics_when_google_services_missing!\(installer\)\n/g,
          '\n'
        );
      }
      if (!podfile.includes('  post_integrate do |installer|')) {
        podfile = podfile.replace(
          /(\n\s+post_install do \|installer\|[\s\S]*?\n\s+end\n)(end\n)/,
          '$1\n  post_integrate do |installer|\n    skip_crashlytics_when_google_services_missing!(installer)\n  end\n$2'
        );
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
}

function withIosFirebaseAppDelegateSettings(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const appDelegatePath = path.join(config.modRequest.platformProjectRoot, 'Larderly', 'AppDelegate.swift');
      let appDelegate = fs.readFileSync(appDelegatePath, 'utf8');
      const firebaseConfigureGuard = [
        'if FirebaseApp.app() == nil {',
        '  if Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {',
        '    FirebaseApp.configure()',
        '  } else {',
        '    NSLog("FirebaseApp.configure() skipped because GoogleService-Info.plist is missing")',
        '  }',
        '}',
      ].join('\n');

      if (!appDelegate.includes('FirebaseApp.configure() skipped because GoogleService-Info.plist is missing')) {
        appDelegate = appDelegate.replace('FirebaseApp.configure()', firebaseConfigureGuard);
      }
      if (!appDelegate.includes('if let packagerURL = RCTBundleURLProvider.sharedSettings().jsBundleURL')) {
        appDelegate = appDelegate.replace(
          'return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")',
          [
            'if let packagerURL = RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry") {',
            '      return packagerURL',
            '    }',
            '    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")',
          ].join('\n    ')
        );
      }

      fs.writeFileSync(appDelegatePath, appDelegate);
      return config;
    },
  ]);
}

// react-native-firebase reads its config from these native files, which you
// download from the Firebase console after registering an iOS and an Android
// app (see SETUP.md). They are conditionally referenced so `expo prebuild`
// still works before you've added them — Firebase just won't initialize until
// the matching file is present.
const IOS_GOOGLE_SERVICES = process.env.GOOGLE_SERVICES_PLIST || './GoogleService-Info.plist';
const ANDROID_GOOGLE_SERVICES = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
const hasIosGoogleServices = fs.existsSync(IOS_GOOGLE_SERVICES);
const hasAndroidGoogleServices = fs.existsSync(ANDROID_GOOGLE_SERVICES);
const hasFirebaseConfig = hasIosGoogleServices || hasAndroidGoogleServices;

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
  runtimeVersion: { policy: 'appVersion' },
  updates: {
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
  },
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.larderly.app',
    buildNumber: '1',
    supportsTablet: true,
    usesAppleSignIn: false,
    googleServicesFile: hasIosGoogleServices ? IOS_GOOGLE_SERVICES : undefined,
    infoPlist: {
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: ['larderly'],
        },
      ],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.larderly.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#F5F4F0',
    },
    googleServicesFile: hasAndroidGoogleServices ? ANDROID_GOOGLE_SERVICES : undefined,
    edgeToEdgeEnabled: true,
  },
  plugins: [
    ...(hasFirebaseConfig
      ? [
          '@react-native-firebase/app',
          '@react-native-firebase/auth',
          '@react-native-firebase/crashlytics',
          '@react-native-firebase/analytics',
        ]
      : []),
    [
      'expo-build-properties',
      {
        // react-native-firebase requires static frameworks on iOS.
        ios: { useFrameworks: 'static' },
      },
    ],
    withIosFirebasePodSettings,
    withIosFirebaseAppDelegateSettings,
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#F5F4F0',
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

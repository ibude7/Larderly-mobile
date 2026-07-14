import { useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LandingLogoMark } from '../components/landing/LandingLogoMark';
import { LandingScrollProgress } from '../components/landing/LandingProgress';
import { GlassButton } from '../components/landing/GlassButton';
import { landingFonts as SF } from '../theme/landing';
import { fitHeroSize } from '../theme/heroFit';
import { useHeroFloat } from '../hooks/useHeroFloat';
import { useLandingColors } from '../hooks/useLandingColors';
import { ForcedColorScheme } from '../theme/ForcedColorScheme';
import { useScale } from '../theme/scale';
import type { AuthStackNavigationProp } from '../navigation/types';
import { StatusBar } from 'expo-status-bar';
import { Theme } from 'tamagui';

const SLIDES = [
  {
    titleBase: 'Welcome to Larderly',
    titleAccent: '',
    copy: 'Your digital pantry, reimagined. Track inventory, plan meals, and shop smarter.',
    image: require('../../assets/onboarding-logo-liquid-v1.png'),
    aspect: 818 / 916,
    heroScale: 0.72,
    heroFirst: true,
  },
  {
    titleBase: 'Everything in your kitchen, ',
    titleAccent: 'organized.',
    copy: 'See what you have, track expiry dates, and never run out of essentials.',
    image: require('../../assets/onboarding-kitchen-3d-front-hard.png'),
    aspect: 1176 / 975,
    heroScale: 1.05,
  },
  {
    titleBase: 'Scan it. ',
    titleAccent: 'Done.',
    copy: 'Add groceries in seconds with barcode and receipt scanning.',
    image: require('../../assets/onboarding-card-2.png'),
    aspect: 623 / 788,
    heroScale: 0.82,
  },
  {
    titleBase: 'Plan meals ',
    titleAccent: 'in seconds.',
    copy: 'Turn what you have into delicious meals your whole family will love.',
    image: require('../../assets/onboarding-meals-3d-clean-hard.png'),
    aspect: 1078 / 950,
    heroScale: 1.05,
  },
  {
    titleBase: 'Shop smarter, ',
    titleAccent: 'waste less.',
    copy: 'Auto-generate shopping lists and reduce food waste every week.',
    image: require('../../assets/onboarding-shop-3d-clean-hard.png'),
    aspect: 1368 / 895,
    heroScale: 1.1,
  },
  {
    titleBase: 'Keep the family ',
    titleAccent: 'in sync.',
    copy: 'Everyone sees the same pantry, lists, and updates — always up to date.',
    image: require('../../assets/onboarding-sync-3d-clean-hard.png'),
    aspect: 1093 / 874,
    heroScale: 1.05,
  },
];

type SlideItem = (typeof SLIDES)[number];

function Slide({
  item,
  index,
  scrollX,
  floatY,
  screenW,
}: {
  item: SlideItem;
  index: number;
  scrollX: SharedValue<number>;
  floatY: SharedValue<number>;
  screenW: number;
}) {
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
  const lc = useLandingColors();
  const [heroBox, setHeroBox] = useState({ width: 0, height: 0 });
  const inputRange = [(index - 1) * screenW, index * screenW, (index + 1) * screenW];
  const heroFirst = 'heroFirst' in item && item.heroFirst;
  const rounded = Boolean('rounded' in item && item.rounded);
  const hasHero = 'image' in item && 'aspect' in item;
  const heroScale = ('heroScale' in item ? item.heroScale : undefined) ?? 1;
  const topBarH = fsLayout(72);
  const footerH = fsLayout(168);
  const maxHeroW = Math.min(screenW * 0.94, s(430)) * heroScale;
  const floatMin = s(3);
  const floatMax = -s(5);
  const textSlide = s(16);
  const fitted = hasHero
    ? fitHeroSize(heroBox.width, heroBox.height, item.aspect, maxHeroW)
    : { width: 0, height: 0 };

  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolation.CLAMP);
    const translateX = interpolate(scrollX.value, inputRange, [screenW * 0.18, 0, -screenW * 0.18]);
    const floatOffset = interpolate(floatY.value, [0, 1], [floatMin, floatMax]);

    return {
      transform: [{ translateX }, { scale }, { translateY: floatOffset }],
      opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.value, inputRange, [textSlide, 0, -textSlide], Extrapolation.CLAMP) },
    ],
  }));

  const onHeroLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== heroBox.width || height !== heroBox.height) {
      setHeroBox({ width, height });
    }
  };

  const copy = (
    <Animated.View
      style={[
        styles.copyBlock,
        {
          maxWidth: s(330),
          marginTop: hasHero ? s(65) : 0,
          marginBottom: hasHero ? s(8) : 0,
        },
        heroFirst && { marginTop: s(20), marginBottom: 0 },
        textStyle,
      ]}
    >
      <Text
        style={[
          styles.headline,
          {
            fontSize: fs(33),
            lineHeight: fs(40),
            marginBottom: s(14),
            color: lc.ink,
          },
        ]}
      >
        {item.titleBase}
        {item.titleAccent ? (
          <Text style={[styles.headlineAccent, { color: lc.accent }]}>{item.titleAccent}</Text>
        ) : null}
      </Text>
      <Text
        style={[
          styles.subhead,
          {
            fontSize: fs(15),
            lineHeight: fs(23),
            maxWidth: s(300),
            color: lc.body,
          },
        ]}
      >
        {item.copy}
      </Text>
    </Animated.View>
  );

  const hero = hasHero ? (
    <View
      style={[styles.heroSection, heroFirst && styles.heroSectionFirst]}
      onLayout={onHeroLayout}
    >
      {fitted.width > 0 ? (
        <Animated.View
          style={[
            {
              width: fitted.width,
              height: fitted.height,
            },
            rounded && { borderRadius: s(28), overflow: 'hidden' },
            imageStyle,
          ]}
        >
          <Image
            source={item.image}
            style={[styles.heroImage, rounded && { borderRadius: s(28) }]}
            contentFit={rounded ? 'cover' : 'contain'}
            transition={250}
          />
        </Animated.View>
      ) : null}
    </View>
  ) : null;

  return (
    <View
      style={[
        styles.slide,
        !hasHero && styles.slideNoHero,
        {
          width: screenW,
          paddingHorizontal: s(24),
          paddingTop: insets.top + topBarH,
          paddingBottom: insets.bottom + footerH,
        },
      ]}
    >
      {heroFirst ? (
        <>
          {hero}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {hero}
        </>
      )}
    </View>
  );
}

export default function LandingScreen() {
  return (
    <ForcedColorScheme scheme="light">
      <Theme name="settings_light">
        <StatusBar style="dark" />
        <LandingScreenContent />
      </Theme>
    </ForcedColorScheme>
  );
}

function LandingScreenContent() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const { width: screenW, s, fs, fsLayout } = useScale();
  const lc = useLandingColors();
  const floatY = useHeroFloat();
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('SignUp');
  };

  const onSignIn = () => {
    Haptics.selectionAsync();
    navigation.navigate('SignIn');
  };

  const onNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.min(currentIndex + 1, SLIDES.length - 1);
    scrollViewRef.current?.scrollTo({ x: next * screenW, animated: true });
    setCurrentIndex(next);
  };

  const handleMomentumScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / screenW));
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: lc.canvas }]}>
      <Animated.View
        entering={FadeInDown.duration(600).springify().damping(18)}
        style={[
          styles.topBar,
          {
            top: insets.top + s(12),
            paddingHorizontal: s(24),
          },
        ]}
      >
        <View style={{ width: s(64) }}>
          <Text
            style={[
              styles.counterText,
              { fontSize: fs(13), letterSpacing: fs(1), color: lc.muted },
            ]}
          >
            {currentIndex + 1} / {SLIDES.length}
          </Text>
        </View>

        <LandingLogoMark size="lg" />

        <Pressable
          onPress={onGetStarted}
          style={[{ width: s(64) }, styles.skipBtn]}
          hitSlop={10}
        >
          <Text style={[styles.skipText, { fontSize: fs(14), color: lc.muted }]}>Skip</Text>
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((item, index) => (
          <Slide
            key={index}
            item={item}
            index={index}
            scrollX={scrollX}
            floatY={floatY}
            screenW={screenW}
          />
        ))}
      </Animated.ScrollView>

      <Animated.View
        entering={FadeInDown.delay(340).duration(620).springify().damping(18)}
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + s(16),
            paddingHorizontal: s(28),
            paddingTop: s(8),
          },
        ]}
      >
        <View style={{ marginBottom: s(18), width: '100%', alignItems: 'center' }}>
          <LandingScrollProgress
            scrollX={scrollX}
            screenW={screenW}
            total={SLIDES.length}
          />
        </View>

        <View style={[styles.ctaWrap, { maxWidth: s(340), minHeight: fsLayout(80) }]}>
          {isLast ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.navControls}>
              <GlassButton
                label="Let's build your pantry"
                variant="dark"
                showArrow
                onPress={onGetStarted}
              />
              <Pressable
                onPress={onSignIn}
                style={[styles.signIn, { marginTop: s(16) }]}
                hitSlop={10}
              >
                <Text style={[styles.signInText, { fontSize: fs(14), color: lc.muted }]}>
                  Already have an account?{' '}
                  <Text style={[styles.signInLink, { color: lc.accent }]}>Sign in</Text>
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={styles.navControls}>
              <GlassButton label="Continue" variant="dark" onPress={onNext} />
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  counterText: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
  skipBtn: {
    alignItems: 'flex-end',
  },
  skipText: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    height: '100%',
    alignItems: 'center',
  },
  slideNoHero: {
    justifyContent: 'center',
  },
  copyBlock: {
    alignItems: 'center',
    width: '100%',
    flexShrink: 0,
  },
  headline: {
    fontFamily: SF.serif,
    textAlign: 'center',
    flexShrink: 0,
  },
  headlineAccent: {
    fontFamily: SF.serif,
  },
  subhead: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    textAlign: 'center',
    flexShrink: 0,
  },
  heroSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    overflow: 'hidden',
  },
  heroSectionFirst: {
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ctaWrap: {
    width: '100%',
  },
  navControls: {
    width: '100%',
  },
  signIn: {
    alignItems: 'center',
  },
  signInText: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
  },
  signInLink: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
});

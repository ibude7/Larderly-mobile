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
import { AppLogoMark } from '../components/ui/AppLogo';
import { LandingScrollProgress } from '../components/landing/LandingProgress';
import { GlassButton } from '../components/landing/GlassButton';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { SettingsIconWell } from '../components/settings/SettingsIconWell';
import { Archive, ChefHat, ShoppingBag, type GlyphIcon } from '../components/ui/Glyph';
import { landingFonts as SF } from '../theme/landing';
import { fitHeroSize } from '../theme/heroFit';
import { useHeroFloat } from '../hooks/useHeroFloat';
import { useLandingColors } from '../hooks/useLandingColors';
import { ForcedColorScheme } from '../theme/ForcedColorScheme';
import { fitScale, useScale } from '../theme/scale';
import type { AuthStackNavigationProp } from '../navigation/types';
import { StatusBar } from 'expo-status-bar';
import { Theme } from 'tamagui';

const SLIDES = [
  {
    titleBase: 'Welcome to Larderly',
    titleAccent: '',
    copy: 'Track every ingredient, plan meals in seconds, and always know what you already have.',
    image: require('../../assets/landing/welcome-pantry-hero.png'),
    aspect: 390 / 370,
    heroScale: 1.05,
    heroFirst: true,
    welcomeHero: true,
  },
  {
    titleBase: 'Everything in your kitchen, ',
    titleAccent: 'organized.',
    copy: 'Larderly helps you see what you have, what\'s running low, and what\'s about to expire-so you can waste less and cook with confidence.',
    image: require('../../assets/landing/slide2-kitchen-chart-glass-front.png'),
    aspect: 1536 / 1024,
    heroScale: 1.06,
    heroFirst: true,
    glassHero: true,
    centerContent: true,
  },
  {
    titleBase: 'Unpack once. ',
    titleAccent: 'Everything\'s logged.',
    copy: 'Scan barcodes as you put groceries away and Larderly builds your pantry for you.',
    image: require('../../assets/onboarding-card-2.png'),
    aspect: 623 / 788,
    heroScale: 0.82,
  },
  {
    titleBase: 'Meals from ',
    titleAccent: 'what you have.',
    copy: 'Larderly suggests recipes from your pantry—so dinner starts with what\'s already home, not another grocery run.',
    image: require('../../assets/onboarding-meals-3d-clean-hard.png'),
    aspect: 1078 / 950,
    heroScale: 1.05,
    centerContent: true,
  },
  {
    titleBase: 'Buy only ',
    titleAccent: 'what you need.',
    copy: 'When something runs low, Larderly adds it to your shopping list—so you stop buying doubles and forgetting the essentials.',
    image: require('../../assets/onboarding-shop-3d-clean-hard.png'),
    aspect: 1368 / 895,
    heroScale: 1.1,
    centerContent: true,
  },
  {
    titleBase: 'Share the kitchen, ',
    titleAccent: 'not the confusion.',
    copy: 'Pantry, shopping lists, and meal plans stay synced for everyone at home—so what one person updates, the whole household sees.',
    image: require('../../assets/landing/slide6-household-sync-dual-v2.png'),
    aspect: 1536 / 1024,
    heroScale: 1.38,
    heroFirst: true,
    centerContent: true,
  },
];

type SlideItem = (typeof SLIDES)[number];

const WELCOME_FEATURES: ReadonlyArray<{
  label: string;
  Icon: GlyphIcon;
}> = [
  { label: 'Pantry Tracking', Icon: Archive },
  { label: 'Meal Planning', Icon: ChefHat },
  { label: 'Smart Shopping', Icon: ShoppingBag },
];

const WELCOME_ITEMS = [
  { kind: 'emoji' as const, emoji: '🍅', label: 'Tomatoes', detail: '3 left', x: 0, rotation: '-3deg' },
  {
    kind: 'reference' as const,
    image: require('../../assets/landing/welcome-basil-reference.png'),
    label: 'Basil',
    detail: 'Fresh',
    x: 126,
    rotation: '-1deg',
  },
  {
    kind: 'reference' as const,
    image: require('../../assets/landing/welcome-red-lentils-reference.png'),
    label: 'Red Lentils',
    detail: '1.2 kg',
    x: 252,
    rotation: '3deg',
  },
] as const;

function WelcomeFeatures() {
  const { s, fs } = useScale();
  const lc = useLandingColors();

  return (
    <View style={[styles.welcomeFeatures, { gap: s(8), marginTop: s(20) }]}>
      {WELCOME_FEATURES.map(({ label, Icon }) => (
        <SettingsGlass
          key={label}
          interactive={false}
          elevated
          radius={s(18)}
          style={styles.welcomeFeature}
          contentStyle={{
            minHeight: s(54),
            paddingHorizontal: s(8),
            paddingVertical: s(8),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: s(7),
          }}
        >
          <SettingsIconWell
            icon={Icon}
            color={lc.accent}
            size={28}
            iconSize={15}
            shape="squircle"
          />
          <Text
            style={[
              styles.welcomeFeatureLabel,
              {
                color: lc.ink,
                fontSize: fs(10.5),
                lineHeight: fs(13),
              },
            ]}
          >
            {label}
          </Text>
        </SettingsGlass>
      ))}
    </View>
  );
}

function WelcomeHeroArtwork({ width, height }: { width: number; height: number }) {
  const scale = fitScale(width, height, 390, 370);
  const artworkW = 390 * scale;
  const artworkH = 370 * scale;
  const radius = 28 * scale;

  return (
    <SettingsGlass
      interactive={false}
      elevated={false}
      radius={radius}
      style={{ width: artworkW, height: artworkH }}
      contentStyle={{ width: artworkW, height: artworkH }}
    >
      <View style={{ width: artworkW, height: artworkH }}>
        <Image
          source={require('../../assets/landing/welcome-pantry-hero.png')}
          style={[
            styles.welcomePantry,
            {
              left: 15 * scale,
              width: 360 * scale,
              height: 360 * scale,
            },
          ]}
          contentFit="contain"
          transition={250}
        />

        {WELCOME_ITEMS.map((item) => (
          <SettingsGlass
            key={item.label}
            interactive={false}
            elevated={false}
            radius={12 * scale}
            style={{
              position: 'absolute',
              left: item.x * scale,
              top: 302 * scale,
              width: 138 * scale,
              transform: [{ rotate: item.rotation }],
            }}
            contentStyle={{
              minHeight: 55 * scale,
              paddingHorizontal: 9 * scale,
              paddingVertical: 8 * scale,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7 * scale,
            }}
          >
            <View
              style={[
                styles.inventoryIcon,
                {
                  width: 34 * scale,
                  height: 34 * scale,
                  borderRadius: 10 * scale,
                },
              ]}
            >
              {item.kind === 'reference' ? (
                <Image
                  source={item.image}
                  style={{
                    width: 34 * scale,
                    height: 34 * scale,
                    borderRadius: 10 * scale,
                  }}
                  contentFit="cover"
                />
              ) : (
                <Text allowFontScaling={false} style={{ fontSize: 20 * scale }}>
                  {item.emoji}
                </Text>
              )}
            </View>
            <View style={styles.inventoryCopy}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[styles.inventoryLabel, { fontSize: 10.5 * scale }]}
              >
                {item.label}
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[
                  styles.inventoryDetail,
                  {
                    fontSize: 9.5 * scale,
                    color: item.detail === 'Fresh' ? '#64884E' : '#B96633',
                  },
                ]}
              >
                {item.detail}
              </Text>
            </View>
          </SettingsGlass>
        ))}
      </View>
    </SettingsGlass>
  );
}

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
  const { s, fs, fsLayout, height: screenH } = useScale();
  const lc = useLandingColors();
  const [heroBox, setHeroBox] = useState({ width: 0, height: 0 });
  const inputRange = [(index - 1) * screenW, index * screenW, (index + 1) * screenW];
  const heroFirst = 'heroFirst' in item && item.heroFirst;
  const centerContent = 'centerContent' in item && item.centerContent;
  const rounded = Boolean('rounded' in item && item.rounded);
  const hasHero = 'image' in item && 'aspect' in item;
  const isWelcomeHero = 'welcomeHero' in item && item.welcomeHero;
  const isGlassHero = 'glassHero' in item && item.glassHero;
  const heroScale = ('heroScale' in item ? item.heroScale : undefined) ?? 1;
  const topBarH = fsLayout(72);
  const footerH = fsLayout(168);
  const slidePadX = centerContent ? s(4) : s(24);
  const floatMin = s(3);
  const floatMax = -s(5);
  const textSlide = s(16);
  // Centered slides size the hero from the true remaining viewport —
  // not the collapsed flex box (which made heroScale changes invisible).
  const copyReserve = centerContent ? fsLayout(118) : 0;
  const availW = screenW - slidePadX * 2;
  const availH = Math.max(
    s(180),
    screenH - insets.top - topBarH - insets.bottom - footerH - copyReserve,
  );
  const maxHeroW = centerContent
    ? availW
    : Math.min(screenW * 0.94, s(430)) * heroScale;
  const heroMeasureH = centerContent ? availH : heroBox.height;
  const heroMeasureW = centerContent ? availW : heroBox.width;
  const fitted = hasHero
    ? fitHeroSize(heroMeasureW, heroMeasureH, item.aspect, maxHeroW)
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
        centerContent && {
          marginTop: heroFirst ? s(14) : s(0),
          marginBottom: heroFirst ? s(0) : s(16),
        },
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
      {isWelcomeHero ? <WelcomeFeatures /> : null}
    </Animated.View>
  );

  const hero = hasHero ? (
    <View
      style={[
        styles.heroSection,
        heroFirst && !centerContent && styles.heroSectionFirst,
        centerContent && styles.heroSectionCentered,
        centerContent && fitted.height > 0 && { height: fitted.height },
      ]}
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
          {isWelcomeHero ? (
            <WelcomeHeroArtwork width={fitted.width} height={fitted.height} />
          ) : isGlassHero ? (
            <SettingsGlass
              interactive={false}
              elevated={false}
              radius={s(28)}
              style={{ width: fitted.width, height: fitted.height }}
              contentStyle={{
                width: fitted.width,
                height: fitted.height,
                overflow: 'hidden',
                borderRadius: s(28),
              }}
            >
              <Image
                source={item.image}
                style={styles.heroImage}
                contentFit="contain"
                transition={250}
              />
            </SettingsGlass>
          ) : (
            <Image
              source={item.image}
              style={[styles.heroImage, rounded && { borderRadius: s(28) }]}
              contentFit={rounded ? 'cover' : 'contain'}
              transition={250}
            />
          )}
        </Animated.View>
      ) : null}
    </View>
  ) : null;

  return (
    <View
      style={[
        styles.slide,
        !hasHero && styles.slideNoHero,
        centerContent && styles.slideCentered,
        {
          width: screenW,
          paddingHorizontal: slidePadX,
          paddingTop: insets.top + topBarH,
          paddingBottom: insets.bottom + footerH,
        },
      ]}
    >
      {centerContent ? (
        <View style={styles.centerCluster}>
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
      ) : heroFirst ? (
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

        <AppLogoMark size="sm" />

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
  slideCentered: {
    justifyContent: 'center',
  },
  centerCluster: {
    width: '100%',
    alignItems: 'center',
    flexShrink: 0,
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
  heroSectionCentered: {
    flexGrow: 0,
    flexShrink: 0,
    flex: 0,
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  welcomePantry: {
    position: 'absolute',
    top: 0,
  },
  inventoryIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F1E7',
    overflow: 'hidden',
  },
  inventoryCopy: {
    flex: 1,
    minWidth: 0,
  },
  inventoryLabel: {
    color: '#3D2A20',
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
  inventoryDetail: {
    marginTop: 2,
    fontFamily: SF.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : undefined,
  },
  welcomeFeatures: {
    width: '100%',
    flexDirection: 'row',
  },
  welcomeFeature: {
    flex: 1,
    minWidth: 0,
  },
  welcomeFeatureLabel: {
    flexShrink: 1,
    fontFamily: SF.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : undefined,
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

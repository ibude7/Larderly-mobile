import { useEffect, useState } from 'react';
import { View, Text, Pressable, Share, Dimensions, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import Animated, { 
  FadeIn, SlideInRight, SlideOutLeft, 
  useSharedValue, useAnimatedStyle, withTiming, 
  withRepeat, withSequence, useAnimatedProps
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import SelectField from '../components/ui/SelectField';
import { Icon, IconName } from '../components/ui/Icon';
import Chip from '../components/ui/Chip';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { categoryFromName, STORAGE_LOCATIONS } from '../lib/categories';
import { searchProductByBarcode } from '../lib/productDb';
import { requestNotificationPermission } from '../lib/push';
import { pickProfilePhoto, uploadUserAvatar } from '../lib/avatar';
import { useAppColors } from '../hooks/useAppColors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const screenWidth = Dimensions.get('window').width;
const TOTAL_STEPS = 8;

const DIET_OPTIONS: { name: string; icon: IconName }[] = [
  { name: 'Vegetarian', icon: 'leaf' },
  { name: 'Vegan', icon: 'leaf' },
  { name: 'Gluten-Free', icon: 'nutrition' },
  { name: 'Keto', icon: 'flame' },
  { name: 'Paleo', icon: 'flame' },
  { name: 'Pescatarian', icon: 'seafood' },
  { name: 'Halal', icon: 'star' },
  { name: 'Kosher', icon: 'star' }
];

const STORES: { name: string; icon: IconName }[] = [
  { name: 'Whole Foods', icon: 'leaf' },
  { name: 'Trader Joe\'s', icon: 'cart' },
  { name: 'Costco', icon: 'warehouse' },
  { name: 'Target', icon: 'location' },
  { name: 'Walmart', icon: 'cart' },
  { name: 'Kroger', icon: 'cart' },
  { name: 'Safeway', icon: 'cart' },
  { name: 'Publix', icon: 'cart' },
  { name: 'Aldi', icon: 'cart' }
];

const STEP_TITLES = [
  'Your profile',
  'Invite family (optional)',
  'Dietary profile',
  'Where do you shop?',
  'Stay in the loop',
  'Scan your first item',
  'Confirm & add to pantry',
  'All synced!',
];

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
  barcode: string;
}

function BellHero() {
  const c = useAppColors();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 100 }),
        withTiming(15, { duration: 100 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));

  return (
    <Animated.View style={animatedStyle} className="mb-8 items-center justify-center h-32">
      <Icon name="bell" size={80} color={c.primary} />
    </Animated.View>
  );
}

function ScannerHero() {
  const c = useAppColors();
  const scanY = useSharedValue(0);
  
  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 1500 }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }]
  }));

  return (
    <View className="mb-8 items-center justify-center h-32">
      <View style={{ width: 70, height: 110, borderRadius: 12, borderWidth: 4, borderColor: c.primary, opacity: 0.3 }} />
      <Animated.View style={[{ position: 'absolute', top: 10, width: 100, height: 4 }, scanStyle]}>
        <LinearGradient colors={['transparent', c.primary, 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

function CheckmarkHero() {
  const c = useAppColors();
  const progress = useSharedValue(0);
  
  useEffect(() => {
    progress.value = withTiming(1, { duration: 800 });
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: 100 * (1 - progress.value)
  }));

  return (
    <View className="mb-8 items-center justify-center h-32">
      <Svg width="100" height="100" viewBox="0 0 100 100">
        <AnimatedPath
          d="M 25 50 L 45 70 L 75 30"
          stroke={c.success}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="100"
          animatedProps={animatedProps}
        />
      </Svg>
    </View>
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const { user, userProfile, householdId, updateUserProfile, updateUserPreferences } = useAuth();
  const { showToast } = useToast();
  
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [firstName, setFirstName] = useState(userProfile?.firstName ?? user?.displayName?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState(userProfile?.lastName ?? user?.displayName?.split(' ').slice(1).join(' ') ?? '');
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(userProfile?.dietaryPreferences ?? []);
  const [allergies, setAllergies] = useState(userProfile?.personalAllergies ?? '');
  const [stores, setStores] = useState<string[]>(userProfile?.preferredStores ?? []);
  const [customStore, setCustomStore] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [scanSkipped, setScanSkipped] = useState(false);
  const [editQty, setEditQty] = useState('1');
  const [editLoc, setEditLoc] = useState('Pantry');
  const [addedToSync, setAddedToSync] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(userProfile?.profilePictureUrl ?? user?.photoURL ?? '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(((step + 1) / TOTAL_STEPS) * screenWidth, { duration: 400 });
  }, [step]);

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  useEffect(() => {
    if (!householdId) return;
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (snap.exists()) setInviteCode((snap.data()?.inviteCode as string) ?? '');
    });
    return unsub;
  }, [householdId]);

  const toggleDiet = (d: string) =>
    setDietaryPrefs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const toggleStore = (s: string) =>
    setStores((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const finish = async () => {
    setSaving(true);
    const { error } = await updateUserPreferences({ onboardingCompleted: true });
    setSaving(false);
    if (error) showToast('Could not finish onboarding', 'error');
    else navigation.replace('Main');
  };

  const handleScan = async (barcode: string) => {
    setLookingUp(true);
    try {
      const product = await searchProductByBarcode(barcode);
      const name = product?.name ?? 'Unknown Item';
      setScannedItem({
        name,
        quantity: 1,
        unit: product?.unit ?? 'pcs',
        storageLocation: 'Pantry',
        category: categoryFromName(name).id,
        barcode,
      });
      setEditQty('1');
      setEditLoc('Pantry');
      setStep(6);
    } catch {
      showToast('Barcode not found — try a demo or skip', 'warning');
    } finally {
      setLookingUp(false);
    }
  };

  const handleAddToPantry = async () => {
    if (!householdId || !user || !scannedItem) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'households', householdId, 'inventory'), {
        name: scannedItem.name,
        quantity: parseFloat(editQty) || 1,
        unit: scannedItem.unit,
        storageLocation: editLoc,
        category: scannedItem.category,
        barcode: scannedItem.barcode,
        pricePerUnit: 0,
        addedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setAddedToSync(true);
      setStep(7);
    } catch {
      showToast('Could not add item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    setSaving(true);
    try {
      if (step === 0) {
        await updateUserProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          ...(photoUrl ? { profilePictureUrl: photoUrl } : {}),
        });
      }
      if (step === 2) {
        await updateUserPreferences({ dietaryPreferences: dietaryPrefs, personalAllergies: allergies });
      }
      if (step === 3) {
        await updateUserPreferences({ preferredStores: stores });
      }
    } catch {
      showToast('Could not save', 'error');
      setSaving(false);
      return;
    }
    setSaving(false);
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else await finish();
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View className="flex-1 mt-4">
            <View className="items-center mb-8">
              <LinearGradient 
                colors={[c.primary, c.violetGlow || '#8B5CF6']} 
                style={{ padding: 4, borderRadius: 64 }}
              >
                <View style={{ width: 120, height: 120, borderRadius: 60, overflow: 'hidden', backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={{ width: 120, height: 120 }} />
                  ) : (
                    <Icon name="user" size={48} color={c.muted} />
                  )}
                </View>
              </LinearGradient>
              <Pressable 
                onPress={async () => {
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
                }}
                className="mt-4"
              >
                <Text className="text-primary font-bold">{uploadingPhoto ? 'Uploading...' : 'Change Photo'}</Text>
              </Pressable>
            </View>
            <View className="gap-4">
              <TextField label="First name" value={firstName} onChangeText={setFirstName} />
              <TextField label="Last name" value={lastName} onChangeText={setLastName} />
            </View>
          </View>
        );

      case 1:
        return (
          <View className="flex-1 mt-8 gap-6">
            <BlurView intensity={c.blurIntensity as number || 60} tint={c.blurTint as any || 'light'} style={{ padding: 32, borderRadius: 24, borderWidth: 1, borderColor: c.lineStrong, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: c.muted, textTransform: 'uppercase', letterSpacing: 2 }}>Your invite code</Text>
              <Text style={{ marginTop: 16, fontSize: 36, fontWeight: '900', letterSpacing: 12, color: c.ink, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                {inviteCode || '——'}
              </Text>
            </BlurView>
            <Text className="text-center text-[15px] leading-relaxed text-muted dark:text-[#6B6878] px-4">
              Family can join via Settings → Join household. You can invite people later too.
            </Text>
            <Button
              label="Share code"
              variant="secondary"
              onPress={() => inviteCode && Share.share({ message: `Join my Larderly household: ${inviteCode}` })}
            />
          </View>
        );

      case 2:
        return (
          <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <View className="flex-row flex-wrap gap-3">
              {DIET_OPTIONS.map((d) => (
                <Chip
                  key={d.name}
                  label={d.name}
                  icon={d.icon}
                  active={dietaryPrefs.includes(d.name)}
                  onPress={() => toggleDiet(d.name)}
                />
              ))}
            </View>
            <View className="mt-6">
              <TextField label="Allergies" value={allergies} onChangeText={setAllergies} placeholder="e.g. peanuts, shellfish" />
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <View className="flex-row flex-wrap gap-3 mb-6">
              {STORES.map((s) => (
                <Chip
                  key={s.name}
                  label={s.name}
                  icon={s.icon}
                  active={stores.includes(s.name)}
                  onPress={() => toggleStore(s.name)}
                />
              ))}
            </View>
            <View className="flex-row gap-3 items-end">
              <View className="flex-1">
                <TextField value={customStore} onChangeText={setCustomStore} placeholder="Add another store…" />
              </View>
              <Button
                label="Add"
                variant="secondary"
                style={{ height: 52 }}
                onPress={() => {
                  const s = customStore.trim();
                  if (s) {
                    setStores((p) => [...p, s]);
                    setCustomStore('');
                  }
                }}
              />
            </View>
          </ScrollView>
        );

      case 4:
        return (
          <View className="flex-1 mt-8 justify-center">
            <BellHero />
            <Text className="text-[15px] leading-relaxed text-center text-muted dark:text-[#6B6878] mb-8">
              Get alerts about expiring items, low stock, and household activity directly to your device.
            </Text>
            <Button
              label="Enable notifications"
              onPress={async () => {
                const ok = await requestNotificationPermission();
                showToast(ok ? 'Notifications enabled' : 'Skipped — enable later in Settings', ok ? 'success' : 'info');
                setStep(5);
              }}
              style={{
                shadowColor: c.primary, shadowOpacity: 0.45, shadowRadius: 20, elevation: 10, shadowOffset: { width: 0, height: 8 }
              }}
            />
            <Button label="Skip for now" variant="ghost" className="mt-4" onPress={() => setStep(5)} />
          </View>
        );

      case 5:
        return (
          <View className="flex-1 mt-8 justify-center">
            <ScannerHero />
            <Text className="mt-4 mb-8 text-center text-[15px] leading-relaxed text-muted dark:text-[#6B6878]">
              {lookingUp ? 'Looking up barcode...' : 'Scan any food barcode or try a demo product.'}
            </Text>
            <View className="gap-4">
              <Button label="Open scanner" onPress={() => navigation.navigate('Main', { screen: 'Scanner', params: { mode: 'add' } })} />
              <View className="flex-row gap-3">
                <Button label="Demo: Milk" variant="secondary" className="flex-1" onPress={() => handleScan('5901234123457')} />
                <Button label="Demo: Cereal" variant="secondary" className="flex-1" onPress={() => handleScan('1234567890128')} />
              </View>
              <Button
                label="Skip this step"
                variant="ghost"
                onPress={() => {
                  setScanSkipped(true);
                  setStep(7);
                }}
              />
            </View>
          </View>
        );

      case 6:
        return (
          <View className="flex-1 mt-4 gap-6">
            <View className="items-center mb-4">
              <Icon name="box" size={64} color={c.primary} />
            </View>
            {scannedItem && (
              <View className="rounded-2xl border border-success/30 bg-success/10 p-5 items-center">
                <Text className="text-xl font-bold text-ink dark:text-[#F0EEE9] mb-1 text-center">{scannedItem.name}</Text>
                <Text className="font-mono text-xs text-muted dark:text-[#6B6878]">{scannedItem.barcode}</Text>
              </View>
            )}
            <View className="gap-4">
              <TextField label="Quantity" value={editQty} onChangeText={setEditQty} keyboardType="numeric" />
              <SelectField
                label="Storage"
                value={editLoc}
                onChange={setEditLoc}
                options={STORAGE_LOCATIONS.map((l) => ({ label: l, value: l }))}
              />
            </View>
            <View className="mt-4 gap-3">
              <Button label="Add to pantry" onPress={handleAddToPantry} loading={saving} style={{ shadowColor: c.primary, shadowOpacity: 0.45, shadowRadius: 20, elevation: 10, shadowOffset: { width: 0, height: 8 } }} />
              <Button label="Scan different item" variant="ghost" onPress={() => setStep(5)} />
            </View>
          </View>
        );

      case 7:
        return (
          <View className="flex-1 mt-12 items-center justify-center">
            {scanSkipped ? <Icon name="sparkles" size={100} color={c.warning} /> : <CheckmarkHero />}
            <Text className="mt-8 text-center text-[16px] leading-relaxed text-muted dark:text-[#6B6878] px-4">
              {scanSkipped
                ? "You're all set! Add items anytime from the Pantry or Scanner tab."
                : 'Your item is safely stored! Head to your dashboard to see your new inventory.'}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  // Fixed Bottom Continue Button height
  const bottomButtonHeight = 52;
  const bottomMargin = insets.bottom + 24;

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      {/* Absolute Progress Bar at top */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: c.line, zIndex: 50 }}>
        <Animated.View style={[{ height: 4, backgroundColor: c.primary, borderBottomRightRadius: 2, borderTopRightRadius: 2 }, progressStyle]} />
      </View>

      {/* Header with Back Button */}
      <View style={{ marginTop: insets.top + 20, paddingHorizontal: 24, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
        {step > 0 && step < 7 ? (
          <Pressable onPress={() => setStep(s => s - 1)} hitSlop={16} className="mr-4">
            <Icon name="chevron-left" size={24} color={c.ink} />
          </Pressable>
        ) : <View style={{ width: 40 }} />}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View 
            key={step} 
            entering={SlideInRight.duration(400)} 
            exiting={SlideOutLeft.duration(400)} 
            style={{ position: 'absolute', width: '100%', height: '100%', paddingHorizontal: 24 }}
          >
            <View style={{ marginTop: 24 }}>
              <Text className="text-[13px] font-bold uppercase tracking-widest text-primary mb-2">Step {step + 1} of {TOTAL_STEPS}</Text>
              <Text className="text-3xl font-black tracking-tight text-ink dark:text-[#F0EEE9]">{STEP_TITLES[step]}</Text>
            </View>
            {renderStep()}
          </Animated.View>
        </View>

        {/* Fixed Continue Button */}
        {step < 4 || step === 7 ? (
          <View style={{ position: 'absolute', bottom: bottomMargin, left: 24, right: 24 }}>
            {step === 7 ? (
              <Pressable
                onPress={finish}
                disabled={saving}
                style={{
                  height: bottomButtonHeight,
                  borderRadius: 16,
                  backgroundColor: c.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: c.primary,
                  shadowOpacity: 0.45,
                  shadowRadius: 20,
                  elevation: 10,
                  shadowOffset: { width: 0, height: 8 },
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{saving ? 'Finishing...' : 'Go to Dashboard'}</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={next}
                disabled={saving}
                style={{
                  height: bottomButtonHeight,
                  borderRadius: 16,
                  backgroundColor: c.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: c.primary,
                  shadowOpacity: 0.45,
                  shadowRadius: 20,
                  elevation: 10,
                  shadowOffset: { width: 0, height: 8 },
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{saving ? 'Saving...' : 'Continue'}</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import SelectField from '../components/ui/SelectField';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { categoryFromName, STORAGE_LOCATIONS } from '../lib/categories';
import { searchProductByBarcode } from '../lib/productDb';
import { requestNotificationPermission } from '../lib/push';
import { pickProfilePhoto, uploadUserAvatar } from '../lib/avatar';

const TOTAL_STEPS = 8;
const IMG_KITCHEN = 'https://images.pexels.com/photos/10568352/pexels-photo-10568352.jpeg?auto=compress&cs=tinysrgb&w=900';
const IMG_VEGGIES = 'https://images.unsplash.com/photo-1579113800032-c38bd7635818?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHx2aWJyYW50JTIwZnJlc2glMjB2ZWdldGFibGVzJTIwaW5ncmVkaWVudHMlMjBjaW5lbWF0aWN8ZW58MHx8fHwxNzgzMzIzNzM2fDA&ixlib=rb-4.1.0&q=85';
const IMG_MARKET = 'https://images.unsplash.com/photo-1518843875459-f738682238a6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwzfHx2aWJyYW50JTIwZnJlc2glMjB2ZWdldGFibGVzJTIwaW5ncmVkaWVudHMlMjBjaW5lbWF0aWN8ZW58MHx8fHwxNzgzMzIzNzM2fDA&ixlib=rb-4.1.0&q=85';
const STEP_IMAGES = [
  IMG_KITCHEN,
  IMG_KITCHEN,
  IMG_VEGGIES,
  IMG_MARKET,
  IMG_VEGGIES,
  IMG_MARKET,
  IMG_VEGGIES,
  IMG_KITCHEN,
] as const;
const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Pescatarian', 'Halal', 'Kosher'];
const STORES = ["Whole Foods", "Trader Joe's", 'Costco', 'Target', 'Walmart', 'Kroger', 'Safeway', 'Publix', 'Aldi'];

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

function StepDot({ active, complete }: { active: boolean; complete: boolean }) {
  const width = useSharedValue(active ? 24 : 8);

  useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 180 });
  }, [active, width]);

  const style = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <Animated.View
      style={style}
      className={`h-2 rounded-full ${active ? 'bg-primary' : complete ? 'bg-primary/40' : 'bg-line'}`}
    />
  );
}

export default function OnboardingScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { userProfile, updateUserProfile, updateUserPreferences } = useProfile();
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
  const stepX = useSharedValue(24);
  const stepOpacity = useSharedValue(0);
  const continueScale = useSharedValue(1);

  useEffect(() => {
    stepX.value = 24;
    stepOpacity.value = 0;
    stepX.value = withTiming(0, { duration: 250 });
    stepOpacity.value = withTiming(1, { duration: 250 });
  }, [step, stepOpacity, stepX]);

  const stepStyle = useAnimatedStyle(() => ({
    opacity: stepOpacity.value,
    transform: [{ translateX: stepX.value }],
  }));

  const continueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueScale.value }],
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

  const handleContinue = () => {
    continueScale.value = withSequence(
      withTiming(0.97, { duration: 90 }),
      withSpring(1, { damping: 12, stiffness: 240 }),
    );
    void next();
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-6 flex-row justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <StepDot key={i} active={i === step} complete={i < step} />
          ))}
        </View>

        {/* Cinematic step hero */}
        <View
          style={{
            height: 230,
            borderRadius: 32,
            borderBottomRightRadius: 12,
            overflow: 'hidden',
            marginBottom: 24,
          }}
        >
          <Image
            source={{ uri: STEP_IMAGES[step] }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={450}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(0,0,0,0.78)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 16 }}>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.22)',
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: 'Outfit_700Bold', letterSpacing: 1, color: '#FFFFFF' }}>
                STEP {step + 1} OF {TOTAL_STEPS}
              </Text>
            </View>
            <Text style={{ marginTop: 8, fontSize: 30, lineHeight: 34, fontFamily: 'Fraunces_700Bold', color: '#FFFFFF' }}>
              {STEP_TITLES[step]}
            </Text>
          </View>
        </View>

        <Animated.View style={stepStyle}>
        {step === 0 && (
          <View className="mt-4 gap-3">
            <View className="items-center gap-3">
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} className="h-24 w-24 rounded-full border border-line dark:border-line-dark" />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full border border-line dark:border-line-dark bg-surface dark:bg-surface-dark">
                  <Text className="text-3xl text-muted dark:text-muted-dark">?</Text>
                </View>
              )}
              <Button
                label={uploadingPhoto ? 'Uploading…' : 'Choose profile photo'}
                variant="secondary"
                size="sm"
                loading={uploadingPhoto}
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
              />
            </View>
            <TextField label="First name" value={firstName} onChangeText={setFirstName} />
            <TextField label="Last name" value={lastName} onChangeText={setLastName} />
          </View>
        )}

        {step === 1 && (
          <View className="mt-4 gap-4">
            <View className="items-center rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <Text className="text-xs font-bold uppercase text-muted dark:text-muted-dark">Your invite code</Text>
              <Text className="mt-2 font-mono text-3xl font-black tracking-widest text-ink dark:text-ink-dark">
                {inviteCode || '——'}
              </Text>
              <Button
                label="Share code"
                size="sm"
                variant="secondary"
                className="mt-3"
                onPress={() => inviteCode && Share.share({ message: `Join my Larderly household: ${inviteCode}` })}
              />
            </View>
            <Text className="text-center text-sm text-muted dark:text-muted-dark">
              Family can join via Settings → Join household. You can invite people later too.
            </Text>
          </View>
        )}

        {step === 2 && (
          <View className="mt-4 gap-4">
            <View className="flex-row flex-wrap gap-2">
              {DIET_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => toggleDiet(d)}
                  className={`rounded-full px-4 py-2 ${dietaryPrefs.includes(d) ? 'bg-primary' : 'border border-line dark:border-line-dark bg-surface dark:bg-surface-dark'}`}
                >
                  <Text className={dietaryPrefs.includes(d) ? 'font-semibold text-white' : 'text-ink dark:text-ink-dark'}>{d}</Text>
                </Pressable>
              ))}
            </View>
            <TextField label="Allergies" value={allergies} onChangeText={setAllergies} placeholder="e.g. peanuts, shellfish" />
          </View>
        )}

        {step === 3 && (
          <View className="mt-4 gap-3">
            <View className="flex-row flex-wrap gap-2">
              {STORES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => toggleStore(s)}
                  className={`rounded-full px-4 py-2 ${stores.includes(s) ? 'bg-ink' : 'border border-line dark:border-line-dark bg-surface dark:bg-surface-dark'}`}
                >
                  <Text className={stores.includes(s) ? 'font-semibold text-white' : 'text-ink dark:text-ink-dark'}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <TextField value={customStore} onChangeText={setCustomStore} placeholder="Add another store…" />
              </View>
              <Button
                label="Add"
                size="sm"
                variant="secondary"
                onPress={() => {
                  const s = customStore.trim();
                  if (s) {
                    setStores((p) => [...p, s]);
                    setCustomStore('');
                  }
                }}
              />
            </View>
          </View>
        )}

        {step === 4 && (
          <View className="mt-4 gap-3">
            <Text className="text-sm text-muted dark:text-muted-dark">
              Get alerts about expiring items, low stock, and household activity.
            </Text>
            <Button
              label="Enable notifications"
              onPress={async () => {
                const ok = await requestNotificationPermission();
                showToast(ok ? 'Notifications enabled' : 'Skipped — enable later in Settings', ok ? 'success' : 'info');
                setStep(5);
              }}
            />
            <Button label="Skip for now" variant="ghost" onPress={() => setStep(5)} />
          </View>
        )}

        {step === 5 && (
          <View className="mt-4 gap-3">
            <View className="items-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6">
              <Text className="text-4xl">📷</Text>
              <Text className="mt-3 text-center text-sm text-muted dark:text-muted-dark">
                Scan any food barcode or try a demo product below.
              </Text>
            </View>
            {lookingUp && <Text className="text-center text-sm font-semibold text-primary">Looking up barcode…</Text>}
            <Button label="Open scanner" onPress={() => navigation.navigate('Main', { screen: 'Scanner', params: { mode: 'add' } })} />
            <View className="flex-row gap-2">
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
        )}

        {step === 6 && scannedItem && (
          <View className="mt-4 gap-3">
            <View className="rounded-2xl border border-success/30 bg-success/10 p-4">
              <Text className="font-display text-xl text-ink dark:text-ink-dark">{scannedItem.name}</Text>
              <Text className="font-mono text-xs text-muted dark:text-muted-dark">{scannedItem.barcode}</Text>
            </View>
            <TextField label="Quantity" value={editQty} onChangeText={setEditQty} keyboardType="numeric" />
            <SelectField
              label="Storage"
              value={editLoc}
              onChange={setEditLoc}
              options={STORAGE_LOCATIONS.map((l) => ({ label: l, value: l }))}
            />
            <Button label="Add to pantry" onPress={handleAddToPantry} loading={saving} />
            <Button label="Scan a different item" variant="ghost" onPress={() => setStep(5)} />
          </View>
        )}

        {step === 7 && (
          <View className="mt-4 items-center gap-4">
            <Text className="text-5xl">{scanSkipped ? '✨' : '☁️'}</Text>
            {!scanSkipped && addedToSync && scannedItem && (
              <Text className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-center text-sm text-success">
                {scannedItem.name} has been added to your pantry and synced.
              </Text>
            )}
            <Text className="text-center text-sm text-muted dark:text-muted-dark">
              {scanSkipped
                ? "You're all set! Add items anytime from Pantry or Scanner."
                : 'Your data is safely stored. Head to your dashboard to manage inventory.'}
            </Text>
            <Button label="Go to my dashboard" onPress={finish} loading={saving} />
          </View>
        )}

        {step < 4 && (
          <View className="mt-8 gap-2">
            <Animated.View style={continueStyle}>
              <Button label="Continue" onPress={handleContinue} loading={saving} />
            </Animated.View>
            {step > 0 ? (
              <Button label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} />
            ) : (
              <Button label="Skip setup" variant="ghost" onPress={finish} />
            )}
          </View>
        )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

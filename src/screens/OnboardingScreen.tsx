import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import SelectField from '../components/ui/SelectField';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../lib/firebase';
import { categoryFromName, STORAGE_LOCATIONS } from '../lib/categories';
import { searchProductByBarcode } from '../lib/productDb';
import { requestNotificationPermission } from '../lib/push';
import { pickProfilePhoto, uploadUserAvatar } from '../lib/avatar';

const TOTAL_STEPS = 8;
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

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
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

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View className="mb-6 flex-row justify-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-line'}`}
            />
          ))}
        </View>

        <Text className="text-sm font-semibold text-primary">Step {step + 1} of {TOTAL_STEPS}</Text>
        <Text className="mb-1 mt-2 text-2xl font-bold text-ink">{STEP_TITLES[step]}</Text>

        {step === 0 && (
          <View className="mt-4 gap-3">
            <View className="items-center gap-3">
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} className="h-24 w-24 rounded-full border border-line" />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full border border-line bg-surface">
                  <Text className="text-3xl text-muted">?</Text>
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
              <Text className="text-xs font-bold uppercase text-muted">Your invite code</Text>
              <Text className="mt-2 font-mono text-3xl font-black tracking-widest text-ink">
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
            <Text className="text-center text-sm text-muted">
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
                  className={`rounded-full px-4 py-2 ${dietaryPrefs.includes(d) ? 'bg-primary' : 'border border-line bg-surface'}`}
                >
                  <Text className={dietaryPrefs.includes(d) ? 'font-semibold text-white' : 'text-ink'}>{d}</Text>
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
                  className={`rounded-full px-4 py-2 ${stores.includes(s) ? 'bg-ink' : 'border border-line bg-surface'}`}
                >
                  <Text className={stores.includes(s) ? 'font-semibold text-white' : 'text-ink'}>{s}</Text>
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
            <Text className="text-sm text-muted">
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
              <Text className="mt-3 text-center text-sm text-muted">
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
              <Text className="text-lg font-bold text-ink">{scannedItem.name}</Text>
              <Text className="font-mono text-xs text-muted">{scannedItem.barcode}</Text>
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
            <Text className="text-center text-sm text-muted">
              {scanSkipped
                ? "You're all set! Add items anytime from Pantry or Scanner."
                : 'Your data is safely stored. Head to your dashboard to manage inventory.'}
            </Text>
            <Button label="Go to my dashboard" onPress={finish} loading={saving} />
          </View>
        )}

        {step < 4 && (
          <View className="mt-8 gap-2">
            <Button label="Continue" onPress={next} loading={saving} />
            {step > 0 ? (
              <Button label="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} />
            ) : (
              <Button label="Skip setup" variant="ghost" onPress={finish} />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

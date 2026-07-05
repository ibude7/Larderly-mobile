import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  setDoc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from '@react-native-firebase/firestore';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { useToast } from '../contexts/ToastContext';
import { useSync } from '../contexts/SyncContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useReauth, withReauth } from '../components/auth/ReauthDialog';
import HouseholdSettingsSection from '../components/settings/HouseholdSettingsSection';
import SecuritySection from '../components/settings/SecuritySection';
import PreferencesSection from '../components/settings/PreferencesSection';
import { db } from '../lib/firebase';
import { getLocationIcon } from '../lib/appIcons';
import { StorageLocation } from '../types';
import { useAppColors } from '../hooks/useAppColors';
import { pickProfilePhoto, uploadUserAvatar } from '../lib/avatar';

const LOCATION_COLORS = [
  '#3b82f6',
  '#06b6d4',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#10b981',
  '#ec4899',
  '#64748b',
] as const;

function describeProvider(providerIds: string[], isAnonymous: boolean): string {
  if (isAnonymous) return 'Guest';
  const ids = new Set(providerIds);
  if (ids.has('google.com')) return 'Google';
  if (ids.has('apple.com')) return 'Apple';
  if (ids.has('password')) return 'Email';
  return 'Signed in';
}

export default function SettingsScreen() {
  const c = useAppColors();
  const navigation = useNavigation<RootStackNavigationProp>();
  const {
    user,
    profile,
    userProfile,
    householdId,
    role,
    signOut,
    updateProfile,
    sendVerificationEmail,
    upgradeAnonymous,
    upgradeAnonymousWithGoogle,
    googleAvailable,
    deleteAccount,
    revokeAllSessions,
    updateUserProfile,
  } = useAuth();
  const { locations, refetch, items } = useInventory();
  const { shoppingList } = useShopping();
  const { showToast } = useToast();
  const { online, syncing, lastSyncedAt } = useSync();
  const confirm = useConfirm();
  const reauth = useReauth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocColor, setNewLocColor] = useState('#f59e0b');
  const [addingLoc, setAddingLoc] = useState(false);
  const [resending, setResending] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeShowPw, setUpgradeShowPw] = useState(false);
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pendingDeleteLoc, setPendingDeleteLoc] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [deletingLoc, setDeletingLoc] = useState(false);
  const [loginEvents, setLoginEvents] = useState<{ id: string; device: string; platform: string; at?: number }[]>([]);
  const [photoUrl, setPhotoUrl] = useState(userProfile?.profilePictureUrl ?? user?.photoURL ?? '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'loginEvents'), orderBy('at', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setLoginEvents(
        snap.docs.map((d) => {
          const data = d.data();
          let at: number | undefined;
          const raw = data.at;
          if (typeof raw === 'object' && raw !== null && 'toMillis' in raw) {
            at = (raw as { toMillis: () => number }).toMillis();
          }
          return { id: d.id, device: (data.device as string) ?? 'Device', platform: (data.platform as string) ?? '', at };
        }),
      );
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile?.full_name]);

  useEffect(() => {
    setPhotoUrl(userProfile?.profilePictureUrl ?? user?.photoURL ?? '');
  }, [userProfile?.profilePictureUrl, user?.photoURL]);

  const isAnonymous = !!user?.isAnonymous;
  const providerLabel = useMemo(
    () => describeProvider(user?.providerData?.map((p) => p.providerId) ?? [], isAnonymous),
    [user?.providerData, isAnonymous],
  );
  const needsVerification =
    !!user && !isAnonymous && !!user.email && !user.emailVerified;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const { error } = await updateProfile({ full_name: fullName });
    if (error) showToast('Failed to update profile', 'error');
    else showToast('Profile updated', 'success');
    setSavingProfile(false);
  };

  const handleAddLocation = async () => {
    if (!newLocName.trim() || !user || !householdId) return;
    if (role === 'viewer') {
      showToast('View-only access', 'warning');
      return;
    }
    try {
      const colRef = collection(db, 'households', householdId, 'storageLocations');
      const ref = doc(colRef);
      await setDoc(ref, {
        userId: user.uid,
        name: newLocName.trim(),
        icon: 'package',
        color: newLocColor,
        createdAt: serverTimestamp(),
      });
      showToast(`${newLocName} location added`, 'success');
      setNewLocName('');
      setAddingLoc(false);
      refetch();
    } catch {
      showToast('Failed to add location', 'error');
    }
  };

  const handleDeleteLocation = async () => {
    if (!user || !pendingDeleteLoc || !householdId) return;
    if (role === 'viewer') {
      showToast('View-only access', 'warning');
      return;
    }
    const { id, name } = pendingDeleteLoc;
    setDeletingLoc(true);
    try {
      const pantryQ = query(
        collection(db, 'households', householdId, 'inventory'),
        where('locationId', '==', id),
      );
      const pantrySnap = await getDocs(pantryQ);
      const batch = writeBatch(db);
      pantrySnap.docs.forEach((d) =>
        batch.update(d.ref, { locationId: null, updatedAt: serverTimestamp() }),
      );
      batch.delete(doc(db, 'households', householdId, 'storageLocations', id));
      await batch.commit();
      showToast(`${name} location removed`, 'success');
      refetch();
    } catch {
      showToast('Failed to delete location', 'error');
    } finally {
      setDeletingLoc(false);
      setPendingDeleteLoc(null);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    const { error } = await sendVerificationEmail();
    if (error) showToast(error.message || 'Could not send verification email', 'error');
    else showToast(`Verification email sent to ${user?.email}`, 'success');
    setResending(false);
  };

  const handleUpgrade = async () => {
    if (!upgradeEmail.trim() || upgradePassword.length < 6) {
      showToast('Enter a valid email and a password with at least 6 characters', 'warning');
      return;
    }
    setUpgradeBusy(true);
    const { error } = await upgradeAnonymous(upgradeEmail.trim(), upgradePassword, fullName.trim());
    setUpgradeBusy(false);
    if (error) {
      showToast(error.message || 'Could not create your account', 'error');
      return;
    }
    showToast(`Account created. A verification email was sent to ${upgradeEmail}.`, 'success');
    setUpgradeOpen(false);
    setUpgradeEmail('');
    setUpgradePassword('');
  };

  const handleGoogleUpgrade = async () => {
    setGoogleBusy(true);
    const { error } = await upgradeAnonymousWithGoogle();
    setGoogleBusy(false);
    if (error) {
      showToast(error.message || 'Could not link your Google account', 'error');
      return;
    }
    showToast('Google account linked. Your pantry is now saved.', 'success');
    setUpgradeOpen(false);
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const payload: Record<string, unknown> = {
        exported_at: new Date().toISOString(),
        user: {
          uid: user.uid,
          email: user.email || null,
          display_name: profile?.full_name || user.displayName || null,
          provider: providerLabel,
        },
        pantry_items: items,
        storage_locations: locations,
        shopping_list: shoppingList,
      };
      if (householdId) {
        const [invSnap, listsSnap] = await Promise.all([
          getDocs(collection(db, 'households', householdId, 'inventory')),
          getDocs(collection(db, 'households', householdId, 'shoppingLists')),
        ]);
        payload.household_id = householdId;
        payload.household_inventory = invSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        payload.shopping_lists = listsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `larderly-export-${stamp}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', UTI: 'public.json' });
      }
      showToast('Data exported as JSON', 'success');
    } catch (err) {
      console.error('[Larderly] Export failed', err);
      showToast('Export failed — try again in a moment', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRevokeSessions = async () => {
    const ok = await confirm({
      title: 'Sign out everywhere?',
      message: 'This ends all active sessions on other devices.',
      destructive: true,
      confirmLabel: 'Revoke all',
    });
    if (!ok) return;
    try {
      await withReauth(() => revokeAllSessions(), reauth, 'Confirm to revoke all sessions.');
      showToast('All sessions revoked', 'success');
    } catch (err) {
      if ((err as Error).message !== 'Re-authentication cancelled.') {
        showToast('Could not revoke sessions', 'error');
      }
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete account?',
      message: 'This permanently removes your account and data. This cannot be undone.',
      destructive: true,
      confirmLabel: 'Delete account',
    });
    if (!ok) return;
    try {
      await withReauth(() => deleteAccount(), reauth, 'Confirm to delete your account.');
      showToast('Account deleted', 'info');
    } catch (err) {
      if ((err as Error).message !== 'Re-authentication cancelled.') {
        showToast('Could not delete account', 'error');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-[#0F0F13]" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-line dark:border-[#2A2A35] px-4 pb-3">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]"
        >
          <Icon name="chevron-left" size={20} color={c.ink} />
        </Pressable>
        <Text className="text-lg font-bold text-ink dark:text-[#F0EEE9]">Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-card border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-5">
          <View className="mb-1 flex-row items-center gap-1.5">
            <Icon name="sparkles" size={14} color={c.primary} />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted dark:text-[#6B6878]">
              Workspace settings
            </Text>
          </View>
          <Text className="text-2xl font-bold text-ink dark:text-[#F0EEE9]">Tune your pantry</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            <Chip label={`${locations.length} locations`} />
            <Chip label={providerLabel} highlight />
            {user?.email ? (
              <Chip
                label={user.email}
                icon={user.emailVerified ? 'success' : 'mail'}
                warn={!user.emailVerified}
              />
            ) : null}
          </View>
        </View>

        {isAnonymous ? (
          <Section title="Upgrade guest session" icon="sparkles" iconBg="bg-primary">
            <Text className="mb-4 text-sm leading-relaxed text-muted dark:text-[#6B6878]">
              Create an account to keep your items, meals, and shopping list backed up.
            </Text>
            {googleAvailable ? (
              <Button
                label={googleBusy ? 'Linking…' : 'Continue with Google'}
                icon="google"
                variant="secondary"
                onPress={handleGoogleUpgrade}
                loading={googleBusy}
                disabled={upgradeBusy}
                full
              />
            ) : null}
            {!upgradeOpen ? (
              <View className={googleAvailable ? 'mt-3' : ''}>
                <Button
                  label="Create with email"
                  icon="sparkles"
                  onPress={() => setUpgradeOpen(true)}
                  disabled={googleBusy}
                  full
                />
              </View>
            ) : (
              <View className="mt-3 gap-3">
                <TextField
                  label="Email"
                  value={upgradeEmail}
                  onChangeText={setUpgradeEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@example.com"
                />
                <TextField
                  label="Password"
                  value={upgradePassword}
                  onChangeText={setUpgradePassword}
                  secureTextEntry={!upgradeShowPw}
                  rightIcon={upgradeShowPw ? 'eye-off' : 'eye'}
                  onRightIconPress={() => setUpgradeShowPw((v) => !v)}
                  placeholder="At least 6 characters"
                />
                <View className="flex-row gap-2">
                  <Button
                    label={upgradeBusy ? 'Creating…' : 'Create account'}
                    onPress={handleUpgrade}
                    loading={upgradeBusy}
                    disabled={googleBusy}
                    className="flex-1"
                  />
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => {
                      setUpgradeOpen(false);
                      setUpgradePassword('');
                    }}
                  />
                </View>
              </View>
            )}
          </Section>
        ) : null}

        {needsVerification ? (
          <Section title="Verify your email" icon="mail" iconBg="bg-warning/10">
            <Text className="mb-3 text-sm text-muted dark:text-[#6B6878]">
              We sent a link to <Text className="font-bold text-ink dark:text-[#F0EEE9]">{user?.email}</Text>. Tap the
              link to confirm your address.
            </Text>
            <Button
              label={resending ? 'Sending…' : 'Resend link'}
              variant="secondary"
              onPress={handleResendVerification}
              loading={resending}
            />
          </Section>
        ) : null}

        <Section title="Profile" icon="user" iconBg="bg-primary/10">
          <View className="mb-4 items-center gap-3">
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} className="h-20 w-20 rounded-full border border-line dark:border-[#2A2A35]" />
            ) : (
              <View className="h-20 w-20 items-center justify-center rounded-full border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13]">
                <Icon name="user" size={28} color={c.muted} />
              </View>
            )}
            <Button
              label={uploadingPhoto ? 'Uploading…' : 'Change photo'}
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
              }}
            />
          </View>
          <Text className="mb-4 text-sm text-muted dark:text-[#6B6878]">
            {isAnonymous ? 'Guest session — no email on file' : user?.email || 'Signed in'}
          </Text>
          <TextField
            label="Display Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            autoComplete="name"
          />
          <View className="mt-4">
            <Button
              label={savingProfile ? 'Saving…' : 'Save changes'}
              onPress={handleSaveProfile}
              disabled={savingProfile || fullName === (profile?.full_name || '')}
              loading={savingProfile}
            />
          </View>
        </Section>

        {householdId ? (
          <Section title="Household" icon="user" iconBg="bg-info/10">
            <HouseholdSettingsSection />
          </Section>
        ) : null}

        <Section title="Preferences" icon="sparkles" iconBg="bg-primary/10">
          <PreferencesSection />
        </Section>

        <Section title="Security & sync" icon="lock" iconBg="bg-warning/10">
          <SecuritySection />
          <View className="mt-4 rounded-xl border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13] p-3">
            <Text className="text-sm font-semibold text-ink dark:text-[#F0EEE9]">Sync status</Text>
            <Text className="mt-1 text-xs text-muted dark:text-[#6B6878]">
              {online ? (syncing ? 'Syncing…' : 'Online') : 'Offline'}
              {lastSyncedAt ? ` · Last sync ${new Date(lastSyncedAt).toLocaleString()}` : ''}
            </Text>
          </View>
          {loginEvents.length > 0 && (
            <View className="mt-4">
              <Text className="mb-2 text-sm font-semibold text-ink dark:text-[#F0EEE9]">Recent sign-ins</Text>
              {loginEvents.map((ev) => (
                <View key={ev.id} className="mb-1 rounded-lg bg-canvas dark:bg-[#0F0F13] px-3 py-2">
                  <Text className="text-xs text-ink dark:text-[#F0EEE9]">{ev.device} · {ev.platform}</Text>
                  {ev.at ? <Text className="text-[10px] text-muted dark:text-[#6B6878]">{new Date(ev.at).toLocaleString()}</Text> : null}
                </View>
              ))}
            </View>
          )}
          {!isAnonymous && (
            <View className="mt-3 gap-2">
              <Button label="Revoke all sessions" variant="secondary" size="sm" onPress={handleRevokeSessions} />
            </View>
          )}
        </Section>

        <Section title="Storage locations" icon="shelf" iconBg="bg-info/10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-sm text-muted dark:text-[#6B6878]">Pantry, Fridge, Freezer, etc.</Text>
            <Button
              label={addingLoc ? 'Cancel' : 'Add'}
              icon={addingLoc ? 'close' : 'plus'}
              variant="secondary"
              size="sm"
              onPress={() => setAddingLoc((v) => !v)}
            />
          </View>
          {addingLoc ? (
            <View className="mb-4 gap-3 rounded-2xl border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13] p-3">
              <TextField
                value={newLocName}
                onChangeText={setNewLocName}
                placeholder="Location name…"
                autoFocus
              />
              <View>
                <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
                  Color
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {LOCATION_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setNewLocColor(color)}
                      className={`h-9 w-9 rounded-full border-2 ${
                        newLocColor === color ? 'border-ink' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </View>
              </View>
              <Button
                label="Add location"
                onPress={handleAddLocation}
                disabled={!newLocName.trim()}
                size="sm"
              />
            </View>
          ) : null}
          {locations.length === 0 ? (
            <Text className="rounded-2xl border border-dashed border-line dark:border-[#2A2A35] p-4 text-center text-xs text-muted dark:text-[#6B6878]">
              No storage locations yet. Tap Add to create one.
            </Text>
          ) : (
            <View className="gap-2">
              {locations.map((loc) => (
                <LocationRow
                  key={loc.id}
                  location={loc}
                  onDelete={() => setPendingDeleteLoc({ id: loc.id, name: loc.name })}
                />
              ))}
            </View>
          )}
        </Section>

        <Section title="More" icon="grid" iconBg="bg-primary/10">
          <View className="gap-2">
            <Button label="Notifications" icon="bell" variant="secondary" onPress={() => navigation.navigate('Notifications')} />
            <Button label="Reminders" icon="clock" variant="secondary" onPress={() => navigation.navigate('Reminders')} />
            <Button label="Nutrition" icon="nutrition" variant="secondary" onPress={() => navigation.navigate('Nutrition')} />
            <Button label="Analytics" icon="trending-down" variant="secondary" onPress={() => navigation.navigate('Analytics')} />
            <Button label="Meal planner" icon="calendar" variant="secondary" onPress={() => navigation.navigate('MealPlanner')} />
          </View>
        </Section>

        <Section title="Progress" icon="star" iconBg="bg-primary/10">
          <Text className="mb-4 text-sm leading-relaxed text-muted dark:text-[#6B6878]">
            Track streaks, badges, and milestones as you use Larderly.
          </Text>
          <Button
            label="View achievements"
            icon="star"
            variant="secondary"
            onPress={() => navigation.navigate('Achievements')}
          />
        </Section>

        <Section title="Your data" icon="download" iconBg="bg-success/10">
          <Text className="mb-4 text-sm leading-relaxed text-muted dark:text-[#6B6878]">
            Download a JSON copy of your pantry, shopping list, meal plans, and storage locations.
          </Text>
          <Button
            label={exporting ? 'Preparing export…' : 'Export data'}
            icon="download"
            variant="secondary"
            onPress={handleExport}
            loading={exporting}
          />
        </Section>

        <Section title="Account" icon="logout" iconBg="bg-danger/10">
          <Text className="mb-4 text-sm text-muted dark:text-[#6B6878]">
            {isAnonymous
              ? 'Signing out clears this guest session.'
              : 'Securely end your session on this device.'}
          </Text>
          <Button label="Sign out" icon="logout" variant="danger" onPress={signOut} />
          {!isAnonymous && (
            <View className="mt-3">
              <Button label="Delete account" variant="ghost" onPress={handleDeleteAccount} />
            </View>
          )}
        </Section>

        <View className="items-center pt-2">
          <Text className="text-[11px] font-bold uppercase tracking-widest text-muted dark:text-[#6B6878]">
            Larderly · v1.0
          </Text>
        </View>
      </ScrollView>

      <ConfirmDialog
        isOpen={!!pendingDeleteLoc}
        onClose={() => !deletingLoc && setPendingDeleteLoc(null)}
        onConfirm={handleDeleteLocation}
        busy={deletingLoc}
        title="Delete storage location"
        description={`Delete ${pendingDeleteLoc?.name}? Items stored there will be unassigned.`}
        confirmLabel="Delete location"
        cancelLabel="Keep"
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  iconBg,
  children,
}: {
  title: string;
  icon: Parameters<typeof Icon>[0]['name'];
  iconBg: string;
  children: React.ReactNode;
}) {
  const c = useAppColors();
  return (
    <View className="rounded-card border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-5">
      <View className="mb-4 flex-row items-center gap-3">
        <View className={`h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}>
          <Icon name={icon} size={22} color={c.ink} />
        </View>
        <Text className="text-base font-bold text-ink dark:text-[#F0EEE9]">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Chip({
  label,
  icon,
  highlight,
  warn,
}: {
  label: string;
  icon?: Parameters<typeof Icon>[0]['name'];
  highlight?: boolean;
  warn?: boolean;
}) {
  const c = useAppColors();
  return (
    <View
      className={`flex-row items-center gap-1 rounded-full border px-3 py-1 ${
        highlight
          ? 'border-ink bg-ink'
          : warn
            ? 'border-warning/40 bg-warning/10'
            : 'border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13]'
      }`}
    >
      {icon ? (
        <Icon name={icon} size={12} color={highlight ? '#FFFFFF' : warn ? c.warning : c.muted} />
      ) : null}
      <Text
        numberOfLines={1}
        className={`max-w-[180px] text-[11px] font-bold ${
          highlight ? 'text-white' : warn ? 'text-warning' : 'text-muted dark:text-[#6B6878]'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

function LocationRow({
  location,
  onDelete,
}: {
  location: StorageLocation;
  onDelete: () => void;
}) {
  const c = useAppColors();
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13] p-3">
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl border"
        style={{
          backgroundColor: location.color + '18',
          borderColor: location.color + '40',
        }}
      >
        <Icon name={getLocationIcon(location.name)} size={18} color={location.color} />
      </View>
      <Text className="flex-1 text-sm font-bold text-ink dark:text-[#F0EEE9]">{location.name}</Text>
      <View
        className="h-3.5 w-3.5 rounded-full"
        style={{ backgroundColor: location.color }}
      />
      <Pressable onPress={onDelete} hitSlop={8} className="h-9 w-9 items-center justify-center">
        <Icon name="trash" size={16} color={c.muted} />
      </Pressable>
    </View>
  );
}

import { useEffect, useState } from 'react';
import { ActivityIndicator, Share } from 'react-native';
import { Text, View, XStack, YStack } from 'tamagui';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useToast } from '../../contexts/ToastContext';
import { useHouseholdSettings } from '../../hooks/useHouseholdSettings';
import {
  canChangeHouseholdMemberRole,
  canLeaveHousehold,
  canRemoveHouseholdMember,
} from '../../lib/householdSettings';
import type { Role } from '../../types/household';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsBodyText } from './SettingsBodyText';
import { SettingsChoiceChip } from './SettingsChoiceChip';
import { SettingsFieldLabel } from './SettingsFieldLabel';
import { SettingsSurface } from './SettingsSurface';
import { SettingsTextField } from './SettingsTextField';
import { settingsFonts } from './settingsFonts';

const DIET_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Pescatarian', 'Halal', 'Kosher'];

type HouseholdSettingsController = ReturnType<typeof useHouseholdSettings>;

interface HouseholdSectionProps {
  /** Prefer a single screen-owned controller to avoid duplicate Firestore listeners. */
  settings: HouseholdSettingsController;
}

export function HouseholdSection({ settings }: HouseholdSectionProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const { user } = useAuth();
  const {
    household,
    role,
    canEdit,
    canManageMembers,
    isOwner,
    loading,
    error,
    pendingAction,
    leaveHousehold,
    savePreferences,
    changeRole,
    removeMember,
  } = settings;
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [draftAllergies, setDraftAllergies] = useState('');
  const [draftDiet, setDraftDiet] = useState<string[]>([]);

  useEffect(() => {
    if (!household) return;
    setDraftAllergies(household.allergies);
    setDraftDiet(household.dietaryPrefs);
  }, [household]);

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  if (loading) {
    return (
      <YStack style={{ alignItems: 'center', paddingVertical: s(24) }}>
        <ActivityIndicator color={c.ink} />
      </YStack>
    );
  }

  if (!household) {
    return (
      <SettingsBodyText>
        {error ?? 'Could not load household. Check your connection and try again.'}
      </SettingsBodyText>
    );
  }

  const members = household.members.map((uid) => ({
    uid,
    name: household.memberNames[uid] ?? 'Member',
    memberRole: household.memberRoles[uid] ?? 'editor',
  }));

  const shareInvite = async () => {
    if (!household.inviteCode) return;
    try {
      await Share.share({ message: `Join my Larderly household with code: ${household.inviteCode}` });
    } catch {
      showToast('Could not share invite code', 'error');
    }
  };

  const handleSave = async () => {
    if (!canEdit) {
      showToast('View-only members cannot edit preferences', 'warning');
      return;
    }
    try {
      await savePreferences(draftAllergies, draftDiet);
      showToast('Household preferences saved', 'success');
    } catch (err) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleChangeRole = async (uid: string, nextRole: Role) => {
    try {
      await changeRole(uid, nextRole);
      showToast('Role updated', 'success');
    } catch (err) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleRemove = async (uid: string, name: string) => {
    const ok = await confirm({
      title: `Remove ${name}?`,
      message: 'They will lose access to shared inventory.',
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      await removeMember(uid);
      showToast('Member removed', 'info');
    } catch (err) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const handleLeave = async () => {
    const ok = await confirm({
      title: 'Leave household?',
      message: 'You will lose access to shared inventory until you join again.',
      destructive: true,
      confirmLabel: 'Leave',
    });
    if (!ok) return;
    try {
      await leaveHousehold();
      showToast('Left household', 'info');
    } catch (err) {
      if (err instanceof Error) showToast(err.message, 'error');
    }
  };

  const prefsBusy = pendingAction === 'preferences';
  const leaveBusy = pendingAction === 'leave';
  const roleBusy = pendingAction === 'role' || pendingAction === 'remove';
  const canLeave = Boolean(user && canLeaveHousehold(user.uid, household.ownerId));

  return (
    <YStack style={{ gap: s(16) }}>
      <SettingsSurface contentStyle={{ padding: s(16), gap: s(12) }}>
        <SettingsTextField label="Household name" value={household.name} editable={false} />

        {household.inviteCode ? (
          <YStack style={{ gap: s(8) }}>
            <SettingsFieldLabel>Invite code</SettingsFieldLabel>
            <View
              style={{
                borderRadius: s(14),
                borderWidth: 1,
                borderColor: c.tint(c.accent, 0.36),
                backgroundColor: c.tint(c.accent, 0.1),
                paddingHorizontal: s(14),
                paddingVertical: s(12),
              }}
            >
              <Text
                style={{
                  fontFamily: settingsFonts.semibold,
                  fontSize: fs(20),
                  letterSpacing: fs(4),
                  color: c.accent,
                  flexShrink: 0,
                }}
              >
                {household.inviteCode}
              </Text>
            </View>
            <SettingsActionButton label="Share invite" onPress={() => void shareInvite()} />
          </YStack>
        ) : null}

        <SettingsBodyText>
          Your role: {role}
          {isOwner ? ' · Owner' : ''}
          {!canEdit ? ' · View only' : ''}
        </SettingsBodyText>
      </SettingsSurface>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Members</SettingsFieldLabel>
        {members.map((m) => {
          const canChangeRole =
            !!user &&
            canChangeHouseholdMemberRole({
              currentUid: user.uid,
              targetUid: m.uid,
              ownerId: household.ownerId,
              currentRole: role,
              canEdit,
              nextRole: 'editor',
            });
          const canRemove =
            !!user &&
            canRemoveHouseholdMember({
              currentUid: user.uid,
              targetUid: m.uid,
              ownerId: household.ownerId,
              currentRole: role,
              canEdit,
            });

          return (
            <SettingsSurface key={m.uid} contentStyle={{ padding: s(12), gap: s(10) }}>
              <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: s(8) }}>
                <YStack style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontFamily: settingsFonts.semibold,
                      fontSize: fs(14),
                      lineHeight: fs(19),
                      color: c.ink,
                      flexShrink: 0,
                    }}
                  >
                    {m.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: settingsFonts.regular,
                      fontSize: fs(12),
                      lineHeight: fs(16),
                      color: c.muted,
                      textTransform: 'capitalize',
                      flexShrink: 0,
                    }}
                  >
                    {m.memberRole}
                  </Text>
                </YStack>
              </XStack>
              {canManageMembers && (canChangeRole || canRemove) ? (
                <XStack style={{ flexWrap: 'wrap', gap: s(6), opacity: roleBusy ? 0.5 : 1 }}>
                  {(['editor', 'viewer'] as Role[]).map((r) => (
                    <SettingsChoiceChip
                      key={r}
                      label={r}
                      selected={m.memberRole === r}
                      disabled={roleBusy || !canChangeRole}
                      onPress={() => void handleChangeRole(m.uid, r)}
                    />
                  ))}
                  {canRemove ? (
                    <SettingsActionButton
                      label="Remove"
                      tone="danger"
                      disabled={roleBusy}
                      onPress={() => void handleRemove(m.uid, m.name)}
                      style={{ paddingHorizontal: s(10), paddingVertical: s(6), minHeight: undefined }}
                    />
                  ) : null}
                </XStack>
              ) : null}
            </SettingsSurface>
          );
        })}
      </YStack>

      <SettingsSurface contentStyle={{ padding: s(16), gap: s(12) }}>
        <SettingsFieldLabel>Household dietary prefs</SettingsFieldLabel>
        {!canEdit ? (
          <SettingsBodyText>View-only members cannot edit household preferences.</SettingsBodyText>
        ) : null}
        <XStack style={{ flexWrap: 'wrap', gap: s(8) }}>
          {DIET_OPTIONS.map((d) => (
            <SettingsChoiceChip
              key={d}
              label={d}
              selected={draftDiet.includes(d)}
              disabled={!canEdit || prefsBusy}
              onPress={() =>
                setDraftDiet((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
              }
            />
          ))}
        </XStack>

        <SettingsTextField
          label="Household allergies"
          value={draftAllergies}
          onChangeText={setDraftAllergies}
          editable={canEdit && !prefsBusy}
          multiline
        />

        {canEdit ? (
          <SettingsActionButton
            label={prefsBusy ? 'Saving…' : 'Save household prefs'}
            tone="primary"
            loading={prefsBusy}
            disabled={prefsBusy}
            onPress={() => void handleSave()}
          />
        ) : null}
      </SettingsSurface>

      {canLeave ? (
        <SettingsActionButton
          label={leaveBusy ? 'Leaving…' : 'Leave household'}
          tone="danger"
          loading={leaveBusy}
          disabled={leaveBusy}
          onPress={() => void handleLeave()}
        />
      ) : isOwner ? (
        <SettingsBodyText>
          Owners cannot leave. Transfer ownership or delete the household from another device when
          available.
        </SettingsBodyText>
      ) : null}
    </YStack>
  );
}

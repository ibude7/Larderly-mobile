import { View, Text, Pressable, Share } from 'react-native';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface HouseholdBannerProps {
  name: string;
  memberNames: Record<string, string>;
  members: string[];
  inviteCode?: string;
  itemCount: number;
  maxAvatars?: number;
}

function initials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function HouseholdBanner({
  name,
  memberNames,
  members,
  inviteCode,
  itemCount,
  maxAvatars = 4,
}: HouseholdBannerProps) {
  const c = useAppColors();
  const memberCount = members.length || 1;
  const shown = members.slice(0, maxAvatars);
  const overflow = members.length - shown.length;

  const shareInvite = async () => {
    if (!inviteCode) return;
    await Share.share({ message: `Join my Larderly household with code: ${inviteCode}` });
  };

  return (
    <View>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-3xl font-bold text-ink dark:text-[#F6F1EA]">{name}</Text>
          <Text className="mt-1 font-medium text-muted dark:text-[#9A948D]">
            {itemCount} items tracked
          </Text>
        </View>

        {inviteCode ? (
          <Pressable
            onPress={shareInvite}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            className="flex-row items-center gap-1.5 rounded-full px-3 py-2"
          >
            <View
              style={{
                backgroundColor: `${c.primary}1A`,
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="plus" size={14} color={c.primary} />
            </View>
            <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: c.primary }}>
              Invite
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        {/* Member avatar chips */}
        <View className="flex-row">
          {shown.map((uid, i) => {
            const isFirst = i === 0;
            return (
              <View
                key={uid}
                style={{
                  marginLeft: isFirst ? 0 : -8,
                  backgroundColor: i % 2 === 0 ? `${c.primary}30` : `${c.info}30`,
                  borderColor: c.line,
                  borderWidth: 1.5,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: shown.length - i,
                }}
              >
                <Text className="text-xs font-bold text-ink dark:text-[#F6F1EA]">
                  {initials(memberNames[uid] ?? 'M')}
                </Text>
              </View>
            );
          })}
          {overflow > 0 ? (
            <View
              style={{
                marginLeft: -8,
                backgroundColor: c.surface,
                borderColor: c.line,
                borderWidth: 1.5,
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-xs font-bold text-muted dark:text-[#9A948D]">
                +{overflow}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="rounded-full border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] px-3 py-1">
          <Text className="text-xs font-bold text-muted dark:text-[#9A948D]">
            {memberCount} member{memberCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>
    </View>
  );
}

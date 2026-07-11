import type { Role } from '../types/household';

export interface HouseholdSettingsData {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  allergies: string;
  dietaryPrefs: string[];
  members: string[];
  memberRoles: Record<string, Role>;
  memberNames: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isHouseholdRole(value: unknown): value is Role {
  return value === 'admin' || value === 'editor' || value === 'viewer';
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function readStringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

function readRoleMap(value: unknown): Record<string, Role> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, Role] => isHouseholdRole(entry[1])),
  );
}

export function parseHouseholdSettings(
  id: string,
  value: unknown,
): HouseholdSettingsData | null {
  if (!isRecord(value)) return null;

  return {
    id,
    name: readString(value.name),
    ownerId: readString(value.ownerId),
    inviteCode: readString(value.inviteCode),
    allergies: readString(value.allergies),
    dietaryPrefs: readStringArray(value.dietaryPrefs),
    members: readStringArray(value.members),
    memberRoles: readRoleMap(value.memberRoles),
    memberNames: readStringMap(value.memberNames),
  };
}

export function canManageHouseholdMembers(role: Role, canEdit: boolean): boolean {
  return canEdit && role === 'admin';
}

export function canChangeHouseholdMemberRole(input: {
  currentUid: string;
  targetUid: string;
  ownerId: string;
  currentRole: Role;
  canEdit: boolean;
  nextRole: Role;
}): boolean {
  return (
    canManageHouseholdMembers(input.currentRole, input.canEdit) &&
    input.currentUid !== input.targetUid &&
    input.ownerId !== input.targetUid &&
    isHouseholdRole(input.nextRole)
  );
}

export function canRemoveHouseholdMember(input: {
  currentUid: string;
  targetUid: string;
  ownerId: string;
  currentRole: Role;
  canEdit: boolean;
}): boolean {
  return (
    canManageHouseholdMembers(input.currentRole, input.canEdit) &&
    input.currentUid !== input.targetUid &&
    input.ownerId !== input.targetUid
  );
}

export function canLeaveHousehold(currentUid: string, ownerId: string): boolean {
  return Boolean(currentUid && ownerId && currentUid !== ownerId);
}

import {
  canChangeHouseholdMemberRole,
  canLeaveHousehold,
  canManageHouseholdMembers,
  canRemoveHouseholdMember,
  parseHouseholdSettings,
} from '../householdSettings';

describe('household settings guards', () => {
  it('allows only editable admins to manage members', () => {
    expect(canManageHouseholdMembers('admin', true)).toBe(true);
    expect(canManageHouseholdMembers('editor', true)).toBe(false);
    expect(canManageHouseholdMembers('viewer', false)).toBe(false);
  });

  it('protects the owner and current member from role and remove actions', () => {
    const base = {
      currentUid: 'admin',
      ownerId: 'owner',
      currentRole: 'admin' as const,
      canEdit: true,
    };

    expect(
      canChangeHouseholdMemberRole({ ...base, targetUid: 'member', nextRole: 'viewer' }),
    ).toBe(true);
    expect(
      canChangeHouseholdMemberRole({ ...base, targetUid: 'owner', nextRole: 'viewer' }),
    ).toBe(false);
    expect(
      canChangeHouseholdMemberRole({ ...base, targetUid: 'admin', nextRole: 'viewer' }),
    ).toBe(false);
    expect(canRemoveHouseholdMember({ ...base, targetUid: 'member' })).toBe(true);
    expect(canRemoveHouseholdMember({ ...base, targetUid: 'owner' })).toBe(false);
  });

  it('prevents the owner from leaving without blocking other roles', () => {
    expect(canLeaveHousehold('owner', 'owner')).toBe(false);
    expect(canLeaveHousehold('admin', 'owner')).toBe(true);
    expect(canLeaveHousehold('viewer', 'owner')).toBe(true);
  });
});

describe('parseHouseholdSettings', () => {
  it('filters malformed arrays and maps instead of trusting snapshot data', () => {
    expect(
      parseHouseholdSettings('household-1', {
        name: 'Home',
        ownerId: 'owner',
        members: ['owner', 42, 'member'],
        memberRoles: { owner: 'admin', member: 'invalid', stranger: 'viewer' },
        memberNames: { owner: 'Owner', member: null },
        dietaryPrefs: ['Vegan', false],
        allergies: 12,
      }),
    ).toEqual({
      id: 'household-1',
      name: 'Home',
      ownerId: 'owner',
      inviteCode: '',
      allergies: '',
      dietaryPrefs: ['Vegan'],
      members: ['owner', 'member'],
      memberRoles: { owner: 'admin', stranger: 'viewer' },
      memberNames: { owner: 'Owner' },
    });
  });

  it('rejects non-object snapshot data', () => {
    expect(parseHouseholdSettings('household-1', null)).toBeNull();
    expect(parseHouseholdSettings('household-1', [])).toBeNull();
  });
});

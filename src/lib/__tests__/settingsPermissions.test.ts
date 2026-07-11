import {
  canRequestPermission,
  normalizePermissionState,
  type SettingsPermissionSnapshot,
} from '../settingsPermissions';

describe('normalizePermissionState', () => {
  it('maps granted responses', () => {
    expect(normalizePermissionState({ granted: true, status: 'granted' }, 'camera')).toMatchObject({
      kind: 'camera',
      state: 'granted',
    });
  });

  it('maps limited photo access', () => {
    expect(
      normalizePermissionState({ status: 'granted', accessPrivileges: 'limited', canAskAgain: true }, 'photos'),
    ).toMatchObject({
      kind: 'photos',
      state: 'limited',
      canAskAgain: true,
    });
  });

  it('maps denied and undetermined statuses', () => {
    expect(normalizePermissionState({ status: 'denied', canAskAgain: false }, 'speech').state).toBe(
      'denied',
    );
    expect(normalizePermissionState({ status: 'undetermined' }, 'notifications').state).toBe(
      'undetermined',
    );
  });

  it('treats missing responses as unavailable', () => {
    expect(normalizePermissionState(null, 'camera').state).toBe('unavailable');
    expect(normalizePermissionState({ restricted: true }, 'camera').state).toBe('unavailable');
  });
});

describe('canRequestPermission', () => {
  const base = (overrides: Partial<SettingsPermissionSnapshot>): SettingsPermissionSnapshot => ({
    kind: 'camera',
    state: 'undetermined',
    canAskAgain: true,
    canOpenSettings: true,
    ...overrides,
  });

  it('allows prompting only when undetermined/denied and canAskAgain', () => {
    expect(canRequestPermission(base({ state: 'undetermined', canAskAgain: true }))).toBe(true);
    expect(canRequestPermission(base({ state: 'denied', canAskAgain: true }))).toBe(true);
    expect(canRequestPermission(base({ state: 'denied', canAskAgain: false }))).toBe(false);
    expect(canRequestPermission(base({ state: 'granted' }))).toBe(false);
    expect(canRequestPermission(base({ state: 'unavailable' }))).toBe(false);
  });
});

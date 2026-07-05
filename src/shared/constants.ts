export const IMAGE_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export interface DefaultStorageLocation {
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_STORAGE_LOCATIONS: DefaultStorageLocation[] = [
  { name: 'Pantry', icon: 'warehouse', color: '#f59e0b' },
  { name: 'Fridge', icon: 'thermometer', color: '#3b82f6' },
  { name: 'Freezer', icon: 'snowflake', color: '#06b6d4' },
  { name: 'Cabinet', icon: 'layout-grid', color: '#8b5cf6' },
  { name: 'Other', icon: 'layout-grid', color: '#8b5cf6' },
];

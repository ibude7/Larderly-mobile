export type Role = 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  dietaryPreferences: string[];
  personalAllergies: string;
  preferredStores: string[];
  onboardingCompleted: boolean;
  notificationPrefs?: Record<string, unknown>;
  timezone?: string;
}

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  memberRoles: Record<string, Role>;
  memberNames: Record<string, string>;
  inviteCode?: string;
  dietaryPrefs?: string[];
  allergies?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  storageLocation: string;
  expirationDate?: number;
  barcode?: string;
  brand?: string;
  category?: string;
  pricePerUnit?: number;
  unit?: string;
  notes?: string;
  imageUrl?: string;
  lowStockThreshold?: number;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  addedBy?: string;
  locationId?: string;
}

export interface ShoppingListMeta {
  id: string;
  name: string;
  budget?: number;
  totalSpent?: number;
  isRecurring?: boolean;
  isTemplate?: boolean;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly' | '';
  store?: string;
  archivedAt?: number | null;
}

export interface HouseholdShoppingItem {
  id: string;
  productName: string;
  quantity: number;
  purchased: boolean;
  estimatedPrice: number;
  unit?: string;
  category?: string;
  notes?: string;
  barcode?: string;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'time' | 'location' | 'recipe' | 'recurring';
  time?: number;
  location?: string;
  recipeId?: string;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly';
  completed: boolean;
}

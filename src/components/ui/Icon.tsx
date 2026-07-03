import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Semantic icon names used across Larderly, mapped to Ionicons glyphs.
 * The web app used a mix of hand-drawn SVG glyphs and lucide icons; on RN we
 * consolidate onto Ionicons (ships with Expo, comprehensive coverage) behind
 * these stable semantic names so screens stay decoupled from the icon set.
 */
export type IconName =
  | 'dashboard'
  | 'pantry'
  | 'scanner'
  | 'shopping'
  | 'meals'
  | 'settings'
  | 'add'
  | 'close'
  | 'check'
  | 'checkmark-done'
  | 'trash'
  | 'edit'
  | 'search'
  | 'camera'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-up'
  | 'warning'
  | 'info'
  | 'success'
  | 'error'
  | 'minus'
  | 'plus'
  | 'sparkles'
  | 'refresh'
  | 'logout'
  | 'user'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'snowflake'
  | 'thermometer'
  | 'grid'
  | 'warehouse'
  | 'bell'
  | 'star'
  | 'flash'
  | 'clock'
  | 'tag'
  | 'more'
  | 'flame'
  | 'leaf'
  | 'calendar'
  | 'cart'
  | 'box'
  | 'chef'
  | 'google'
  | 'apple'
  | 'alert'
  | 'trending-down'
  | 'send'
  | 'image'
  | 'download'
  | 'share'
  | 'mic'
  | 'nutrition'
  | 'flask'
  | 'sad'
  // Category glyphs
  | 'beverages'
  | 'bakery'
  | 'cereal'
  | 'canned'
  | 'condiments'
  | 'dairy'
  | 'deli'
  | 'frozen'
  | 'fruits'
  | 'grains'
  | 'household'
  | 'seafood'
  | 'snacks'
  | 'personalcare'
  | 'produce'
  | 'spices'
  | 'sweets'
  | 'vegetables'
  | 'winery'
  | 'wine'
  // Location glyphs
  | 'fridge'
  | 'freezer'
  | 'shelf'
  | 'location'
  // Meal-type glyphs
  | 'sunny'
  | 'moon'
  | 'egg';

const MAP: Record<IconName, IoniconName> = {
  dashboard: 'home',
  pantry: 'cube',
  scanner: 'barcode',
  shopping: 'cart',
  meals: 'restaurant',
  settings: 'settings',
  add: 'add',
  close: 'close',
  check: 'checkmark',
  'checkmark-done': 'checkmark-done',
  trash: 'trash',
  edit: 'create',
  search: 'search',
  camera: 'camera',
  'chevron-right': 'chevron-forward',
  'chevron-down': 'chevron-down',
  'chevron-left': 'chevron-back',
  'chevron-up': 'chevron-up',
  warning: 'warning',
  info: 'information-circle',
  success: 'checkmark-circle',
  error: 'close-circle',
  minus: 'remove',
  plus: 'add',
  sparkles: 'sparkles',
  refresh: 'refresh',
  logout: 'log-out',
  user: 'person',
  mail: 'mail',
  lock: 'lock-closed',
  eye: 'eye',
  'eye-off': 'eye-off',
  snowflake: 'snow',
  thermometer: 'thermometer',
  grid: 'grid',
  warehouse: 'file-tray-stacked',
  bell: 'notifications',
  star: 'star',
  flash: 'flash',
  clock: 'time',
  tag: 'pricetag',
  more: 'ellipsis-horizontal',
  flame: 'flame',
  leaf: 'leaf',
  calendar: 'calendar',
  cart: 'cart',
  box: 'cube',
  chef: 'restaurant',
  google: 'logo-google',
  apple: 'logo-apple',
  alert: 'alert-circle',
  'trending-down': 'trending-down',
  send: 'send',
  image: 'image',
  download: 'download',
  share: 'share-outline',
  mic: 'mic',
  nutrition: 'nutrition',
  flask: 'flask',
  sad: 'sad-outline',
  // Category glyphs
  beverages: 'cafe',
  bakery: 'fast-food',
  cereal: 'nutrition',
  canned: 'file-tray',
  condiments: 'water',
  dairy: 'egg',
  deli: 'restaurant',
  frozen: 'snow',
  fruits: 'nutrition',
  grains: 'nutrition',
  household: 'home',
  seafood: 'fish',
  snacks: 'fast-food',
  personalcare: 'heart',
  produce: 'leaf',
  spices: 'flame',
  sweets: 'ice-cream',
  vegetables: 'leaf',
  winery: 'wine',
  wine: 'wine',
  // Location glyphs
  fridge: 'thermometer',
  freezer: 'snow',
  shelf: 'file-tray-stacked',
  location: 'location',
  // Meal-type glyphs
  sunny: 'sunny',
  moon: 'moon',
  egg: 'egg',
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = colors.ink }: IconProps) {
  return <Ionicons name={MAP[name] ?? 'ellipse'} size={size} color={color} />;
}

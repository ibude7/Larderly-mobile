import React from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import {
  AlertTriangle,
  Apple,
  Archive,
  BeefIcon,
  Bell,
  BottleWineIcon,
  Box,
  Calendar,
  Camera,
  Candy,
  Carrot,
  Check,
  CheckCheck,
  ChefHat,
  Cherry,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Croissant,
  CupSoda,
  Download,
  Droplet,
  Egg,
  Ellipsis,
  Eye,
  EyeOff,
  Fish,
  Flame,
  FlaskConical,
  Frown,
  GoogleIcon,
  Heart,
  House,
  Image,
  Information,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Leaf,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Mic,
  Milk,
  Minus,
  Moon,
  Package,
  Pencil,
  Plus,
  Popcorn,
  Refrigerator,
  Refresh,
  Salad,
  ScanBarcode,
  Search,
  Send,
  Settings,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tag,
  Thermometer,
  Trash2,
  TrendingDown,
  User,
  UtensilsCrossed,
  Warehouse,
  WheatIcon,
  X,
  Zap,
} from '@hugeicons/core-free-icons';
import { useAppColors } from '../../hooks/useAppColors';

/**
 * Semantic icon names used across Larderly, mapped to Hugeicons glyphs
 * (bold 2.5 stroke).
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
  | 'sun'
  | 'moon'
  | 'phone'
  | 'egg';

const MAP: Record<IconName, IconSvgElement> = {
  dashboard: LayoutDashboard,
  pantry: Archive,
  scanner: ScanBarcode,
  shopping: ShoppingBag,
  meals: UtensilsCrossed,
  settings: Settings,
  add: Plus,
  close: X,
  check: Check,
  'checkmark-done': CheckCheck,
  trash: Trash2,
  edit: Pencil,
  search: Search,
  camera: Camera,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  warning: AlertTriangle,
  info: Information,
  success: CircleCheck,
  error: CircleX,
  minus: Minus,
  plus: Plus,
  sparkles: Sparkles,
  refresh: Refresh,
  logout: LogOut,
  user: User,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  'eye-off': EyeOff,
  snowflake: Snowflake,
  thermometer: Thermometer,
  grid: LayoutGrid,
  warehouse: Warehouse,
  bell: Bell,
  star: Star,
  flash: Zap,
  clock: Clock,
  tag: Tag,
  more: Ellipsis,
  flame: Flame,
  leaf: Leaf,
  calendar: Calendar,
  cart: ShoppingCart,
  box: Box,
  chef: ChefHat,
  google: GoogleIcon,
  apple: Apple,
  alert: CircleAlert,
  'trending-down': TrendingDown,
  send: Send,
  image: Image,
  download: Download,
  share: Share2,
  mic: Mic,
  nutrition: Apple,
  flask: FlaskConical,
  sad: Frown,
  // Category glyphs
  beverages: CupSoda,
  bakery: Croissant,
  cereal: WheatIcon,
  canned: Package,
  condiments: Droplet,
  dairy: Milk,
  deli: BeefIcon,
  frozen: Snowflake,
  fruits: Cherry,
  grains: WheatIcon,
  household: House,
  seafood: Fish,
  snacks: Popcorn,
  personalcare: Heart,
  produce: Carrot,
  spices: Flame,
  sweets: Candy,
  vegetables: Salad,
  winery: BottleWineIcon,
  wine: BottleWineIcon,
  // Location glyphs
  fridge: Refrigerator,
  freezer: Snowflake,
  shelf: Layers,
  location: MapPin,
  // Meal-type glyphs
  sunny: Sun,
  sun: Sun,
  moon: Moon,
  phone: Smartphone,
  egg: Egg,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color }: IconProps) {
  const c = useAppColors();
  const resolved = color ?? c.ink;
  const glyph = MAP[name] ?? Box;

  return <HugeiconsIcon icon={glyph} size={size} color={resolved} strokeWidth={2.5} />;
}

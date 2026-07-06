import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  LayoutDashboard, Archive, ScanBarcode, ShoppingBag, UtensilsCrossed, Settings, Plus, X,
  Check, CheckCheck, Trash2, Pencil, Search, Camera, ChevronRight, ChevronDown, ChevronLeft,
  ChevronUp, TriangleAlert, Info, CircleCheck, CircleX, Minus, Sparkles, RefreshCw, LogOut,
  User, Mail, Lock, Eye, EyeOff, Snowflake, Thermometer, LayoutGrid, Warehouse, Bell, Star,
  Zap, Clock, Tag, Ellipsis, Flame, Leaf, Calendar, ShoppingCart, Box, ChefHat, CircleAlert,
  TrendingDown, Send, Image, Download, Share2, Mic, Apple, FlaskConical, Frown, CupSoda,
  Croissant, Wheat, Package, Droplet, Milk, Beef, Cherry, House, Fish, Popcorn, Heart,
  Carrot, Candy, Salad, Wine, Refrigerator, Layers, MapPin, Sun, Moon, Smartphone, Egg,
  type LucideIcon,
} from 'lucide-react-native';
import { useAppColors } from '../../hooks/useAppColors';

/**
 * Semantic icon names used across Larderly, mapped to lucide glyphs
 * (bold 2.5 stroke — Orchard OS design system). Brand logos stay on Ionicons.
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

const MAP: Record<Exclude<IconName, 'google' | 'apple'>, LucideIcon> = {
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
  warning: TriangleAlert,
  info: Info,
  success: CircleCheck,
  error: CircleX,
  minus: Minus,
  plus: Plus,
  sparkles: Sparkles,
  refresh: RefreshCw,
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
  cereal: Wheat,
  canned: Package,
  condiments: Droplet,
  dairy: Milk,
  deli: Beef,
  frozen: Snowflake,
  fruits: Cherry,
  grains: Wheat,
  household: House,
  seafood: Fish,
  snacks: Popcorn,
  personalcare: Heart,
  produce: Carrot,
  spices: Flame,
  sweets: Candy,
  vegetables: Salad,
  winery: Wine,
  wine: Wine,
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

  if (name === 'google') return <Ionicons name="logo-google" size={size} color={resolved} />;
  if (name === 'apple') return <Ionicons name="logo-apple" size={size} color={resolved} />;

  const LucideGlyph = MAP[name] ?? Box;
  return <LucideGlyph size={size} color={resolved} strokeWidth={2.5} />;
}

import React from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react-native';
import {
  Activity as ActivityIcon,
  AlertCircle as AlertCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Apple as AppleIcon,
  Archive as ArchiveIcon,
  BadgeInfo as BadgeInfoIcon,
  BeefIcon,
  Bell as BellIcon,
  BookOpen as BookOpenIcon,
  BottleWineIcon,
  Box as BoxIcon,
  Calendar as CalendarIcon,
  CalendarClock as CalendarClockIcon,
  Camera as CameraIcon,
  Candy as CandyIcon,
  Carrot as CarrotIcon,
  Check as CheckIcon,
  CheckCheck as CheckCheckIcon,
  CheckCircle as CheckCircleIcon,
  ChefHat as ChefHatIcon,
  Cherry as CherryIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronUp as ChevronUpIcon,
  CircleAlert as CircleAlertIcon,
  CircleCheck as CircleCheckIcon,
  CircleX as CircleXIcon,
  ClipboardCopy as ClipboardCopyIcon,
  Clock as ClockIcon,
  Clock3 as Clock3Icon,
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Coins as CoinsIcon,
  Croissant as CroissantIcon,
  CupSoda as CupSodaIcon,
  Database as DatabaseIcon,
  Download as DownloadIcon,
  Droplet as DropletIcon,
  Egg as EggIcon,
  Ellipsis as EllipsisIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  FileText as FileTextIcon,
  Fingerprint as FingerprintIcon,
  Fish as FishIcon,
  Flame as FlameIcon,
  FlaskConical as FlaskConicalIcon,
  Frown as FrownIcon,
  Globe02Icon,
  Heart as HeartIcon,
  HelpCircleIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  House as HouseIcon,
  Image as ImageIcon,
  Images as ImagesIcon,
  Information as InformationIcon,
  KeyRound as KeyRoundIcon,
  Laptop as LaptopIcon,
  Layers as LayersIcon,
  LayoutDashboard as LayoutDashboardIcon,
  LayoutGrid as LayoutGridIcon,
  Leaf as LeafIcon,
  Lock as LockIcon,
  LogOut as LogOutIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Mic02Icon,
  Milk as MilkIcon,
  Minus as MinusIcon,
  Moon as MoonIcon,
  Package as PackageIcon,
  PackageMinus as PackageMinusIcon,
  Palette as PaletteIcon,
  Pencil as PencilIcon,
  Plus as PlusIcon,
  Popcorn as PopcornIcon,
  Refrigerator as RefrigeratorIcon,
  Refresh as RefreshIcon,
  RotateCcw as RotateCcwIcon,
  Ruler as RulerIcon,
  Salad as SaladIcon,
  Scale as ScaleIcon,
  ScanBarcode as ScanBarcodeIcon,
  ScanLine as ScanLineIcon,
  ScrollText as ScrollTextIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Share2 as Share2Icon,
  ShieldCheck as ShieldCheckIcon,
  ShieldX as ShieldXIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingBasket as ShoppingBasketIcon,
  ShoppingCart as ShoppingCartIcon,
  SlidersHorizontal as SlidersHorizontalIcon,
  Smartphone as SmartphoneIcon,
  Snowflake as SnowflakeIcon,
  Sparkles as SparklesIcon,
  Star as StarIcon,
  Stethoscope as StethoscopeIcon,
  Sun as SunIcon,
  Tag as TagIcon,
  Thermometer as ThermometerIcon,
  Trash2 as Trash2Icon,
  TrendingDown as TrendingDownIcon,
  Trophy as TrophyIcon,
  Type as TypeIcon,
  User as UserIcon,
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
  UtensilsCrossed as UtensilsCrossedIcon,
  VibrateIcon,
  Volume2 as Volume2Icon,
  Wallet as WalletIcon,
  Warehouse as WarehouseIcon,
  WheatIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  X as XIcon,
  Zap as ZapIcon,
  ZapOff as ZapOffIcon,
} from '@hugeicons/core-free-icons';

export type { IconSvgElement };

export interface GlyphProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Lucide-compatible icon component backed by Hugeicons. */
export type GlyphIcon = React.ComponentType<GlyphProps>;

export function createGlyph(icon: IconSvgElement): GlyphIcon {
  const Glyph = ({ size = 24, color = '#000000', strokeWidth = 2 }: GlyphProps) => (
    <HugeiconsIcon icon={icon} size={size} color={color} strokeWidth={strokeWidth} />
  );
  Glyph.displayName = 'Glyph';
  return Glyph;
}

const g = createGlyph;

export const Activity = g(ActivityIcon);
export const AlertCircle = g(AlertCircleIcon);
export const Apple = g(AppleIcon);
export const Archive = g(ArchiveIcon);
export const BadgeInfo = g(BadgeInfoIcon);
export const Beef = g(BeefIcon);
export const Bell = g(BellIcon);
export const BookOpen = g(BookOpenIcon);
export const Box = g(BoxIcon);
export const Calendar = g(CalendarIcon);
export const CalendarClock = g(CalendarClockIcon);
export const Camera = g(CameraIcon);
export const Candy = g(CandyIcon);
export const Carrot = g(CarrotIcon);
export const Check = g(CheckIcon);
export const CheckCheck = g(CheckCheckIcon);
export const CheckCircle2 = g(CheckCircleIcon);
export const ChefHat = g(ChefHatIcon);
export const Cherry = g(CherryIcon);
export const ChevronDown = g(ChevronDownIcon);
export const ChevronLeft = g(ChevronLeftIcon);
export const ChevronRight = g(ChevronRightIcon);
export const ChevronUp = g(ChevronUpIcon);
export const CircleAlert = g(CircleAlertIcon);
export const CircleCheck = g(CircleCheckIcon);
export const CircleHelp = g(HelpCircleIcon);
export const CircleX = g(CircleXIcon);
export const ClipboardCopy = g(ClipboardCopyIcon);
export const Clock = g(ClockIcon);
export const Clock3 = g(Clock3Icon);
export const Cloud = g(CloudIcon);
export const CloudOff = g(CloudOffIcon);
export const Coins = g(CoinsIcon);
export const Croissant = g(CroissantIcon);
export const CupSoda = g(CupSodaIcon);
export const Database = g(DatabaseIcon);
export const Download = g(DownloadIcon);
export const Droplet = g(DropletIcon);
export const Egg = g(EggIcon);
export const Ellipsis = g(EllipsisIcon);
export const Eye = g(EyeIcon);
export const EyeOff = g(EyeOffIcon);
export const FileText = g(FileTextIcon);
export const Fingerprint = g(FingerprintIcon);
export const Fish = g(FishIcon);
export const Flame = g(FlameIcon);
export const FlaskConical = g(FlaskConicalIcon);
export const Frown = g(FrownIcon);
export const Globe2 = g(Globe02Icon);
export const Heart = g(HeartIcon);
export const History = g(HistoryIcon);
export const Home = g(HomeIcon);
export const House = g(HouseIcon);
export const Image = g(ImageIcon);
export const Images = g(ImagesIcon);
export const Info = g(InformationIcon);
export const KeyRound = g(KeyRoundIcon);
export const Laptop = g(LaptopIcon);
export const Layers = g(LayersIcon);
export const LayoutDashboard = g(LayoutDashboardIcon);
export const LayoutGrid = g(LayoutGridIcon);
export const Leaf = g(LeafIcon);
export const Lock = g(LockIcon);
export const LogOut = g(LogOutIcon);
export const Mail = g(MailIcon);
export const MapPin = g(MapPinIcon);
export const Mic2 = g(Mic02Icon);
export const Milk = g(MilkIcon);
export const Minus = g(MinusIcon);
export const Moon = g(MoonIcon);
export const Package = g(PackageIcon);
export const PackageMinus = g(PackageMinusIcon);
export const Palette = g(PaletteIcon);
export const Pencil = g(PencilIcon);
export const Plus = g(PlusIcon);
export const Popcorn = g(PopcornIcon);
export const Refrigerator = g(RefrigeratorIcon);
export const RefreshCw = g(RefreshIcon);
export const RotateCcw = g(RotateCcwIcon);
export const Ruler = g(RulerIcon);
export const Salad = g(SaladIcon);
export const Scale = g(ScaleIcon);
export const ScanBarcode = g(ScanBarcodeIcon);
export const ScanLine = g(ScanLineIcon);
export const ScrollText = g(ScrollTextIcon);
export const Search = g(SearchIcon);
export const Send = g(SendIcon);
export const Settings = g(SettingsIcon);
export const Share2 = g(Share2Icon);
export const ShieldCheck = g(ShieldCheckIcon);
export const ShieldX = g(ShieldXIcon);
export const ShoppingBag = g(ShoppingBagIcon);
export const ShoppingBasket = g(ShoppingBasketIcon);
export const ShoppingCart = g(ShoppingCartIcon);
export const SlidersHorizontal = g(SlidersHorizontalIcon);
export const Smartphone = g(SmartphoneIcon);
export const Snowflake = g(SnowflakeIcon);
export const Sparkles = g(SparklesIcon);
export const Star = g(StarIcon);
export const Stethoscope = g(StethoscopeIcon);
export const Sun = g(SunIcon);
export const Tag = g(TagIcon);
export const Thermometer = g(ThermometerIcon);
export const Trash2 = g(Trash2Icon);
export const TrendingDown = g(TrendingDownIcon);
export const TriangleAlert = g(AlertTriangleIcon);
export const Trophy = g(TrophyIcon);
export const Type = g(TypeIcon);
export const User = g(UserIcon);
export const UserPlus = g(UserPlusIcon);
export const Users = g(UsersIcon);
export const UtensilsCrossed = g(UtensilsCrossedIcon);
export const Vibrate = g(VibrateIcon);
export const Volume2 = g(Volume2Icon);
export const Wallet = g(WalletIcon);
export const Warehouse = g(WarehouseIcon);
export const Wheat = g(WheatIcon);
export const Wifi = g(WifiIcon);
export const WifiOff = g(WifiOffIcon);
export const Wine = g(BottleWineIcon);
export const X = g(XIcon);
export const Zap = g(ZapIcon);
export const ZapOff = g(ZapOffIcon);

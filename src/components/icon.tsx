import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  ArrowUUpLeftIcon,
  CalendarCheckIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  CreditCardIcon,
  GearSixIcon,
  InfoIcon,
  LightbulbIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PiggyBankIcon,
  PowerIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  ShieldSlashIcon,
  SignOutIcon,
  SquaresFourIcon,
  TrashIcon,
  WalletIcon,
  WarningIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react/ssr";

const ICONS = {
  "arrow-counter-clockwise": ArrowCounterClockwiseIcon,
  "arrow-right": ArrowRightIcon,
  "arrow-u-up-left": ArrowUUpLeftIcon,
  "calendar-check": CalendarCheckIcon,
  "caret-down": CaretDownIcon,
  "caret-left": CaretLeftIcon,
  "caret-right": CaretRightIcon,
  "check-circle": CheckCircleIcon,
  check: CheckIcon,
  "clock-counter-clockwise": ClockCounterClockwiseIcon,
  "credit-card": CreditCardIcon,
  "gear-six": GearSixIcon,
  info: InfoIcon,
  lightbulb: LightbulbIcon,
  "magnifying-glass": MagnifyingGlassIcon,
  "pencil-simple": PencilSimpleIcon,
  "piggy-bank": PiggyBankIcon,
  power: PowerIcon,
  receipt: ReceiptIcon,
  "shield-check": ShieldCheckIcon,
  "shield-slash": ShieldSlashIcon,
  "sign-out": SignOutIcon,
  "squares-four": SquaresFourIcon,
  trash: TrashIcon,
  wallet: WalletIcon,
  warning: WarningIcon,
  "warning-octagon": WarningOctagonIcon,
};

export type IconName = keyof typeof ICONS;

/** Ícone Phosphor no peso duotone (o único usado no sistema Broadsheet). */
export function Icon({ name, size = 18, className, style }: { name: IconName; size?: number; className?: string; style?: React.CSSProperties }) {
  const Component = ICONS[name];
  return <Component weight="duotone" size={size} className={className} style={style} aria-hidden="true" />;
}

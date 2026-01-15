'use client';

import {
  ArrowRight,
  ArrowsClockwise,
  ArrowsInSimple,
  Binary,
  BracketsCurly,
  CaretDown,
  CaretRight,
  CaretUp,
  ChartBar,
  ChartLine,
  Chat,
  Check,
  CheckCircle,
  Circle,
  CircleNotch,
  Clock,
  ClockCounterClockwise,
  Code,
  Command,
  Copy,
  Database,
  DownloadSimple,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Faders,
  File,
  FileCode,
  FileText,
  FileX,
  Fingerprint,
  FloppyDisk,
  Folder,
  Gear,
  GitDiff,
  GithubLogo,
  Globe,
  HardDrives,
  Hash,
  IdentificationBadge,
  Image,
  Info,
  Key,
  Lightning,
  Link,
  Lock,
  LockOpen,
  MagnifyingGlass,
  Moon,
  Palette,
  PencilSimple,
  Play,
  Quotes,
  Scan,
  Shield,
  Sparkle,
  Sun,
  TextT,
  Timer,
  ToggleLeft,
  Trash,
  TwitterLogo,
  UploadSimple,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react';

interface IconProps {
  name: string;
  className?: string;
  size?: number | string;
  /** Accessible label for the icon. If provided, the icon is treated as meaningful content. */
  'aria-label'?: string;
  /** If true, the icon is hidden from assistive technologies. Defaults to true for decorative icons. */
  'aria-hidden'?: boolean;
}

export function Icon({
  name,
  className,
  size = 24,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
}: IconProps) {
  const iconName = name as keyof typeof ICON_MAP;

  if (!ICON_MAP[iconName]) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return <span className={`inline-block ${className}`}>⚡</span>;
  }

  const IconComponent = ICON_MAP[iconName];

  // If aria-label is provided, the icon is meaningful; otherwise, it's decorative
  const isDecorative = !ariaLabel;
  const hidden = ariaHidden ?? isDecorative;

  return (
    <IconComponent
      className={className}
      size={size}
      weight="regular"
      aria-hidden={hidden}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
}

const ICON_MAP = {
  ArrowRight,
  ArrowsClockwise,
  ArrowsInSimple,
  Binary,
  BracketsCurly,
  CaretDown,
  CaretRight,
  CaretUp,
  ChartBar,
  ChartLine,
  Chat,
  Check,
  CheckCircle,
  Circle,
  CircleNotch,
  Clock,
  ClockCounterClockwise,
  Code,
  Command,
  Copy,
  Database,
  DownloadSimple,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Faders,
  File,
  FileCode,
  FileText,
  FileX,
  FloppyDisk,
  Folder,
  Fingerprint,
  Gear,
  GitDiff,
  Globe,
  GithubLogo,
  HardDrives,
  Hash,
  IdentificationBadge,
  Image,
  Info,
  Key,
  Lightning,
  Link,
  Lock,
  LockOpen,
  MagnifyingGlass,
  Moon,
  PencilSimple,
  Palette,
  Play,
  Quotes,
  Scan,
  Shield,
  Sparkle,
  Sun,
  TextT,
  Timer,
  ToggleLeft,
  Trash,
  TwitterLogo,
  WarningCircle,
  UploadSimple,
  X,
  XCircle,
} as const;

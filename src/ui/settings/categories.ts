// Per-category presentation: label, an accent color (always a token), and the
// icon shown in a plugin's list row. Colors are semantic, never gradients.

import type { PluginCategory } from "../../core/plugin";
import {
  AppearanceIcon,
  CodeIcon,
  EllipsisIcon,
  MessageIcon,
  ShieldIcon,
  SlidersIcon,
  SpeakerIcon,
  type IconProps
} from "../../icons";

export interface CategoryMeta {
  label: string;
  /** CSS variable reference used as the icon tile background. */
  color: string;
  Icon: (props: IconProps) => React.ReactElement;
}

export const CATEGORIES: Record<PluginCategory, CategoryMeta> = {
  utility: { label: "实用工具", color: "var(--hc-accent)", Icon: SlidersIcon },
  chat: { label: "聊天", color: "var(--hc-green)", Icon: MessageIcon },
  voice: { label: "语音", color: "var(--hc-indigo)", Icon: SpeakerIcon },
  appearance: { label: "外观", color: "var(--hc-pink)", Icon: AppearanceIcon },
  privacy: { label: "隐私", color: "var(--hc-teal)", Icon: ShieldIcon },
  developer: { label: "开发者", color: "var(--hc-orange)", Icon: CodeIcon },
  misc: { label: "其他", color: "var(--hc-fill-primary)", Icon: EllipsisIcon }
};

export const CATEGORY_ORDER: PluginCategory[] = [
  "utility",
  "chat",
  "voice",
  "appearance",
  "privacy",
  "developer",
  "misc"
];

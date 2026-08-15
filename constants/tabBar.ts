import { spacing } from '@/theme/tokens';

/** Floating tab bar layout — see documentation/design-system.md §3.10 (revised). */
export const TAB_BAR_EXPANDED_HEIGHT = 76;
export const TAB_BAR_COMPACT_HEIGHT = 52;
export const TAB_BAR_FLOAT_OFFSET = spacing.lg;
export const TAB_BAR_WIDTH_RATIO = 0.94;
export const TAB_BAR_ICON_EXPANDED = 28;
export const TAB_BAR_ICON_COMPACT = 22;
export const TAB_BAR_ICON_GAP_EXPANDED = spacing.xl;
export const TAB_BAR_ICON_GAP_COMPACT = spacing.lg;
export const TAB_BAR_PADDING_H_EXPANDED = spacing.xl;
export const TAB_BAR_PADDING_H_COMPACT = spacing.lg;
export const TAB_BAR_HIT_SLOP = 52;

export const TAB_BAR_SCROLL_DOWN_THRESHOLD = 12;
export const TAB_BAR_SCROLL_JITTER = 4;
export const TAB_BAR_SCROLL_REST_MS = 400;

/** Bottom inset for scroll content: float offset + expanded height + breathing room. */
export const TAB_BAR_CONTENT_EXTRA = spacing.lg;

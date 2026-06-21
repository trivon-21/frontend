/**
 * Table Design Tokens
 * UNIFIED table styling for entire application.
 *
 * IMPORTANT: All color values reference colorTokens — the Single Source of Truth.
 * If the brand palette changes, update colors.tokens.ts and all tables update automatically.
 *
 * APPROXIMATION NOTES (values consolidated from a prior Tailwind-slate palette):
 *
 * | Previous Raw Value | Token Used                       | Delta / Note                                       |
 * |--------------------|----------------------------------|----------------------------------------------------|
 * | #f8fbff (header bg)| backgrounds.page (#F9FAFB)       | Near-identical; imperceptible difference           |
 * | #1e40af (header fg)| semantic.info (#1D61FF)          | Different blue tone; blue-800→brand-blue. Revisit. |
 * | #eff6ff (hdr brd)  | semantic.infoLight (#eff6ff)     | Exact match                                        |
 * | #475569 (cell fg)  | text.secondary (#5C646D)         | Slate-600→brand-neutral; slight hue shift          |
 * | #f3f4f6 (cell brd) | borders.light (#e5e7eb)          | Very close; imperceptible                          |
 * | #f9fafb (row hover)| backgrounds.hover (#f3f4f6)      | Near-identical off-white                           |
 * | #f0fdf4 (selected) | backgrounds.selected (#E8FDF0)   | Both are light green; slight shade shift           |
 * | #16a34a (pill fg)  | semantic.success (#00843D)       | Green-600→brand-green; intentional consolidation   |
 * | #ea580c (pill fg)  | semantic.warning (#f59e0b)       | Orange-600→amber; slight hue shift                 |
 * | #3b82f6 (pill fg)  | semantic.info (#1D61FF)          | Blue-500→brand-blue; slight hue shift              |
 * | #dc2626 (pill fg)  | semantic.error (#C20E0E)         | Red-600→brand-red; slight hue shift                |
 * | #6b7280 (page fg)  | text.muted (#9ca3af)             | Slight lightness shift; acceptable                 |
 */

import { colorTokens } from './colors.tokens';

export interface TableHeaderConfig {
  background: string;
  color: string;
  fontSize: string;
  fontWeight: number;
  padding: string;
  borderBottom: string;
  textAlign?: string;
  letterSpacing?: string;
  textTransform?: string;
}

export interface TableCellConfig {
  padding: string;
  fontSize: string;
  color: string;
  borderBottom: string;
  verticalAlign: string;
}

export interface TableRowConfig {
  hover?: {
    background?: string;
  };
  selected?: {
    background?: string;
  };
}

export interface StatusPillConfig {
  padding: string;
  borderRadius: string;
  fontSize: string;
  fontWeight: number;
  background: string;
  color: string;
  display?: string;
  whiteSpace?: string;
}

export interface StatusPills {
  approved: StatusPillConfig;
  draft: StatusPillConfig;
  pending: StatusPillConfig;
  inProgress: StatusPillConfig;
  rejected: StatusPillConfig;
  completed: StatusPillConfig;
  onHold: StatusPillConfig;
}

export interface PaginationConfig {
  color: string;
  fontSize: string;
}

export interface TableTokens {
  header: TableHeaderConfig;
  cell: TableCellConfig;
  row: TableRowConfig;
  statusPills: StatusPills;
  pagination: PaginationConfig;
}

/**
 * UNIVERSAL Table Tokens
 * All colors reference colorTokens. See approximation notes at top of file.
 */
const universalTableTokens: TableTokens = {
  header: {
    // NOTE: Previous value #f8fbff (light blue tint). backgrounds.page (#F9FAFB) is near-identical.
    background: colorTokens.backgrounds.page,
    // NOTE: Previous value #1e40af (Tailwind Blue-800). Brand uses semantic.info (#1D61FF).
    // This consolidates to the brand blue. If a darker blue is needed, add a token to colorTokens.
    color: colorTokens.semantic.info,
    fontSize: '12px',
    fontWeight: 700,
    padding: '20px 24px',
    // NOTE: semantic.infoLight (#eff6ff) is an exact match for the previous #eff6ff.
    borderBottom: `2px solid ${colorTokens.semantic.infoLight}`,
    textAlign: 'left',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  cell: {
    padding: '24px',
    fontSize: '14px',
    // NOTE: Previous #475569 (Slate-600). text.secondary (#5C646D) is the brand equivalent.
    color: colorTokens.text.secondary,
    // NOTE: Previous #f3f4f6. borders.light (#e5e7eb) is near-identical.
    borderBottom: `1px solid ${colorTokens.borders.light}`,
    verticalAlign: 'middle',
  },
  row: {
    hover: {
      // NOTE: Previous #f9fafb. backgrounds.hover (#f3f4f6) is near-identical off-white.
      background: colorTokens.backgrounds.hover,
    },
    selected: {
      // NOTE: Previous #f0fdf4. backgrounds.selected (#E8FDF0) is the brand light-green equivalent.
      background: colorTokens.backgrounds.selected,
    },
  },
  statusPills: {
    approved: {
      background: colorTokens.semantic.successLight,
      // NOTE: Previous #16a34a (Green-600). Consolidated to brand success (#00843D).
      color: colorTokens.semantic.success,
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    draft: {
      // Previous #f1f5f9 (Slate-100) → backgrounds.hover is the closest neutral tint.
      background: colorTokens.backgrounds.hover,
      color: colorTokens.text.secondary,
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    pending: {
      background: colorTokens.semantic.warningLight,
      // NOTE: Previous #ea580c (Orange-600). Consolidated to brand warning (#f59e0b).
      color: colorTokens.semantic.warning,
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    inProgress: {
      background: colorTokens.semantic.infoLight,
      // NOTE: Previous #3b82f6 (Blue-500). Consolidated to brand info (#1D61FF).
      color: colorTokens.semantic.info,
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    rejected: {
      background: colorTokens.semantic.errorLight,
      // NOTE: Previous #dc2626 (Red-600). Consolidated to brand error (#C20E0E).
      color: colorTokens.semantic.error,
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    completed: {
      background: colorTokens.semantic.successLight,
      color: colorTokens.semantic.success,
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    onHold: {
      background: colorTokens.semantic.errorLight,
      color: colorTokens.semantic.error,
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
  },
  pagination: {
    // NOTE: Previous #6b7280 (Gray-500). text.muted (#9ca3af) is the brand muted equivalent.
    color: colorTokens.text.muted,
    fontSize: '14px',
  },
};

/**
 * Table Token System - UNIVERSAL
 * Single set of table styles for entire application.
 * All colors derive from colorTokens (colors.tokens.ts).
 */
export const tableTokens: TableTokens = universalTableTokens;

/**
 * Utility function to get table tokens
 */
export function getTableTokens(): TableTokens {
  return tableTokens;
}

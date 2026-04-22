/**
 * Design Tokens Index
 * Central export point for all design tokens
 *
 * This file re-exports all token definitions for easy imports
 * throughout the application.
 *
 * UNIFIED THEME: One universal theme for entire application
 * - Colors, buttons, tables, spacing, typography, shadows
 * - All components use the same styling tokens
 * - Single place to manage all UI changes
 *
 * Usage:
 * import { colorTokens, spacingTokens, getColorTokens } from '@app/core/styling/tokens';
 */

// Color Tokens
export { colorTokens, getColorTokens } from './colors.tokens';
export type { ColorPalette } from './colors.tokens';

// Typography Tokens
export { typographyTokens, getTypographyTokens } from './typography.tokens';
export type { FontConfig, TypographyScale } from './typography.tokens';

// Spacing Tokens
export { spacingTokens, getSpacing, getBorderRadius } from './spacing.tokens';
export type { SpacingScale, BorderRadiusScale, Spacing } from './spacing.tokens';

// Shadow Tokens
export { shadowTokens, getShadow } from './shadows.tokens';
export type { ShadowPresets, Shadows } from './shadows.tokens';

// Button Tokens
export { buttonTokens, getButtonTokens } from './buttons.tokens';
export type { ButtonVariant, ButtonTokens } from './buttons.tokens';

// Table Tokens
export { tableTokens, getTableTokens } from './tables.tokens';
export type {
  TableHeaderConfig,
  TableCellConfig,
  StatusPillConfig,
  StatusPills,
  TableTokens,
} from './tables.tokens';

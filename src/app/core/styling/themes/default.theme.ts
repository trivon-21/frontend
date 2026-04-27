/**
 * Default Theme Definition
 * Bundles all design tokens into a single unified theme
 *
 * This theme applies to the entire application:
 * - Customer portal
 * - Technician portal
 * - Inventory Manager dashboard
 * - All other applications
 *
 * One universal theme ensures consistency across all user-facing surfaces
 */

import { colorTokens } from '../tokens/colors.tokens';
import { typographyTokens } from '../tokens/typography.tokens';
import { spacingTokens } from '../tokens/spacing.tokens';
import { shadowTokens } from '../tokens/shadows.tokens';
import { buttonTokens } from '../tokens/buttons.tokens';
import { tableTokens } from '../tokens/tables.tokens';

import type { ColorPalette } from '../tokens/colors.tokens';
import type { TypographyScale } from '../tokens/typography.tokens';
import type { Spacing } from '../tokens/spacing.tokens';
import type { Shadows } from '../tokens/shadows.tokens';
import type { ButtonTokens } from '../tokens/buttons.tokens';
import type { TableTokens } from '../tokens/tables.tokens';

/**
 * Complete theme interface
 * Groups all token types into a single cohesive theme
 */
export interface UnifiedTheme {
  name: string;
  version: string;
  description: string;
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: Spacing;
  shadows: Shadows;
  buttons: ButtonTokens;
  tables: TableTokens;
  metadata: {
    created: string;
    updated: string;
    maintainer: string;
  };
}

/**
 * Default unified theme for all applications
 * Changes made here automatically apply everywhere
 */
export const defaultTheme: UnifiedTheme = {
  name: 'default',
  version: '1.0.0',
  description:
    'Unified theme for entire Airlux application - applies to all portals and dashboards',

  // All token groups
  colors: colorTokens,
  typography: typographyTokens.customer,
  spacing: spacingTokens,
  shadows: shadowTokens,
  buttons: buttonTokens,
  tables: tableTokens,

  // Theme metadata
  metadata: {
    created: '2024-01-15',
    updated: new Date().toISOString(),
    maintainer: 'Airlux Design System Team',
  },
};

/**
 * Get the default theme
 * Used by ThemeProvider for initialization
 */
export function getDefaultTheme(): UnifiedTheme {
  return defaultTheme;
}

/**
 * Theme registry - can be extended for multiple themes
 * Currently only contains the default unified theme
 * Future enhancement: Add customer-specific, technician-specific, etc.
 */
export const themeRegistry: Record<string, UnifiedTheme> = {
  default: defaultTheme,
};

/**
 * Get theme by name from registry
 * @param themeName - Name of the theme to retrieve
 * @returns Theme configuration or default if not found
 */
export function getThemeByName(themeName: string = 'default'): UnifiedTheme {
  return themeRegistry[themeName] || defaultTheme;
}

/**
 * List all available themes
 */
export function getAvailableThemes(): string[] {
  return Object.keys(themeRegistry);
}

/**
 * Check if a theme exists
 */
export function themeExists(themeName: string): boolean {
  return themeName in themeRegistry;
}

/**
 * Register a new theme
 * Can be used for dynamic theme creation
 * @param themeName - Name for the new theme
 * @param theme - Theme configuration
 * @returns True if registration successful, false if already exists
 */
export function registerTheme(themeName: string, theme: UnifiedTheme): boolean {
  if (themeName in themeRegistry) {
    console.warn(`Theme "${themeName}" already registered. Use updateTheme() to modify.`);
    return false;
  }

  themeRegistry[themeName] = theme;
  console.log(`✓ Theme registered: ${themeName}`);
  return true;
}

/**
 * Update an existing theme
 * @param themeName - Name of theme to update
 * @param theme - Updated theme configuration
 */
export function updateTheme(themeName: string, theme: UnifiedTheme): void {
  if (!(themeName in themeRegistry)) {
    console.warn(`Theme "${themeName}" not found. Use registerTheme() to create new themes.`);
    return;
  }

  themeRegistry[themeName] = theme;
  console.log(`✓ Theme updated: ${themeName}`);
}

/**
 * Remove a theme from registry
 * Cannot remove the default theme
 * @param themeName - Name of theme to remove
 */
export function removeTheme(themeName: string): boolean {
  if (themeName === 'default') {
    console.warn('Cannot remove default theme');
    return false;
  }

  if (!(themeName in themeRegistry)) {
    console.warn(`Theme "${themeName}" not found`);
    return false;
  }

  delete themeRegistry[themeName];
  console.log(`✓ Theme removed: ${themeName}`);
  return true;
}

/**
 * Create a custom theme based on the default
 * Useful for role-specific or user-specific themes
 * @param baseName - Name of base theme to extend
 * @param customizations - Partial theme overrides
 * @returns New theme with customizations applied
 */
export function createCustomTheme(
  baseName: string = 'default',
  customizations: Partial<UnifiedTheme>,
): UnifiedTheme {
  const baseTheme = getThemeByName(baseName);

  return {
    ...baseTheme,
    ...customizations,
    metadata: {
      ...baseTheme.metadata,
      updated: new Date().toISOString(),
    },
  };
}

/**
 * Export theme as JSON
 * Useful for saving/loading configurations
 */
export function exportThemeAsJSON(themeName: string = 'default'): string {
  const theme = getThemeByName(themeName);
  return JSON.stringify(theme, null, 2);
}

/**
 * Import theme from JSON
 * @param themeName - Name for imported theme
 * @param jsonString - JSON string representing theme
 */
export function importThemeFromJSON(themeName: string, jsonString: string): boolean {
  try {
    const theme = JSON.parse(jsonString) as UnifiedTheme;
    return registerTheme(themeName, theme);
  } catch (error) {
    console.error('Failed to import theme:', error);
    return false;
  }
}

/**
 * Styling System - Public API
 *
 * Central export point for all styling utilities, tokens, and services
 * Usage:
 * import { ThemeProvider, colorTokens, getSpacing } from '@app/core/styling';
 */

// Services
export { ThemeProvider, type ThemeName } from './theme.provider';
export { StylesService, type CSSVariableUpdate, type VariableNamespaces } from './styles.service';

// Token Objects & Utilities
export { colorTokens, getColorTokens, type ColorPalette } from './tokens/colors.tokens';
export {
  typographyTokens,
  getTypographyTokens,
  type TypographyScale,
} from './tokens/typography.tokens';
export { spacingTokens, getSpacing, getBorderRadius, type Spacing } from './tokens/spacing.tokens';
export { shadowTokens, getShadow, type Shadows } from './tokens/shadows.tokens';
export { buttonTokens, getButtonTokens, type ButtonTokens } from './tokens/buttons.tokens';
export { tableTokens, getTableTokens, type TableTokens } from './tokens/tables.tokens';

// Themes
export {
  defaultTheme,
  getDefaultTheme,
  getThemeByName,
  getAvailableThemes,
  themeExists,
  registerTheme,
  updateTheme,
  removeTheme,
  createCustomTheme,
  exportThemeAsJSON,
  importThemeFromJSON,
  type UnifiedTheme,
} from './themes/default.theme';

// Generators
export {
  generateCompleteThemeCSS,
  generateThemeCSSFromTokens,
  generateVariablesOnly,
  injectThemeCSS,
  updateCSSVariable,
} from './generators/component-styles.generator';

export {
  generateAllCSSVariables,
  generateColorVariables,
  generateTypographyVariables,
  generateSpacingVariables,
  generateShadowVariables,
  generateGlobalStyles,
} from './generators/css-variables.generator';

export { generateButtonStyles } from './generators/button-styles.generator';
export { generateTableStyles } from './generators/table-styles.generator';

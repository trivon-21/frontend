/**
 * Component Styles Generator
 * Master generator that combines all CSS generators
 *
 * Generates complete theme CSS that can be injected into DOM:
 * - CSS variables for all tokens
 * - Global styles
 * - Button styles
 * - Table styles
 * - All component CSS in one string
 */

import { generateAllCSSVariables, generateGlobalStyles } from './css-variables.generator';
import { generateButtonStyles } from './button-styles.generator';
import { generateTableStyles } from './table-styles.generator';
import { colorTokens, getColorTokens } from '../tokens/colors.tokens';
import { typographyTokens, getTypographyTokens } from '../tokens/typography.tokens';
import { spacingTokens } from '../tokens/spacing.tokens';
import { shadowTokens } from '../tokens/shadows.tokens';
import { buttonTokens, getButtonTokens } from '../tokens/buttons.tokens';
import { tableTokens, getTableTokens } from '../tokens/tables.tokens';

/**
 * Generate complete theme CSS from all tokens
 * This creates a single CSS string with everything needed
 */
export function generateCompleteThemeCSS(): string {
  let css = '';

  // 1. CSS Variables from all tokens
  css += generateAllCSSVariables(
    getColorTokens(),
    getTypographyTokens(),
    spacingTokens,
    shadowTokens,
  );

  // 2. Global styles
  css += '\n';
  css += generateGlobalStyles();

  // 3. Button styles
  css += '\n';
  css += generateButtonStyles(getButtonTokens());

  // 4. Table styles
  css += '\n';
  css += generateTableStyles(getTableTokens());

  // 5. Additional utility styles
  css += generateUtilityStyles();

  return css;
}

/**
 * Generate utility CSS classes for common patterns
 */
function generateUtilityStyles(): string {
  let css = `\n/* Utility Styles */\n\n`;

  // Flex utilities
  css += `.flex { display: flex; }\n`;
  css += `.flex-center { display: flex; align-items: center; justify-content: center; }\n`;
  css += `.flex-between { display: flex; align-items: center; justify-content: space-between; }\n`;
  css += `.flex-column { display: flex; flex-direction: column; }\n`;

  // Grid utilities
  css += `.grid { display: grid; }\n`;

  // Text utilities
  css += `.text-center { text-align: center; }\n`;
  css += `.text-left { text-align: left; }\n`;
  css += `.text-right { text-align: right; }\n`;

  // Gap utilities
  css += `.gap-xs { gap: var(--spacing-xs); }\n`;
  css += `.gap-sm { gap: var(--spacing-sm); }\n`;
  css += `.gap-md { gap: var(--spacing-md); }\n`;
  css += `.gap-lg { gap: var(--spacing-lg); }\n`;
  css += `.gap-xl { gap: var(--spacing-xl); }\n`;
  css += `.gap-xxl { gap: var(--spacing-xxl); }\n`;

  // Padding utilities
  css += `.p-xs { padding: var(--spacing-xs); }\n`;
  css += `.p-sm { padding: var(--spacing-sm); }\n`;
  css += `.p-md { padding: var(--spacing-md); }\n`;
  css += `.p-lg { padding: var(--spacing-lg); }\n`;
  css += `.p-xl { padding: var(--spacing-xl); }\n`;
  css += `.p-xxl { padding: var(--spacing-xxl); }\n`;

  // Margin utilities
  css += `.m-xs { margin: var(--spacing-xs); }\n`;
  css += `.m-sm { margin: var(--spacing-sm); }\n`;
  css += `.m-md { margin: var(--spacing-md); }\n`;
  css += `.m-lg { margin: var(--spacing-lg); }\n`;
  css += `.m-xl { margin: var(--spacing-xl); }\n`;
  css += `.m-xxl { margin: var(--spacing-xxl); }\n`;

  // Rounded utilities
  css += `.rounded-xs { border-radius: var(--border-radius-xs); }\n`;
  css += `.rounded-sm { border-radius: var(--border-radius-sm); }\n`;
  css += `.rounded-md { border-radius: var(--border-radius-md); }\n`;
  css += `.rounded-lg { border-radius: var(--border-radius-lg); }\n`;
  css += `.rounded-xl { border-radius: var(--border-radius-xl); }\n`;
  css += `.rounded-full { border-radius: var(--border-radius-full); }\n`;

  // Shadow utilities
  css += `.shadow-minimal { box-shadow: var(--shadow-minimal); }\n`;
  css += `.shadow-light { box-shadow: var(--shadow-light); }\n`;
  css += `.shadow-standard { box-shadow: var(--shadow-standard); }\n`;
  css += `.shadow-medium { box-shadow: var(--shadow-medium); }\n`;
  css += `.shadow-large { box-shadow: var(--shadow-large); }\n`;
  css += `.shadow-xl { box-shadow: var(--shadow-xl); }\n`;
  css += `.shadow-modal { box-shadow: var(--shadow-modal); }\n`;

  // Display utilities
  css += `.hidden { display: none; }\n`;
  css += `.block { display: block; }\n`;
  css += `.inline { display: inline; }\n`;
  css += `.inline-block { display: inline-block; }\n`;

  // Opacity utilities
  css += `.opacity-50 { opacity: 0.5; }\n`;
  css += `.opacity-75 { opacity: 0.75; }\n`;
  css += `.opacity-100 { opacity: 1; }\n`;

  // Cursor utilities
  css += `.cursor-pointer { cursor: pointer; }\n`;
  css += `.cursor-default { cursor: default; }\n`;
  css += `.cursor-not-allowed { cursor: not-allowed; }\n`;

  // Transition utilities
  css += `.transition { transition: all 0.2s ease; }\n`;
  css += `.transition-fast { transition: all 0.1s ease; }\n`;
  css += `.transition-slow { transition: all 0.3s ease; }\n`;

  return css;
}

/**
 * Generate CSS for a specific set of tokens
 * Useful for dynamic theme switching
 */
export function generateThemeCSSFromTokens(
  colors: any,
  typography: any,
  spacing: any,
  shadows: any,
  buttons: any,
  tables: any,
): string {
  let css = '';

  // CSS Variables
  css += generateAllCSSVariables(colors, typography, spacing, shadows);

  // Global styles
  css += '\n';
  css += generateGlobalStyles();

  // Button styles
  css += '\n';
  css += generateButtonStyles(buttons);

  // Table styles
  css += '\n';
  css += generateTableStyles(tables);

  // Utilities
  css += generateUtilityStyles();

  return css;
}

/**
 * Generates just the CSS variables (for incremental styling)
 */
export function generateVariablesOnly(
  colors: any,
  typography: any,
  spacing: any,
  shadows: any,
): string {
  return generateAllCSSVariables(colors, typography, spacing, shadows);
}

/**
 * Utility function to inject CSS into DOM
 * Used by theme provider
 * RECOVERY 1.1: Guards against SSR environments
 */
export function injectThemeCSS(
  css: string,
  elementId: string = 'airlux-theme-styles',
): HTMLStyleElement {
  // RECOVERY 1.1: Guard - check if document exists (SSR safety)
  if (typeof document === 'undefined') {
    console.warn('⚠  DOM not available (SSR). Theme CSS cannot be injected.');
    return null as any;
  }

  let styleElement = document.getElementById(elementId) as HTMLStyleElement;

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = elementId;
    document.head.appendChild(styleElement);
  }

  styleElement.innerHTML = css;
  return styleElement;
}

/**
 * Update only CSS variables (for dynamic customization)
 * More efficient than regenerating entire CSS
 */
export function updateCSSVariable(variableName: string, value: string): void {
  document.documentElement.style.setProperty(`--${variableName}`, value);
}

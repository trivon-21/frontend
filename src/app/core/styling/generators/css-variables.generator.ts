/**
 * CSS Variables Generator
 * Converts design tokens into CSS custom properties
 *
 * Generates:
 * --text-primary: #1a1a1b
 * --spacing-lg: 16px
 * --shadow-standard: 0 4px 20px rgba(0,0,0,0.03)
 * etc.
 */

import { ColorPalette } from '../tokens/colors.tokens';
import { TypographyScale } from '../tokens/typography.tokens';
import { Spacing } from '../tokens/spacing.tokens';
import { Shadows } from '../tokens/shadows.tokens';

/**
 * Generates CSS custom properties for colors
 */
export function generateColorVariables(colors: ColorPalette): string {
  let css = '';

  // Primary colors
  css += `  --primary-main: ${colors.primary.main};\n`;
  css += `  --primary-hover: ${colors.primary.hover};\n`;
  css += `  --primary-active: ${colors.primary.active};\n`;
  css += `  --primary-light: ${colors.primary.light};\n`;
  css += `  --primary-lighter: ${colors.primary.lighter};\n`;

  // Secondary colors
  css += `  --secondary-main: ${colors.secondary.main};\n`;
  css += `  --secondary-hover: ${colors.secondary.hover};\n`;
  css += `  --secondary-light: ${colors.secondary.light};\n`;

  // Semantic colors
  css += `  --success: ${colors.semantic.success};\n`;
  css += `  --success-light: ${colors.semantic.successLight};\n`;
  css += `  --error: ${colors.semantic.error};\n`;
  css += `  --error-light: ${colors.semantic.errorLight};\n`;
  css += `  --warning: ${colors.semantic.warning};\n`;
  css += `  --warning-light: ${colors.semantic.warningLight};\n`;
  css += `  --info: ${colors.semantic.info};\n`;
  css += `  --info-light: ${colors.semantic.infoLight};\n`;

  // Text colors
  css += `  --text-primary: ${colors.text.primary};\n`;
  css += `  --text-secondary: ${colors.text.secondary};\n`;
  css += `  --text-muted: ${colors.text.muted};\n`;
  css += `  --text-disabled: ${colors.text.disabled};\n`;
  css += `  --text-inverse: ${colors.text.inverse};\n`;

  // Background colors
  css += `  --background-page: ${colors.backgrounds.page};\n`;
  css += `  --background-card: ${colors.backgrounds.card};\n`;
  css += `  --background-input: ${colors.backgrounds.input};\n`;
  css += `  --background-hover: ${colors.backgrounds.hover};\n`;
  css += `  --background-selected: ${colors.backgrounds.selected};\n`;
  css += `  --background-disabled: ${colors.backgrounds.disabled};\n`;

  // Border colors
  css += `  --border-light: ${colors.borders.light};\n`;
  css += `  --border-medium: ${colors.borders.medium};\n`;
  css += `  --border-dark: ${colors.borders.dark};\n`;

  // Surface colors
  css += `  --surface-overlay: ${colors.surface.overlay};\n`;
  css += `  --surface-elevation-1: ${colors.surface.elevation1};\n`;
  css += `  --surface-elevation-2: ${colors.surface.elevation2};\n`;

  return css;
}

/**
 * Generates CSS custom properties for typography
 */
export function generateTypographyVariables(typography: TypographyScale): string {
  let css = '';

  const generateLevel = (levelName: string, config: any) => {
    css += `\n  /* ${levelName.replace(/([A-Z])/g, ' $1').trim()} */\n`;
    css += `  --${levelName}-font-family: ${config.fontFamily};\n`;
    css += `  --${levelName}-font-size: ${config.fontSize};\n`;
    css += `  --${levelName}-font-weight: ${config.fontWeight};\n`;
    css += `  --${levelName}-line-height: ${config.lineHeight};\n`;
    if (config.letterSpacing) {
      css += `  --${levelName}-letter-spacing: ${config.letterSpacing};\n`;
    }
  };

  generateLevel('display', typography.display);
  generateLevel('h1', typography.h1);
  generateLevel('h2', typography.h2);
  generateLevel('h3', typography.h3);
  generateLevel('h4', typography.h4);
  generateLevel('body-large', typography.bodyLarge);
  generateLevel('body', typography.body);
  generateLevel('body-small', typography.bodySmall);
  generateLevel('label', typography.label);
  generateLevel('label-small', typography.labelSmall);
  generateLevel('caption', typography.caption);
  generateLevel('button', typography.button);
  generateLevel('button-small', typography.buttonSmall);

  return css;
}

/**
 * Generates CSS custom properties for spacing
 */
export function generateSpacingVariables(spacing: Spacing): string {
  let css = '';

  // Spacing scale
  css += `\n  /* Spacing Scale */\n`;
  Object.entries(spacing.padding).forEach(([key, value]) => {
    css += `  --spacing-${key}: ${value};\n`;
  });

  // Border radius scale
  css += `\n  /* Border Radius Scale */\n`;
  Object.entries(spacing.borderRadius).forEach(([key, value]) => {
    css += `  --border-radius-${key}: ${value};\n`;
  });

  // Component padding
  css += `\n  /* Component Padding */\n`;
  Object.entries(spacing.componentPadding).forEach(([key, value]) => {
    css += `  --padding-${key}: ${value};\n`;
  });

  // Component gaps
  css += `\n  /* Component Gaps */\n`;
  Object.entries(spacing.componentGap).forEach(([key, value]) => {
    css += `  --gap-${key}: ${value};\n`;
  });

  return css;
}

/**
 * Generates CSS custom properties for shadows
 */
export function generateShadowVariables(shadows: Shadows): string {
  let css = '';

  css += `\n  /* Shadows */\n`;
  Object.entries(shadows.boxShadows).forEach(([key, value]) => {
    css += `  --shadow-${key}: ${value};\n`;
  });

  return css;
}

/**
 * Main function: Generate all CSS variables
 */
export function generateAllCSSVariables(
  colors: ColorPalette,
  typography: TypographyScale,
  spacing: Spacing,
  shadows: Shadows,
): string {
  let css = `:root {\n`;

  css += generateColorVariables(colors);
  css += generateTypographyVariables(typography);
  css += generateSpacingVariables(spacing);
  css += generateShadowVariables(shadows);

  css += `}\n`;

  return css;
}

/**
 * Global styles using CSS variables
 */
export function generateGlobalStyles(): string {
  return `
/* Global Styles using CSS Variables */

* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  line-height: var(--body-line-height);
  color: var(--text-primary);
  background-color: var(--background-page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1 {
  font-family: var(--h1-font-family);
  font-size: var(--h1-font-size);
  font-weight: var(--h1-font-weight);
  line-height: var(--h1-line-height);
  letter-spacing: var(--h1-letter-spacing, 0);
  margin: 0;
  color: var(--text-primary);
}

h2 {
  font-family: var(--h2-font-family);
  font-size: var(--h2-font-size);
  font-weight: var(--h2-font-weight);
  line-height: var(--h2-line-height);
  letter-spacing: var(--h2-letter-spacing, 0);
  margin: 0;
  color: var(--text-primary);
}

h3 {
  font-family: var(--h3-font-family);
  font-size: var(--h3-font-size);
  font-weight: var(--h3-font-weight);
  line-height: var(--h3-line-height);
  margin: 0;
  color: var(--text-primary);
}

h4 {
  font-family: var(--h4-font-family);
  font-size: var(--h4-font-size);
  font-weight: var(--h4-font-weight);
  line-height: var(--h4-line-height);
  margin: 0;
  color: var(--text-primary);
}

p {
  margin: 0;
  color: var(--text-primary);
}

input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
}

button {
  cursor: pointer;
  font-family: inherit;
}

a {
  color: var(--info);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  text-decoration: underline;
}
`;
}

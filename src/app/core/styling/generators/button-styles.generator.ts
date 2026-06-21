/**
 * Button Styles Generator
 * Generates complete CSS for all button variants.
 *
 * IMPORTANT: This generator emits CSS variable references (e.g. `var(--primary-main)`)
 * rather than resolved token values. This ensures that runtime updates via ThemeProvider
 * or StylesService are immediately reflected on all buttons without regenerating the CSS.
 *
 * The ButtonCSSVarMap provides the explicit (variantName, property) → CSS variable mapping.
 * Non-color properties (shadow, transform, focus ring) use the resolved token values since
 * no CSS custom property exists for them.
 */

import { ButtonTokens, ButtonVariant } from '../tokens/buttons.tokens';

// ---------------------------------------------------------------------------
// CSS Variable Map
// ---------------------------------------------------------------------------

/**
 * Defines which CSS variable to emit for each color property of a button variant.
 * Properties not listed here fall back to the resolved token value (e.g. for
 * custom shadows, transforms, or values with no corresponding CSS variable).
 */
interface ButtonCSSVarMap {
  background?: string;
  color?: string;
  hoverBackground?: string;
  hoverColor?: string;
  hoverBorder?: string;
  activeBackground?: string;
  disabledBackground?: string;
  disabledColor?: string;
}

/**
 * Explicit per-variant CSS variable mappings.
 * Every color property that has a CSS custom property is listed here.
 * Using an explicit structural type (not Record<string, ...>) avoids TS4111 index
 * signature errors when the Angular compiler runs with noPropertyAccessFromIndexSignature.
 */
const BUTTON_VAR_MAP: {
  primary: ButtonCSSVarMap;
  secondary: ButtonCSSVarMap;
  success: ButtonCSSVarMap;
  danger: ButtonCSSVarMap;
  warning: ButtonCSSVarMap;
  icon: ButtonCSSVarMap;
  text: ButtonCSSVarMap;
  review: ButtonCSSVarMap;
  small: ButtonCSSVarMap;
} = {
  primary: {
    background: 'primary-main',
    color: 'text-inverse',
    hoverBackground: 'primary-hover',
    activeBackground: 'primary-active',
    disabledBackground: 'secondary-light',
    disabledColor: 'text-inverse',
  },
  secondary: {
    background: 'background-card',
    color: 'text-primary',
    hoverBackground: 'background-page',
    hoverColor: 'primary-main',
    disabledBackground: 'background-page',
    disabledColor: 'secondary-light',
  },
  success: {
    background: 'success',
    color: 'text-inverse',
    hoverBackground: 'primary-hover',
    activeBackground: 'primary-active',
    disabledBackground: 'secondary-light',
  },
  danger: {
    background: 'error',
    color: 'text-inverse',
    hoverBackground: 'error',  // errorDark has no generated CSS var; use raw value from token
    disabledBackground: 'secondary-light',
  },
  warning: {
    background: 'warning',
    color: 'text-inverse',
    hoverBackground: 'warning',  // warningDark has no generated CSS var; use raw value from token
    disabledBackground: 'secondary-light',
  },
  icon: {
    color: 'text-secondary',
    hoverBackground: 'background-page',
    hoverColor: 'text-primary',
    disabledColor: 'secondary-light',
  },
  text: {
    color: 'info',
    hoverColor: 'info',  // infoDark has no generated CSS var; use raw value from token
  },
  review: {
    background: 'success-light',
    color: 'success',
    hoverBackground: 'success',
    hoverColor: 'text-inverse',
  },
  small: {
    background: 'primary-main',
    color: 'text-inverse',
    hoverBackground: 'primary-hover',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a `var(--name)` CSS reference if a CSS variable exists for this
 * property, otherwise returns the resolved token value as a fallback.
 */
function cssVar(varName: string | undefined, fallbackValue: string | undefined): string {
  if (varName) return `var(--${varName})`;
  return fallbackValue ?? '';
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Generates CSS for a single button variant, emitting CSS variable references
 * for color properties wherever a mapping is defined in BUTTON_VAR_MAP.
 */
function generateButtonVariantCSS(
  variantName: string,
  variant: ButtonVariant,
  varMap: ButtonCSSVarMap = {},
): string {
  let css = `.btn-${variantName} {\n`;

  // Base styles
  css += `  background-color: ${cssVar(varMap.background, variant.background)};\n`;
  css += `  color: ${cssVar(varMap.color, variant.color)};\n`;
  css += `  padding: ${variant.padding};\n`;
  css += `  border-radius: ${variant.borderRadius};\n`;
  css += `  font-size: ${variant.fontSize};\n`;
  css += `  font-weight: ${variant.fontWeight};\n`;
  css += `  font-family: ${variant.fontFamily};\n`;
  css += `  border: ${variant.border};\n`;

  if (variant.minWidth) {
    css += `  min-width: ${variant.minWidth};\n`;
  }

  css += `  display: flex;\n`;
  css += `  align-items: center;\n`;
  css += `  justify-content: center;\n`;
  css += `  gap: 16px;\n`;
  css += `  cursor: pointer;\n`;
  css += `  transition: all 0.2s ease;\n`;
  css += `}\n`;

  // Hover state
  if (variant.hover) {
    css += `.btn-${variantName}:hover {\n`;
    if (variant.hover.background !== undefined) {
      css += `  background-color: ${cssVar(varMap.hoverBackground, variant.hover.background)};\n`;
    }
    if (variant.hover.color !== undefined) {
      css += `  color: ${cssVar(varMap.hoverColor, variant.hover.color)};\n`;
    }
    if (variant.hover.shadow !== undefined) {
      // Box shadows are custom values — no CSS variable exists; emit raw token value
      css += `  box-shadow: ${variant.hover.shadow};\n`;
    }
    if (variant.hover.transform !== undefined) {
      css += `  transform: ${variant.hover.transform};\n`;
    }
    if (variant.hover.border !== undefined) {
      const hoverBorder = varMap.hoverBorder
        ? variant.hover.border.replace(/#[0-9a-fA-F]{3,6}/, `var(--${varMap.hoverBorder})`)
        : variant.hover.border;
      css += `  border: ${hoverBorder};\n`;
    }
    css += `}\n`;
  }

  // Active state
  if (variant.active) {
    css += `.btn-${variantName}:active {\n`;
    if (variant.active.background !== undefined) {
      css += `  background-color: ${cssVar(varMap.activeBackground, variant.active.background)};\n`;
    }
    if (variant.active.color !== undefined) {
      css += `  color: ${variant.active.color};\n`;
    }
    css += `}\n`;
  }

  // Disabled state
  if (variant.disabled) {
    css += `.btn-${variantName}:disabled,\n`;
    css += `.btn-${variantName}.disabled {\n`;
    if (variant.disabled.background !== undefined) {
      css += `  background-color: ${cssVar(varMap.disabledBackground, variant.disabled.background)};\n`;
    }
    if (variant.disabled.color !== undefined) {
      css += `  color: ${cssVar(varMap.disabledColor, variant.disabled.color)};\n`;
    }
    if (variant.disabled.cursor !== undefined) {
      css += `  cursor: ${variant.disabled.cursor};\n`;
    }
    if (variant.disabled.opacity !== undefined) {
      css += `  opacity: ${variant.disabled.opacity};\n`;
    }
    css += `}\n`;
  }

  // Focus state
  if (variant.focus) {
    css += `.btn-${variantName}:focus {\n`;
    if (variant.focus.outline !== undefined) {
      css += `  outline: ${variant.focus.outline};\n`;
    }
    if (variant.focus.boxShadow !== undefined) {
      css += `  box-shadow: ${variant.focus.boxShadow};\n`;
    }
    css += `}\n`;
  }

  return css;
}

/**
 * Main function: Generate all button styles.
 * Each call to generateButtonVariantCSS passes its explicit CSS variable map so
 * color properties emit `var(--x)` rather than the resolved hex value.
 */
export function generateButtonStyles(buttonTokens: ButtonTokens): string {
  let css = `\n/* Button Styles */\n\n`;

  css += generateButtonVariantCSS('primary', buttonTokens.primary, BUTTON_VAR_MAP.primary);
  css += '\n';
  css += generateButtonVariantCSS('secondary', buttonTokens.secondary, BUTTON_VAR_MAP.secondary);
  css += '\n';
  css += generateButtonVariantCSS('success', buttonTokens.success, BUTTON_VAR_MAP.success);
  css += '\n';
  css += generateButtonVariantCSS('danger', buttonTokens.danger, BUTTON_VAR_MAP.danger);
  css += '\n';
  css += generateButtonVariantCSS('warning', buttonTokens.warning, BUTTON_VAR_MAP.warning);
  css += '\n';
  css += generateButtonVariantCSS('icon', buttonTokens.icon, BUTTON_VAR_MAP.icon);
  css += '\n';
  css += generateButtonVariantCSS('text', buttonTokens.text, BUTTON_VAR_MAP.text);
  css += '\n';
  css += generateButtonVariantCSS('review', buttonTokens.review, BUTTON_VAR_MAP.review);
  css += '\n';
  css += generateButtonVariantCSS('small', buttonTokens.small, BUTTON_VAR_MAP.small);

  return css;
}

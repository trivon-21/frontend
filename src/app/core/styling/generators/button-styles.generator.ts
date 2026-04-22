/**
 * Button Styles Generator
 * Generates complete CSS for all button variants
 *
 * Creates classes like:
 * .btn-primary
 * .btn-secondary
 * .btn-success
 * .btn-danger
 * etc.
 */

import { ButtonTokens } from '../tokens/buttons.tokens';

/**
 * Generates CSS for a single button variant
 */
function generateButtonVariantCSS(variantName: string, variant: any): string {
  let css = `.btn-${variantName} {\n`;

  // Base styles
  css += `  background-color: ${variant.background};\n`;
  css += `  color: ${variant.color};\n`;
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
    if (variant.hover.background) {
      css += `  background-color: ${variant.hover.background};\n`;
    }
    if (variant.hover.color) {
      css += `  color: ${variant.hover.color};\n`;
    }
    if (variant.hover.shadow) {
      css += `  box-shadow: ${variant.hover.shadow};\n`;
    }
    if (variant.hover.transform) {
      css += `  transform: ${variant.hover.transform};\n`;
    }
    css += `}\n`;
  }

  // Active state
  if (variant.active) {
    css += `.btn-${variantName}:active {\n`;
    if (variant.active.background) {
      css += `  background-color: ${variant.active.background};\n`;
    }
    if (variant.active.color) {
      css += `  color: ${variant.active.color};\n`;
    }
    css += `}\n`;
  }

  // Disabled state
  if (variant.disabled) {
    css += `.btn-${variantName}:disabled,\n`;
    css += `.btn-${variantName}.disabled {\n`;
    if (variant.disabled.background) {
      css += `  background-color: ${variant.disabled.background};\n`;
    }
    if (variant.disabled.color) {
      css += `  color: ${variant.disabled.color};\n`;
    }
    if (variant.disabled.cursor) {
      css += `  cursor: ${variant.disabled.cursor};\n`;
    }
    if (variant.disabled.opacity) {
      css += `  opacity: ${variant.disabled.opacity};\n`;
    }
    css += `}\n`;
  }

  // Focus state
  if (variant.focus) {
    css += `.btn-${variantName}:focus {\n`;
    if (variant.focus.outline) {
      css += `  outline: ${variant.focus.outline};\n`;
    }
    if (variant.focus.boxShadow) {
      css += `  box-shadow: ${variant.focus.boxShadow};\n`;
    }
    css += `}\n`;
  }

  return css;
}

/**
 * Main function: Generate all button styles
 */
export function generateButtonStyles(buttonTokens: ButtonTokens): string {
  let css = `\n/* Button Styles */\n\n`;

  // Primary button
  css += generateButtonVariantCSS('primary', buttonTokens.primary);
  css += '\n';

  // Secondary button
  css += generateButtonVariantCSS('secondary', buttonTokens.secondary);
  css += '\n';

  // Success button
  css += generateButtonVariantCSS('success', buttonTokens.success);
  css += '\n';

  // Danger button
  css += generateButtonVariantCSS('danger', buttonTokens.danger);
  css += '\n';

  // Warning button
  css += generateButtonVariantCSS('warning', buttonTokens.warning);
  css += '\n';

  // Icon button
  css += `.btn-icon {\n`;
  css += `  background-color: ${buttonTokens.icon.background};\n`;
  css += `  color: ${buttonTokens.icon.color};\n`;
  css += `  padding: ${buttonTokens.icon.padding};\n`;
  css += `  border-radius: ${buttonTokens.icon.borderRadius};\n`;
  css += `  font-size: ${buttonTokens.icon.fontSize};\n`;
  css += `  border: ${buttonTokens.icon.border};\n`;
  css += `  display: flex;\n`;
  css += `  align-items: center;\n`;
  css += `  justify-content: center;\n`;
  css += `  cursor: pointer;\n`;
  css += `  transition: all 0.2s ease;\n`;
  css += `}\n`;

  if (buttonTokens.icon.hover) {
    css += `.btn-icon:hover {\n`;
    if (buttonTokens.icon.hover.background) {
      css += `  background-color: ${buttonTokens.icon.hover.background};\n`;
    }
    if (buttonTokens.icon.hover.color) {
      css += `  color: ${buttonTokens.icon.hover.color};\n`;
    }
    css += `}\n`;
  }
  css += '\n';

  // Text button
  css += `.btn-text {\n`;
  css += `  background-color: ${buttonTokens.text.background};\n`;
  css += `  color: ${buttonTokens.text.color};\n`;
  css += `  padding: ${buttonTokens.text.padding};\n`;
  css += `  border-radius: ${buttonTokens.text.borderRadius};\n`;
  css += `  font-size: ${buttonTokens.text.fontSize};\n`;
  css += `  font-weight: ${buttonTokens.text.fontWeight};\n`;
  css += `  font-family: ${buttonTokens.text.fontFamily};\n`;
  css += `  border: ${buttonTokens.text.border};\n`;
  css += `  cursor: pointer;\n`;
  css += `  transition: all 0.2s ease;\n`;
  css += `}\n`;

  if (buttonTokens.text.hover) {
    css += `.btn-text:hover {\n`;
    if (buttonTokens.text.hover.color) {
      css += `  color: ${buttonTokens.text.hover.color};\n`;
    }
    css += `}\n`;
  }
  css += '\n';

  // Review button
  css += generateButtonVariantCSS('review', buttonTokens.review);
  css += '\n';

  // Small button
  css += generateButtonVariantCSS('small', buttonTokens.small);

  return css;
}

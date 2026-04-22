/**
 * Shadow Design Tokens
 * Predefined shadow elevations for different component types
 */

export interface ShadowPresets {
  minimal: string;
  light: string;
  standard: string;
  medium: string;
  large: string;
  xl: string;
  modal: string;
}

export interface Shadows {
  boxShadows: ShadowPresets;
}

/**
 * Shadow Presets
 * Different elevations for different component contexts
 */
const shadowPresets: ShadowPresets = {
  // Minimal: Subtle presence, almost imperceptible
  minimal: '0 1px 3px rgba(0, 0, 0, 0.05)',

  // Light: Very subtle shadow for delicate elements
  light: '0 2px 10px rgba(0, 0, 0, 0.02)',

  // Standard: Default shadow for cards and containers
  standard: '0 4px 20px rgba(0, 0, 0, 0.03)',

  // Medium: Elevated shadow for buttons on hover, summary cards
  medium: '0 4px 24px rgba(0, 0, 0, 0.04)',

  // Large: Significant elevation for floating panels
  large: '0 8px 16px rgba(59, 90, 56, 0.2)',

  // Extra Large: High elevation for dropdowns and popovers
  xl: '0 10px 40px rgba(0, 0, 0, 0.15)',

  // Modal: Maximum elevation for modal dialogs
  modal: '0 20px 60px rgba(0, 0, 0, 0.35)',
};

/**
 * Complete Shadow Token System
 * Same for all themes
 */
export const shadowTokens: Shadows = {
  boxShadows: shadowPresets,
};

/**
 * Utility function to get shadow preset by name
 * Example: getShadow('large') returns the large shadow value
 */
export function getShadow(type: keyof ShadowPresets): string {
  return shadowTokens.boxShadows[type];
}

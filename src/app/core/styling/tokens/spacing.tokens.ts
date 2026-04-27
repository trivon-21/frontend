/**
 * Spacing Design Tokens
 * 8px-based grid system for consistent spacing
 *
 * All spacing values are multiples of 8px for:
 * - Padding
 * - Margin
 * - Gap between elements
 * - Border radius
 */

export interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
  huge: string;
}

export interface BorderRadiusScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface Spacing {
  padding: SpacingScale;
  margin: SpacingScale;
  gap: SpacingScale;
  borderRadius: BorderRadiusScale;
  componentPadding: {
    button: string;
    card: string;
    cardHeader: string;
    input: string;
  };
  componentGap: {
    section: string;
    component: string;
    item: string;
  };
}

/**
 * Standard Spacing Scale (8px grid)
 * xs: 4px
 * sm: 8px
 * md: 12px
 * lg: 16px
 * xl: 24px
 * xxl: 32px
 * xxxl: 40px
 * huge: 48px
 */
const spacingScale: SpacingScale = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '40px',
  huge: '48px',
};

/**
 * Border Radius Scale
 */
const borderRadiusScale: BorderRadiusScale = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '50%',
};

/**
 * Complete Spacing Token System
 * Same for all themes
 */
export const spacingTokens: Spacing = {
  padding: spacingScale,
  margin: spacingScale,
  gap: spacingScale,
  borderRadius: borderRadiusScale,
  componentPadding: {
    button: '16px 24px',
    card: '32px',
    cardHeader: '28px 32px',
    input: '12px 16px',
  },
  componentGap: {
    section: '40px',
    component: '32px',
    item: '24px',
  },
};

/**
 * Utility function to convert scale name to value
 * Example: getSpacing('lg') returns '16px'
 */
export function getSpacing(size: keyof SpacingScale): string {
  return spacingTokens.padding[size];
}

/**
 * Utility function to convert border radius name to value
 * Example: getBorderRadius('md') returns '12px'
 */
export function getBorderRadius(size: keyof BorderRadiusScale): string {
  return spacingTokens.borderRadius[size];
}

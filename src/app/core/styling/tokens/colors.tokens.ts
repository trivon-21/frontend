/**
 * Color Design Tokens
 * UNIFIED color palette used across entire application
 *
 * Single universal theme for:
 * - Customer-facing website
 * - Technician/Worker portal
 * - Inventory Manager dashboard
 * - All other applications
 *
 * One place to manage all color changes across the entire UI
 */

export interface ColorPalette {
  primary: {
    main: string;
    hover: string;
    active: string;
    light: string;
    lighter: string;
  };
  secondary: {
    main: string;
    hover: string;
    light: string;
  };
  semantic: {
    success: string;
    successLight: string;
    error: string;
    errorLight: string;
    warning: string;
    warningLight: string;
    info: string;
    infoLight: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    inverse: string;
  };
  backgrounds: {
    page: string;
    card: string;
    input: string;
    hover: string;
    selected: string;
    disabled: string;
  };
  borders: {
    light: string;
    medium: string;
    dark: string;
  };
  surface: {
    overlay: string;
    elevation1: string;
    elevation2: string;
  };
}

/**
 * UNIVERSAL Color Palette
 * Primary: Forest Green (#41603d)
 * Used everywhere: Customer portal, Technician portal, Inventory Manager, all applications
 */
const universalColors: ColorPalette = {
  primary: {
    main: '#00843D',     // Vibrant Forest Green (Top Left)
    hover: '#006B32',    // Derived Darker Green
    active: '#1A2421',   // Darkest Green/Black (Top 2nd)
    light: '#B9FBC0',    // Mint Green (Top 3rd)
    lighter: '#E8FDF0',  // Pale Mint (Top Right)
  },
  secondary: {
    main: '#2D3139',     // Slate Gray (Middle Left)
    hover: '#5C646D',    // Medium Slate (Middle 2nd)
    light: '#D1D5DB',    // Light Gray (Middle 3rd)
  },
  semantic: {
    success: '#00843D',
    successLight: '#E8FDF0',
    error: '#C20E0E',      // Vibrant Red (Bottom Left)
    errorLight: '#FEF2F2', // Very Pale Red (Bottom 3rd)
    warning: '#f59e0b',    // standard orange
    warningLight: '#FECACA', // Pale Red/Pink (Bottom 2nd)
    info: '#1D61FF',       // Vibrant Blue (Bottom Right)
    infoLight: '#eff6ff',
  },
  text: {
    primary: '#2D3139',    // Slate Gray (Middle Left)
    secondary: '#5C646D',  // Medium Slate (Middle 2nd)
    muted: '#9ca3af',
    disabled: '#D1D5DB',   // Light Gray (Middle 3rd)
    inverse: '#ffffff',
  },
  backgrounds: {
    page: '#F9FAFB',       // Off-White (Middle Right)
    card: '#ffffff',
    input: '#ffffff',
    hover: '#f3f4f6',
    selected: '#E8FDF0',
    disabled: '#e5e7eb',
  },
  borders: {
    light: '#e5e7eb',
    medium: '#D1D5DB',     // Light Gray (Middle 3rd)
    dark: '#9ca3af',
  },
  surface: {
    overlay: 'rgba(0, 0, 0, 0.4)',
    elevation1: 'rgba(0, 132, 61, 0.02)',
    elevation2: 'rgba(0, 132, 61, 0.04)',
  },
};

/**
 * Color Token System - UNIVERSAL
 * Single theme for entire application
 */
export const colorTokens: ColorPalette = universalColors;

/**
 * Utility function to get colors
 * Simple pass-through since there's only one universal theme
 */
export function getColorTokens(): ColorPalette {
  return colorTokens;
}

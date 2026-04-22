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
    main: '#41603d',
    hover: '#2d4428',
    active: '#1a2a1f',
    light: '#e6fbe7',
    lighter: '#f0f7f0',
  },
  secondary: {
    main: '#16a34a',
    hover: '#15803d',
    light: '#dcfce7',
  },
  semantic: {
    success: '#22c55e',
    successLight: '#dcfce7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    warning: '#f97316',
    warningLight: '#fff7ed',
    info: '#3b82f6',
    infoLight: '#eff6ff',
  },
  text: {
    primary: '#1a1a1b',
    secondary: '#4b5563',
    muted: '#6b7280',
    disabled: '#9ca3af',
    inverse: '#ffffff',
  },
  backgrounds: {
    page: '#f5f7f9',
    card: '#ffffff',
    input: '#f9fafb',
    hover: '#f3f4f6',
    selected: '#eaf7ea',
    disabled: '#e5e7eb',
  },
  borders: {
    light: '#e5e7eb',
    medium: '#d0d5dd',
    dark: '#9ca3af',
  },
  surface: {
    overlay: 'rgba(0, 0, 0, 0.4)',
    elevation1: 'rgba(59, 90, 56, 0.02)',
    elevation2: 'rgba(59, 90, 56, 0.04)',
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

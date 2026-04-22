/**
 * Typography Design Tokens
 * Centralized font configurations for all themes
 *
 * Fonts:
 * - Primary: Inter (body text, most components)
 * - Secondary: Arimo (button labels, form text)
 */

export interface FontConfig {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: string;
}

export interface TypographyScale {
  display: FontConfig;
  h1: FontConfig;
  h2: FontConfig;
  h3: FontConfig;
  h4: FontConfig;
  bodyLarge: FontConfig;
  body: FontConfig;
  bodySmall: FontConfig;
  label: FontConfig;
  labelSmall: FontConfig;
  caption: FontConfig;
  button: FontConfig;
  buttonSmall: FontConfig;
}

export interface ThemeTypography {
  customer: TypographyScale;
  technician: TypographyScale;
  inventory: TypographyScale;
}

/**
 * Customer Theme Typography
 */
const customerTypography: TypographyScale = {
  display: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '48px',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-2px',
  },
  h1: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '38px',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-1px',
  },
  h2: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.5px',
  },
  h3: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  h4: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  bodyLarge: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  label: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  labelSmall: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  caption: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  button: {
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: '0',
  },
  buttonSmall: {
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '0',
  },
};

/**
 * Technician Theme Typography
 * (Same as customer theme by default, can be customized per role)
 */
const technicianTypography: TypographyScale = {
  display: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '48px',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-2px',
  },
  h1: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '38px',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-1px',
  },
  h2: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.5px',
  },
  h3: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  h4: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  bodyLarge: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  label: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  labelSmall: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  caption: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  button: {
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: '0',
  },
  buttonSmall: {
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '0',
  },
};

/**
 * Inventory Theme Typography
 */
const inventoryTypography: TypographyScale = {
  display: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '48px',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-2px',
  },
  h1: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '38px',
    fontWeight: 800,
    lineHeight: 1.2,
    letterSpacing: '-1px',
  },
  h2: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.5px',
  },
  h3: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  h4: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1.4,
  },
  bodyLarge: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '18px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  label: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  labelSmall: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  caption: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  button: {
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: '0',
  },
  buttonSmall: {
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: '0',
  },
};

/**
 * Complete Typography Token System
 */
export const typographyTokens: ThemeTypography = {
  customer: customerTypography,
  technician: technicianTypography,
  inventory: inventoryTypography,
};

/**
 * Utility function to get typography tokens
 * Typography is universal across all themes
 */
export function getTypographyTokens(): TypographyScale {
  return typographyTokens.customer;
}

/**
 * Typography Design Tokens
 * Single universal font configuration for the entire Airlux application.
 *
 * Fonts:
 * - Primary: Inter (body text, most components)
 * - Secondary: Arimo (button labels, form text)
 *
 * One scale applies to all portals and dashboards — Customer, Technician, Inventory Manager.
 * To customize per role in the future, extend this file and add role-specific overrides
 * via a theme object rather than duplicating the full scale.
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

/**
 * Universal Typography Scale — Single Source of Truth
 * All portals and dashboards use this scale.
 */
export const typographyTokens: TypographyScale = {
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
 * Returns the universal typography scale.
 * Used by CSS generators and the ThemeProvider.
 */
export function getTypographyTokens(): TypographyScale {
  return typographyTokens;
}

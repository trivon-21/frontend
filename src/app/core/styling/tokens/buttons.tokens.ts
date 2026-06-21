/**
 * Button Design Tokens
 * Configuration for all button variants.
 *
 * IMPORTANT: All color values reference colorTokens — the Single Source of Truth.
 * If the brand palette changes, update colors.tokens.ts and all buttons update automatically.
 *
 * Note: Structural / layout values (padding, border-radius, font-size, font-weight)
 * are kept as literal strings here because they are button-specific design decisions,
 * not entries in the shared spacing or typography scale.
 */

import { colorTokens } from './colors.tokens';

/**
 * Configuration for a single button variant.
 * Defines visual properties for all interaction states.
 */
export interface ButtonVariant {
  background: string;
  color: string;
  padding: string;
  borderRadius: string;
  fontSize: string;
  fontWeight: number;
  fontFamily: string;
  border: string;
  minWidth?: string;
  hover?: {
    background?: string;
    color?: string;
    shadow?: string;
    transform?: string;
    border?: string;
  };
  active?: {
    background?: string;
    color?: string;
  };
  disabled?: {
    background?: string;
    color?: string;
    cursor?: string;
    opacity?: number;
  };
  focus?: {
    outline?: string;
    boxShadow?: string;
  };
}

/**
 * Collection of all button variants supported by the system.
 */
export interface ButtonTokens {
  primary: ButtonVariant;
  secondary: ButtonVariant;
  success: ButtonVariant;
  danger: ButtonVariant;
  warning: ButtonVariant;
  icon: ButtonVariant;
  text: ButtonVariant;
  review: ButtonVariant;
  small: ButtonVariant;
}

/**
 * Universal button definitions.
 * All colors reference colorTokens — no raw hex strings.
 */
const universalButtonTokens: ButtonTokens = {
  primary: {
    background: colorTokens.primary.main,
    color: colorTokens.text.inverse,
    padding: '14px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: 'Outfit, Inter, system-ui, sans-serif',
    border: 'none',
    minWidth: '200px',
    hover: {
      background: colorTokens.primary.hover,
      transform: 'translateY(-2px)',
      shadow: '0 8px 16px rgba(0, 132, 61, 0.25)',
    },
    active: {
      background: colorTokens.primary.active,
    },
    disabled: {
      background: colorTokens.secondary.light,
      color: colorTokens.text.inverse,
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    focus: {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(0, 132, 61, 0.1)',
    },
  },
  secondary: {
    background: colorTokens.backgrounds.card,
    color: colorTokens.text.primary,
    padding: '12px 24px',
    borderRadius: '99px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: `1px solid ${colorTokens.borders.medium}`,
    hover: {
      background: colorTokens.backgrounds.page,
      border: `1px solid ${colorTokens.primary.main}`,
      color: colorTokens.primary.main,
    },
    disabled: {
      background: colorTokens.backgrounds.page,
      color: colorTokens.secondary.light,
      cursor: 'not-allowed',
    },
  },
  success: {
    background: colorTokens.semantic.success,
    color: colorTokens.text.inverse,
    padding: '12px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: colorTokens.primary.hover,
    },
    active: {
      background: colorTokens.primary.active,
    },
    disabled: {
      background: colorTokens.secondary.light,
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  danger: {
    background: colorTokens.semantic.error,
    color: colorTokens.text.inverse,
    padding: '12px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: colorTokens.semantic.errorDark,
    },
    disabled: {
      background: colorTokens.secondary.light,
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  warning: {
    background: colorTokens.semantic.warning,
    color: colorTokens.text.inverse,
    padding: '12px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: colorTokens.semantic.warningDark,
    },
    disabled: {
      background: colorTokens.secondary.light,
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  icon: {
    background: 'none',
    color: colorTokens.text.secondary,
    padding: '10px',
    borderRadius: '50%',
    fontSize: '20px',
    fontWeight: 400,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: colorTokens.backgrounds.page,
      color: colorTokens.text.primary,
    },
    disabled: {
      color: colorTokens.secondary.light,
      cursor: 'not-allowed',
    },
  },
  text: {
    background: 'transparent',
    color: colorTokens.semantic.info,
    padding: '0',
    borderRadius: '0',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      color: colorTokens.semantic.infoDark,
    },
  },
  review: {
    background: colorTokens.semantic.successLight,
    color: colorTokens.semantic.success,
    padding: '8px 24px',
    borderRadius: '99px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: colorTokens.semantic.success,
      color: colorTokens.text.inverse,
    },
  },
  small: {
    background: colorTokens.primary.main,
    color: colorTokens.text.inverse,
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: colorTokens.primary.hover,
    },
  },
};

/**
 * Button Token System - UNIVERSAL
 * Single set of button styles for entire application.
 * All colors derive from colorTokens (colors.tokens.ts).
 */
export const buttonTokens: ButtonTokens = universalButtonTokens;

/**
 * Utility function to get button tokens
 */
export function getButtonTokens(): ButtonTokens {
  return buttonTokens;
}

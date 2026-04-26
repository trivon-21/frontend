/**
 * Button Design Tokens
 * UNIFIED button styling for entire application
 *
 * Single source of truth for all button variants across:
 * - Customer portal
 * - Technician portal
 * - Inventory Manager
 * - All other applications
 *
 * Button Types:
 * - primary: Main action button
 * - secondary: Alternative action button
 * - success: Positive action (green)
 * - danger: Destructive action (red)
 * - icon: Icon-only button
 * - text: Text/link button
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
 * UNIVERSAL Button Tokens
 * Primary Color: Forest Green (#41603d)
 * Used everywhere
 */
const universalButtonTokens: ButtonTokens = {
  primary: {
    background: '#00843D', // primary-main
    color: '#ffffff',
    padding: '14px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: 'Outfit, Inter, system-ui, sans-serif',
    border: 'none',
    minWidth: '200px',
    hover: {
      background: '#006B32',
      transform: 'translateY(-2px)',
      shadow: '0 8px 16px rgba(0, 132, 61, 0.25)',
    },
    active: {
      background: '#1A2421',
    },
    disabled: {
      background: '#D1D5DB',
      color: '#ffffff',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    focus: {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(0, 132, 61, 0.1)',
    },
  },
  secondary: {
    background: '#ffffff',
    color: '#2D3139',
    padding: '12px 24px',
    borderRadius: '99px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: '1px solid #D1D5DB',
    hover: {
      background: '#F9FAFB',
      border: '1px solid #00843D',
      color: '#00843D',
    },
    disabled: {
      background: '#F9FAFB',
      color: '#D1D5DB',
      cursor: 'not-allowed',
    },
  },
  success: {
    background: '#00843D',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: '#006B32',
    },
    active: {
      background: '#1A2421',
    },
    disabled: {
      background: '#D1D5DB',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  danger: {
    background: '#C20E0E',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: '#9e0b0b',
    },
    disabled: {
      background: '#D1D5DB',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  warning: {
    background: '#f59e0b',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '99px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: '#d97706',
    },
    disabled: {
      background: '#D1D5DB',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  icon: {
    background: 'none',
    color: '#5C646D',
    padding: '10px',
    borderRadius: '50%',
    fontSize: '20px',
    fontWeight: 400,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: '#F9FAFB',
      color: '#2D3139',
    },
    disabled: {
      color: '#D1D5DB',
      cursor: 'not-allowed',
    },
  },
  text: {
    background: 'transparent',
    color: '#1D61FF',
    padding: '0',
    borderRadius: '0',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      color: '#0047e0',
    },
  },
  review: {
    background: '#E8FDF0',
    color: '#00843D',
    padding: '8px 24px',
    borderRadius: '99px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: '#00843D',
      color: '#ffffff',
    },
  },
  small: {
    background: '#00843D',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, sans-serif',
    border: 'none',
    hover: {
      background: '#006B32',
    },
  },
};

/**
 * Button Token System - UNIVERSAL
 * Single set of button styles for entire application
 */
export const buttonTokens: ButtonTokens = universalButtonTokens;

/**
 * Utility function to get button tokens
 */
export function getButtonTokens(): ButtonTokens {
  return buttonTokens;
}

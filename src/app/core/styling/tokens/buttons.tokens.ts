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
    background: '#41603d',
    color: '#ffffff',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 400,
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    minWidth: '190px',
    hover: {
      background: '#2d4428',
      transform: 'translateY(-2px)',
      shadow: '0 8px 16px rgba(65, 96, 61, 0.2)',
    },
    active: {
      background: '#1a2a1f',
    },
    disabled: {
      background: '#9ca3af',
      color: '#ffffff',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
    focus: {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(65, 96, 61, 0.1)',
    },
  },
  secondary: {
    background: '#ffffff',
    color: '#3b82f6',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    border: '1px solid #e2e8f0',
    hover: {
      background: '#f0fdf4',
      border: '1px solid #41603d',
    },
    disabled: {
      background: '#f3f4f6',
      color: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  success: {
    background: '#16a34a',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    hover: {
      background: '#15803d',
    },
    active: {
      background: '#14532d',
    },
    disabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  danger: {
    background: '#ef4444',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    hover: {
      background: '#dc2626',
    },
    disabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  warning: {
    background: '#f97316',
    color: '#ffffff',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    hover: {
      background: '#ea580c',
    },
    disabled: {
      background: '#9ca3af',
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  icon: {
    background: 'none',
    color: '#4b5563',
    padding: '8px',
    borderRadius: '50%',
    fontSize: '24px',
    fontWeight: 400,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    hover: {
      background: '#f3f4f6',
      color: '#111827',
    },
    disabled: {
      color: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  text: {
    background: 'transparent',
    color: '#3b82f6',
    padding: '0',
    borderRadius: '0',
    fontSize: '14px',
    fontWeight: 400,
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    hover: {
      color: '#2563eb',
    },
  },
  review: {
    background: '#eaf7ea',
    color: '#41603d',
    padding: '8px 24px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 400,
    fontFamily: 'Arimo, Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    hover: {
      background: '#41603d',
      color: '#ffffff',
    },
  },
  small: {
    background: '#41603d',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    border: 'none',
    hover: {
      background: '#2d4428',
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

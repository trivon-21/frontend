/**
 * Airlux Design Tokens — the single source of truth for theming.
 *
 * Each entry becomes a CSS custom property: `{ "primary-main": "#00843D" }`
 * is injected as `--primary-main: #00843D` and used in CSS as
 * `var(--primary-main)`. To re-theme the whole app, edit a value here.
 */
export const TOKENS: Record<string, string> = {
  // Brand colors
  'primary-main': '#00843D',
  'primary-hover': '#006B32',
  'primary-active': '#1A2421',
  'primary-light': '#B9FBC0',
  'primary-lighter': '#E8FDF0',
  'secondary-main': '#2D3139',
  'secondary-hover': '#5C646D',
  'secondary-light': '#D1D5DB',

  // Status colors
  'success': '#00843D',
  'success-light': '#E8FDF0',
  'error': '#C20E0E',
  'error-light': '#FEF2F2',
  'warning': '#f59e0b',
  'warning-light': '#FECACA',
  'info': '#1D61FF',
  'info-light': '#eff6ff',

  // Text colors
  'text-primary': '#2D3139',
  'text-secondary': '#5C646D',
  'text-muted': '#9ca3af',
  'text-disabled': '#D1D5DB',
  'text-inverse': '#ffffff',

  // Background colors
  'background-page': '#F9FAFB',
  'background-card': '#ffffff',
  'background-input': '#ffffff',
  'background-hover': '#f3f4f6',
  'background-selected': '#E8FDF0',
  'background-disabled': '#e5e7eb',

  // Border colors
  'border-light': '#e5e7eb',
  'border-medium': '#D1D5DB',
  'border-dark': '#9ca3af',

  // Surface colors
  'surface-overlay': 'rgba(0, 0, 0, 0.4)',
  'surface-elevation-1': 'rgba(0, 132, 61, 0.02)',
  'surface-elevation-2': 'rgba(0, 132, 61, 0.04)',

  // Typography
  'display-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'display-font-size': '48px',
  'display-font-weight': '800',
  'display-line-height': '1.1',
  'display-letter-spacing': '-2px',
  'h1-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'h1-font-size': '38px',
  'h1-font-weight': '800',
  'h1-line-height': '1.2',
  'h1-letter-spacing': '-1px',
  'h2-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'h2-font-size': '28px',
  'h2-font-weight': '700',
  'h2-line-height': '1.3',
  'h2-letter-spacing': '-0.5px',
  'h3-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'h3-font-size': '24px',
  'h3-font-weight': '700',
  'h3-line-height': '1.4',
  'h4-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'h4-font-size': '20px',
  'h4-font-weight': '700',
  'h4-line-height': '1.4',
  'body-large-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'body-large-font-size': '18px',
  'body-large-font-weight': '400',
  'body-large-line-height': '1.5',
  'body-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'body-font-size': '16px',
  'body-font-weight': '400',
  'body-line-height': '1.5',
  'body-small-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'body-small-font-size': '14px',
  'body-small-font-weight': '400',
  'body-small-line-height': '1.5',
  'label-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'label-font-size': '16px',
  'label-font-weight': '600',
  'label-line-height': '1.4',
  'label-small-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'label-small-font-size': '14px',
  'label-small-font-weight': '600',
  'label-small-line-height': '1.4',
  'caption-font-family': 'Inter, system-ui, -apple-system, sans-serif',
  'caption-font-size': '12px',
  'caption-font-weight': '500',
  'caption-line-height': '1.4',
  'button-font-family': 'Arimo, Inter, system-ui, -apple-system, sans-serif',
  'button-font-size': '16px',
  'button-font-weight': '400',
  'button-line-height': '1',
  'button-letter-spacing': '0',
  'button-small-font-family': 'Arimo, Inter, system-ui, -apple-system, sans-serif',
  'button-small-font-size': '14px',
  'button-small-font-weight': '600',
  'button-small-line-height': '1',
  'button-small-letter-spacing': '0',

  // Spacing scale
  'spacing-xs': '4px',
  'spacing-sm': '8px',
  'spacing-md': '12px',
  'spacing-lg': '16px',
  'spacing-xl': '24px',
  'spacing-xxl': '32px',
  'spacing-xxxl': '40px',
  'spacing-huge': '48px',

  // Border radius scale
  'border-radius-xs': '4px',
  'border-radius-sm': '8px',
  'border-radius-md': '12px',
  'border-radius-lg': '16px',
  'border-radius-xl': '20px',
  'border-radius-full': '50%',

  // Component padding
  'padding-button': '16px 24px',
  'padding-card': '32px',
  'padding-cardHeader': '28px 32px',
  'padding-input': '12px 16px',

  // Component gaps
  'gap-section': '40px',
  'gap-component': '32px',
  'gap-item': '24px',

  // Shadows
  'shadow-minimal': '0 1px 3px rgba(0, 0, 0, 0.05)',
  'shadow-light': '0 2px 10px rgba(0, 0, 0, 0.02)',
  'shadow-standard': '0 4px 20px rgba(0, 0, 0, 0.03)',
  'shadow-medium': '0 4px 24px rgba(0, 0, 0, 0.04)',
  'shadow-large': '0 8px 16px rgba(59, 90, 56, 0.2)',
  'shadow-xl': '0 10px 40px rgba(0, 0, 0, 0.15)',
  'shadow-modal': '0 20px 60px rgba(0, 0, 0, 0.35)',
};

/**
 * Design tokens the shared `.role-portal-shell` button system reads. In the app they come from
 * `role-portal-shell.css` (`:host` block) and the theme provider; specs render bare test hosts,
 * so they bind this string to the shell element's `style` attribute. Values mirror those sources.
 */
export const ROLE_PORTAL_TEST_TOKENS = [
  '--primary-main: #00843D',
  '--primary-hover: #006b31',
  '--error: #c62828',
  '--danger-hover: #a61f1f',
  '--background-card: #fff',
  '--text-secondary: #4a5a52',
  '--control-radius: 10px',
  '--control-height: 40px',
  '--control-padding: 0 20px',
  '--control-gap: 8px',
  '--control-font-size: 13.5px',
  '--control-border: rgba(0, 0, 0, 0.1)',
  '--control-focus-ring: rgba(0, 132, 61, 0.24)',
  '--control-disabled-opacity: 0.55',
].join('; ');

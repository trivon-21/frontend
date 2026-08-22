/**
 * Styling System — Public API
 *
 * Two things to know:
 *   1. Edit values in `theme.tokens.ts` to re-theme the app.
 *   2. `ThemeProvider.loadTheme()` (called once in app.ts) injects them.
 *
 * Components just use the CSS variables, e.g. `var(--primary-main)`.
 */
export { ThemeProvider } from './theme.provider';
export { TOKENS } from './theme.tokens';

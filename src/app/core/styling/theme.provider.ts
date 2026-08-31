/**
 * Theme Provider
 *
 * Turns the design TOKENS into a `:root { --var: value }` block, prepends the
 * static BASE_CSS, and injects the result into a single <style> tag once at app
 * startup (from app.ts → loadTheme()). Because everything is driven by CSS
 * variables, colours/spacing can also be tweaked live via updateVariable().
 *
 * This replaces the previous multi-file generator/validator/registry system —
 * the output CSS is identical, but there is now one obvious place to customize:
 * theme.tokens.ts.
 */
import { Injectable } from '@angular/core';
import { TOKENS } from './theme.tokens';
import { BASE_CSS } from './theme.css';

const STYLE_ELEMENT_ID = 'airlux-theme-styles';

@Injectable({ providedIn: 'root' })
export class ThemeProvider {
  private readonly isBrowser = typeof document !== 'undefined';

  /** Injects the theme stylesheet into <head>. Call once when the app boots. */
  loadTheme(): void {
    if (!this.isBrowser) return;

    const css = this.buildRootVariables() + '\n' + BASE_CSS;

    let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }

  /** Override a single CSS variable at runtime, e.g. updateVariable('primary-main', '#123'). */
  updateVariable(name: string, value: string): void {
    if (!this.isBrowser) return;
    document.documentElement.style.setProperty(`--${name}`, value);
  }

  /** Override several CSS variables at once. */
  updateVariables(updates: Record<string, string>): void {
    Object.entries(updates).forEach(([name, value]) => this.updateVariable(name, value));
  }

  /** Builds the `:root { … }` custom-property block from TOKENS. */
  private buildRootVariables(): string {
    const declarations = Object.entries(TOKENS)
      .map(([name, value]) => `  --${name}: ${value};`)
      .join('\n');
    return `:root {\n${declarations}\n}\n`;
  }
}

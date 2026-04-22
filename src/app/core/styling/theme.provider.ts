/**
 * Theme Provider Service
 * Manages dynamic theme loading and CSS injection
 *
 * Responsibilities:
 * - Load complete theme CSS on app initialization
 * - Inject CSS into DOM as <style> tag
 * - Support theme switching at runtime
 * - Track current active theme
 * - Validate tokens before injection
 * - Handle SSR and browser compatibility
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, take } from 'rxjs';
import { generateCompleteThemeCSS } from './generators/component-styles.generator';
import { injectThemeCSS, updateCSSVariable } from './generators/component-styles.generator';
import { CSSSupport } from './compat/css-support';
import { TokenValidator } from './validators/tokens.validator';

export type ThemeName = 'default';

/**
 * Injectable service for theme management
 * Usage:
 * - In AppComponent: this.themeProvider.loadTheme()
 * - From any component: this.themeProvider.updateVariable('primary-main', '#ffffff')
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeProvider {
  private currentTheme: ThemeName = 'default';
  private styleElement: HTMLStyleElement | null = null;
  private readonly elementId = 'airlux-theme-styles';
  private isReady = false;
  private readySubject = new BehaviorSubject<boolean>(false);
  public ready$ = this.readySubject.asObservable();
  private isSSR = typeof document === 'undefined';
  private enableValidation = true;
  private styleHistory: { timestamp: number; size: number }[] = [];

  constructor() {
    // Early browser support check
    if (!this.isSSR) {
      CSSSupport.logBrowserInfo();
    }
  }

  /**
   * Load complete theme CSS and inject into DOM
   * Called once on app initialization
   * RECOVERY: Validates tokens, handles SSR, validates browser support
   */
  public loadTheme(theme: ThemeName = 'default'): void {
    try {
      // RECOVERY 1.1: Guard DOM access for SSR
      if (this.isSSR) {
        console.warn('⚠  DOM not available (SSR mode). Theme CSS injection deferred to client.');
        this.isReady = false;
        return;
      }

      // RECOVERY 4.1: Check browser support
      if (!CSSSupport.CSS_VARIABLES_SUPPORTED) {
        console.error('❌ CSS Custom Properties not supported in this browser');
        throw new Error('Browser does not support CSS Custom Properties (IE 11 or older)');
      }

      // RECOVERY 6.1: Validate all tokens before injection
      if (this.enableValidation) {
        TokenValidator.logValidationStatus();
        TokenValidator.throwIfInvalid();
      }

      // Generate complete CSS from all tokens
      const css = generateCompleteThemeCSS();

      // RECOVERY 3.1: Track CSS size for memory monitoring
      const sizeKB = new Blob([css]).size / 1024;
      this.styleHistory.push({
        timestamp: Date.now(),
        size: sizeKB,
      });

      if (sizeKB > 500) {
        console.warn(`⚠  Generated CSS is ${sizeKB}KB - unusually large`);
      }

      // Keep only last 10 entries
      if (this.styleHistory.length > 10) {
        this.styleHistory.shift();
      }

      // Inject into DOM
      this.styleElement = injectThemeCSS(css, this.elementId);

      // Track current theme
      this.currentTheme = theme;
      this.isReady = true;
      this.readySubject.next(true);

      console.log(`✓ Theme loaded: ${theme}`);
    } catch (error) {
      this.isReady = false;
      this.readySubject.next(false);
      console.error('❌ Failed to load theme:', error);
      throw error;
    }
  }

  /**
   * Get currently active theme name
   */
  public getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }

  /**
   * Switch to a different theme
   * Regenerates and reinjects CSS
   */
  public switchTheme(theme: ThemeName): void {
    if (theme === this.currentTheme) {
      console.log(`Theme ${theme} already active`);
      return;
    }

    this.loadTheme(theme);
  }

  /**
   * Update a single CSS variable at runtime
   * More efficient than reloading entire theme
   * RECOVERY 8.1: Forces reflow to ensure updates apply
   *
   * @param variableName - Name without '--' prefix (e.g., 'primary-main')
   * @param value - CSS value (e.g., '#ffffff')
   *
   * Example:
   * this.themeProvider.updateVariable('primary-main', '#00ff00');
   */
  public updateVariable(variableName: string, value: string): void {
    try {
      updateCSSVariable(variableName, value);

      // RECOVERY 8.1: Force browser reflow to ensure update is applied
      void document.documentElement.offsetHeight;

      console.log(`✓ Variable updated: --${variableName} = ${value}`);
    } catch (error) {
      console.error(`❌ Failed to update variable ${variableName}:`, error);
    }
  }

  /**
   * Update multiple CSS variables at once
   *
   * @param updates - Object with variable names as keys and values as CSS values
   *
   * Example:
   * this.themeProvider.updateVariables({
   *   'primary-main': '#00ff00',
   *   'text-primary': '#000000'
   * });
   */
  public updateVariables(updates: Record<string, string>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.updateVariable(key, value);
    });
  }

  /**
   * Get reference to the style element for advanced manipulation
   */
  public getStyleElement(): HTMLStyleElement | null {
    return this.styleElement;
  }

  /**
   * Check if theme is currently loaded
   */
  public isThemeLoaded(): boolean {
    return this.styleElement !== null && this.styleElement.innerHTML.length > 0;
  }

  /**
   * Reload current theme (useful after token updates)
   */
  public reloadTheme(): void {
    this.loadTheme(this.currentTheme);
  }

  /**
   * Clear injected theme CSS from DOM
   */
  public clearTheme(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      console.log('✓ Theme cleared from DOM');
    }
  }

  /**
   * RECOVERY 5.1: Wait for theme to be ready
   * Prevents race conditions when components access theme before initialization
   */
  public waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.ready$
          .pipe(
            filter((ready) => ready),
            take(1),
          )
          .subscribe(() => resolve());
      }
    });
  }

  /**
   * RECOVERY 5.1: Wait for theme ready with timeout protection
   */
  public async waitForReadyWithTimeout(ms: number = 5000): Promise<void> {
    return Promise.race([
      this.waitForReady(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Theme loading timeout')), ms),
      ),
    ]);
  }

  /**
   * Check if theme is ready for use
   */
  public isThemeReady(): boolean {
    return this.isReady;
  }

  /**
   * RECOVERY 3.1: Garbage collection for memory monitoring
   * Removes duplicate style elements if they somehow exist
   */
  public collectGarbage(): void {
    if (this.isSSR) return;

    const elements = document.querySelectorAll(`style[id*="airlux"]`);
    if (elements.length > 1) {
      for (let i = 0; i < elements.length - 1; i++) {
        elements[i].remove();
      }
      console.log(`✓ Cleaned up ${elements.length - 1} duplicate style elements`);
    }
  }

  /**
   * Get memory monitoring statistics
   */
  public getMemoryStats(): { averageSize: number; maxSize: number; samples: number } {
    if (this.styleHistory.length === 0) {
      return { averageSize: 0, maxSize: 0, samples: 0 };
    }

    const sizes = this.styleHistory.map((h) => h.size);
    const averageSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const maxSize = Math.max(...sizes);

    return {
      averageSize: Math.round(averageSize * 100) / 100,
      maxSize: Math.round(maxSize * 100) / 100,
      samples: this.styleHistory.length,
    };
  }

  /**
   * Enable/disable token validation
   * Disable for performance if tokens are guaranteed valid
   */
  public setValidationEnabled(enabled: boolean): void {
    this.enableValidation = enabled;
    console.log(`Token validation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current validation status
   */
  public isValidationEnabled(): boolean {
    return this.enableValidation;
  }

  /**
   * Get detailed status report
   */
  public getStatusReport(): string {
    const stats = this.getMemoryStats();
    let report = '═══════════════════════════════════\n';
    report += '  THEME PROVIDER STATUS\n';
    report += '═══════════════════════════════════\n';
    report += `Current Theme: ${this.currentTheme}\n`;
    report += `Theme Ready: ${this.isReady ? '✓ Yes' : '✗ No'}\n`;
    report += `SSR Mode: ${this.isSSR ? 'Yes' : 'No'}\n`;
    report += `Browser Support: ${CSSSupport.CSS_VARIABLES_SUPPORTED ? '✓ Full' : '✗ Limited'}\n`;
    report += `Validation Enabled: ${this.enableValidation ? 'Yes' : 'No'}\n`;
    report += `CSS Size (Avg): ${stats.averageSize}KB\n`;
    report += `CSS Size (Max): ${stats.maxSize}KB\n`;
    report += '═══════════════════════════════════\n';
    return report;
  }

  /**
   * Log status report to console
   */
  public logStatusReport(): void {
    console.log(this.getStatusReport());
  }
}

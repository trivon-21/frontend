/**
 * Theme Provider Service
 * Manages the generation and injection of CSS variables and global styles.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, take } from 'rxjs';
import { generateCompleteThemeCSS } from './generators/component-styles.generator';
import { injectThemeCSS, updateCSSVariable } from './generators/component-styles.generator';
import { getThemeByName } from './themes/default.theme';
import { CSSSupport } from './compat/css-support';
import { TokenValidator } from './validators/tokens.validator';

export type ThemeName = 'default';

/**
 * Service for central theme management.
 * Injects CSS into the DOM and provides runtime style updates.
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
    // Initial browser capability check
    if (!this.isSSR) {
      CSSSupport.logBrowserInfo();
    }
  }

  /**
   * Initializes the theme by generating CSS and injecting it into the DOM.
   * Handles server-side rendering and browser compatibility checks.
   */
  public loadTheme(theme: ThemeName = 'default'): void {
    try {
      // Defer injection if running in SSR environment
      if (this.isSSR) {
        console.warn('DOM not available (SSR mode). Theme injection deferred to client.');
        this.isReady = false;
        return;
      }

      // Verify browser support for CSS custom properties
      if (!CSSSupport.CSS_VARIABLES_SUPPORTED) {
        console.error('CSS Custom Properties not supported in this browser');
        throw new Error('Browser does not support CSS Custom Properties');
      }

      // Execute token validation if enabled
      if (this.enableValidation) {
        TokenValidator.logValidationStatus();
        TokenValidator.throwIfInvalid();
      }

      // Resolve the full UnifiedTheme object from the registry
      const themeObject = getThemeByName(theme);

      // Generate complete CSS bundle from the resolved theme
      const css = generateCompleteThemeCSS(themeObject);

      // Track CSS size for performance monitoring
      const sizeKB = new Blob([css]).size / 1024;
      this.styleHistory.push({
        timestamp: Date.now(),
        size: sizeKB,
      });

      if (sizeKB > 500) {
        console.warn(`Generated CSS bundle size (${sizeKB}KB) exceeds performance threshold`);
      }

      // Maintain limited history of style generations
      if (this.styleHistory.length > 10) {
        this.styleHistory.shift();
      }

      // Inject generated styles into the document head
      this.styleElement = injectThemeCSS(css, this.elementId);

      this.currentTheme = theme;
      this.isReady = true;
      this.readySubject.next(true);

      console.log(`Theme initialized: ${theme}`);
    } catch (error) {
      this.isReady = false;
      this.readySubject.next(false);
      console.error('Theme initialization failed:', error);
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
   * Updates a single CSS variable at runtime.
   * Forces a browser reflow to ensure the update is rendered immediately.
   */
  public updateVariable(variableName: string, value: string): void {
    try {
      updateCSSVariable(variableName, value);

      // Trigger reflow for immediate rendering
      void document.documentElement.offsetHeight;

      console.log(`Variable updated: --${variableName} = ${value}`);
    } catch (error) {
      console.error(`Failed to update variable ${variableName}:`, error);
    }
  }

  /**
   * Batch updates multiple CSS variables.
   */
  public updateVariables(updates: Record<string, string>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.updateVariable(key, value);
    });
  }

  /**
   * Removes the injected theme styles from the document head.
   */
  public clearTheme(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
      this.styleElement = null;
      console.log('Theme styles removed from DOM');
    }
  }

  /**
   * Returns a promise that resolves when the theme is initialized.
   * Prevents race conditions during application startup.
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
   * Periodically cleans up any duplicate style elements found in the DOM.
   */
  public collectGarbage(): void {
    if (this.isSSR) return;

    const elements = document.querySelectorAll(`style[id*="airlux"]`);
    if (elements.length > 1) {
      for (let i = 0; i < elements.length - 1; i++) {
        elements[i].remove();
      }
      console.log(`Cleaned up ${elements.length - 1} duplicate style elements`);
    }
  }

  /**
   * Generates a status report of the current theme provider state.
   */
  public getStatusReport(): string {
    const stats = this.getMemoryStats();
    let report = '-----------------------------------\n';
    report += '  THEME PROVIDER STATUS\n';
    report += '-----------------------------------\n';
    report += `Current Theme: ${this.currentTheme}\n`;
    report += `Theme Ready: ${this.isReady ? 'Yes' : 'No'}\n`;
    report += `SSR Mode: ${this.isSSR ? 'Yes' : 'No'}\n`;
    report += `Browser Support: ${CSSSupport.CSS_VARIABLES_SUPPORTED ? 'Full' : 'Limited'}\n`;
    report += `Validation Enabled: ${this.enableValidation ? 'Yes' : 'No'}\n`;
    report += `CSS Size (Avg): ${stats.averageSize}KB\n`;
    report += `CSS Size (Max): ${stats.maxSize}KB\n`;
    report += '-----------------------------------\n';
    return report;
  }

  /**
   * Retrieves performance and memory usage statistics for the theme generator.
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
   * Enables or disables runtime token validation.
   */
  public setValidationEnabled(enabled: boolean): void {
    this.enableValidation = enabled;
    console.log(`Token validation ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Logs the current status report to the console.
   */
  public logStatusReport(): void {
    console.log(this.getStatusReport());
  }
}

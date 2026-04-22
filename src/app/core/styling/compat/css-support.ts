/**
 * CSS Support Detector
 * Detects browser support for CSS custom properties and other features
 *
 * Critical for graceful degradation and early error detection
 */

export class CSSSupport {
  // Static detection (runs once)
  static readonly CSS_VARIABLES_SUPPORTED = CSSSupport.detectCSSVariables();
  static readonly COMPUTED_STYLE_SUPPORTED = CSSSupport.detectComputedStyle();

  /**
   * Detect if browser supports CSS custom properties (CSS variables)
   */
  private static detectCSSVariables(): boolean {
    try {
      if (typeof document === 'undefined') return false;

      document.documentElement.style.setProperty('--test-var', '1px');
      const result = document.documentElement.style.getPropertyValue('--test-var') === '1px';
      document.documentElement.style.removeProperty('--test-var');
      return result;
    } catch (error) {
      console.warn('❌ CSS Variables detection failed:', error);
      return false;
    }
  }

  /**
   * Detect if getComputedStyle is available
   */
  private static detectComputedStyle(): boolean {
    try {
      return typeof window !== 'undefined' && typeof window.getComputedStyle === 'function';
    } catch {
      return false;
    }
  }

  /**
   * Throw error if required features not supported
   */
  static throwIfUnsupported(): void {
    if (!CSSSupport.CSS_VARIABLES_SUPPORTED) {
      throw new Error(
        '❌ This application requires CSS Custom Properties support. ' +
          'Your browser (IE 11 or older) does not support this feature. ' +
          'Please use Chrome, Firefox, Safari, or Edge.',
      );
    }
  }

  /**
   * Log browser support info for debugging
   */
  static logBrowserInfo(): void {
    console.log('=== Browser CSS Support ===');
    console.log(
      `CSS Variables: ${CSSSupport.CSS_VARIABLES_SUPPORTED ? '✓ Supported' : '✗ NOT supported'}`,
    );
    console.log(
      `Computed Styles: ${CSSSupport.COMPUTED_STYLE_SUPPORTED ? '✓ Supported' : '✗ NOT supported'}`,
    );
  }

  /**
   * Get graceful fallback recommendation
   */
  static getRecommendation(): string {
    if (!CSSSupport.CSS_VARIABLES_SUPPORTED) {
      return 'CSS Custom Properties not supported. Static fallback stylesheet will be used.';
    }
    return 'All CSS features supported. Dynamic theming enabled.';
  }
}

/**
 * CSS Validator
 * Validates CSS values and token configurations
 *
 * Catches common configuration errors early
 */

export class CSSValidator {
  /**
   * Validate if value is a valid CSS color
   * Supports: hex, rgb, rgba, hsl, hsla, named colors
   */
  static isValidColor(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    const colorRegex =
      /^(#([0-9A-Fa-f]{3}){1,2}|rgb\(|rgba\(|hsl\(|hsla\(|currentColor|transparent|inherit|[a-z]+).*$/i;
    return colorRegex.test(value.trim());
  }

  /**
   * Validate if value is a valid CSS spacing/sizing
   * Supports: px, em, rem, %, vh, vw, ch, ex, cm, mm, in, pt, pc, calc()
   */
  static isValidSpacing(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    const spacingRegex = /^(\d+(\.\d+)?(px|em|rem|%|vh|vw|ch|ex|cm|mm|in|pt|pc)|calc\(.+\)|0)$/;
    return spacingRegex.test(value.trim());
  }

  /**
   * Validate if value is a valid box-shadow
   * Format: none | x y blur spread color
   */
  static isValidShadow(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    // Accept 'none' or shadow values
    if (value.trim() === 'none') return true;

    // Box-shadow can have multiple shadows separated by commas
    const shadows = value.split(',');
    const shadowRegex =
      /^((-?\d+px\s+){2}(-?\d+px)?(\s+(-?\d+px))?\s+(#([0-9A-Fa-f]{3}){1,2}|rgba?\(.+\)|hsl.+\))|transparent)$/;

    return shadows.every((shadow) => shadowRegex.test(shadow.trim()));
  }

  /**
   * Validate if value is a valid border-radius
   */
  static isValidBorderRadius(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    const radiusRegex = /^(\d+(\.\d+)?(px|em|rem|%)|50%)$/;
    return radiusRegex.test(value.trim());
  }

  /**
   * Validate if value is a valid font-size
   */
  static isValidFontSize(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    const sizeRegex =
      /^(\d+(\.\d+)?(px|em|rem|%|pt|pc|ch|vw|vh)|small|medium|large|smaller|larger|inherit)$/;
    return sizeRegex.test(value.trim());
  }

  /**
   * Validate if value is a valid font-weight
   */
  static isValidFontWeight(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    const weightRegex = /^(\d{1,3}|normal|bold|bolder|lighter|inherit)$/;
    return weightRegex.test(value.trim());
  }

  /**
   * Validate if value is a valid line-height
   */
  static isValidLineHeight(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    const heightRegex = /^(\d+(\.\d+)?(px|em|rem|%)?|normal|inherit)$/;
    return heightRegex.test(value.trim());
  }

  /**
   * Validate token property based on its name
   * Automatically detects type from property name
   */
  static validateToken(name: string, value: string): { valid: boolean; error?: string } {
    if (!value) {
      return { valid: false, error: `Token "${name}" is empty or null` };
    }

    if (typeof value !== 'string') {
      return { valid: false, error: `Token "${name}" must be a string, got ${typeof value}` };
    }

    // Detect token type from name
    if (name.includes('color') || name.includes('background') || name.includes('text')) {
      if (!this.isValidColor(value)) {
        return { valid: false, error: `Invalid color for "${name}": "${value}"` };
      }
    }

    if (
      name.includes('spacing') ||
      name.includes('padding') ||
      name.includes('gap') ||
      name.includes('margin')
    ) {
      if (!this.isValidSpacing(value)) {
        return { valid: false, error: `Invalid spacing for "${name}": "${value}"` };
      }
    }

    if (name.includes('shadow')) {
      if (!this.isValidShadow(value)) {
        return { valid: false, error: `Invalid shadow for "${name}": "${value}"` };
      }
    }

    if (name.includes('radius') || name.includes('rounded')) {
      if (!this.isValidBorderRadius(value)) {
        return { valid: false, error: `Invalid border-radius for "${name}": "${value}"` };
      }
    }

    if (name.includes('size') && name.includes('font')) {
      if (!this.isValidFontSize(value)) {
        return { valid: false, error: `Invalid font-size for "${name}": "${value}"` };
      }
    }

    if (name.includes('weight') && name.includes('font')) {
      if (!this.isValidFontWeight(value)) {
        return { valid: false, error: `Invalid font-weight for "${name}": "${value}"` };
      }
    }

    if (name.includes('height') && name.includes('line')) {
      if (!this.isValidLineHeight(value)) {
        return { valid: false, error: `Invalid line-height for "${name}": "${value}"` };
      }
    }

    return { valid: true };
  }

  /**
   * Validate multiple tokens
   */
  static validateTokens(tokens: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    Object.entries(tokens).forEach(([name, value]) => {
      const validation = this.validateToken(name, value);
      if (!validation.valid) {
        errors.push(validation.error || `Invalid token: ${name}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get validation summary with suggestions
   */
  static getValidationReport(tokens: Record<string, string>): string {
    const validation = this.validateTokens(tokens);

    let report = '';
    if (validation.valid) {
      report = `✓ All ${Object.keys(tokens).length} tokens are valid`;
    } else {
      report = `✗ Token validation failed (${validation.errors.length} errors):\n`;
      validation.errors.forEach((error) => {
        report += `  • ${error}\n`;
      });
    }

    return report;
  }
}

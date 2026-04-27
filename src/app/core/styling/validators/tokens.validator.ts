/**
 * Token Validator
 * Validates that all token objects have required properties and valid values
 *
 * Prevents undefined token errors at runtime
 */

import { colorTokens, type ColorPalette } from '../tokens/colors.tokens';
import { typographyTokens, type TypographyScale } from '../tokens/typography.tokens';
import { spacingTokens, type Spacing } from '../tokens/spacing.tokens';
import { shadowTokens, type Shadows } from '../tokens/shadows.tokens';
import { buttonTokens, type ButtonTokens } from '../tokens/buttons.tokens';
import { tableTokens, type TableTokens } from '../tokens/tables.tokens';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class TokenValidator {
  /**
   * Validate all tokens at once
   */
  static validateAllTokens(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate each token type
    const colorValidation = this.validateColorTokens(colorTokens);
    errors.push(...colorValidation.errors);
    warnings.push(...colorValidation.warnings);

    const typographyValidation = this.validateTypographyTokens(typographyTokens.customer);
    errors.push(...typographyValidation.errors);
    warnings.push(...typographyValidation.warnings);

    const spacingValidation = this.validateSpacingTokens(spacingTokens);
    errors.push(...spacingValidation.errors);
    warnings.push(...spacingValidation.warnings);

    const shadowValidation = this.validateShadowTokens(shadowTokens);
    errors.push(...shadowValidation.errors);
    warnings.push(...shadowValidation.warnings);

    const buttonValidation = this.validateButtonTokens(buttonTokens);
    errors.push(...buttonValidation.errors);
    warnings.push(...buttonValidation.warnings);

    const tableValidation = this.validateTableTokens(tableTokens);
    errors.push(...tableValidation.errors);
    warnings.push(...tableValidation.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate color tokens
   */
  private static validateColorTokens(colors: ColorPalette): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!colors) {
      errors.push('colorTokens is null or undefined');
      return { errors, warnings };
    }

    // Check primary colors
    if (!colors.primary?.main) errors.push('colorTokens.primary.main is missing');
    if (!colors.primary?.hover) errors.push('colorTokens.primary.hover is missing');
    if (!colors.primary?.active) errors.push('colorTokens.primary.active is missing');

    // Check secondary colors
    if (!colors.secondary?.main) errors.push('colorTokens.secondary.main is missing');

    // Check semantic colors
    if (!colors.semantic?.success) errors.push('colorTokens.semantic.success is missing');
    if (!colors.semantic?.error) errors.push('colorTokens.semantic.error is missing');
    if (!colors.semantic?.warning) errors.push('colorTokens.semantic.warning is missing');

    // Check text colors
    if (!colors.text?.primary) errors.push('colorTokens.text.primary is missing');
    if (!colors.text?.secondary) errors.push('colorTokens.text.secondary is missing');

    // Check backgrounds
    if (!colors.backgrounds?.page) errors.push('colorTokens.backgrounds.page is missing');
    if (!colors.backgrounds?.card) errors.push('colorTokens.backgrounds.card is missing');

    return { errors, warnings };
  }

  /**
   * Validate typography tokens
   */
  private static validateTypographyTokens(typography: TypographyScale): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!typography) {
      errors.push('typographyTokens is null or undefined');
      return { errors, warnings };
    }

    // Check key typography levels
    const requiredLevels = ['h1', 'h2', 'body', 'button', 'label'];
    requiredLevels.forEach((level) => {
      if (!typography[level as keyof TypographyScale]) {
        errors.push(`typographyTokens.${level} is missing`);
      }
    });

    // Check required properties in each level
    if (typography.body) {
      if (!typography.body.fontSize) errors.push('typography.body.fontSize is missing');
      if (!typography.body.fontFamily) errors.push('typography.body.fontFamily is missing');
    }

    return { errors, warnings };
  }

  /**
   * Validate spacing tokens
   */
  private static validateSpacingTokens(spacing: Spacing): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!spacing) {
      errors.push('spacingTokens is null or undefined');
      return { errors, warnings };
    }

    // Check padding scale
    if (!spacing.padding) {
      errors.push('spacingTokens.padding is missing');
    } else {
      const requiredSizes = ['xs', 'sm', 'md', 'lg', 'xl'];
      requiredSizes.forEach((size) => {
        if (!spacing.padding[size as keyof typeof spacing.padding]) {
          errors.push(`spacingTokens.padding.${size} is missing`);
        }
      });
    }

    // Check border radius
    if (!spacing.borderRadius) {
      errors.push('spacingTokens.borderRadius is missing');
    }

    return { errors, warnings };
  }

  /**
   * Validate shadow tokens
   */
  private static validateShadowTokens(shadows: Shadows): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!shadows) {
      errors.push('shadowTokens is null or undefined');
      return { errors, warnings };
    }

    if (!shadows.boxShadows) {
      errors.push('shadowTokens.boxShadows is missing');
      return { errors, warnings };
    }

    // Check required shadow presets
    const requiredShadows = ['minimal', 'light', 'standard', 'medium', 'large'];
    requiredShadows.forEach((shadow) => {
      if (!shadows.boxShadows[shadow as keyof typeof shadows.boxShadows]) {
        errors.push(`shadowTokens.boxShadows.${shadow} is missing`);
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate button tokens
   */
  private static validateButtonTokens(buttons: ButtonTokens): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!buttons) {
      errors.push('buttonTokens is null or undefined');
      return { errors, warnings };
    }

    // Check required button variants
    const requiredVariants = ['primary', 'secondary', 'success', 'danger'];
    requiredVariants.forEach((variant) => {
      if (!buttons[variant as keyof ButtonTokens]) {
        errors.push(`buttonTokens.${variant} is missing`);
      }
    });

    // Check primary button structure
    if (buttons.primary) {
      if (!buttons.primary.background) errors.push('buttonTokens.primary.background is missing');
      if (!buttons.primary.color) errors.push('buttonTokens.primary.color is missing');
    }

    return { errors, warnings };
  }

  /**
   * Validate table tokens
   */
  private static validateTableTokens(tables: TableTokens): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tables) {
      errors.push('tableTokens is null or undefined');
      return { errors, warnings };
    }

    // Check required table structure
    if (!tables.header) errors.push('tableTokens.header is missing');
    if (!tables.cell) errors.push('tableTokens.cell is missing');
    if (!tables.statusPills) errors.push('tableTokens.statusPills is missing');

    return { errors, warnings };
  }

  /**
   * Generate validation report
   */
  static getValidationReport(): string {
    const result = this.validateAllTokens();

    let report = '═══════════════════════════════════\n';
    report += '  TOKEN VALIDATION REPORT\n';
    report += '═══════════════════════════════════\n\n';

    if (result.valid) {
      report += '✓ All tokens are valid\n';
    } else {
      report += `✗ Token validation failed (${result.errors.length} errors)\n\n`;
      report += 'ERRORS:\n';
      result.errors.forEach((error) => {
        report += `  ❌ ${error}\n`;
      });
    }

    if (result.warnings.length > 0) {
      report += '\nWARNINGS:\n';
      result.warnings.forEach((warning) => {
        report += `  ⚠  ${warning}\n`;
      });
    }

    report += '\n═══════════════════════════════════\n';
    return report;
  }

  /**
   * Throw error if validation fails
   */
  static throwIfInvalid(): void {
    const result = this.validateAllTokens();
    if (!result.valid) {
      const message = `Token validation failed:\n${result.errors.join('\n')}`;
      throw new Error(message);
    }
  }

  /**
   * Log validation status to console
   */
  static logValidationStatus(): void {
    const result = this.validateAllTokens();
    if (result.valid) {
      console.log('✓ All design tokens validated successfully');
    } else {
      console.error('✗ Token validation failed:', result.errors);
      result.errors.forEach((error) => console.error(`  - ${error}`));
    }
    if (result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.warn(`  ⚠ ${warning}`));
    }
  }
}

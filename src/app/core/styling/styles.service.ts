/**
 * Styles Service
 * Provides utilities for runtime CSS customization
 *
 * Responsibilities:
 * - Update individual CSS variables dynamically
 * - Batch update multiple variables
 * - Get current variable values
 * - Reset variables to defaults
 * - Validate variable names and values
 */

import { Injectable } from '@angular/core';

export interface CSSVariableUpdate {
  name: string;
  value: string;
}

export interface VariableNamespaces {
  color: string[];
  typography: string[];
  spacing: string[];
  shadow: string[];
  other: string[];
}

/**
 * Service for runtime CSS variable management
 * Works in conjunction with ThemeProvider
 *
 * Usage:
 * - this.stylesService.setColor('primary-main', '#ffffff')
 * - this.stylesService.setSpacing('lg', '20px')
 * - this.stylesService.setVariable('custom-var', 'value')
 */
@Injectable({
  providedIn: 'root',
})
export class StylesService {
  private readonly root = document.documentElement;
  private variableHistory: Map<string, string> = new Map();

  constructor() {
    this.cacheCurrentVariables();
  }

  /**
   * Set a CSS color variable
   * @param colorName - Variable name without '--color-' prefix
   * @param value - Color value (hex, rgb, etc.)
   */
  public setColor(colorName: string, value: string): void {
    this.setVariable(`color-${colorName}`, value);
  }

  /**
   * Set a CSS typography variable
   * @param typographyKey - Typography level (h1, body, etc.)
   * @param property - Font property (font-size, font-weight, etc.)
   * @param value - CSS value
   */
  public setTypography(typographyKey: string, property: string, value: string): void {
    this.setVariable(`${typographyKey}-${property}`, value);
  }

  /**
   * Set a CSS spacing variable
   * @param spacingSize - Size key (xs, sm, md, lg, xl, xxl)
   * @param value - Spacing value (px, em, rem)
   */
  public setSpacing(spacingSize: string, value: string): void {
    this.setVariable(`spacing-${spacingSize}`, value);
  }

  /**
   * Set a CSS border-radius variable
   * @param radiusSize - Size key (xs, sm, md, lg, xl, full)
   * @param value - Radius value (px, %)
   */
  public setBorderRadius(radiusSize: string, value: string): void {
    this.setVariable(`border-radius-${radiusSize}`, value);
  }

  /**
   * Set a CSS shadow variable
   * @param shadowName - Shadow name (minimal, light, standard, medium, large, xl, modal)
   * @param value - Shadow value (box-shadow CSS)
   */
  public setShadow(shadowName: string, value: string): void {
    this.setVariable(`shadow-${shadowName}`, value);
  }

  /**
   * Set any CSS variable
   * @param variableName - Variable name without '--' prefix
   * @param value - CSS value
   */
  public setVariable(variableName: string, value: string): void {
    // Normalize variable name (remove '--' if present)
    const normalizedName = variableName.startsWith('--') ? variableName : variableName;

    // Store previous value for potential rollback
    const previousValue = this.getVariable(normalizedName);
    if (previousValue) {
      this.variableHistory.set(normalizedName, previousValue);
    }

    // Set the CSS variable
    this.root.style.setProperty(`--${normalizedName}`, value);
  }

  /**
   * Set multiple CSS variables at once
   * @param updates - Array of variable name/value pairs or object
   */
  public setVariables(updates: CSSVariableUpdate[] | Record<string, string>): void {
    if (Array.isArray(updates)) {
      updates.forEach(({ name, value }) => this.setVariable(name, value));
    } else {
      Object.entries(updates).forEach(([name, value]) => this.setVariable(name, value));
    }
  }

  /**
   * Get current value of a CSS variable
   * @param variableName - Variable name without '--' prefix
   * @returns Current value or null if not set
   */
  public getVariable(variableName: string): string | null {
    const normalizedName = variableName.startsWith('--') ? variableName.slice(2) : variableName;
    const value = getComputedStyle(this.root).getPropertyValue(`--${normalizedName}`).trim();
    return value || null;
  }

  /**
   * Get multiple CSS variables
   * @param variableNames - Array of variable names without '--' prefix
   * @returns Object with current values
   */
  public getVariables(variableNames: string[]): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    variableNames.forEach((name) => {
      result[name] = this.getVariable(name);
    });
    return result;
  }

  /**
   * Reset a variable to its last known value
   * @param variableName - Variable name without '--' prefix
   */
  public resetVariable(variableName: string): void {
    const normalizedName = variableName.startsWith('--') ? variableName.slice(2) : variableName;
    const previousValue = this.variableHistory.get(normalizedName);

    if (previousValue) {
      this.setVariable(normalizedName, previousValue);
    }
  }

  /**
   * Reset all variables to their initial cached values
   */
  public resetAll(): void {
    this.variableHistory.forEach((value, name) => {
      this.setVariable(name, value);
    });
  }

  /**
   * Get all current CSS variables on :root
   * @returns Object with all CSS variables
   */
  public getAllVariables(): Record<string, string> {
    const styles = getComputedStyle(this.root);
    const result: Record<string, string> = {};

    // Extract all CSS variables from :root
    for (let i = 0; i < styles.length; i++) {
      const propertyName = styles[i];
      if (propertyName.startsWith('--')) {
        const value = styles.getPropertyValue(propertyName).trim();
        result[propertyName] = value;
      }
    }

    return result;
  }

  /**
   * Group CSS variables by namespace
   * @returns Variables organized by type (color, typography, spacing, shadow)
   */
  public getVariablesByNamespace(): VariableNamespaces {
    const allVars = this.getAllVariables();
    const namespaces: VariableNamespaces = {
      color: [],
      typography: [],
      spacing: [],
      shadow: [],
      other: [],
    };

    Object.keys(allVars).forEach((varName) => {
      const cleanName = varName.replace('--', '');

      if (
        cleanName.startsWith('color-') ||
        cleanName.startsWith('primary-') ||
        cleanName.startsWith('secondary-') ||
        cleanName.startsWith('text-') ||
        cleanName.startsWith('background-') ||
        cleanName.startsWith('border-')
      ) {
        namespaces.color.push(cleanName);
      } else if (
        cleanName.includes('font-') ||
        cleanName.includes('line-height') ||
        cleanName.includes('letter-spacing')
      ) {
        namespaces.typography.push(cleanName);
      } else if (
        cleanName.startsWith('spacing-') ||
        cleanName.startsWith('gap-') ||
        cleanName.startsWith('padding-') ||
        cleanName.startsWith('border-radius-')
      ) {
        namespaces.spacing.push(cleanName);
      } else if (cleanName.startsWith('shadow-')) {
        namespaces.shadow.push(cleanName);
      } else {
        namespaces.other.push(cleanName);
      }
    });

    return namespaces;
  }

  /**
   * Check if a CSS variable is defined
   * @param variableName - Variable name without '--' prefix
   */
  public hasVariable(variableName: string): boolean {
    return this.getVariable(variableName) !== null;
  }

  /**
   * Export current variables as CSS text
   * Useful for debugging or saving configurations
   */
  public exportVariablesAsCSS(): string {
    const allVars = this.getAllVariables();
    let css = ':root {\n';

    Object.entries(allVars).forEach(([name, value]) => {
      css += `  ${name}: ${value};\n`;
    });

    css += '}\n';
    return css;
  }

  /**
   * Cache all current CSS variables on initialization
   * Used for reset functionality
   */
  private cacheCurrentVariables(): void {
    const styles = getComputedStyle(this.root);

    for (let i = 0; i < styles.length; i++) {
      const propertyName = styles[i];
      if (propertyName.startsWith('--')) {
        const value = styles.getPropertyValue(propertyName).trim();
        if (value) {
          this.variableHistory.set(propertyName.replace('--', ''), value);
        }
      }
    }
  }

  /**
   * Clear all cached history
   */
  public clearHistory(): void {
    this.variableHistory.clear();
    this.cacheCurrentVariables();
  }
}

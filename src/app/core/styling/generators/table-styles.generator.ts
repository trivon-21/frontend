/**
 * Table Styles Generator
 * Generates complete CSS for table components.
 *
 * IMPORTANT: This generator emits CSS variable references (e.g. `var(--text-secondary)`)
 * for all color properties that have a corresponding CSS custom property.
 * Non-color properties (padding, font-size, border-radius) use resolved token values.
 *
 * Creates classes like:
 *   table, th, td
 *   .status-pill-approved, .status-pill-rejected, etc.
 *   .pagination
 */

import { TableTokens } from '../tokens/tables.tokens';

// ---------------------------------------------------------------------------
// CSS Variable Maps
// ---------------------------------------------------------------------------

/**
 * Maps each table color property to its CSS variable name.
 * The generator uses these to emit `var(--x)` instead of raw hex strings.
 */
const TABLE_HEADER_VAR_MAP = {
  background: 'background-page',
  color: 'info',
};

const TABLE_CELL_VAR_MAP = {
  color: 'text-secondary',
};

const TABLE_ROW_VAR_MAP = {
  hoverBackground: 'background-hover',
  selectedBackground: 'background-selected',
};

const TABLE_PAGINATION_VAR_MAP = {
  color: 'text-muted',
};

/**
 * Maps each status pill to { background, color } CSS variable names.
 * The key matches the status pill key in TableTokens.statusPills.
 */
const STATUS_PILL_VAR_MAP: Record<string, { background: string; color: string }> = {
  approved: { background: 'success-light', color: 'success' },
  draft: { background: 'background-hover', color: 'text-secondary' },
  pending: { background: 'warning-light', color: 'warning' },
  inProgress: { background: 'info-light', color: 'info' },
  rejected: { background: 'error-light', color: 'error' },
  completed: { background: 'success-light', color: 'success' },
  onHold: { background: 'error-light', color: 'error' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns `var(--name)` when a variable mapping exists, otherwise the fallback value. */
function cssVar(varName: string | undefined, fallback: string): string {
  return varName ? `var(--${varName})` : fallback;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/**
 * Main function: Generate all table styles.
 */
export function generateTableStyles(tableTokens: TableTokens): string {
  let css = `\n/* Table Styles */\n\n`;

  // Table wrapper
  css += `table {\n`;
  css += `  width: 100%;\n`;
  css += `  border-collapse: collapse;\n`;
  css += `}\n\n`;

  // Table header
  css += `th {\n`;
  css += `  text-align: ${tableTokens.header.textAlign || 'left'};\n`;
  css += `  padding: ${tableTokens.header.padding};\n`;
  css += `  background-color: ${cssVar(TABLE_HEADER_VAR_MAP.background, tableTokens.header.background)};\n`;
  css += `  color: ${cssVar(TABLE_HEADER_VAR_MAP.color, tableTokens.header.color)};\n`;
  css += `  font-size: ${tableTokens.header.fontSize};\n`;
  css += `  font-weight: ${tableTokens.header.fontWeight};\n`;
  // border-bottom includes a color segment — emit the full border value; the token already
  // contains a CSS variable reference via the template string in tables.tokens.ts.
  css += `  border-bottom: ${tableTokens.header.borderBottom};\n`;
  if (tableTokens.header.letterSpacing) {
    css += `  letter-spacing: ${tableTokens.header.letterSpacing};\n`;
  }
  if (tableTokens.header.textTransform) {
    css += `  text-transform: ${tableTokens.header.textTransform};\n`;
  }
  css += `}\n\n`;

  // Table cell
  css += `td {\n`;
  css += `  padding: ${tableTokens.cell.padding};\n`;
  css += `  font-size: ${tableTokens.cell.fontSize};\n`;
  css += `  color: ${cssVar(TABLE_CELL_VAR_MAP.color, tableTokens.cell.color)};\n`;
  // Same as header.borderBottom — value from token already contains resolved color reference
  css += `  border-bottom: ${tableTokens.cell.borderBottom};\n`;
  css += `  vertical-align: ${tableTokens.cell.verticalAlign};\n`;
  css += `}\n\n`;

  // Table row hover
  if (tableTokens.row.hover) {
    css += `tr:hover td {\n`;
    if (tableTokens.row.hover.background !== undefined) {
      css += `  background-color: ${cssVar(TABLE_ROW_VAR_MAP.hoverBackground, tableTokens.row.hover.background)};\n`;
    }
    css += `}\n\n`;
  }

  // Table row selected
  if (tableTokens.row.selected) {
    css += `tr.selected td {\n`;
    if (tableTokens.row.selected.background !== undefined) {
      css += `  background-color: ${cssVar(TABLE_ROW_VAR_MAP.selectedBackground, tableTokens.row.selected.background)};\n`;
    }
    css += `}\n\n`;
  }

  // Status Pills
  css += `/* Status Pills */\n`;

  Object.entries(tableTokens.statusPills).forEach(([statusName, statusConfig]) => {
    const className = statusName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    const varMap = STATUS_PILL_VAR_MAP[statusName];

    css += `.status-pill-${className} {\n`;
    css += `  background-color: ${cssVar(varMap?.background, statusConfig.background)};\n`;
    css += `  color: ${cssVar(varMap?.color, statusConfig.color)};\n`;
    css += `  padding: ${statusConfig.padding};\n`;
    css += `  border-radius: ${statusConfig.borderRadius};\n`;
    css += `  font-size: ${statusConfig.fontSize};\n`;
    css += `  font-weight: ${statusConfig.fontWeight};\n`;
    if (statusConfig.display) {
      css += `  display: ${statusConfig.display};\n`;
    }
    if (statusConfig.whiteSpace) {
      css += `  white-space: ${statusConfig.whiteSpace};\n`;
    }
    css += `}\n`;
  });

  css += '\n';

  // Pagination
  css += `/* Pagination */\n`;
  css += `.pagination {\n`;
  css += `  display: flex;\n`;
  css += `  justify-content: space-between;\n`;
  css += `  align-items: center;\n`;
  css += `  color: ${cssVar(TABLE_PAGINATION_VAR_MAP.color, tableTokens.pagination.color)};\n`;
  css += `  font-size: ${tableTokens.pagination.fontSize};\n`;
  css += `  margin-top: 16px;\n`;
  css += `}\n\n`;

  css += `.pagination-info {\n`;
  css += `  color: ${cssVar(TABLE_PAGINATION_VAR_MAP.color, tableTokens.pagination.color)};\n`;
  css += `  font-size: ${tableTokens.pagination.fontSize};\n`;
  css += `}\n\n`;

  css += `.pagination-controls {\n`;
  css += `  display: flex;\n`;
  css += `  gap: 8px;\n`;
  css += `  align-items: center;\n`;
  css += `}\n\n`;

  css += `.pagination-controls button {\n`;
  css += `  background-color: transparent;\n`;
  css += `  border: 1px solid var(--border-light);\n`;
  css += `  border-radius: var(--border-radius-md);\n`;
  css += `  padding: 8px 12px;\n`;
  css += `  cursor: pointer;\n`;
  css += `  color: var(--text-primary);\n`;
  css += `  transition: all 0.2s ease;\n`;
  css += `  font-size: 14px;\n`;
  css += `}\n\n`;

  css += `.pagination-controls button:hover {\n`;
  css += `  background-color: var(--background-hover);\n`;
  css += `  border-color: var(--primary-main);\n`;
  css += `}\n\n`;

  css += `.pagination-controls button:disabled {\n`;
  css += `  opacity: 0.5;\n`;
  css += `  cursor: not-allowed;\n`;
  css += `}\n`;

  return css;
}

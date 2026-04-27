/**
 * Table Styles Generator
 * Generates complete CSS for table components
 *
 * Creates classes like:
 * table, th, td
 * .status-pill-approved, .status-pill-rejected, etc.
 * .pagination
 */

import { TableTokens } from '../tokens/tables.tokens';

/**
 * Main function: Generate all table styles
 */
export function generateTableStyles(tableTokens: TableTokens): string {
  let css = `\n/* Table Styles */\n\n`;

  // Table header
  css += `table {\n`;
  css += `  width: 100%;\n`;
  css += `  border-collapse: collapse;\n`;
  css += `}\n\n`;

  css += `th {\n`;
  css += `  text-align: ${tableTokens.header.textAlign || 'left'};\n`;
  css += `  padding: ${tableTokens.header.padding};\n`;
  css += `  background-color: ${tableTokens.header.background};\n`;
  css += `  color: ${tableTokens.header.color};\n`;
  css += `  font-size: ${tableTokens.header.fontSize};\n`;
  css += `  font-weight: ${tableTokens.header.fontWeight};\n`;
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
  css += `  color: ${tableTokens.cell.color};\n`;
  css += `  border-bottom: ${tableTokens.cell.borderBottom};\n`;
  css += `  vertical-align: ${tableTokens.cell.verticalAlign};\n`;
  css += `}\n\n`;

  // Table row
  if (tableTokens.row.hover) {
    css += `tr:hover td {\n`;
    if (tableTokens.row.hover.background) {
      css += `  background-color: ${tableTokens.row.hover.background};\n`;
    }
    css += `}\n\n`;
  }

  if (tableTokens.row.selected) {
    css += `tr.selected td {\n`;
    if (tableTokens.row.selected.background) {
      css += `  background-color: ${tableTokens.row.selected.background};\n`;
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

    css += `.status-pill-${className} {\n`;
    css += `  background-color: ${statusConfig.background};\n`;
    css += `  color: ${statusConfig.color};\n`;
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
  css += `  color: ${tableTokens.pagination.color};\n`;
  css += `  font-size: ${tableTokens.pagination.fontSize};\n`;
  css += `  margin-top: 16px;\n`;
  css += `}\n\n`;

  css += `.pagination-info {\n`;
  css += `  color: ${tableTokens.pagination.color};\n`;
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

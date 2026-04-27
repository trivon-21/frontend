/**
 * Table Design Tokens
 * UNIFIED table styling for entire application
 *
 * Single source of truth for table components across:
 * - Customer portal
 * - Technician portal
 * - Inventory Manager
 * - All other applications
 *
 * Includes:
 * - Table header styling
 * - Table cell styling
 * - Row variants and hover states
 * - Status pill/badge styling
 * - Pagination styling
 */

export interface TableHeaderConfig {
  background: string;
  color: string;
  fontSize: string;
  fontWeight: number;
  padding: string;
  borderBottom: string;
  textAlign?: string;
  letterSpacing?: string;
  textTransform?: string;
}

export interface TableCellConfig {
  padding: string;
  fontSize: string;
  color: string;
  borderBottom: string;
  verticalAlign: string;
}

export interface TableRowConfig {
  hover?: {
    background?: string;
  };
  selected?: {
    background?: string;
  };
}

export interface StatusPillConfig {
  padding: string;
  borderRadius: string;
  fontSize: string;
  fontWeight: number;
  background: string;
  color: string;
  display?: string;
  whiteSpace?: string;
}

export interface StatusPills {
  approved: StatusPillConfig;
  draft: StatusPillConfig;
  pending: StatusPillConfig;
  inProgress: StatusPillConfig;
  rejected: StatusPillConfig;
  completed: StatusPillConfig;
  onHold: StatusPillConfig;
}

export interface PaginationConfig {
  color: string;
  fontSize: string;
}

export interface TableTokens {
  header: TableHeaderConfig;
  cell: TableCellConfig;
  row: TableRowConfig;
  statusPills: StatusPills;
  pagination: PaginationConfig;
}

/**
 * UNIVERSAL Table Tokens
 * Used everywhere
 */
const universalTableTokens: TableTokens = {
  header: {
    background: '#f8fbff',
    color: '#1e40af',
    fontSize: '12px',
    fontWeight: 700,
    padding: '20px 24px',
    borderBottom: '2px solid #eff6ff',
    textAlign: 'left',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  cell: {
    padding: '24px',
    fontSize: '14px',
    color: '#475569',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  },
  row: {
    hover: {
      background: '#f9fafb',
    },
    selected: {
      background: '#f0fdf4',
    },
  },
  statusPills: {
    approved: {
      background: '#f0fdf4',
      color: '#16a34a',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    draft: {
      background: '#f1f5f9',
      color: '#475569',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    pending: {
      background: '#fff7ed',
      color: '#ea580c',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    inProgress: {
      background: '#eff6ff',
      color: '#3b82f6',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    rejected: {
      background: '#fee2e2',
      color: '#dc2626',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    completed: {
      background: '#dcfce7',
      color: '#16a34a',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
    onHold: {
      background: '#fee2e2',
      color: '#ef4444',
      padding: '6px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600,
    },
  },
  pagination: {
    color: '#6b7280',
    fontSize: '14px',
  },
};

/**
 * Table Token System - UNIVERSAL
 * Single set of table styles for entire application
 */
export const tableTokens: TableTokens = universalTableTokens;

/**
 * Utility function to get table tokens
 */
export function getTableTokens(): TableTokens {
  return tableTokens;
}

/**
 * Static base stylesheet (design-system agnostic).
 *
 * Global element resets + utility, button, and table classes. Everything here
 * references the CSS variables produced from TOKENS (theme.tokens.ts), so you
 * almost never edit this file — change a value in theme.tokens.ts instead and
 * it cascades here automatically.
 */
export const BASE_CSS = `
/* Global Styles using CSS Variables */

* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--body-font-family);
  font-size: var(--body-font-size);
  font-weight: var(--body-font-weight);
  line-height: var(--body-line-height);
  color: var(--text-primary);
  background-color: var(--background-page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1 {
  font-family: var(--h1-font-family);
  font-size: var(--h1-font-size);
  font-weight: var(--h1-font-weight);
  line-height: var(--h1-line-height);
  letter-spacing: var(--h1-letter-spacing, 0);
  margin: 0;
  color: var(--text-primary);
}

h2 {
  font-family: var(--h2-font-family);
  font-size: var(--h2-font-size);
  font-weight: var(--h2-font-weight);
  line-height: var(--h2-line-height);
  letter-spacing: var(--h2-letter-spacing, 0);
  margin: 0;
  color: var(--text-primary);
}

h3 {
  font-family: var(--h3-font-family);
  font-size: var(--h3-font-size);
  font-weight: var(--h3-font-weight);
  line-height: var(--h3-line-height);
  margin: 0;
  color: var(--text-primary);
}

h4 {
  font-family: var(--h4-font-family);
  font-size: var(--h4-font-size);
  font-weight: var(--h4-font-weight);
  line-height: var(--h4-line-height);
  margin: 0;
  color: var(--text-primary);
}

p {
  margin: 0;
  color: var(--text-primary);
}

input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
}

button {
  cursor: pointer;
  font-family: inherit;
}

a {
  color: var(--info);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  text-decoration: underline;
}


/* Button Styles */

.btn-primary {
  background-color: var(--primary-main);
  color: var(--text-inverse);
  padding: 14px 32px;
  border-radius: 99px;
  font-size: 16px;
  font-weight: 700;
  font-family: Outfit, Inter, system-ui, sans-serif;
  border: none;
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background-color: var(--primary-hover);
  box-shadow: 0 8px 16px rgba(0, 132, 61, 0.25);
  transform: translateY(-2px);
}
.btn-primary:active {
  background-color: var(--primary-active);
}
.btn-primary:disabled,
.btn-primary.disabled {
  background-color: var(--secondary-light);
  color: var(--text-inverse);
  cursor: not-allowed;
  opacity: 0.6;
}
.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.1);
}

.btn-secondary {
  background-color: var(--background-card);
  color: var(--text-primary);
  padding: 12px 24px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  border: 1px solid #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-secondary:hover {
  background-color: var(--background-page);
  color: var(--primary-main);
  border: 1px solid #00843D;
}
.btn-secondary:disabled,
.btn-secondary.disabled {
  background-color: var(--background-page);
  color: var(--secondary-light);
  cursor: not-allowed;
}

.btn-success {
  background-color: var(--success);
  color: var(--text-inverse);
  padding: 12px 32px;
  border-radius: 99px;
  font-size: 16px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-success:hover {
  background-color: var(--primary-hover);
}
.btn-success:active {
  background-color: var(--primary-active);
}
.btn-success:disabled,
.btn-success.disabled {
  background-color: var(--secondary-light);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-danger {
  background-color: var(--error);
  color: var(--text-inverse);
  padding: 12px 32px;
  border-radius: 99px;
  font-size: 16px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-danger:hover {
  background-color: var(--error);
}
.btn-danger:disabled,
.btn-danger.disabled {
  background-color: var(--secondary-light);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-warning {
  background-color: var(--warning);
  color: var(--text-inverse);
  padding: 12px 32px;
  border-radius: 99px;
  font-size: 16px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-warning:hover {
  background-color: var(--warning);
}
.btn-warning:disabled,
.btn-warning.disabled {
  background-color: var(--secondary-light);
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-icon {
  background-color: none;
  color: var(--text-secondary);
  padding: 10px;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 400;
  font-family: Inter, system-ui, sans-serif;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-icon:hover {
  background-color: var(--background-page);
  color: var(--text-primary);
}
.btn-icon:disabled,
.btn-icon.disabled {
  color: var(--secondary-light);
  cursor: not-allowed;
}

.btn-text {
  background-color: transparent;
  color: var(--info);
  padding: 0;
  border-radius: 0;
  font-size: 14px;
  font-weight: 500;
  font-family: Inter, system-ui, sans-serif;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-text:hover {
  color: var(--info);
}

.btn-review {
  background-color: var(--success-light);
  color: var(--success);
  padding: 8px 24px;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-review:hover {
  background-color: var(--success);
  color: var(--text-inverse);
}

.btn-small {
  background-color: var(--primary-main);
  color: var(--text-inverse);
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-small:hover {
  background-color: var(--primary-hover);
}


/* Table Styles */

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 20px 24px;
  background-color: var(--background-page);
  color: var(--info);
  font-size: 12px;
  font-weight: 700;
  border-bottom: 2px solid #eff6ff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

td {
  padding: 24px;
  font-size: 14px;
  color: var(--text-secondary);
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

tr:hover td {
  background-color: var(--background-hover);
}

tr.selected td {
  background-color: var(--background-selected);
}

/* Status Pills */
.status-pill-approved {
  background-color: var(--success-light);
  color: var(--success);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill-draft {
  background-color: var(--background-hover);
  color: var(--text-secondary);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill-pending {
  background-color: var(--warning-light);
  color: var(--warning);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill-in-progress {
  background-color: var(--info-light);
  color: var(--info);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill-rejected {
  background-color: var(--error-light);
  color: var(--error);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill-completed {
  background-color: var(--success-light);
  color: var(--success);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pill-on-hold {
  background-color: var(--error-light);
  color: var(--error);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 16px;
}

.pagination-info {
  color: var(--text-muted);
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-controls button {
  background-color: transparent;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  padding: 8px 12px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s ease;
  font-size: 14px;
}

.pagination-controls button:hover {
  background-color: var(--background-hover);
  border-color: var(--primary-main);
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Utility Styles */

.flex { display: flex; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; align-items: center; justify-content: space-between; }
.flex-column { display: flex; flex-direction: column; }
.grid { display: grid; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }
.gap-xl { gap: var(--spacing-xl); }
.gap-xxl { gap: var(--spacing-xxl); }
.p-xs { padding: var(--spacing-xs); }
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
.p-xl { padding: var(--spacing-xl); }
.p-xxl { padding: var(--spacing-xxl); }
.m-xs { margin: var(--spacing-xs); }
.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }
.m-xl { margin: var(--spacing-xl); }
.m-xxl { margin: var(--spacing-xxl); }
.rounded-xs { border-radius: var(--border-radius-xs); }
.rounded-sm { border-radius: var(--border-radius-sm); }
.rounded-md { border-radius: var(--border-radius-md); }
.rounded-lg { border-radius: var(--border-radius-lg); }
.rounded-xl { border-radius: var(--border-radius-xl); }
.rounded-full { border-radius: var(--border-radius-full); }
.shadow-minimal { box-shadow: var(--shadow-minimal); }
.shadow-light { box-shadow: var(--shadow-light); }
.shadow-standard { box-shadow: var(--shadow-standard); }
.shadow-medium { box-shadow: var(--shadow-medium); }
.shadow-large { box-shadow: var(--shadow-large); }
.shadow-xl { box-shadow: var(--shadow-xl); }
.shadow-modal { box-shadow: var(--shadow-modal); }
.hidden { display: none; }
.block { display: block; }
.inline { display: inline; }
.inline-block { display: inline-block; }
.opacity-50 { opacity: 0.5; }
.opacity-75 { opacity: 0.75; }
.opacity-100 { opacity: 1; }
.cursor-pointer { cursor: pointer; }
.cursor-default { cursor: default; }
.cursor-not-allowed { cursor: not-allowed; }
.transition { transition: all 0.2s ease; }
.transition-fast { transition: all 0.1s ease; }
.transition-slow { transition: all 0.3s ease; }
`;

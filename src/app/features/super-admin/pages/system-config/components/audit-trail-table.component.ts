import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLog } from '../../../models/system-config.model';

@Component({
  selector: 'app-audit-trail-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-section">
      <h2>Audit Trail</h2>
      <p class="section-description">Complete history of all configuration changes made to the system</p>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading audit logs...</p>
      </div>

      <div *ngIf="!loading" class="table-container">
        <div *ngIf="auditLogs.length === 0" class="empty-state">
          <p>No configuration changes recorded yet</p>
        </div>

        <div *ngIf="auditLogs.length > 0">
          <table class="audit-table">
            <thead>
              <tr>
                <th class="col-timestamp">Timestamp</th>
                <th class="col-user">User</th>
                <th class="col-action">Action</th>
                <th class="col-changes">Changes</th>
                <th class="col-reason">Reason</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of auditLogs" class="audit-row">
                <td class="col-timestamp">
                  <div class="timestamp">
                    <div class="date">{{ log.createdAt | date : 'MMM d, yyyy' }}</div>
                    <div class="time">{{ log.createdAt | date : 'HH:mm:ss' }}</div>
                  </div>
                </td>
                <td class="col-user">
                  <div class="user-info">
                    <div class="user-name">{{ log.performedBy.fullName }}</div>
                    <div class="user-email">{{ log.performedBy.email }}</div>
                  </div>
                </td>
                <td class="col-action">
                  <span class="action-badge" [class]="'action-' + getActionType(log.action)">
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td class="col-changes">
                  <div class="changes-list">
                    <div *ngFor="let key of getChangeKeys(log.changes)" class="change-item">
                      <span class="field-name">{{ formatFieldName(key) }}:</span>
                      <span class="old-value">{{ formatValue(log.changes[key]?.oldValue) }}</span>
                      <span class="arrow">→</span>
                      <span class="new-value">{{ formatValue(log.changes[key]?.newValue) }}</span>
                    </div>
                  </div>
                </td>
                <td class="col-reason">
                  <span *ngIf="log.reason" class="reason-text">{{ log.reason }}</span>
                  <span *ngIf="!log.reason" class="reason-empty">-</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <button
              (click)="previousPage()"
              [disabled]="currentPage === 1 || loading"
              class="pagination-btn"
            >
              ← Previous
            </button>
            <span class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              (click)="nextPage()"
              [disabled]="currentPage === totalPages || loading"
              class="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .audit-section {
        background: #fff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .section-description {
        margin: 0 0 30px 0;
        font-size: 14px;
        color: #666;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #666;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e0e0e0;
        border-top-color: var(--primary-main);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #999;
      }

      .table-container {
        overflow-x: auto;
      }

      .audit-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .audit-table thead {
        background-color: #f5f5f5;
      }

      .audit-table th {
        padding: 12px 15px;
        text-align: left;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #e0e0e0;
        white-space: nowrap;
      }

      .col-timestamp {
        width: 150px;
      }

      .col-user {
        width: 150px;
      }

      .col-action {
        width: 120px;
      }

      .col-changes {
        width: 300px;
      }

      .col-reason {
        width: 150px;
      }

      .audit-row {
        border-bottom: 1px solid #e0e0e0;
        transition: background-color 0.3s ease;
      }

      .audit-row:hover {
        background-color: #f9f9f9;
      }

      .audit-table td {
        padding: 12px 15px;
        vertical-align: top;
      }

      .timestamp {
        font-size: 12px;
      }

      .date {
        font-weight: 500;
        color: #333;
      }

      .time {
        color: #999;
        margin-top: 2px;
      }

      .user-info {
        font-size: 12px;
      }

      .user-name {
        font-weight: 500;
        color: #333;
      }

      .user-email {
        color: #999;
        margin-top: 2px;
      }

      .action-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        font-weight: 500;
        font-size: 11px;
        white-space: nowrap;
      }

      .action-business {
        background-color: #e3f2fd;
        color: var(--primary-main);
      }

      .action-feature {
        background-color: #f3e5f5;
        color: #7b1fa2;
      }

      .action-maintenance {
        background-color: #fff3e0;
        color: #e65100;
      }

      .action-info {
        background-color: #e8f5e9;
        color: var(--primary-hover);
      }

      .action-logging {
        background-color: #f0f4f8;
        color: #455a64;
      }

      .action-default {
        background-color: #f5f5f5;
        color: #666;
      }

      .changes-list {
        font-size: 12px;
      }

      .change-item {
        margin-bottom: 6px;
        line-height: 1.4;
      }

      .change-item:last-child {
        margin-bottom: 0;
      }

      .field-name {
        font-weight: 500;
        color: #333;
      }

      .old-value {
        color: #d32f2f;
        text-decoration: line-through;
      }

      .arrow {
        color: #999;
        margin: 0 6px;
      }

      .new-value {
        color: #2e7d32;
        font-weight: 500;
      }

      .reason-text {
        font-size: 12px;
        color: #666;
      }

      .reason-empty {
        color: #ccc;
      }

      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
      }

      .pagination-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background-color: #f5f5f5;
        color: #333;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .pagination-btn:hover:not(:disabled) {
        background-color: #e0e0e0;
        border-color: #999;
      }

      .pagination-btn:disabled {
        color: #ccc;
        cursor: not-allowed;
        background-color: #f9f9f9;
      }

      .page-info {
        font-size: 13px;
        color: #666;
        min-width: 120px;
        text-align: center;
      }
    `,
  ],
})
export class AuditTrailTableComponent {
  @Input() auditLogs: AuditLog[] = [];
  @Input() totalPages = 1;
  @Input() currentPage = 1;
  @Input() loading = false;
  @Output() pageChange = new EventEmitter<number>();

  getChangeKeys(changes: any): string[] {
    return Object.keys(changes);
  }

  formatAction(action: string): string {
    // Handle new human-readable action names
    if (typeof action === 'string') {
      // If it's already a formatted name (contains spaces), return as-is
      if (action.includes(' ')) {
        return action;
      }
      
      // Otherwise, map the old constant-style names
      const actions: { [key: string]: string } = {
        UPDATE_BUSINESS_RULES: 'Update Business Rules',
        UPDATE_FEATURE_FLAGS: 'Update Feature Flags',
        UPDATE_MAINTENANCE_MODE: 'Update Maintenance Settings',
        UPDATE_SYSTEM_INFO: 'Update System Info',
        CREATE_CONFIG: 'Config Created',
      };

      return actions[action] || action;
    }
    return action;
  }

  getActionType(action: string): string {
    const lowerAction = (action || '').toLowerCase();
    if (lowerAction.includes('business')) return 'business';
    if (lowerAction.includes('feature')) return 'feature';
    if (lowerAction.includes('maintenance')) return 'maintenance';
    if (lowerAction.includes('info')) return 'info';
    if (lowerAction.includes('logging')) return 'logging';
    if (lowerAction.includes('schedule')) return 'maintenance';
    if (lowerAction.includes('activate')) return 'maintenance';
    if (lowerAction.includes('deactivate')) return 'maintenance';
    return 'default';
  }

  formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  formatValue(value: any): string {
    if (value === null || value === undefined || value === '') return 'none';
    if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';

    // Handle date strings
    if (typeof value === 'string' && value.includes('T') && value.includes('Z')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }

    return value.toString();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
}

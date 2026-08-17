import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shared Component: Status Badge
 * Displays status with color-coding based on status type
 * Usage: <app-status-badge [status]="'Completed'"></app-status-badge>
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="getStatusClass(status)" class="badge">
      {{ status }}
    </span>
  `,
  styles: [
    `
      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
        font-weight: 500;
        text-align: center;
        white-space: nowrap;
      }

      .status-completed,
      .status-addressed,
      .status-closed {
        background-color: #d4edda;
        color: #155724;
      }

      .status-pending,
      .status-ongoing,
      .status-assigned {
        background-color: #fff3cd;
        color: #856404;
      }

      .status-cancelled,
      .status-returned {
        background-color: #f8d7da;
        color: #721c24;
      }

      .status-in-progress {
        background-color: #d1ecf1;
        color: #0c5460;
      }

      .status-default {
        background-color: #e2e3e5;
        color: #383d41;
      }
    `,
  ],
})
export class StatusBadgeComponent {
  @Input() status!: string;

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';

    if (
      statusLower.includes('completed') ||
      statusLower.includes('addressed')
    ) {
      return 'badge status-completed';
    } else if (
      statusLower.includes('pending') ||
      statusLower.includes('ongoing')
    ) {
      return 'badge status-pending';
    } else if (
      statusLower.includes('cancelled') ||
      statusLower.includes('returned')
    ) {
      return 'badge status-cancelled';
    } else if (statusLower.includes('progress')) {
      return 'badge status-in-progress';
    } else if (statusLower.includes('closed')) {
      return 'badge status-closed';
    } else if (statusLower.includes('assigned')) {
      return 'badge status-assigned';
    }

    return 'badge status-default';
  }
}

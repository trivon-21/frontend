import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="confirmation-overlay"
      *ngIf="state$ | async as state"
      [class.confirmation-overlay--open]="state.isOpen"
      (mousedown)="onBackdropMouseDown($event)"
    >
      <div
        *ngIf="state.isOpen"
        class="confirmation-modal"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="bodyId"
        (mousedown)="$event.stopPropagation()"
      >
        <div class="confirmation-header">
          <h2 [id]="titleId">{{ state.title }}</h2>
        </div>
        <div class="confirmation-body">
          <p [id]="bodyId">{{ state.message }}</p>
        </div>
        <div class="confirmation-footer">
          <button #cancelButton class="btn btn-secondary" type="button" (click)="onCancel()">
            {{ state.cancelText }}
          </button>
          <button
            class="btn btn-primary"
            type="button"
            [class.btn-danger]="state.variant === 'danger'"
            (click)="onAccept()"
          >
            {{ state.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-overlay {
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      background-color: var(--surface-overlay, rgba(0, 0, 0, 0.45));
    }

    .confirmation-overlay--open {
      display: flex;
      animation: fadeIn 0.15s ease-out;
    }

    .confirmation-modal {
      background: var(--background-card);
      border-radius: var(--border-radius-xl, 16px);
      box-shadow: var(--shadow-modal);
      max-width: 450px;
      width: 90%;
      overflow: hidden;
      animation: slideUp 0.2s ease-out;
    }

    .confirmation-header {
      padding: var(--spacing-lg, 20px) var(--spacing-xl, 24px);
      border-bottom: 1px solid var(--border-light);
    }

    .confirmation-header h2 {
      margin: 0;
      font-size: var(--h2-size, 20px);
      font-weight: var(--h2-weight, 600);
      color: var(--text-primary);
    }

    .confirmation-body {
      padding: var(--spacing-lg, 20px) var(--spacing-xl, 24px);
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .confirmation-body p {
      margin: 0;
    }

    .confirmation-footer {
      padding: var(--spacing-lg, 20px) var(--spacing-xl, 24px);
      border-top: 1px solid var(--border-light);
      display: flex;
      gap: var(--spacing-sm, 10px);
      justify-content: flex-end;
    }

    .btn {
      padding: 10px 20px;
      border: 1px solid transparent;
      border-radius: var(--border-radius-md, 8px);
      font-size: var(--button-size, 14px);
      font-weight: var(--button-weight, 500);
      cursor: pointer;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .btn-primary {
      background-color: var(--primary-main);
      color: var(--text-inverse);
    }

    .btn-primary:hover {
      background-color: var(--primary-hover);
    }

    .btn-primary.btn-danger {
      background-color: var(--error);
    }

    .btn-primary.btn-danger:hover {
      background-color: var(--error-hover, var(--error));
      filter: brightness(0.92);
    }

    .btn-secondary {
      background-color: var(--background-page);
      color: var(--text-primary);
      border-color: var(--border-medium);
    }

    .btn-secondary:hover {
      background-color: var(--background-hover);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(24px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class ConfirmationComponent {
  @ViewChild('cancelButton') cancelButtonRef?: ElementRef<HTMLButtonElement>;

  readonly titleId = 'confirmation-title';
  readonly bodyId = 'confirmation-body';

  private wasOpen = false;

  constructor(private confirmService: ConfirmService) {}

  get state$() {
    return this.confirmService.state$;
  }

  onAccept(): void {
    this.confirmService.accept();
  }

  onCancel(): void {
    this.confirmService.cancel();
  }

  onBackdropMouseDown(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }
}

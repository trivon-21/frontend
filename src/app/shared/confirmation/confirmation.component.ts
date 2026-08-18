import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirmation-overlay" *ngIf="(state$ | async)?.isOpen">
      <div class="confirmation-modal">
        <div class="confirmation-header">
          <h2>{{ (state$ | async)?.title }}</h2>
        </div>
        <div class="confirmation-body">
          <p>{{ (state$ | async)?.message }}</p>
        </div>
        <div class="confirmation-footer">
          <button class="btn btn-secondary" (click)="onCancel()">
            {{ (state$ | async)?.cancelText }}
          </button>
          <button class="btn btn-primary" (click)="onAccept()">
            {{ (state$ | async)?.confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9998;
      animation: fadeIn 0.2s ease-out;
    }

    .confirmation-modal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 450px;
      width: 90%;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }

    .confirmation-header {
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .confirmation-header h2 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .confirmation-body {
      padding: 20px;
      color: #666;
      line-height: 1.6;
    }

    .confirmation-body p {
      margin: 0;
    }

    .confirmation-footer {
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      background: #f8f9fa;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class ConfirmationComponent {
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
}

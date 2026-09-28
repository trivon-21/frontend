import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CsaSidebarComponent } from '../sidebar/csa-sidebar.component';
import { CsaHeaderComponent } from '../header/csa-header.component';
import { CsaAlertService } from '../../services/csa-alert.service';

@Component({
  selector: 'app-csa-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, CsaSidebarComponent, CsaHeaderComponent],
  template: `
    <div class="csa-layout">
      <app-csa-sidebar></app-csa-sidebar>
      <div class="csa-main">
        <app-csa-header></app-csa-header>
        <main class="csa-content">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Live Floating Inquiry Notifications Stack (Right Side) -->
      <aside *ngIf="alertService.alerts$ | async as alerts"
             class="floating-alert-stack"
             role="alert"
             aria-live="polite">
        <ng-container *ngIf="alerts.length > 0">
          <!-- Top Right Clear All button if multiple notifications -->
          <div *ngIf="alerts.length > 1" class="alert-stack-header">
            <button type="button" 
                    class="alert-clear-all-btn" 
                    (click)="alertService.clearAllAlerts()" 
                    title="Clear all notifications">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
              <span>Clear All ({{ alerts.length }})</span>
            </button>
          </div>

          <!-- Notification Cards List -->
          <div *ngFor="let alert of alerts; trackBy: trackByAlertId"
               class="floating-alert-card" 
               (click)="alertService.openInquiry(alert.id)">
            <div class="alert-top">
              <div class="alert-type-badge" [class.type-new]="alert.type === 'new'" [class.type-reply]="alert.type === 'reply'">
                <span class="pulse-dot"></span>
                {{ alert.type === 'new' ? 'New Inquiry' : 'Customer Replied' }}
              </div>
              <span class="alert-ref">{{ alert.inquiryRef }}</span>
              <button type="button" 
                      class="alert-close-btn" 
                      (click)="$event.stopPropagation(); alertService.dismissAlert(alert.id)" 
                      title="Dismiss this notification">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            <div class="alert-body">
              <div class="alert-avatar">
                {{ alert.customerName ? alert.customerName.charAt(0).toUpperCase() : 'C' }}
              </div>
              <div class="alert-info">
                <h4 class="alert-sender">{{ alert.customerName }}</h4>
                <p class="alert-snippet">{{ alert.message }}</p>
              </div>
            </div>

            <div class="alert-footer">
              <span class="alert-hint">Click to open & reply</span>
              <button type="button" class="alert-action-btn">
                <span>Reply</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </ng-container>
      </aside>
    </div>
  `,
  styles: [`
    .csa-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: #f3f4f2;
      position: relative;
    }
    .csa-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }
    .csa-content {
      flex: 1;
      overflow-y: scroll;
      scrollbar-gutter: stable;
      padding: 24px 32px 40px;
    }
    @media (max-width: 1200px) {
      .csa-content {
        padding: 20px 20px 32px;
      }
    }

    /* Floating Alert Stack Styles */
    .floating-alert-stack {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      overflow-x: hidden;
      pointer-events: none;
      padding: 4px;
    }

    .alert-stack-header {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      pointer-events: auto;
      animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .alert-clear-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.15s ease;
    }

    .alert-clear-all-btn:hover {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fca5a5;
      transform: translateY(-1px);
    }

    .floating-alert-card {
      width: 360px;
      max-width: calc(100vw - 48px);
      background: #ffffff;
      border: 1px solid rgba(27, 47, 39, 0.12);
      border-radius: 14px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.14), 0 4px 12px rgba(27, 47, 39, 0.08);
      padding: 14px 16px;
      cursor: pointer;
      pointer-events: auto;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 10px;
      animation: slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .floating-alert-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 42px rgba(0, 0, 0, 0.18);
    }

    .alert-top {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .alert-type-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 9999px;
    }

    .alert-type-badge.type-new {
      background: #eaf7ed;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .alert-type-badge.type-reply {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
      animation: pulse 1.6s infinite ease-in-out;
    }

    .alert-ref {
      font-size: 12px;
      font-weight: 600;
      color: #6a7873;
      font-family: monospace;
      margin-left: auto;
    }

    .alert-close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      padding: 4px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
    }

    .alert-close-btn:hover {
      background: #f1f5f9;
      color: #334155;
    }

    .alert-body {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .alert-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1b2f27 0%, #2e4d40 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .alert-info {
      flex: 1;
      min-width: 0;
    }

    .alert-sender {
      margin: 0 0 2px;
      font-size: 14px;
      font-weight: 700;
      color: #1b2f27;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .alert-snippet {
      margin: 0;
      font-size: 12px;
      color: #4b5563;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .alert-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
      margin-top: 2px;
    }

    .alert-hint {
      font-size: 11px;
      color: #94a3b8;
    }

    .alert-action-btn {
      background: #1b2f27;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .alert-action-btn:hover {
      background: #2e4d40;
    }

    @keyframes slideInRight {
      from {
        transform: translateX(120%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes pulse {
      0% { opacity: 0.4; }
      50% { opacity: 1; }
      100% { opacity: 0.4; }
    }
  `]
})
export class CsaLayoutComponent {
  constructor(public alertService: CsaAlertService) {
    console.log('[CsaLayoutComponent] Initialized with CsaAlertService');
  }

  trackByAlertId(index: number, alert: any): string {
    return alert?.id || index.toString();
  }
}


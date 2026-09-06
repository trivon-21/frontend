import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationPreferences, NotificationService } from '../../../../core/services/notification.service';

interface CsaWorkspacePreferences {
  audioAlerts: boolean;
  autoRefreshQueue: boolean;
  highlightUrgentTickets: boolean;
  agentStatus: 'available' | 'busy' | 'away';
}

@Component({
  selector: 'app-csa-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="header-section">
        <h1 class="page-title">Agent Settings & Preferences</h1>
        <p class="page-subtitle">Configure your customer support queues, notification alerts, and workspace preferences</p>
      </div>

      <!-- Agent Availability Status -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Support Agent Availability</h2>
            <p class="section-desc">Set your current availability status for receiving live inquiries</p>
          </div>
        </div>

        <div class="status-options">
          <label class="status-card" [class.selected]="workspace.agentStatus === 'available'">
            <input type="radio" name="agentStatus" value="available" [(ngModel)]="workspace.agentStatus" (change)="saveWorkspacePreferences()" />
            <div class="status-indicator available"></div>
            <div class="status-info">
              <span class="status-name">Available</span>
              <span class="status-hint">Ready to handle inquiries & tickets</span>
            </div>
          </label>

          <label class="status-card" [class.selected]="workspace.agentStatus === 'busy'">
            <input type="radio" name="agentStatus" value="busy" [(ngModel)]="workspace.agentStatus" (change)="saveWorkspacePreferences()" />
            <div class="status-indicator busy"></div>
            <div class="status-info">
              <span class="status-name">Busy / In Consultation</span>
              <span class="status-hint">Currently attending high-priority case</span>
            </div>
          </label>

          <label class="status-card" [class.selected]="workspace.agentStatus === 'away'">
            <input type="radio" name="agentStatus" value="away" [(ngModel)]="workspace.agentStatus" (change)="saveWorkspacePreferences()" />
            <div class="status-indicator away"></div>
            <div class="status-info">
              <span class="status-name">Away / On Break</span>
              <span class="status-hint">Temporarily away from console</span>
            </div>
          </label>
        </div>
      </div>

      <!-- In-App Support Queue Notifications -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Support Queue & In-App Alerts</h2>
            <p class="section-desc">Choose which support activities trigger pop-up notifications in your CSA portal</p>
          </div>
        </div>

        <div class="settings-list">
          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="preferences.inquiryResponses" (change)="savePreferences()" />
            <div class="setting-label">
              <strong>New Customer Inquiries</strong>
              <span class="setting-desc">Alert when a customer submits a new inquiry or sends a message</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="preferences.serviceRequests" (change)="savePreferences()" />
            <div class="setting-label">
              <strong>Service & Repair Ticket Alerts</strong>
              <span class="setting-desc">Alert when new service tickets, repair requests, or maintenance tasks are logged</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="preferences.feedbackConfirmation" (change)="savePreferences()" />
            <div class="setting-label">
              <strong>Customer Feedback & Ratings</strong>
              <span class="setting-desc">Alert when customers submit reviews, satisfaction ratings, or follow-up notes</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="preferences.orderUpdates" (change)="savePreferences()" />
            <div class="setting-label">
              <strong>Equipment Order Inquiries</strong>
              <span class="setting-desc">Alert when customer requests assistance regarding equipment delivery and orders</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Email Notifications -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Support Email Notifications</h2>
            <p class="section-desc">Receive email notifications for urgent customer cases and daily digests</p>
          </div>
        </div>

        <div class="settings-list">
          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="preferences.emailNotifications" (change)="savePreferences()" />
            <div class="setting-label">
              <strong>Email Alerts for Urgent Tickets</strong>
              <span class="setting-desc">Receive direct email notifications when high-priority or urgent tickets are filed</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Workspace Preferences -->
      <div class="settings-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Agent Console & Workspace</h2>
            <p class="section-desc">Customize your dashboard workflow and monitoring environment</p>
          </div>
        </div>

        <div class="settings-list">
          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="workspace.audioAlerts" (change)="saveWorkspacePreferences()" />
            <div class="setting-label">
              <strong>Audio Chime on Inquiries</strong>
              <span class="setting-desc">Play a sound notification when a new customer inquiry arrives</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="workspace.autoRefreshQueue" (change)="saveWorkspacePreferences()" />
            <div class="setting-label">
              <strong>Auto-Refresh Live Queues</strong>
              <span class="setting-desc">Automatically update ticket metrics and active customer requests every 60 seconds</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="workspace.highlightUrgentTickets" (change)="saveWorkspacePreferences()" />
            <div class="setting-label">
              <strong>Highlight Urgent Tickets</strong>
              <span class="setting-desc">Apply visual high-priority badges to tickets requiring prompt action</span>
            </div>
          </label>
        </div>
      </div>

      <!-- Save Message Toast -->
      <div *ngIf="saved" class="alert-success">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
        <span>Your CSA settings and preferences have been updated</span>
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 720px;
      margin: 0 auto;
      padding: 10px 16px 48px;
    }

    .header-section {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #1b2f27;
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 14px;
      color: #6a7873;
      margin: 0;
    }

    .settings-section {
      margin-bottom: 24px;
      padding: 22px;
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 18px;
    }

    .section-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: var(--primary-lighter, #e8fdf0);
      color: var(--primary-main, #00843D);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1b2f27;
      margin: 0 0 4px;
    }

    .section-desc {
      font-size: 13px;
      color: #7b8884;
      margin: 0;
      line-height: 1.4;
    }

    .status-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px;
    }

    .status-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: #fbfcfb;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 10px;
      cursor: pointer;
      position: relative;
      transition: all 0.15s ease;
    }

    .status-card input[type="radio"] {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .status-card:hover {
      background: #f4faf6;
      border-color: rgba(0, 132, 61, 0.3);
    }

    .status-card.selected {
      background: #f0fbf4;
      border-color: var(--primary-main, #00843D);
      box-shadow: 0 0 0 1px var(--primary-main, #00843D);
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-indicator.available {
      background: #00843D;
      box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.2);
    }

    .status-indicator.busy {
      background: #eab308;
      box-shadow: 0 0 0 3px rgba(234, 179, 8, 0.2);
    }

    .status-indicator.away {
      background: #94a3b8;
      box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
    }

    .status-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .status-name {
      font-size: 13px;
      font-weight: 600;
      color: #1b2f27;
    }

    .status-hint {
      font-size: 11px;
      color: #7b8884;
    }

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .setting-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 10px;
      cursor: pointer;
      background: #fafbfa;
      border: 1px solid rgba(0, 0, 0, 0.04);
      transition: background 0.15s, border-color 0.15s;
    }

    .setting-item:hover {
      background: #f4faf6;
      border-color: rgba(0, 132, 61, 0.2);
    }

    .setting-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      cursor: pointer;
      accent-color: var(--primary-main, #00843D);
      flex-shrink: 0;
    }

    .setting-label {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .setting-label strong {
      font-size: 14px;
      font-weight: 600;
      color: #1b2f27;
    }

    .setting-desc {
      font-size: 12.5px;
      color: #7b8884;
      line-height: 1.35;
    }

    .alert-success {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #00843D;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 6px 20px rgba(0, 132, 61, 0.3);
      z-index: 999;
      animation: slideUp 0.25s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(12px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `]
})
export class CsaSettingsComponent implements OnInit {
  private notificationService = inject(NotificationService);

  preferences: NotificationPreferences = {
    orderUpdates: true,
    inquiryResponses: true,
    serviceRequests: true,
    feedbackConfirmation: true,
    emailNotifications: true,
    pushNotifications: false
  };

  workspace: CsaWorkspacePreferences = {
    audioAlerts: true,
    autoRefreshQueue: true,
    highlightUrgentTickets: true,
    agentStatus: 'available'
  };

  saved = false;
  private saveTimeout: any;

  ngOnInit(): void {
    this.loadPreferences();
    this.loadWorkspacePreferences();
  }

  loadPreferences(): void {
    this.notificationService.getPreferences().subscribe({
      next: (res) => {
        if (res?.data) {
          this.preferences = { ...this.preferences, ...res.data };
        }
      },
      error: () => {
        // Fallback to default
      }
    });
  }

  loadWorkspacePreferences(): void {
    try {
      const stored = localStorage.getItem('csa_workspace_preferences');
      if (stored) {
        this.workspace = { ...this.workspace, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore parse error
    }
  }

  savePreferences(): void {
    this.notificationService.updatePreferences(this.preferences).subscribe({
      next: (res) => {
        if (res?.data) {
          this.preferences = { ...this.preferences, ...res.data };
        }
        this.triggerSavedFeedback();
      },
      error: () => {
        // Handle error quietly
      }
    });
  }

  saveWorkspacePreferences(): void {
    try {
      localStorage.setItem('csa_workspace_preferences', JSON.stringify(this.workspace));
      this.triggerSavedFeedback();
    } catch {
      // Ignore error
    }
  }

  private triggerSavedFeedback(): void {
    this.saved = true;
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saved = false;
    }, 3000);
  }
}

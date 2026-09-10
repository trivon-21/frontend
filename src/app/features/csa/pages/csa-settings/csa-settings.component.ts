import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CsaWorkspacePreferences {
  popupInquiryAlerts: boolean;
  autoRefreshQueue: boolean;
}

@Component({
  selector: 'app-csa-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="header-section">
        <h1 class="page-title">Agent Settings & Preferences</h1>
        <p class="page-subtitle">Configure your customer support workspace preferences</p>
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
            <input type="checkbox" [(ngModel)]="workspace.popupInquiryAlerts" (change)="saveWorkspacePreferences()" />
            <div class="setting-label">
              <strong>Live Inquiry Popups</strong>
              <span class="setting-desc">Show floating notifications on the right when new inquiries arrive or customers reply</span>
            </div>
          </label>

          <label class="setting-item">
            <input type="checkbox" [(ngModel)]="workspace.autoRefreshQueue" (change)="saveWorkspacePreferences()" />
            <div class="setting-label">
              <strong>Auto-Refresh Live Queues</strong>
              <span class="setting-desc">Automatically update ticket metrics and active customer requests every 60 seconds</span>
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
  workspace: CsaWorkspacePreferences = {
    popupInquiryAlerts: true,
    autoRefreshQueue: true
  };

  saved = false;
  private saveTimeout: any;

  ngOnInit(): void {
    this.loadWorkspacePreferences();
  }

  loadWorkspacePreferences(): void {
    try {
      const stored = localStorage.getItem('csa_workspace_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.workspace = {
          ...this.workspace,
          ...parsed,
          popupInquiryAlerts: parsed.popupInquiryAlerts !== undefined ? parsed.popupInquiryAlerts : true
        };
      }
    } catch {
      // Ignore parse error
    }
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

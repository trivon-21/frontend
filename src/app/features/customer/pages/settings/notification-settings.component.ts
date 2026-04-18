import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface NotificationPreference {
  orderUpdates: boolean;
  inquiryResponses: boolean;
  serviceRequests: boolean;
  feedbackConfirmation: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <h1 class="page-title">Notification Settings</h1>

      <!-- Email Notification Section -->
      <div class="settings-section">
        <h2 class="section-title">Email Notifications</h2>
        <p class="section-desc">Choose which emails you want to receive</p>

        <label class="setting-item">
          <input type="checkbox" [(ngModel)]="preferences.emailNotifications" (change)="savePreferences()" />
          <span class="setting-label">
            <strong>Email Notifications</strong>
            <span class="setting-desc">Get notified via email</span>
          </span>
        </label>
      </div>

      <!-- In-App Notifications -->
      <div class="settings-section">
        <h2 class="section-title">In-App Notifications</h2>
        <p class="section-desc">Notifications you'll see in the app</p>

        <label class="setting-item">
          <input type="checkbox" [(ngModel)]="preferences.orderUpdates" (change)="savePreferences()" />
          <span class="setting-label">
            <strong>📦 Order Updates</strong>
            <span class="setting-desc">Updates about your orders and deliveries</span>
          </span>
        </label>

        <label class="setting-item">
          <input type="checkbox" [(ngModel)]="preferences.inquiryResponses" (change)="savePreferences()" />
          <span class="setting-label">
            <strong>💬 Inquiry Responses</strong>
            <span class="setting-desc">Responses to your support inquiries</span>
          </span>
        </label>

        <label class="setting-item">
          <input type="checkbox" [(ngModel)]="preferences.serviceRequests" (change)="savePreferences()" />
          <span class="setting-label">
            <strong>🔧 Service Requests</strong>
            <span class="setting-desc">Updates on your service requests</span>
          </span>
        </label>

        <label class="setting-item">
          <input type="checkbox" [(ngModel)]="preferences.feedbackConfirmation" (change)="savePreferences()" />
          <span class="setting-label">
            <strong>⭐ Feedback Confirmation</strong>
            <span class="setting-desc">When your feedback has been received</span>
          </span>
        </label>
      </div>

      <!-- Save Message -->
      <div *ngIf="saved" class="alert alert-success">
        ✓ Your notification preferences have been saved
      </div>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #1b2f27;
      margin: 0 0 24px;
    }

    .settings-section {
      margin-bottom: 32px;
      padding: 20px;
      background: #f9faf9;
      border-radius: 12px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #1b2f27;
      margin: 0 0 4px;
    }

    .section-desc {
      font-size: 13px;
      color: #9aa09e;
      margin: 0 0 16px;
    }

    .setting-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: background 0.15s;
      border-radius: 8px;
    }

    .setting-item:hover {
      background: rgba(0,0,0,0.03);
    }

    .setting-item:last-child {
      margin-bottom: 0;
    }

    .setting-item input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-top: 2px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .setting-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .setting-label strong {
      font-size: 14px;
      color: #1b2f27;
    }

    .setting-desc {
      font-size: 12px;
      color: #9aa09e;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 24px;
    }

    .alert-success {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
  `]
})
export class NotificationSettingsComponent implements OnInit {
  preferences: NotificationPreference = {
    orderUpdates: true,
    inquiryResponses: true,
    serviceRequests: true,
    feedbackConfirmation: true,
    emailNotifications: true,
    pushNotifications: false
  };

  saved = false;

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      this.preferences = JSON.parse(saved);
    }
  }

  savePreferences(): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }
}

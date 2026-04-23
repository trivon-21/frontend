import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <h1 class="page-title">All Notifications</h1>
        <div class="header-actions">
          <button class="btn-secondary" (click)="markAllAsRead()" *ngIf="unreadCount > 0">
            Mark all as read
          </button>
          <button class="btn-danger" (click)="clearAll()" *ngIf="notifications.length > 0">
            Clear all
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="notifications.length === 0" class="empty-state">
        <span class="empty-icon">NT</span>
        <h2>No notifications yet</h2>
        <p>You'll see all your notifications here</p>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list" *ngIf="notifications.length > 0">
        <div *ngFor="let notif of notifications" class="notification-tile" [class.unread]="!notif.read">
          <div class="notif-icon">{{ getNotificationIcon(notif.type) }}</div>
          <div class="notif-body">
            <div class="notif-header">
              <h3 class="notif-title">{{ notif.title }}</h3>
              <span class="notif-time">{{ getTimeAgo(notif.createdAt) }}</span>
            </div>
            <p class="notif-message">{{ notif.message }}</p>
            <div class="notif-type-badge">{{ getTypeName(notif.type) }}</div>
          </div>
          <div class="notif-actions">
            <button
              class="action-btn"
              (click)="navigateTo(notif)"
              *ngIf="notif.actionUrl"
              title="Open"
            >
              →
            </button>
            <button
              class="action-btn"
              (click)="deleteNotif(notif.id)"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      max-width: 700px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #1b2f27;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn-secondary,
    .btn-danger {
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }

    .btn-danger {
      background: #ffebee;
      color: #c0392b;
    }

    .btn-danger:hover {
      background: #ffcdd2;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
    }

    .empty-state h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1b2f27;
      margin: 0 0 8px;
    }

    .empty-state p {
      font-size: 14px;
      color: #9aa09e;
      margin: 0;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-tile {
      display: flex;
      gap: 14px;
      padding: 16px;
      background: #f9faf9;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 12px;
      transition: all 0.15s;
    }

    .notification-tile:hover {
      background: #f3f4f2;
    }

    .notification-tile.unread {
      background: #edf5f0;
      border-color: rgba(31,91,69,0.2);
    }

    .notif-icon {
      font-size: 28px;
      flex-shrink: 0;
    }

    .notif-body {
      flex: 1;
      min-width: 0;
    }

    .notif-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 6px;
    }

    .notif-title {
      font-size: 14px;
      font-weight: 700;
      color: #1b2f27;
      margin: 0;
    }

    .notif-time {
      font-size: 12px;
      color: #9aa09e;
      margin-left: auto;
      white-space: nowrap;
    }

    .notif-message {
      font-size: 13px;
      color: #566463;
      margin: 0 0 8px;
    }

    .notif-type-badge {
      display: inline-block;
      padding: 4px 8px;
      background: rgba(31,91,69,0.1);
      color: #1f5b45;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .notif-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      background: #e0e0e0;
      border-color: rgba(0,0,0,0.2);
    }

    @media (max-width: 640px) {
      .notifications-page {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        margin-top: 12px;
        width: 100%;
      }

      .notification-tile {
        gap: 10px;
      }

      .notif-icon {
        font-size: 24px;
      }

      .notif-header {
        flex-direction: column;
      }

      .notif-time {
        margin-left: 0;
      }
    }
  `]
})
export class NotificationsPageComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe((notifs) => {
      this.notifications = notifs;
    });

    this.notificationService.getUnreadCount().subscribe((count) => {
      this.unreadCount = count;
    });
  }

  getNotificationIcon(type: string): string {
    const labels: { [key: string]: string } = {
      order: 'OR',
      inquiry: 'IN',
      service: 'SV',
      feedback: 'FB',
      general: 'NT'
    };
    return labels[type] || 'NT';
  }

  getTypeName(type: string): string {
    const names: { [key: string]: string } = {
      order: 'Order',
      inquiry: 'Inquiry',
      service: 'Service',
      feedback: 'Feedback',
      general: 'General'
    };
    return names[type] || 'Notification';
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }

  navigateTo(notification: Notification): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
      this.notificationService.markAsRead(notification.id);
    }
  }

  deleteNotif(id: string): void {
    this.notificationService.deleteNotification(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAll(): void {
    if (confirm('Are you sure you want to delete all notifications?')) {
      this.notificationService.clearNotifications();
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../../core/services/notification.service';
import { PortalIconsModule } from '../../../../shared/components/portal-icons/portal-icons.module';

type FilterType = 'all' | 'unread' | 'system' | 'announcements' | 'service';

@Component({
  selector: 'app-csa-notifications',
  standalone: true,
  imports: [CommonModule, PortalIconsModule],
  template: `
    <div class="notifications-page">
      <!-- Top Banner / Header -->
      <div class="header-card">
        <div class="header-main">
          <div class="header-title-row">
            <div class="admin-badge">
              <lucide-angular name="shield-check" [size]="14"></lucide-angular>
              <span>Official Admin Channel</span>
            </div>
            <h1 class="page-title">Admin Bulletins & System Announcements</h1>
            <p class="page-subtitle">
              Broadcasts, scheduled maintenance notices, and priority bulletins from the Super Admin
            </p>
          </div>

          <div class="header-actions">
            <button
              class="btn-secondary"
              (click)="markAllAsRead()"
              *ngIf="unreadCount > 0"
              title="Mark all notifications as read"
            >
              <lucide-angular name="check" [size]="15"></lucide-angular>
              <span>Mark all as read</span>
            </button>
            <ng-container *ngIf="notifications.length > 0">
              <button
                class="btn-danger-outline"
                (click)="confirmingClear = true"
                *ngIf="!confirmingClear"
                title="Clear all notifications"
              >
                <lucide-angular name="trash-2" [size]="15"></lucide-angular>
                <span>Clear all</span>
              </button>
              <div class="confirm-clear-box" *ngIf="confirmingClear">
                <span class="confirm-text">Clear all?</span>
                <button class="btn-confirm-yes" (click)="executeClearAll()">Yes, Clear</button>
                <button class="btn-confirm-no" (click)="confirmingClear = false">Cancel</button>
              </div>
            </ng-container>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filter-bar">
          <button
            class="filter-tab"
            [class.active]="currentFilter === 'all'"
            (click)="setFilter('all')"
          >
            <span>All Bulletins</span>
            <span class="tab-count" *ngIf="notifications.length > 0">{{ notifications.length }}</span>
          </button>
          <button
            class="filter-tab"
            [class.active]="currentFilter === 'unread'"
            (click)="setFilter('unread')"
          >
            <span>Unread</span>
            <span class="tab-count unread" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          </button>
          <button
            class="filter-tab"
            [class.active]="currentFilter === 'system'"
            (click)="setFilter('system')"
          >
            <span>System Alerts</span>
            <span class="tab-count" *ngIf="systemCount > 0">{{ systemCount }}</span>
          </button>
          <button
            class="filter-tab"
            [class.active]="currentFilter === 'announcements'"
            (click)="setFilter('announcements')"
          >
            <span>Announcements</span>
            <span class="tab-count" *ngIf="announcementCount > 0">{{ announcementCount }}</span>
          </button>
          <button
            class="filter-tab"
            [class.active]="currentFilter === 'service'"
            (click)="setFilter('service')"
          >
            <span>Service &amp; Ops</span>
            <span class="tab-count" *ngIf="serviceCount > 0">{{ serviceCount }}</span>
          </button>
        </div>
      </div>

      <!-- Empty State: Zero Notifications -->
      <div *ngIf="notifications.length === 0" class="empty-state-card">
        <div class="empty-icon-wrap">
          <lucide-angular name="shield" [size]="42"></lucide-angular>
        </div>
        <h2 class="empty-title">No Admin Announcements</h2>
        <p class="empty-desc">
          You are all caught up! System maintenance schedules, policy updates, and broadcast bulletins from the Super Admin will appear here.
        </p>
        <div class="empty-badge">
          <lucide-angular name="circle-check-big" [size]="14"></lucide-angular>
          <span>Real-time channel active</span>
        </div>
      </div>

      <!-- Empty State: Filter Has No Results -->
      <div *ngIf="notifications.length > 0 && filteredNotifications.length === 0" class="empty-state-card">
        <div class="empty-icon-wrap subtle">
          <lucide-angular name="filter" [size]="36"></lucide-angular>
        </div>
        <h2 class="empty-title">No matching notifications</h2>
        <p class="empty-desc">
          No announcements found under the "<strong>{{ getFilterLabel(currentFilter) }}</strong>" filter.
        </p>
        <button class="btn-reset-filter" (click)="setFilter('all')">
          View all notifications
        </button>
      </div>

      <!-- Notifications Feed -->
      <div class="notifications-feed" *ngIf="filteredNotifications.length > 0">
        <div
          *ngFor="let notif of filteredNotifications"
          class="notification-card"
          [class.unread]="!notif.read"
          [class.is-alert]="isAlert(notif)"
        >
          <!-- Left Icon Box -->
          <div class="card-icon-box" [ngClass]="getIconBoxClass(notif)">
            <lucide-angular [name]="getIconName(notif)" [size]="20"></lucide-angular>
          </div>

          <!-- Main Content -->
          <div class="card-content">
            <div class="card-meta">
              <div class="meta-tags">
                <span class="sender-tag">
                  <lucide-angular name="shield" [size]="12"></lucide-angular>
                  Super Admin
                </span>
                <span class="type-badge" [ngClass]="getTypeBadgeClass(notif)">
                  {{ getTypeLabel(notif) }}
                </span>
                <span class="unread-dot" *ngIf="!notif.read" title="Unread notification"></span>
              </div>
              <span class="timestamp" [title]="notif.createdAt | date:'medium'">
                <lucide-angular name="clock" [size]="12"></lucide-angular>
                {{ getTimeAgo(notif.createdAt) }}
              </span>
            </div>

            <h3 class="card-title">{{ notif.title }}</h3>
            <p class="card-message">{{ notif.message }}</p>

            <div class="card-footer" *ngIf="notif.actionUrl">
              <button class="btn-action-link" (click)="openAction(notif)">
                <span>View Details</span>
                <lucide-angular name="external-link" [size]="13"></lucide-angular>
              </button>
            </div>
          </div>

          <!-- Right Action Buttons -->
          <div class="card-actions">
            <button
              class="action-icon-btn"
              (click)="toggleRead(notif, $event)"
              [title]="notif.read ? 'Mark as unread' : 'Mark as read'"
            >
              <lucide-angular
                [name]="notif.read ? 'circle' : 'check'"
                [size]="16"
              ></lucide-angular>
            </button>
            <button
              class="action-icon-btn delete-btn"
              (click)="deleteNotification(notif.id, $event)"
              title="Delete bulletin"
            >
              <lucide-angular name="trash-2" [size]="16"></lucide-angular>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      padding: 24px 28px 48px;
      max-width: 1040px;
      margin: 0 auto;
      font-family: inherit;
    }

    /* Header Card */
    .header-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.07);
      border-radius: 16px;
      padding: 24px 28px 0;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 22px;
      flex-wrap: wrap;
    }

    .admin-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: #15803d;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 6px;
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
      line-height: 1.45;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      align-self: flex-start;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .btn-danger-outline {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: #ffffff;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #dc2626;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-danger-outline:hover {
      background: #fef2f2;
      border-color: #f87171;
    }

    .confirm-clear-box {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
    }

    .confirm-text {
      font-size: 12px;
      font-weight: 600;
      color: #991b1b;
    }

    .btn-confirm-yes {
      padding: 4px 10px;
      background: #dc2626;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-confirm-yes:hover {
      background: #b91c1c;
    }

    .btn-confirm-no {
      padding: 4px 8px;
      background: transparent;
      color: #4b5563;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-confirm-no:hover {
      color: #111827;
    }

    /* Filter Bar */
    .filter-bar {
      display: flex;
      gap: 4px;
      border-top: 1px solid #f3f4f6;
      overflow-x: auto;
    }

    .filter-tab {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 13px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .filter-tab:hover {
      color: #111827;
    }

    .filter-tab.active {
      color: #00843D;
      border-bottom-color: #00843D;
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 7px;
      background: #f3f4f6;
      color: #4b5563;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
    }

    .tab-count.unread {
      background: #dcfce7;
      color: #15803d;
    }

    /* Empty State */
    .empty-state-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 16px;
      padding: 64px 32px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .empty-icon-wrap {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: #f0fdf4;
      color: #00843D;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .empty-icon-wrap.subtle {
      background: #f3f4f6;
      color: #9ca3af;
    }

    .empty-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px;
    }

    .empty-desc {
      font-size: 14px;
      color: #6b7280;
      max-width: 500px;
      line-height: 1.55;
      margin: 0 0 20px;
    }

    .empty-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
    }

    .btn-reset-filter {
      padding: 8px 16px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-reset-filter:hover {
      background: #e5e7eb;
    }

    /* Notifications Feed */
    .notifications-feed {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-card {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.07);
      border-radius: 14px;
      padding: 20px 22px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
      transition: all 0.18s ease;
      position: relative;
    }

    .notification-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border-color: rgba(0, 0, 0, 0.12);
    }

    .notification-card.unread {
      background: #fcfdfd;
      border-left: 4px solid #00843D;
    }

    .notification-card.unread.is-alert {
      border-left-color: #f59e0b;
    }

    /* Icon Box */
    .card-icon-box {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-icon-box.icon-alert {
      background: #fef3c7;
      color: #b45309;
    }

    .card-icon-box.icon-service,
    .card-icon-box.icon-maintenance {
      background: #e0f2fe;
      color: #0284c7;
    }

    .card-icon-box.icon-announcement {
      background: #ede9fe;
      color: #6d28d9;
    }

    .card-icon-box.icon-general {
      background: #f0fdf4;
      color: #15803d;
    }

    /* Card Content */
    .card-content {
      flex: 1;
      min-width: 0;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      gap: 12px;
    }

    .meta-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .sender-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 7px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      color: #374151;
    }

    .type-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .type-badge.badge-urgent {
      background: #fee2e2;
      color: #b91c1c;
    }

    .type-badge.badge-alert {
      background: #fef3c7;
      color: #b45309;
    }

    .type-badge.badge-service,
    .type-badge.badge-maintenance {
      background: #e0f2fe;
      color: #0369a1;
    }

    .type-badge.badge-announcement {
      background: #ede9fe;
      color: #6d28d9;
    }

    .type-badge.badge-general {
      background: #f0fdf4;
      color: #15803d;
    }

    .unread-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00843D;
      display: inline-block;
    }

    .timestamp {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #9ca3af;
      white-space: nowrap;
    }

    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 6px;
      line-height: 1.4;
    }

    .card-message {
      font-size: 13.5px;
      color: #4b5563;
      margin: 0;
      line-height: 1.55;
      white-space: pre-line;
    }

    .card-footer {
      margin-top: 12px;
    }

    .btn-action-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      color: #00843D;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-action-link:hover {
      background: #dcfce7;
      border-color: #86efac;
    }

    /* Right Actions */
    .card-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-left: 6px;
    }

    .action-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .action-icon-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .action-icon-btn.delete-btn:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #dc2626;
    }

    @media (max-width: 640px) {
      .notifications-page {
        padding: 16px;
      }
      .header-card {
        padding: 18px 18px 0;
      }
      .notification-card {
        flex-direction: column;
      }
      .card-actions {
        flex-direction: row;
        margin-left: 0;
        margin-top: 10px;
      }
    }
  `]
})
export class CsaNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  currentFilter: FilterType = 'all';
  private notifSub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notifSub = this.notificationService.getNotifications().subscribe((list) => {
      this.notifications = list || [];
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  get filteredNotifications(): Notification[] {
    switch (this.currentFilter) {
      case 'unread':
        return this.notifications.filter((n) => !n.read);
      case 'system':
        return this.notifications.filter((n) => this.isSystemAlert(n));
      case 'announcements':
        return this.notifications.filter((n) => this.isAnnouncement(n));
      case 'service':
        return this.notifications.filter((n) => this.isService(n));
      default:
        return this.notifications;
    }
  }

  get unreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  get systemCount(): number {
    return this.notifications.filter((n) => this.isSystemAlert(n)).length;
  }

  get announcementCount(): number {
    return this.notifications.filter((n) => this.isAnnouncement(n)).length;
  }

  get serviceCount(): number {
    return this.notifications.filter((n) => this.isService(n)).length;
  }

  setFilter(filter: FilterType): void {
    this.currentFilter = filter;
  }

  getFilterLabel(filter: FilterType): string {
    switch (filter) {
      case 'unread':
        return 'Unread';
      case 'system':
        return 'System Alerts';
      case 'announcements':
        return 'Announcements';
      case 'service':
        return 'Service & Ops';
      default:
        return 'All';
    }
  }

  confirmingClear = false;

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  executeClearAll(): void {
    this.confirmingClear = false;
    this.notificationService.clearNotifications();
  }

  toggleRead(notif: Notification, event: Event): void {
    event.stopPropagation();
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id);
    }
  }

  deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  openAction(notif: Notification): void {
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id);
    }
    if (!notif.actionUrl) return;

    if (notif.actionUrl.startsWith('http://') || notif.actionUrl.startsWith('https://')) {
      window.open(notif.actionUrl, '_blank');
    } else {
      this.router.navigateByUrl(notif.actionUrl);
    }
  }

  isAlert(notif: Notification): boolean {
    const t = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    return t === 'system_alert' || t.includes('alert') || t.includes('urgent') || title.includes('urgent') || title.includes('alert');
  }

  isSystemAlert(notif: Notification): boolean {
    const t = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    return (
      t === 'system_alert' ||
      t.includes('alert') ||
      t.includes('urgent') ||
      title.includes('system alert') ||
      title.includes('outage') ||
      title.includes('downtime')
    );
  }

  isService(notif: Notification): boolean {
    const t = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    return (
      t === 'service' ||
      t.includes('service') ||
      t.includes('maintenance') ||
      title.includes('maintenance') ||
      title.includes('service') ||
      title.includes('amc')
    );
  }

  isAnnouncement(notif: Notification): boolean {
    const t = (notif.type || '').toLowerCase();
    return (
      t === 'announcement' ||
      t === 'general' ||
      (!this.isSystemAlert(notif) && !this.isService(notif))
    );
  }

  getIconName(notif: Notification): string {
    const t = (notif.type || '').toLowerCase();
    if (this.isService(notif)) return 'wrench';
    if (this.isSystemAlert(notif) || this.isAlert(notif)) return 'triangle-alert';
    if (t === 'announcement') return 'bell';
    if (t === 'order') return 'package';
    if (t === 'inquiry') return 'message-circle';
    if (t === 'feedback') return 'star';
    return 'info';
  }

  getIconBoxClass(notif: Notification): string {
    const t = (notif.type || '').toLowerCase();
    if (this.isSystemAlert(notif) || this.isAlert(notif)) return 'icon-alert';
    if (this.isService(notif)) return 'icon-service';
    if (t === 'announcement') return 'icon-announcement';
    return 'icon-general';
  }

  getTypeLabel(notif: Notification): string {
    const t = (notif.type || '').toLowerCase();
    if (this.isSystemAlert(notif)) return 'System Alert';
    if (this.isAlert(notif)) return 'Urgent Alert';
    if (this.isService(notif)) return 'Service & Maintenance';
    if (t === 'announcement') return 'Announcement';
    if (t === 'order') return 'Order Update';
    if (t === 'inquiry') return 'Customer Inquiry';
    if (t === 'feedback') return 'Feedback & Review';
    return 'General Notice';
  }

  getTypeBadgeClass(notif: Notification): string {
    const t = (notif.type || '').toLowerCase();
    if (this.isSystemAlert(notif) || this.isAlert(notif)) return 'badge-alert';
    if (this.isService(notif)) return 'badge-service';
    if (t === 'announcement') return 'badge-announcement';
    return 'badge-general';
  }

  getTimeAgo(dateValue: Date | string): string {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}

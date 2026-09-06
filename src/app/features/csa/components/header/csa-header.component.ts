import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService, Notification } from '../../../../core/services/notification.service';
import { ClickOutsideDirective } from '../../../../directives/click-outside.directive';

@Component({
  selector: 'app-csa-header',
  standalone: true,
  imports: [CommonModule, RouterLink, ClickOutsideDirective],
  template: `
    <header class="csa-header">
      <div class="header-left">
        <a routerLink="/" class="back-home-btn" title="Back to Home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Home</span>
        </a>
        <div class="page-context-wrap">
          <span class="page-context">Customer Support Portal</span>
        </div>
      </div>
      <div class="header-right">
        <!-- Live Clock -->
        <div class="header-clock">
          <span class="clock-time">{{ currentTime | date: 'h:mm:ss a' }}</span>
          <span class="clock-date">{{ currentTime | date: 'MMM d, yyyy' }}</span>
        </div>

        <!-- Settings Button -->
        <button class="icon-btn" aria-label="Settings" (click)="goToSettings()" title="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        <!-- Notifications -->
        <div class="notifications-container" appClickOutside (clickOutside)="closeNotifications()">
          <button class="icon-btn" aria-label="Notifications" (click)="toggleNotifications()" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
          </button>

          <!-- Notifications Dropdown -->
          <div class="notifications-dropdown" *ngIf="showNotifications">
            <div class="notifications-header">
              <h3>Notifications</h3>
              <div class="notifications-actions">
                <button class="action-link" (click)="markAllAsRead()" *ngIf="unreadCount > 0" title="Mark all as read">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button class="action-link" (click)="clearAllNotifications()" *ngIf="notifications.length > 0" title="Clear all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="notifications-list">
              <div *ngIf="notifications.length === 0" class="empty-state">
                <span>No notifications yet</span>
              </div>
              <div *ngFor="let notif of notifications.slice(0, 8)" class="notification-item"
                [class.unread]="!notif.read" (click)="navigateToNotification(notif)">
                <span class="notif-icon">{{ getNotificationIcon(notif.type) }}</span>
                <div class="notif-content">
                  <div class="notif-title">{{ notif.title }}</div>
                  <div class="notif-message">{{ notif.message }}</div>
                </div>
                <button class="notif-delete" (click)="deleteNotification(notif.id, $event)" aria-label="Delete">
                  ✕
                </button>
              </div>
            </div>

            <div class="notifications-footer" *ngIf="notifications.length > 0">
              <a routerLink="/csa/notifications" (click)="closeNotifications()">View All Notifications</a>
            </div>
          </div>
        </div>

        <!-- User Menu -->
        <div class="user-menu-container" appClickOutside (clickOutside)="closeUserMenu()">
          <button class="user-avatar" (click)="toggleUserMenu()" aria-label="User menu" title="User menu">
            {{ userInitials }}
          </button>

          <!-- User Dropdown -->
          <div class="user-dropdown" *ngIf="showUserMenu">
            <div class="user-header">
              <div class="user-avatar-lg">{{ userInitials }}</div>
              <div class="user-meta">
                <div class="user-name">{{ userName }}</div>
                <div class="user-email">{{ userEmail }}</div>
                <span class="user-role-badge">Customer Support Agent</span>
              </div>
            </div>
            <div class="menu-divider"></div>
            <a routerLink="/csa/dashboard" class="menu-item" (click)="closeUserMenu()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
                <path d="M9 21V12h6v9" />
              </svg>
              Dashboard
            </a>
            <a routerLink="/csa/profile" class="menu-item" (click)="closeUserMenu()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              My Profile
            </a>
            <a routerLink="/csa/notifications" class="menu-item" (click)="closeUserMenu()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              Notifications
            </a>
            <a routerLink="/csa/settings" class="menu-item" (click)="closeUserMenu()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="3" />
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </a>
            <div class="menu-divider"></div>
            <button class="menu-item logout" (click)="logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .csa-header {
      height: 64px;
      background: #fff;
      border-bottom: 1px solid rgba(0, 0, 0, 0.07);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-home-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 999px;
      border: 1.5px solid rgba(0, 0, 0, 0.1);
      background: #fff;
      color: #566463;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s;
    }

    .back-home-btn:hover {
      background: #f3f4f2;
      color: var(--primary-main, #00843D);
      border-color: var(--primary-main, #00843D);
    }

    .page-context-wrap {
      display: flex;
      align-items: center;
    }

    .page-context {
      font-size: 14px;
      font-weight: 600;
      color: #566463;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-clock {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-right: 6px;
      padding-right: 14px;
      border-right: 1.5px solid rgba(0, 0, 0, 0.08);
    }

    .clock-time {
      font-size: 14px;
      font-weight: 700;
      color: var(--primary-main, #00843D);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
    }

    .clock-date {
      font-size: 11px;
      color: #9aa09e;
      font-weight: 500;
    }

    /* Icon Buttons */
    .icon-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 1.5px solid rgba(0, 0, 0, 0.1);
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #566463;
      transition: background 0.13s, border-color 0.13s, color 0.13s;
    }

    .icon-btn:hover {
      background: #f3f4f2;
      border-color: rgba(0, 0, 0, 0.18);
      color: var(--primary-main, #00843D);
    }

    /* Notifications */
    .notifications-container {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      min-width: 22px;
      height: 22px;
      background: var(--error, #C20E0E);
      color: #fff;
      border: 2px solid white;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notifications-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 360px;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.10);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      z-index: 300;
      max-height: 450px;
      display: flex;
      flex-direction: column;
    }

    .notifications-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.07);
      flex-shrink: 0;
    }

    .notifications-header h3 {
      font-size: 15px;
      font-weight: 700;
      color: #10251c;
      margin: 0;
    }

    .notifications-actions {
      display: flex;
      gap: 8px;
    }

    .action-link {
      background: none;
      border: none;
      cursor: pointer;
      color: #9aa09e;
      padding: 4px;
      display: flex;
      align-items: center;
      transition: color 0.15s;
    }

    .action-link:hover {
      color: var(--primary-main, #00843D);
    }

    .notifications-list {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: #9aa09e;
      font-size: 13px;
    }

    .notification-item {
      display: flex;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      cursor: pointer;
      transition: background 0.12s;
      align-items: flex-start;
    }

    .notification-item:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .notification-item.unread {
      background: var(--primary-lighter, #e8fdf0);
    }

    .notif-icon {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 6px;
      border-radius: 6px;
      background: #f3f4f2;
      color: #566463;
      flex-shrink: 0;
    }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #10251c;
      margin-bottom: 2px;
    }

    .notif-message {
      font-size: 11.5px;
      color: #566463;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .notif-delete {
      background: none;
      border: none;
      cursor: pointer;
      color: #c8d0ce;
      font-size: 14px;
      padding: 0;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .notif-delete:hover {
      color: #c0392b;
    }

    .notifications-footer {
      padding: 10px 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.07);
      text-align: center;
      flex-shrink: 0;
    }

    .notifications-footer a {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary-main, #00843D);
      text-decoration: none;
    }

    .notifications-footer a:hover {
      text-decoration: underline;
    }

    /* User Menu */
    .user-menu-container {
      position: relative;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--primary-main, #00843D);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      letter-spacing: 0.5px;
      border: none;
      transition: opacity 0.15s;
    }

    .user-avatar:hover {
      opacity: 0.9;
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 230px;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.10);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      z-index: 300;
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
    }

    .user-avatar-lg {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-main, #00843D);
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .user-name {
      font-weight: 700;
      font-size: 13.5px;
      color: #10251c;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 11.5px;
      color: #9aa09e;
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role-badge {
      font-size: 9.5px;
      font-weight: 700;
      color: var(--primary-main, #00843D);
      background: var(--primary-lighter, #e8fdf0);
      padding: 2px 6px;
      border-radius: 999px;
      width: fit-content;
      margin-top: 4px;
      letter-spacing: 0.02em;
    }

    .menu-divider {
      height: 1px;
      background: rgba(0, 0, 0, 0.07);
      margin: 0;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #2a2f2d;
      text-decoration: none;
      background: none;
      border: none;
      width: 100%;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s;
    }

    .menu-item:hover {
      background: rgba(0, 0, 0, 0.03);
    }

    .menu-item svg {
      flex-shrink: 0;
      color: #6b7280;
    }

    .menu-item.logout {
      color: #dc2626;
    }

    .menu-item.logout svg {
      color: #dc2626;
    }

    .menu-item.logout:hover {
      background: #fef2f2;
    }
  `]
})
export class CsaHeaderComponent implements OnInit, OnDestroy {
  currentTime = new Date();
  showNotifications = false;
  showUserMenu = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  private timer: any;
  private notifSub: any;
  private unreadSub: any;

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.timer = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    this.notifSub = this.notificationService.getNotifications().subscribe((notifs) => {
      this.notifications = notifs;
    });

    this.unreadSub = this.notificationService.getUnreadCount().subscribe((count) => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    if (this.notifSub) {
      this.notifSub.unsubscribe();
    }
    if (this.unreadSub) {
      this.unreadSub.unsubscribe();
    }
  }

  get userInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'CSA';
    const name = user.fullName || user.email || 'CSA User';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || 'Customer Support Agent';
  }

  get userEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || '';
  }

  goToSettings(): void {
    this.router.navigate(['/csa/settings']);
    this.showUserMenu = false;
    this.showNotifications = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAllNotifications(): void {
    this.notificationService.clearNotifications();
  }

  deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  navigateToNotification(notification: Notification): void {
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    this.notificationService.markAsRead(notification.id);
    this.showNotifications = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
}

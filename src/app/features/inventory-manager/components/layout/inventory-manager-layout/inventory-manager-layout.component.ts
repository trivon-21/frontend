import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../core/services/auth.service';
import {
  NotificationService,
  Notification,
} from '../../../../../core/services/notification.service';
import { IconMappingService } from '../../../../../shared/services/icon-mapping.service';
import { ClickOutsideDirective } from '../../../../../directives/click-outside.directive';

@Component({
  selector: 'app-inventory-manager-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    LucideAngularModule,
    FormsModule,
    ClickOutsideDirective,
  ],
  templateUrl: './inventory-manager-layout.component.html',
  styleUrl: './inventory-manager-layout.component.css',
})
export class InventoryManagerLayoutComponent implements OnInit {
  showNotifications = false;
  showUserMenu = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  searchQuery = '';

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private iconMappingService: IconMappingService,
  ) {}

  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe((notifs) => {
      this.notifications = notifs;
    });

    this.notificationService.getUnreadCount().subscribe((count) => {
      this.unreadCount = count;
    });
  }

  get userInitials(): string {
    const user = this.authService.getUser();
    if (!user) return 'U';
    const parts = user.fullName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  get userName(): string {
    const user = this.authService.getUser();
    return user?.fullName || 'User';
  }

  get userEmail(): string {
    const user = this.authService.getUser();
    return user?.email || '';
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

  markNotificationAsRead(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id);
  }

  deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAllNotifications(): void {
    this.notificationService.clearNotifications();
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
    return this.iconMappingService.getNotificationIcon(type);
  }

  handleGlobalSearch(): void {
    const query = this.searchQuery.trim();
    if (query) {
      this.router.navigate(['/inventory-manager/inventory'], {
        queryParams: { search: query }
      });
      this.searchQuery = '';
    }
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { MaintenanceService } from '../../../../../core/services/maintenance.service';
import { NotificationService, Notification } from '../../../../../core/services/notification.service';
import { ClickOutsideDirective } from '../../../../../directives/click-outside.directive';
import { SystemInfoService, SystemInfo } from '../../../../../core/services/system-info.service';
import { PortalIconsModule } from '../../../../../shared/components/portal-icons/portal-icons.module';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, ClickOutsideDirective, PortalIconsModule],
  templateUrl: './super-admin-layout.component.html',
  styleUrls: ['./super-admin-layout.component.css'],
})
export class SuperAdminLayoutComponent implements OnInit, OnDestroy {
  showUserMenu = false;
  showNotifications = false;
  userName = '';
  userEmail = '';
  userInitials = '';
  currentTime = new Date();
  systemInfo: SystemInfo | null = null;
  notifications: Notification[] = [];
  unreadCount = 0;
  maintenanceCountdown = '';
  searchQuery = '';

  private clockInterval: any;
  private countdownInterval: any;

  constructor(
    private authService: AuthService,
    public maintenanceService: MaintenanceService,
    private notificationService: NotificationService,
    private router: Router,
    private systemInfoService: SystemInfoService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.fullName || '';
      this.userEmail = user.email || '';
      this.userInitials = this.getInitials(user.fullName || '');
    }

    this.systemInfoService.systemInfo$.subscribe((info) => {
      this.systemInfo = info;
    });

    this.notificationService.getNotifications().subscribe((notifs) => {
      this.notifications = notifs;
    });

    this.notificationService.getUnreadCount().subscribe((count) => {
      this.unreadCount = count;
    });

    // Monitor maintenance status and display countdown
    this.maintenanceService.scheduledStart$.subscribe((startTime: Date | null) => {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }

      if (startTime && !this.maintenanceService.isMaintenanceActiveSyncGetter()) {
        this.updateCountdown(startTime);
        this.countdownInterval = setInterval(() => {
          this.updateCountdown(startTime);
        }, 1000);
      } else {
        this.maintenanceCountdown = '';
      }
    });

    // Update clock every second
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private updateCountdown(startTime: Date): void {
    const now = new Date().getTime();
    const distance = startTime.getTime() - now;

    if (distance < 0) {
      this.maintenanceCountdown = '';
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      return;
    }

    if (distance > 7 * 24 * 60 * 60 * 1000) {
      this.maintenanceCountdown = '';
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    this.maintenanceCountdown = `Maintenance in: ${hours}h ${minutes}m ${seconds}s`;
  }

  private getInitials(fullName: string): string {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0]?.[0]?.toUpperCase() || 'A';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  closeNotifications(): void {
    this.showNotifications = false;
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

  navigateToNotification(notif: Notification): void {
    if (!notif.read) {
      this.notificationService.markAsRead(notif.id);
    }
    this.showNotifications = false;
    if (notif.actionUrl) {
      this.router.navigateByUrl(notif.actionUrl);
    } else {
      this.router.navigate(['/super-admin/global-notifications']);
    }
  }

  goToSettings(): void {
    this.router.navigate(['/super-admin/system-config']);
  }

  onGlobalSearch(): void {
    if (!this.searchQuery.trim()) return;
    const query = this.searchQuery.trim().toLowerCase();
    
    // Smart routing based on query prefix or default search
    if (query.startsWith('ord') || query.includes('order')) {
      this.router.navigate(['/super-admin/core-operations'], {
        queryParams: { tab: 'orders', search: this.searchQuery.trim() }
      });
    } else if (query.startsWith('sr') || query.includes('service') || query.includes('repair')) {
      this.router.navigate(['/super-admin/core-operations'], {
        queryParams: { tab: 'service', search: this.searchQuery.trim() }
      });
    } else if (query.startsWith('inq') || query.includes('inquiry')) {
      this.router.navigate(['/super-admin/core-operations'], {
        queryParams: { tab: 'inquiries', search: this.searchQuery.trim() }
      });
    } else if (query.includes('notif') || query.includes('broadcast')) {
      this.router.navigate(['/super-admin/global-notifications'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    } else {
      // Default to search in users
      this.router.navigate(['/super-admin/users'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}


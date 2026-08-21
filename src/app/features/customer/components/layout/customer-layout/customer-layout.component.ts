import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../core/services/auth.service';
import { MaintenanceService } from '../../../../../core/services/maintenance.service';
import { NotificationService, Notification } from '../../../../../core/services/notification.service';
import { ClickOutsideDirective } from '../../../../../directives/click-outside.directive';
import { SystemInfoService, SystemInfo } from '../../../../../core/services/system-info.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ClickOutsideDirective],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css'
})
export class CustomerLayoutComponent implements OnInit, OnDestroy {
  showNotifications = false;
  showUserMenu = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  currentTime = new Date();
  maintenanceCountdown = '';
  systemInfo: SystemInfo | null = null;
  private clockInterval: any;
  private countdownInterval: any;

  constructor(
    public authService: AuthService,
    private notificationService: NotificationService,
    private maintenanceService: MaintenanceService,
    private router: Router,
    private systemInfoService: SystemInfoService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.role !== 'CUSTOMER') {
      switch (user.role) {
        case 'SUPER_ADMIN':
          this.router.navigate(['/super-admin']);
          break;
        case 'MAIN_TECH':
          this.router.navigate(['/main-technician-dashboard']);
          break;
        case 'SERVICE_TEAM':
          this.router.navigate(['/service-team/dashboard']);
          break;
        case 'FINANCE':
          this.router.navigate(['/finance/dashboard']);
          break;
        case 'INSPECTION':
          this.router.navigate(['/inspection-officer/dashboard']);
          break;
        default:
          this.router.navigate(['/']);
          break;
      }
      return;
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
      // Maintenance has already started - hide timer for customer
      this.maintenanceCountdown = '';
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      // System should redirect user to maintenance page
      return;
    }

    // Only show banner if maintenance is within 7 days
    if (distance > 7 * 24 * 60 * 60 * 1000) {
      this.maintenanceCountdown = '';
      return;
    }

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Show "Starts in: XXh XXm XXs" for upcoming maintenance only
    this.maintenanceCountdown = `Maintenance in: ${hours}h ${minutes}m ${seconds}s`;
  }

  get userInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'U';
    const parts = user.fullName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || 'User';
  }

  get userEmail(): string {
    const user = this.authService.getCurrentUser();
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

  goToSettings(): void {
    this.router.navigate(['/dashboard/settings']);
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
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

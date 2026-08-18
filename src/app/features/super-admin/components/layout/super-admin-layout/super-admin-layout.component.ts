import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { MaintenanceService } from '../../../../../core/services/maintenance.service';
import { ClickOutsideDirective } from '../../../../../directives/click-outside.directive';
import { SystemInfoService, SystemInfo } from '../../../../../core/services/system-info.service';

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ClickOutsideDirective],
  templateUrl: './super-admin-layout.component.html',
  styleUrls: ['./super-admin-layout.component.css'],
})
export class SuperAdminLayoutComponent implements OnInit, OnDestroy {
  showUserMenu = false;
  userName = '';
  userEmail = '';
  userInitials = '';
  currentTime = new Date();
  systemInfo: SystemInfo | null = null;
  private clockInterval: any;

  constructor(
    private authService: AuthService,
    public maintenanceService: MaintenanceService,
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

    // Update clock every second
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
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
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

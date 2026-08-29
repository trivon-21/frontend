import { Component } from '@angular/core';
import { NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { PortalIconsModule } from '../../../../../shared/components/portal-icons/portal-icons.module';
import { AuthService } from '../../../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../../../../directives/click-outside.directive';
import { HeaderClockComponent } from '../../../../../shared/components/header-clock/header-clock.component';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    PortalIconsModule,
    ClickOutsideDirective,
    HeaderClockComponent,
  ],
  templateUrl: './manager-layout.component.html',
  styleUrls: [
    '../../../../../shared/styles/role-portal-shell.css',
    './manager-layout.component.css',
  ],
})
export class ManagerLayoutComponent {
  showUserMenu = false;
  analyticsExpanded = false;

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {
    this.analyticsExpanded = this.router.url.startsWith('/manager/analytics');
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.analyticsExpanded = (event as NavigationEnd).urlAfterRedirects.startsWith('/manager/analytics');
    });
  }

  get userInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'M';
    const parts = user.fullName.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  get userName(): string {
    const user = this.authService.getCurrentUser();
    return user?.fullName || 'Manager';
  }

  get userEmail(): string {
    const user = this.authService.getCurrentUser();
    return user?.email || '';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  toggleAnalytics(): void {
    this.analyticsExpanded = !this.analyticsExpanded;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
